import type { Chain } from 'cive'
import type { HttpNetworkConfig } from 'hardhat/types/config.js'
import type { EthereumProvider } from 'hardhat/types/provider.js'
import memoize from 'lodash.memoize'
export async function getChain(
  provider: EthereumProvider,
  config: HttpNetworkConfig,
): Promise<Chain> {
  const chains = await import('cive/chains')
  const networkId = await getNetworkId(provider)

  if (isConfluxTestNetwork(networkId)) {
    return chains.testnet
  }
  if (isConfluxMainNetwork(networkId)) {
    return chains.mainnet
  }

  const utils = await import('cive/utils')

  // private network
  return utils.defineChain({
    id: networkId,
    name: `net${networkId}`,
    nativeCurrency: { name: 'CFX', decimals: 18, symbol: 'CFX' },
    rpcUrls: { default: { http: [config.url] } },
  })
}

export const getNetworkId = memoize(async (provider: EthereumProvider) => {
  const status = await provider.send('cfx_getStatus')

  return Number(status.networkId)
})

export const isConfluxTestNetwork = (networkId: number) => {
  return networkId === 1
}

export const isConfluxMainNetwork = (networkId: number) => {
  return networkId === 1029
}
