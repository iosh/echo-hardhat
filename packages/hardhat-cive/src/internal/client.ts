import type { Chain, PublicClientConfig, WalletClientConfig } from 'cive'
import type {
  HardhatNetworkAccountsConfig,
  HttpNetworkAccountsConfig,
} from 'hardhat/types/config.js'

import type { PrivateKeyAccount } from 'cive/accounts'
import type { EthereumProvider } from 'hardhat/types/provider.js'
import type { PublicClient, WalletClient } from 'src/types.js'
import { getAccountsByHreAccounts } from './accounts.js'

export type getPublicClientParameters = Partial<PublicClientConfig> &
  Required<Pick<PublicClientConfig, 'chain'>>

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
  }) as PublicClient

  return publicClient
}

export type getWalletClientsParameters = Partial<WalletClientConfig> &
  Required<Pick<WalletClientConfig, 'chain'>>
export async function getWalletClients(
  accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
  provider: EthereumProvider,
  config: getWalletClientsParameters,
): Promise<WalletClient[]> {
  const civeAccounts = getAccountsByHreAccounts(accounts, config.chain!.id)

  return innerGetWalletClients(provider, civeAccounts, config)
}

export async function innerGetWalletClients(
  provider: EthereumProvider,
  accounts: PrivateKeyAccount[],
  walletClientConfig: getWalletClientsParameters,
) {
  const cive = await import('cive')

  const walletClients = accounts.map((account) => {
    return cive.createWalletClient({
      transport: cive.custom(provider),
      account: account,
      ...walletClientConfig,
    }) as WalletClient
  })

  return walletClients
}

export async function getWalletClient(
  accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
  provider: EthereumProvider,
  config: getWalletClientsParameters,
): Promise<WalletClient> {
  const civeAccounts = getAccountsByHreAccounts(accounts, config.chain!.id)

  const pkAccounts = await innerGetWalletClients(provider, civeAccounts, config)
  return pkAccounts[0]
}
