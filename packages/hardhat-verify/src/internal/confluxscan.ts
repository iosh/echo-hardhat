import type { Network } from 'hardhat/types'
import type { Dispatcher } from 'undici/types'
import type { ChainConfig } from '../types'
import type {
  ConfluxscanVerifyResponse,
  EtherscanGetSourceCodeResponse,
} from './etherscan.types'

import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins'

import { builtinChains } from './chain-config'
import {
  ChainConfigNotFoundError,
  CivexHardhatVerifyError,
  ContractAlreadyVerifiedError,
  ContractStatusPollingInvalidStatusCodeError,
  ContractStatusPollingResponseNotOkError,
  ContractVerificationInvalidStatusCodeError,
  ContractVerificationMissingBytecodeError,
  HardhatNetworkNotSupportedError,
  NetworkRequestError,
} from './errors'
import { isSuccessStatusCode, sendGetRequest, sendPostRequest } from './undici'
import { type ValidationResponse, sleep } from './utilities'

// Used for polling the result of the contract verification.
const VERIFICATION_STATUS_POLLING_TIME = 3000

/**
 * Etherscan verification provider for verifying smart contracts.
 * It should work with other verification providers as long as the interface
 * is compatible with Etherscan's.
 */
export class Confluxscan {
  /**
   * Create a new instance of the Etherscan verification provider.
   * @param apiKey - The Etherscan API key.
   * @param apiUrl - The Etherscan API URL, e.g. https://api.etherscan.io/api.
   * @param browserUrl - The Etherscan browser URL, e.g. https://etherscan.io.
   */
  constructor(
    // public apiKey: string,
    public apiUrl: string,
    public browserUrl: string,
  ) {}

  public static async getCurrentChainConfig(
    network: Network,
    customChains: ChainConfig[],
  ): Promise<ChainConfig> {
    const cive = await import('cive')

    if (!('url' in network.config)) {
      throw new Error('Invalid network configuration')
    }

    const client = cive.createPublicClient({
      transport: cive.http(network.config.url),
    })

    const nodeStatus = await client.getStatus()
    const currentChainId = nodeStatus.chainId

    const currentChainConfig = [
      // custom chains has higher precedence than builtin chains
      ...[...customChains].reverse(), // the last entry has higher precedence
      ...builtinChains,
    ].find(({ chainId }) => chainId === currentChainId)

    if (currentChainConfig === undefined) {
      if (network.name === HARDHAT_NETWORK_NAME) {
        throw new HardhatNetworkNotSupportedError()
      }

      throw new ChainConfigNotFoundError(currentChainId)
    }
    return currentChainConfig
  }

  public static fromChainConfig(chainConfig: ChainConfig) {
    const apiUrl = chainConfig.urls.apiURL
    const browserUrl = chainConfig.urls.browserURL.trim().replace(/\/$/, '')

    return new Confluxscan(apiUrl, browserUrl)
  }

  /**
   * Check if a smart contract is verified on Etherscan.
   * @link https://docs.etherscan.io/api-endpoints/contracts#get-contract-source-code-for-verified-contract-source-codes
   * @param address - The address of the smart contract.
   * @returns True if the contract is verified, false otherwise.
   * @throws {NetworkRequestError} if there is an error on the request.
   * @throws {ContractVerificationInvalidStatusCodeError} if the API returns an invalid status code.
   */
  public async isVerified(address: string) {
    const parameters = new URLSearchParams({
      // apikey: this.apiKey,
      // module: "contract",
      // action: "getsourcecode",
      address,
    })

    const url = new URL(this.apiUrl)
    url.pathname = 'contract/getabi'
    url.search = parameters.toString()

    let response: Dispatcher.ResponseData | undefined
    let json: EtherscanGetSourceCodeResponse | undefined
    try {
      response = await sendGetRequest(url)
      json = (await response.body.json()) as EtherscanGetSourceCodeResponse
    } catch (e: any) {
      throw new NetworkRequestError(e)
    }

    if (!isSuccessStatusCode(response.statusCode)) {
      throw new ContractVerificationInvalidStatusCodeError(
        url.toString(),
        response.statusCode,
        JSON.stringify(json),
      )
    }

    if (json.message !== 'OK') {
      return false
    }

    const sourceCode = json.result
    return sourceCode !== undefined && sourceCode !== null && sourceCode !== ''
  }

