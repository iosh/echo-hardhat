import type { Chain } from 'cive'
import type { HttpNetworkConfig } from 'hardhat/types/config.js'
import memoize from 'lodash.memoize'
import type { HttpTransportType } from '../types.js'

export async function getChain(
  transport: HttpTransportType,
  config: HttpNetworkConfig,
): Promise<Chain> {
  const chains = await import('cive/chains')
  const networkId = await getNetworkId(transport)

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
    rpcUrls: { default: { http: [config.url] } },
    nativeCurrency: {
      decimals: 18,
      name: 'CFX',
      symbol: 'CFX',
    },
  }) as Chain
}

export const getNetworkId: (transport: HttpTransportType) => Promise<number> =
  memoize(async (transport: HttpTransportType) => {
    const status = (await transport({}).request({
      method: 'cfx_getStatus',
    })) as any

    return Number(status.networkId)
  })

export const isConfluxTestNetwork = (networkId: number) => {
  return networkId === 1
}

export const isConfluxMainNetwork = (networkId: number) => {
  return networkId === 1029
}
