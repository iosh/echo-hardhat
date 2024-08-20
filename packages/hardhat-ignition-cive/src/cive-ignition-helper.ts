import type {
  DeployConfig,
  DeploymentParameters,
  EIP1193Provider,
  IgnitionModule,
  IgnitionModuleResult,
  StrategyConfig,
} from '@nomicfoundation/ignition-core'
import type { HardhatRuntimeEnvironment } from 'hardhat/types/runtime.js'

export type DeployParameters<Strategy extends keyof StrategyConfig = 'basic'> =
  {
    parameters?: DeploymentParameters
    config?: Partial<DeployConfig>
    defaultSender?: string
    strategy?: Strategy
    strategyConfig?: StrategyConfig[Strategy]
    deploymentId?: string
  }

export class CiveIgnitionHelper {
  public type = 'cive'

  private _provider: EIP1193Provider

  constructor(
    private readonly _her: HardhatRuntimeEnvironment,
    private readonly _config?: Partial<DeployConfig>,
    provider?: EIP1193Provider,
  ) {
    // remove we don't support the provider, or maybe we can support it
    this._provider = provider ?? this._her.network.provider
  }
}