  /**
   * Verify a smart contract on Etherscan.
   * @link https://docs.etherscan.io/api-endpoints/contracts#verify-source-code
   * @param contractAddress - The address of the smart contract to verify.
   * @param sourceCode - The source code of the smart contract.
   * @param contractName - The name of the smart contract, e.g. "contracts/Sample.sol:MyContract"
   * @param compilerVersion - The version of the Solidity compiler used, e.g. `v0.8.19+commit.7dd6d404`
   * @param constructorArguments - The encoded constructor arguments of the smart contract.
   * @returns A promise that resolves to an `EtherscanResponse` object.
   * @throws {NetworkRequestError} if there is an error on the request.
   * @throws {ContractVerificationInvalidStatusCodeError} if the API returns an invalid status code.
   * @throws {ContractVerificationMissingBytecodeError} if the bytecode is not found on the block explorer.
   * @throws {ContractAlreadyVerifiedError} if the contract is already verified.
   * @throws {CivexHardhatVerifyError} if the response status is not OK.
   */
  public async verify(
    contractAddress: string,
    sourceCode: string,
    contractName: string,
    compilerVersion: string,
    constructorArguments: string,
  ): Promise<ConfluxscanResponse> {
    const parameters = new URLSearchParams({
      // apikey: this.apiKey,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode,
      codeformat: 'solidity-standard-json-input',
      contractname: contractName,
      compilerversion: compilerVersion,
      constructorArguements: constructorArguments,
    })

    const url = new URL(this.apiUrl)
    url.pathname = 'contract/verifysourcecode'
    let response: Dispatcher.ResponseData | undefined
    let json: ConfluxscanVerifyResponse | undefined
    try {
      response = await sendPostRequest(url, parameters.toString(), {
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      json = (await response.body.json()) as ConfluxscanVerifyResponse
    } catch (e: any) {
      throw new NetworkRequestError(e)
    }

    if (!isSuccessStatusCode(response.statusCode)) {
      throw new ContractVerificationInvalidStatusCodeError(
        url.toString(),
        response.statusCode,
        JSON.stringify(json),
      )
    }

    const etherscanResponse = new ConfluxscanResponse(json)

    if (etherscanResponse.isBytecodeMissingInNetworkError()) {
      throw new ContractVerificationMissingBytecodeError(
        this.apiUrl,
        contractAddress,
      )
    }

    if (etherscanResponse.isAlreadyVerified()) {
      throw new ContractAlreadyVerifiedError(contractName, contractAddress)
    }

    if (!etherscanResponse.isOk()) {
      throw new CivexHardhatVerifyError(etherscanResponse.message)
    }

    return etherscanResponse
  }

  /**
   * Get the verification status of a smart contract from Etherscan.
   * This method performs polling of the verification status if it's pending.
   * @link https://docs.etherscan.io/api-endpoints/contracts#check-source-code-verification-submission-status
   * @param guid - The verification GUID to check.
   * @returns A promise that resolves to an `EtherscanResponse` object.
   * @throws {NetworkRequestError} if there is an error on the request.
   * @throws {ContractStatusPollingInvalidStatusCodeError} if the API returns an invalid status code.
   * @throws {ContractStatusPollingResponseNotOkError} if the response status is not OK.
   */
  public async getVerificationStatus(
    guid: string,
  ): Promise<ConfluxscanResponse> {
    const parameters = new URLSearchParams({
      // apikey: this.apiKey,
      module: 'contract',
      action: 'checkverifystatus',
      guid,
    })
    const url = new URL(this.apiUrl)
    url.pathname = '/contract/checkverifystatus'
    url.search = parameters.toString()

    let response: Dispatcher.ResponseData | undefined
    let json: ConfluxscanVerifyResponse | undefined
    try {
      response = await sendGetRequest(url)
      json = (await response.body.json()) as ConfluxscanVerifyResponse
    } catch (e: any) {
      throw new NetworkRequestError(e)
    }

    if (!isSuccessStatusCode(response.statusCode)) {
      throw new ContractStatusPollingInvalidStatusCodeError(
        response.statusCode,
        JSON.stringify(json),
      )
    }

    const etherscanResponse = new ConfluxscanResponse(json)

    if (etherscanResponse.isPending()) {
      await sleep(VERIFICATION_STATUS_POLLING_TIME)

      return this.getVerificationStatus(guid)
    }

    if (
      etherscanResponse.isFailure() ||
      etherscanResponse.isAlreadyVerified()
    ) {
      return etherscanResponse
    }

    if (!etherscanResponse.isOk()) {
      throw new ContractStatusPollingResponseNotOkError(
        etherscanResponse.message,
      )
    }

    return etherscanResponse
  }

  /**
   * Get the Etherscan URL for viewing a contract's details.
   * @param address - The address of the smart contract.
   * @returns The URL to view the contract on Etherscan's website.
   */
  public getContractUrl(address: string) {
    return `${this.browserUrl}/address/${address}#code`
  }
}

class ConfluxscanResponse implements ValidationResponse {
  public readonly code: number
  public readonly message: string
  public readonly data: string

  constructor(response: ConfluxscanVerifyResponse) {
    this.code = response.code
    this.data = response.data
    this.message = response.message
  }

  public isPending() {
    return this.data === 'Pending in queue'
  }

  public isFailure() {
    return this.data === 'Fail - Unable to verify'
  }

  public isSuccess() {
    return this.data === 'Pass - Verified'
  }

  public isBytecodeMissingInNetworkError() {
    return this.data.startsWith('Unable to locate ContractCode at')
  }

  public isAlreadyVerified() {
    return (
      // returned by etherscan
      this.data.startsWith('Contract source code already verified') ||
      this.data.startsWith('Already Verified')
    )
  }

  public isOk() {
    return this.code === 0
  }
}

// function resolveApiKey(apiKey: ApiKey | undefined, network: string) {
//   if (apiKey === undefined || apiKey === "") {
//     throw new MissingApiKeyError(network);
//   }

//   if (typeof apiKey === "string") {
//     return apiKey;
//   }

//   const key = apiKey[network];

//   if (key === undefined || key === "") {
//     throw new MissingApiKeyError(network);
//   }

//   return key;
// }
