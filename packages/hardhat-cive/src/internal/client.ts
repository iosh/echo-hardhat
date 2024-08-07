import type { Chain, PublicClient, PublicClientConfig } from 'cive'

import type { EthereumProvider } from 'hardhat/types/provider.js'
import type { getPublicClientParameters } from './type-extensions.js'

export async function getPublicClient(
  provider: EthereumProvider,
  config: getPublicClientParameters,
) {
  const chain = config.chain

  if (!chain) throw new Error('getPublicClient: chain is required')
  return innerGetPublicClient(provider, chain, config)
}

export async function innerGetPublicClient(
  provider: EthereumProvider,
  chain: Chain,
  publicClientConfig?: Partial<PublicClientConfig>,
): Promise<PublicClient> {
  const cive = await import('cive')

  const publicClient = cive.createPublicClient({
    chain: chain,
    transport: cive.custom(provider),
    ...publicClientConfig,
  })

  return publicClient
}
