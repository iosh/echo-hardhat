import { testnet } from 'cive'
import { describe, expect, test } from 'vitest'
import { getAccountsByHreAccounts } from '../src/internal/accounts.js'
import {
  innerGetPublicClient,
  innerGetWalletClients,
} from '../src/internal/client.js'
import { defaultHttpNetworkConfig } from './mocks/httpNetworkConfig.js'

describe('innerGetPublicKey', () => {
  test('default', async () => {
    const client = await innerGetPublicClient(testnet)
    expect(client).toBeDefined()

    expect(client.name).toMatchInlineSnapshot(`"Public Client"`)
    expect(client.type).toMatchInlineSnapshot(`"publicClient"`)
    expect(client.chain.id).toMatchInlineSnapshot('1')
  })

  test('public client with config', async () => {
    const client = await innerGetPublicClient(testnet, {
      pollingInterval: 1000,
      cacheTime: 1000,
    })

    expect(client.pollingInterval).toBe(1000)
    expect(client.cacheTime).toBe(1000)
  })
})

describe('innerGetWalletClients', () => {
  test('default', async () => {
    const civeAccounts = getAccountsByHreAccounts(
      defaultHttpNetworkConfig.accounts,
      testnet.id,
    )
    const clients = await innerGetWalletClients(testnet, civeAccounts)

    expect(clients.length).toMatchInlineSnapshot('7')

    for (const client of clients) {
      expect(client).toBeDefined()
      expect(client.type).toMatchInlineSnapshot(`"walletClient"`)
      expect(client.chain.id).toMatchInlineSnapshot('1')
    }
  })

  test('with args', async () => {
    const civeAccounts = getAccountsByHreAccounts(
      defaultHttpNetworkConfig.accounts,
      testnet.id,
    )
    const clients = await innerGetWalletClients(testnet, civeAccounts, {
      pollingInterval: 2000,
      cacheTime: 2000,
    })

    expect(clients.length).toMatchInlineSnapshot('7')
    for (const client of clients) {
      expect(client).toBeDefined()
      expect(client.type).toMatchInlineSnapshot(`"walletClient"`)
      expect(client.chain.id).toMatchInlineSnapshot('1')
      expect(client.pollingInterval).toBe(2000)
      expect(client.cacheTime).toBe(2000)
    }
  })

  test('empty accounts', async () => {
    const clients = await innerGetWalletClients(testnet, [])

    expect(clients.length).toMatchInlineSnapshot('0')
  })
})
