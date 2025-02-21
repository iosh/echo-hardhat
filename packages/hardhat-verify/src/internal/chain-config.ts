import type { ChainConfig } from '../types'

export const builtinChains: ChainConfig[] = [
  {
    network: 'mainnet',
    chainId: 1029,
    urls: {
      apiURL: 'https://api.confluxscan.io',
      browserURL: 'https://confluxscan.io',
    },
  },
  {
    network: 'testnet',
    chainId: 1,
    urls: {
      apiURL: 'https://api-testnet.confluxscan.io',
      browserURL: 'https://testnet.confluxscan.io',
    },
  },
]
