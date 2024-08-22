import type { GetContractReturnType } from '@civex/hardhat-cive/types'

import path from 'node:path'
import {
  HardhatArtifactResolver,
  errorDeploymentResultToExceptionMessage,
  resolveDeploymentId,
} from '@nomicfoundation/hardhat-ignition/helpers'
import {
  type ContractAtFuture,
  type ContractDeploymentFuture,
  type ContractFuture,
  type DeployConfig,
  type DeploymentParameters,
  DeploymentResultType,
  type EIP1193Provider,
  type Future,
  FutureType,
  type IgnitionModule,
  type IgnitionModuleResult,
  type LibraryDeploymentFuture,
  type NamedArtifactContractAtFuture,
  type NamedArtifactContractDeploymentFuture,
  type NamedArtifactLibraryDeploymentFuture,
  type StrategyConfig,
  type SuccessfulDeploymentResult,
  deploy,
  isContractFuture,
} from '@nomicfoundation/ignition-core'
import { HardhatPluginError } from 'hardhat/plugins.js'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import type { IgnitionModuleResultToCiveContracts } from './types/contract.js'

export class CiveIgnitionHelper {
  public type = 'cive'

  private _provider: EIP1193Provider

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config?: Partial<DeployConfig>,
    provider?: EIP1193Provider,
  ) {
    this._provider = provider ?? this._hre.network.provider
  }

  /**
   * Deploys the given Ignition module and returns the results of the module
   * as Viem contract instances.
   *
   * @param ignitionModule - The Ignition module to deploy.
   * @param options - The options to use for the deployment.
   * @returns Viem contract instances for each contract returned by the module.
   */
  public async deploy<
    ModuleIdT extends string,
    ContractNameT extends string,
    IgnitionModuleResultsT extends IgnitionModuleResult<ContractNameT>,
    StrategyT extends keyof StrategyConfig = 'basic',
  >(
    ignitionModule: IgnitionModule<
      ModuleIdT,
      ContractNameT,
      IgnitionModuleResultsT
    >,
    {
      parameters = {},
      config: perDeployConfig = {},
      defaultSender = undefined,
      strategy,
      strategyConfig,
      deploymentId: givenDeploymentId = undefined,
    }: {
      parameters?: DeploymentParameters
      config?: Partial<DeployConfig>
      defaultSender?: string
      strategy?: StrategyT
      strategyConfig?: StrategyConfig[StrategyT]
      deploymentId?: string
    },
  ): Promise<
    IgnitionModuleResultToCiveContracts<ContractNameT, IgnitionModuleResultsT>
  > {
    const accounts = (await this._hre.network.provider.request({
      method: 'eth_accounts',
    })) as string[]

    const artifactResolver = new HardhatArtifactResolver(this._hre)

    const resolvedConfig: Partial<DeployConfig> = {
      ...this._config,
      ...perDeployConfig,
    }

    const resolvedStrategyConfig =
      CiveIgnitionHelper._resolveStrategyConfig<StrategyT>(
        this._hre,
        strategy,
        strategyConfig,
      )

    const chainId = Number(
      await this._hre.network.provider.request({
        method: 'eth_chainId',
      }),
    )

    const deploymentId = resolveDeploymentId(givenDeploymentId, chainId)

    const deploymentDir =
      this._hre.network.name === 'hardhat'
        ? undefined
        : path.join(
            this._hre.config.paths.ignition,
            'deployments',
            deploymentId,
          )

    const result = await deploy({
      config: resolvedConfig,
      provider: this._provider,
      deploymentDir,
      artifactResolver,
      ignitionModule,
      deploymentParameters: parameters,
      accounts,
      defaultSender,
      strategy,
      strategyConfig: resolvedStrategyConfig,
      maxFeePerGasLimit:
        this._hre.config.networks[this._hre.network.name]?.ignition
          .maxFeePerGasLimit,
      maxPriorityFeePerGas:
        this._hre.config.networks[this._hre.network.name]?.ignition
          .maxPriorityFeePerGas,
    })

    if (result.type !== DeploymentResultType.SUCCESSFUL_DEPLOYMENT) {
      const message = errorDeploymentResultToExceptionMessage(result)

      throw new HardhatPluginError('hardhat-ignition-viem', message)
    }

    return CiveIgnitionHelper._toViemContracts(
      this._hre,
      ignitionModule,
      result,
    )
  }

  private static async _toViemContracts<
    ModuleIdT extends string,
    ContractNameT extends string,
    IgnitionModuleResultsT extends IgnitionModuleResult<ContractNameT>,
  >(
    hre: HardhatRuntimeEnvironment,
    ignitionModule: IgnitionModule<
      ModuleIdT,
      ContractNameT,
      IgnitionModuleResultsT
    >,
    result: SuccessfulDeploymentResult,
  ): Promise<
    IgnitionModuleResultToCiveContracts<ContractNameT, IgnitionModuleResultsT>
  > {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(ignitionModule.results).map(
          async ([name, contractFuture]) => [
            name,
            await CiveIgnitionHelper._getContract(
              hre,
              contractFuture,
              result.contracts[contractFuture.id],
            ),
          ],
        ),
      ),
    )
  }

  private static async _getContract(
    hre: HardhatRuntimeEnvironment,
    future: Future,
    deployedContract: { address: string },
  ): Promise<GetContractReturnType> {
    if (!isContractFuture(future)) {
      throw new HardhatPluginError(
        'hardhat-ignition-cive',
        `Expected contract future but got ${future.id} with type ${future.type} instead`,
      )
    }

    return CiveIgnitionHelper._convertContractFutureToViemContract(
      hre,
      future,
      deployedContract,
    )
  }

  private static async _convertContractFutureToViemContract(
    hre: HardhatRuntimeEnvironment,
    future: ContractFuture<string>,
    deployedContract: { address: string },
  ) {
    switch (future.type) {
      case FutureType.NAMED_ARTIFACT_CONTRACT_DEPLOYMENT:
      case FutureType.NAMED_ARTIFACT_LIBRARY_DEPLOYMENT:
      case FutureType.NAMED_ARTIFACT_CONTRACT_AT:
        return CiveIgnitionHelper._convertHardhatContractToViemContract(
          hre,
          future,
          deployedContract,
        )
      case FutureType.CONTRACT_DEPLOYMENT:
      case FutureType.LIBRARY_DEPLOYMENT:
      case FutureType.CONTRACT_AT:
        return CiveIgnitionHelper._convertArtifactToViemContract(
          hre,
          future,
          deployedContract,
        )
    }
  }

  private static _convertHardhatContractToViemContract(
    hre: HardhatRuntimeEnvironment,
    future:
      | NamedArtifactContractDeploymentFuture<string>
      | NamedArtifactLibraryDeploymentFuture<string>
      | NamedArtifactContractAtFuture<string>,
    deployedContract: { address: string },
  ): Promise<GetContractReturnType> {
    return hre.cive.getContractAt(
      future.contractName,
      CiveIgnitionHelper._ensureAddressFormat(deployedContract.address),
    )
  }

  private static async _convertArtifactToViemContract(
    hre: HardhatRuntimeEnvironment,
    future:
      | ContractDeploymentFuture
      | LibraryDeploymentFuture
      | ContractAtFuture,
    deployedContract: { address: string },
  ): Promise<GetContractReturnType> {
    const publicClient = await hre.cive.getPublicClient()
    const [walletClient] = await hre.cive.getWalletClients()

    if (walletClient === undefined) {
      throw new HardhatPluginError(
        'hardhat-ignition-cive',
        'No default wallet client found',
      )
    }

    const cive = await import('cive')
    const contract = cive.getContract({
      address: CiveIgnitionHelper._ensureAddressFormat(
        deployedContract.address,
      ),
      abi: future.artifact.abi,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    })

    return contract
  }

  private static _ensureAddressFormat(address: string): `0x${string}` {
    if (!address.startsWith('0x')) {
      return `0x${address}`
    }

    return `0x${address.slice(2)}`
  }

  private static _resolveStrategyConfig<StrategyT extends keyof StrategyConfig>(
    hre: HardhatRuntimeEnvironment,
    strategyName: StrategyT | undefined,
    strategyConfig: StrategyConfig[StrategyT] | undefined,
  ): StrategyConfig[StrategyT] | undefined {
    if (strategyName === undefined) {
      return undefined
    }

    if (strategyConfig === undefined) {
      const fromHardhatConfig =
        hre.config.ignition?.strategyConfig?.[strategyName]

      return fromHardhatConfig
    }

    return strategyConfig
  }
}
