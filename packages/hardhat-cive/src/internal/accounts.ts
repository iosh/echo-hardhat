import { type PrivateKeyAccount, privateKeyToAccount } from 'cive/accounts'
import type {
  HardhatNetworkAccountsConfig,
  HttpNetworkAccountsConfig,
} from 'hardhat/types/config.js'

export function getAccountsByHreAccounts(
  accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
  networkId: number,
) {
  const civeAccounts: PrivateKeyAccount[] = []

  if (Array.isArray(accounts)) {
    for (const account of accounts) {
      if (typeof account === 'object') {
        let privateKey = account.privateKey

        if (!privateKey.startsWith('0x')) {
          privateKey = `0x${privateKey}`
        }
        civeAccounts.push(
          privateKeyToAccount(privateKey as `0x${string}`, {
            networkId: networkId,
          }),
        )
      }
    }
  }

  return civeAccounts
}
