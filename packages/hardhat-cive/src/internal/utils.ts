import type { HttpNetworkConfig, NetworkConfig } from 'hardhat/types'

export function checkNetworkConfig(
  config: NetworkConfig,
): config is HttpNetworkConfig {
  if (typeof config === 'undefined') return false

  if (typeof config === 'object' && 'url' in config) return true

  return false
}
