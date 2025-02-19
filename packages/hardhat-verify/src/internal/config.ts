import type { HardhatConfig, HardhatUserConfig } from 'hardhat/types'
import type { ConfluxscanConfig } from '../types'

export function confluxscanConfigExtender(
  config: HardhatConfig,
  userConfig: Readonly<HardhatUserConfig>,
) {
  const defaultConfluxscanConfig: ConfluxscanConfig = {
    apiKey: '',
    customChains: [],
    enabled: true,
  }

  const cloneDeep = require('lodash.clonedeep')

  const userEtherscanConfig = cloneDeep(userConfig.etherscan)

  config.confluxscan = { ...defaultConfluxscanConfig, ...userEtherscanConfig }
}
