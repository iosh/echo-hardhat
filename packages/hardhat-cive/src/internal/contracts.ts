import type { Abi, Address, Hex } from 'cive'
import { base32AddressToHex } from 'cive/utils'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import type {
  DeployContractConfig,
  GetContractAtConfig,
  GetContractReturnType,
  GetTransactionReturnType,
  PublicClient,
  SendDeploymentTransactionConfig,
  WalletClient,
} from '../types'
import { type Libraries, resolveBytecodeWithLinkedLibraries } from './bytecode'
import { getPublicClient, getWalletClients } from './client'
import {
  DefaultWalletClientNotFoundError,
  DeployContractError,
  HardhatCiveError,
  InvalidConfirmationsError,
} from './errors'

async function getContractAbiAndBytecode(
  artifacts: HardhatRuntimeEnvironment['artifacts'],
  contractName: string,
  libraries: Libraries<Address>,
) {
  const artifact = await artifacts.readArtifact(contractName)

  const hexAddressLibraries: Libraries<Hex> = {}
  for (const libraryName of Object.keys(libraries)) {
    const address = libraries[libraryName]
    hexAddressLibraries[libraryName] = base32AddressToHex({ address: address })
  }

  const bytecode = await resolveBytecodeWithLinkedLibraries(
    artifact,
    hexAddressLibraries,
  )

  return {
    abi: artifact.abi,
    bytecode,
  }
}

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  constructorArgs: any,
  config: DeployContractConfig = {},
): Promise<GetContractReturnType> {
  const {
    client,
    confirmations,
    retryCount,
    libraries = {},
    ...deployContractParameters
  } = config

  const { network } = hre

  const [publicClient, walletClient, { abi, bytecode }] = await Promise.all([
    client?.public ?? getPublicClient(hre),
    client?.wallet ?? getDefaultWalletClient(hre, network.name),
    getContractAbiAndBytecode(hre.artifacts, contractName, libraries),
  ])

  return innerDeployContract(
    publicClient,
    walletClient,
    abi,
    bytecode,
    constructorArgs,
    deployContractParameters,
    confirmations,
    retryCount,
  )
}

export async function innerDeployContract(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractAbi: Abi,
  contractBytecode: Hex,
  constructorArgs: any[],
  deployContractParameters: DeployContractConfig,
  confirmations = 1,
  retryCount = 12,
): Promise<GetContractReturnType> {
  let deploymentTxHash: Hex
  // If gasPrice is defined, then maxFeePerGas and maxPriorityFeePerGas
  // must be undefined because it's a legaxy tx.
  if (deployContractParameters.gasPrice !== undefined) {
    deploymentTxHash = await walletClient.deployContract({
      abi: contractAbi,
      bytecode: contractBytecode,
      args: constructorArgs,
      ...deployContractParameters,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    })
  } else {
    deploymentTxHash = await walletClient.deployContract({
      abi: contractAbi,
      bytecode: contractBytecode,
      args: constructorArgs,
      ...deployContractParameters,
      gasPrice: undefined,
    })
  }

  if (confirmations < 0) {
    throw new HardhatCiveError('Confirmations must be greater than 0.')
  }
  if (confirmations === 0) {
    throw new InvalidConfirmationsError()
  }
  const { contractCreated } = await publicClient.waitForTransactionReceipt({
    hash: deploymentTxHash,
    confirmations,
    retryCount: retryCount,
  })

  if (contractCreated === null || contractCreated === undefined) {
    const transaction = await publicClient.getTransaction({
      hash: deploymentTxHash,
    })
    throw new DeployContractError(deploymentTxHash, transaction.blockHash)
  }

  const contract = await innerGetContractAt(
    publicClient,
    walletClient,
    contractAbi,
    contractCreated,
  )

  return contract
}

export async function sendDeploymentTransaction(
  her: HardhatRuntimeEnvironment,
  contractName: string,
  constructorArgs: any[] = [],
  config: SendDeploymentTransactionConfig = {},
): Promise<{
  contract: GetContractReturnType
  deploymentTransaction: GetTransactionReturnType
}> {
  const { network, artifacts } = her
  const { client, libraries = {}, ...deployContractParameters } = config
  const [publicClient, walletClient, { abi, bytecode }] = await Promise.all([
    client?.public ?? getPublicClient(her),
    client?.wallet ?? getDefaultWalletClient(her, network.name),
    getContractAbiAndBytecode(artifacts, contractName, libraries),
  ])

  return innerSendDeploymentTransaction(
    publicClient,
    walletClient,
    abi,
    bytecode,
    constructorArgs,
    deployContractParameters,
  )
}

async function innerSendDeploymentTransaction(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractAbi: Abi,
  contractBytecode: Hex,
  constructorArgs: any[],
  deployContractParameters: SendDeploymentTransactionConfig,
): Promise<{
  contract: GetContractReturnType
  deploymentTransaction: GetTransactionReturnType
}> {
  let deploymentTxHash: Hex
  // If gasPrice is defined, then maxFeePerGas and maxPriorityFeePerGas
  // must be undefined because it's a legaxy tx.
  if (deployContractParameters.gasPrice !== undefined) {
    deploymentTxHash = await walletClient.deployContract({
      abi: contractAbi,
      bytecode: contractBytecode,
      args: constructorArgs,
      ...deployContractParameters,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    })
  } else {
    deploymentTxHash = await walletClient.deployContract({
      abi: contractAbi,
      bytecode: contractBytecode,
      args: constructorArgs,
      ...deployContractParameters,
      gasPrice: undefined,
    })
  }

  const deploymentTx = await publicClient.getTransaction({
    hash: deploymentTxHash,
  })

  const { getContractAddress } = await import('cive/utils')
  const contractAddress = getContractAddress({
    from: walletClient.account.address,
    nonce: deploymentTx.nonce,
    networkId: publicClient.chain.id || walletClient.chain.id,
    bytecode: contractBytecode,
  })

  const contract = await innerGetContractAt(
    publicClient,
    walletClient,
    contractAbi,
    contractAddress,
  )

  return { contract, deploymentTransaction: deploymentTx }
}

export async function getContractAt(
  her: HardhatRuntimeEnvironment,
  contractName: string,
  address: Address,
  config: GetContractAtConfig = {},
): Promise<GetContractReturnType> {
  const { network, artifacts } = her
  const [publicClient, walletClient, contractArtifact] = await Promise.all([
    config.client?.public ?? getPublicClient(her),
    config.client?.wallet ?? getDefaultWalletClient(her, network.name),
    artifacts.readArtifact(contractName),
  ])

  return innerGetContractAt(
    publicClient,
    walletClient,
    contractArtifact.abi,
    address,
  )
}

async function innerGetContractAt(
  publicClient: PublicClient,
  walletClient: WalletClient,
  contractAbi: Abi,
  address: Address,
): Promise<GetContractReturnType> {
  const cive = await import('cive')
  const contract = cive.getContract({
    address,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
    abi: contractAbi,
  })

  return contract
}

async function getDefaultWalletClient(
  hre: HardhatRuntimeEnvironment,
  networkName: string,
): Promise<WalletClient> {
  const [defaultWalletClient] = await getWalletClients(hre)

  if (defaultWalletClient === undefined) {
    throw new DefaultWalletClientNotFoundError(networkName)
  }

  return defaultWalletClient
}
