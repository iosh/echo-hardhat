import type * as civeT from 'cive'
import type { Account } from 'cive/accounts'
import type * as civeActions from 'cive/actions'
import type { ArtifactsMap } from 'hardhat/types/artifacts.js'
import type { Libraries } from './internal/bytecode.js'

export type PublicClient = civeT.PublicClient<civeT.Transport, civeT.Chain>
export type WalletClient = civeT.WalletClient<
  civeT.Transport,
  civeT.Chain,
  Account
>
export type KeyedClient =
  | {
      public?: PublicClient
      wallet: WalletClient
    }
  | {
      public: PublicClient
      wallet?: WalletClient
    }

export interface SendTransactionConfig {
  client?: KeyedClient
  gas?: bigint
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  value?: bigint
}

export interface DeployContractConfig extends SendTransactionConfig {
  retryCount?: number
  confirmations?: number
  libraries?: Libraries<civeT.Address>
}

export interface SendDeploymentTransactionConfig extends SendTransactionConfig {
  libraries?: Libraries<civeT.Address>
}

export interface GetContractAtConfig {
  client?: KeyedClient
}

export type GetContractReturnType<
  TAbi extends civeT.Abi | readonly unknown[] = civeT.Abi,
> = civeT.GetContractReturnType<TAbi, Required<KeyedClient>, civeT.Address>

export type GetTransactionReturnType =
  civeActions.GetTransactionReturnType<civeT.Chain>

export type ContractName<StringT extends string> =
  StringT extends keyof ArtifactsMap ? never : StringT

export declare function deployContract<CN extends string>(
  contractName: ContractName<CN>,
  constructorArgs?: any[],
  config?: DeployContractConfig,
): Promise<GetContractReturnType>

export declare function sendDeploymentTransaction<CN extends string>(
  contractName: ContractName<CN>,
  constructorArgs?: any[],
  config?: SendDeploymentTransactionConfig,
): Promise<{
  contract: GetContractReturnType
  deploymentTransaction: GetTransactionReturnType
}>

export declare function getContractAt<CN extends string>(
  contractName: ContractName<CN>,
  address: civeT.Address,
  config?: GetContractAtConfig,
): Promise<GetContractReturnType>

export type HttpTransportType = ReturnType<typeof civeT.http>

export type { AbiParameterToPrimitiveType } from 'cive'
