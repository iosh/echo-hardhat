import type { Chain, PublicClientConfig, WalletClientConfig } from 'cive'
import type {
  HardhatNetworkAccountsConfig,
  HttpNetworkAccountsConfig,
} from 'hardhat/types/config.js'

import type { PrivateKeyAccount } from 'cive/accounts'
import { HardhatPluginError } from 'hardhat/plugins.js'
import type { EthereumProvider } from 'hardhat/types/provider.js'
import type { HardhatRuntimeEnvironment } from 'hardhat/types/runtime.js'
import type { PublicClient, WalletClient } from 'src/types.js'
import { getAccountsByHreAccounts } from './accounts.js'
import { getChain } from './chains.js'

export async function getPublicClient(
  her: HardhatRuntimeEnvironment,
  config: Partial<PublicClientConfig>,
) {
  const { network } = her

  if (!('url' in network.config)) {
    throw new HardhatPluginError(
      'hardhat-cive',
      'hardhat-cive only support conflux mainnet testnet and private network, please use conflux network and set url in config file',
    )
  }

  const chain = await getChain(network.provider, network.config)

  return innerGetPublicClient(network.provider, chain, config)
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

export type getWalletClientsParameters = Partial<WalletClientConfig>
export async function getWalletClients(
  accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
  provider: EthereumProvider,
  config: getWalletClientsParameters,
): Promise<WalletClient[]> {
  const civeAccounts = getAccountsByHreAccounts(accounts, config.chainId)

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
