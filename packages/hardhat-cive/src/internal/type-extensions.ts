import type { Address, PublicClient, WalletClient } from 'cive'

import 'hardhat/types/runtime.js'
import type {
  getPublicClientParameters,
  getWalletClientsParameters,
} from './client.js'

declare module 'hardhat/types/runtime.js' {
  interface HardhatRuntimeEnvironment {
    cive: {
      getPublicClient(config: getPublicClientParameters): Promise<PublicClient>
      getWalletClients(
        config: getWalletClientsParameters,
      ): Promise<WalletClient[]>
      getWalletClient(
        address: Address,
        config?: Partial<getWalletClientsParameters>,
      ): Promise<WalletClient>
    }
  }
}
