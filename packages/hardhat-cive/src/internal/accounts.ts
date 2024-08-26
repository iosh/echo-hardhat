import type { Hex } from 'cive'
import { type PrivateKeyAccount, privateKeyToAccount } from 'cive/accounts'
import type {
  HardhatNetworkAccountsConfig,
  HttpNetworkAccountsConfig,
} from 'hardhat/types/config'

export function getAccountsByHreAccounts(
  accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
  networkId: number,
) {
  const civeAccounts: PrivateKeyAccount[] = []

  if (Array.isArray(accounts)) {
    for (const account of accounts) {
      let privateKey: Hex
      if (typeof account === 'object') {
        privateKey = account.privateKey.startsWith('0x')
          ? (account.privateKey as Hex)
          : `0x${account.privateKey}`
      } else {
        privateKey = account.startsWith('0x')
          ? (account as Hex)
          : `0x${account}`
      }
      civeAccounts.push(
        privateKeyToAccount(privateKey as `0x${string}`, {
          networkId: networkId,
        }),
      )
    }
  }
  return civeAccounts
}
