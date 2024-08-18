import { afterEach, describe, expect, test, vi } from 'vitest'

import { getChain } from '../src/internal/chains.js'
import type { HttpTransportType } from '../src/types.js'
import { defaultHttpNetworkConfig } from './mocks/httpNetworkConfig.js'

describe('chains', () => {
  describe('getChain', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('should return the mainnet network id', async () => {
      const transport = () => ({
        request: () => Promise.resolve({ chainId: '0x1', networkId: '0x1' }),
      })
      const chain = await getChain(
        transport as unknown as HttpTransportType,
        defaultHttpNetworkConfig,
      )
      expect(chain.id).toBe(1)
    })

    test('should return the testnet network id', async () => {
      const transport = () => ({
        request: () =>
          Promise.resolve({ chainId: '0x405', networkId: '0x405' }),
      })

      const chain = await getChain(
        transport as unknown as HttpTransportType,
        defaultHttpNetworkConfig,
      )
      expect(chain.id).toBe(1029)
    })

    test('should return the private network id', async () => {
      const transport = () => ({
        request: () =>
          Promise.resolve({ chainId: '0x333', networkId: '0x333' }),
      })

      const chain = await getChain(
        transport as unknown as HttpTransportType,
        defaultHttpNetworkConfig,
      )
      expect(chain.id).toBe(819)
    })

    test('private network without config', async () => {
      const transport = () => ({
        request: () =>
          Promise.resolve({ chainId: '0x333', networkId: '0x333' }),
      })
      await expect(
        getChain(transport as unknown as HttpTransportType, {} as any),
      ).rejects.toThrowError(
        'The current network is not mainnet or testnet, please set url in config file',
      )
    })
  })
})
