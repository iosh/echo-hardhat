import type {
  VerificationResponse,
  VerifyTaskArgs,
} from '@nomicfoundation/hardhat-verify'
import { subtask, types } from 'hardhat/config'
import type { CompilerInput } from 'hardhat/types'
import { Confluxscan } from '../internal/confluxscan'
import {
  CompilerVersionsMismatchError,
  ContractVerificationFailedError,
  NetworkRequestError,
} from '../internal/errors'
import type {
  ExtendedContractInformation,
  LibraryToAddress,
} from '../internal/solc/artifacts'
import { Bytecode } from '../internal/solc/bytecode'
import {
  TASK_VERIFY_CONFLUXSCAN,
  TASK_VERIFY_CONFLUXSCAN_ATTEMPT_VERIFICATION,
  TASK_VERIFY_CONFLUXSCAN_GET_MINIMAL_INPUT,
  TASK_VERIFY_CONFLUXSCAN_RESOLVE_ARGUMENTS,
  TASK_VERIFY_GET_CONTRACT_INFORMATION,
} from '../internal/task-names'
import { encodeArguments, getCompilerVersions } from '../internal/utilities'

// parsed verification args
interface VerificationArgs {
  address: string
  constructorArgs: string[]
  libraries: LibraryToAddress
  contractFQN?: string
  force: boolean
}

/**
 * Main Etherscan verification subtask.
 *
 * Verifies a contract in Etherscan by coordinating various subtasks related
 * to contract verification.
 */
subtask(TASK_VERIFY_CONFLUXSCAN)
  .addParam('address')
  .addOptionalParam('constructorArgsParams', undefined, undefined, types.any)
  .addOptionalParam('constructorArgs')
  .addOptionalParam('libraries', undefined, undefined, types.any)
  .addOptionalParam('contract')
  .addFlag('force')
  .setAction(async (taskArgs: VerifyTaskArgs, { config, network, run }) => {
    const {
      address,
      constructorArgs,
      libraries,
      contractFQN,
      force,
    }: VerificationArgs = await run(
      TASK_VERIFY_CONFLUXSCAN_RESOLVE_ARGUMENTS,
      taskArgs,
    )

    const chainConfig = await Confluxscan.getCurrentChainConfig(
      network.name,
      network.provider,
      config.etherscan.customChains,
    )

    const etherscan = Confluxscan.fromChainConfig(
      config.etherscan.apiKey,
      chainConfig,
    )

    let isVerified = false
    try {
      isVerified = await etherscan.isVerified(address)
    } catch (err) {
      if (!force || err instanceof NetworkRequestError) {
        throw err
      }
      // https://github.com/blockscout/blockscout/issues/9001
    }
    if (!force && isVerified) {
      const contractURL = etherscan.getContractUrl(address)
      console.warn(`The contract ${address} has already been verified on the block explorer. If you're trying to verify a partially verified contract, please use the --force flag.
${contractURL}
`)
      return
    }

    const configCompilerVersions = await getCompilerVersions(config.solidity)

    const deployedBytecode = await Bytecode.getDeployedContractBytecode(
      address,
      network.provider,
      network.name,
    )

    const matchingCompilerVersions = await deployedBytecode.getMatchingVersions(
      configCompilerVersions,
    )
    // don't error if the bytecode appears to be OVM bytecode, because we can't infer a specific OVM solc version from the bytecode
    if (matchingCompilerVersions.length === 0 && !deployedBytecode.isOvm()) {
      throw new CompilerVersionsMismatchError(
        configCompilerVersions,
        deployedBytecode.getVersion(),
        network.name,
      )
    }

    const contractInformation: ExtendedContractInformation = await run(
      TASK_VERIFY_GET_CONTRACT_INFORMATION,
      {
        contractFQN,
        deployedBytecode,
        matchingCompilerVersions,
        libraries,
      },
    )

    const minimalInput: CompilerInput = await run(
      TASK_VERIFY_CONFLUXSCAN_GET_MINIMAL_INPUT,
      {
        sourceName: contractInformation.sourceName,
      },
    )

    const encodedConstructorArguments = await encodeArguments(
      contractInformation.contractOutput.abi,
      contractInformation.sourceName,
      contractInformation.contractName,
      constructorArgs,
    )

    // First, try to verify the contract using the minimal input
    const { success: minimalInputVerificationSuccess }: VerificationResponse =
      await run(TASK_VERIFY_CONFLUXSCAN_ATTEMPT_VERIFICATION, {
        address,
        compilerInput: minimalInput,
        contractInformation,
        verificationInterface: etherscan,
        encodedConstructorArguments,
      })

    if (minimalInputVerificationSuccess) {
      return
    }

    console.warn(`We tried verifying your contract ${contractInformation.contractName} without including any unrelated one, but it failed.
Trying again with the full solc input used to compile and deploy it.
This means that unrelated contracts may be displayed on Etherscan...
`)

    // If verifying with the minimal input failed, try again with the full compiler input
    const {
      success: fullCompilerInputVerificationSuccess,
      message: verificationMessage,
    }: VerificationResponse = await run(
      TASK_VERIFY_CONFLUXSCAN_ATTEMPT_VERIFICATION,
      {
        address,
        compilerInput: contractInformation.compilerInput,
        contractInformation,
        verificationInterface: etherscan,
        encodedConstructorArguments,
      },
    )

    if (fullCompilerInputVerificationSuccess) {
      return
    }

    throw new ContractVerificationFailedError(
      verificationMessage,
      contractInformation.undetectableLibraries,
    )
  })
