import type { GetContractReturnType } from '@civex/hardhat-cive/types'

import type {
  ContractAtFuture,
  ContractDeploymentFuture,
  ContractFuture,
  IgnitionModuleResult,
} from '@nomicfoundation/ignition-core'
import type { ArtifactsMap } from 'hardhat/types/artifacts.js'

export type IgnitionModuleResultToCiveContracts<
  TContractName extends string,
  TIgnitionModuleResults extends IgnitionModuleResult<TContractName>,
> = {
  [resultKey in keyof TIgnitionModuleResults]: ToContractType<
    TIgnitionModuleResults,
    resultKey
  >
}

export type ToContractType<
  TIgnitionModuleResults extends IgnitionModuleResult<string>,
  ResultKey extends keyof TIgnitionModuleResults,
> = TIgnitionModuleResults[ResultKey] extends
  | ContractDeploymentFuture
  | ContractAtFuture
  ? GetContractReturnType<AbiOf<TIgnitionModuleResults[ResultKey]>>
  : LookupContractName<
        TIgnitionModuleResults,
        ResultKey
      > extends keyof ArtifactsMap
    ? LookupContractReturnTypeForContractName<
        LookupContractName<TIgnitionModuleResults, ResultKey>
      >
    : never

export type LookupContractReturnTypeForContractName<
  ContractName extends keyof ArtifactsMap,
> = GetContractReturnType<ArtifactsMap[ContractName]['abi']>

export type LookupContractName<
  TIgnitionModuleResults extends IgnitionModuleResult<string>,
  ResultContractKey extends keyof TIgnitionModuleResults,
> = ContractNameOfContractFuture<TIgnitionModuleResults[ResultContractKey]>

export type ContractNameOfContractFuture<TContractFuture> =
  TContractFuture extends ContractFuture<infer ContractName>
    ? ContractName
    : never

export type AbiOf<TContractDeploymentFuture> =
  TContractDeploymentFuture extends ContractDeploymentFuture<
    infer TContractDeploymentAbi
  >
    ? TContractDeploymentAbi
    : TContractDeploymentFuture extends ContractAtFuture<infer TContractAbi>
      ? TContractAbi
      : never
