import type { Chain, PublicClientConfig, WalletClientConfig } from 'cive'

import type { PrivateKeyAccount } from 'cive/accounts'
import type { HardhatRuntimeEnvironment } from 'hardhat/types/runtime.js'
import type { PublicClient, WalletClient } from '../types.js'
import { getAccountsByHreAccounts } from './accounts.js'
import { getChain } from './chains.js'
import { UnsupportedNetworkError } from './errors.js'
import { checkNetworkConfig } from './utils.js'

export async function getPublicClient(
  her: HardhatRuntimeEnvironment,
  config?: Partial<PublicClientConfig>,
): Promise<PublicClient> {
  const { network } = her

  if (!checkNetworkConfig(network.config)) {
    throw new UnsupportedNetworkError()
  }

  const cive = await import('cive')
  const transport = cive.http(network.config.url)
  const chain = await getChain(transport, network.config)
  return innerGetPublicClient(chain, config)
}

export async function innerGetPublicClient(
  chain: Chain,
  publicClientConfig?: Partial<PublicClientConfig>,
): Promise<PublicClient> {
  const cive = await import('cive')
  const transport = cive.http(chain.rpcUrls.default.http[0])
  const publicClient = cive.createPublicClient({
    chain: chain,
    transport: transport,
    ...publicClientConfig,
  }) as PublicClient

  return publicClient
}

export type getWalletClientsParameters = Partial<WalletClientConfig>
export async function getWalletClients(
  { network }: HardhatRuntimeEnvironment,
  config: getWalletClientsParameters = {},
): Promise<WalletClient[]> {
  const { accounts } = network.config

  if (!checkNetworkConfig(network.config)) {
    throw new UnsupportedNetworkError()
  }

  const cive = await import('cive')
  const transport = cive.http(network.config.url)
  const chain = await getChain(transport, network.config)

  const civeAccounts = getAccountsByHreAccounts(accounts, chain.id)

  return innerGetWalletClients(chain, civeAccounts, config)
}

export async function innerGetWalletClients(
  chain: Chain,
  accounts: PrivateKeyAccount[],
  walletClientConfig?: getWalletClientsParameters,
): Promise<WalletClient[]> {
  const cive = await import('cive')
  const transport = cive.http(chain.rpcUrls.default.http[0])
  const walletClients = accounts.map((account) => {
    return cive.createWalletClient({
      chain: chain,
      transport: transport,
      account: account,
      ...walletClientConfig,
    }) as WalletClient
  })

  return walletClients
}

export async function getWalletClient(
  her: HardhatRuntimeEnvironment,
  config?: getWalletClientsParameters,
): Promise<WalletClient> {
  const { network } = her

  if (!checkNetworkConfig(network.config)) {
    throw new UnsupportedNetworkError()
  }

  const cive = await import('cive')

  const transport = cive.http(network.config.url)

  const { accounts } = network.config

  const chain = await getChain(transport, network.config)

  const civeAccounts = getAccountsByHreAccounts(accounts, chain.id)

  const pkAccounts = await innerGetWalletClients(chain, civeAccounts, config)
  return pkAccounts[0]
}
