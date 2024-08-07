import type {
  Address,
  PublicClient,
  PublicClientConfig,
  WalletClient,
  WalletClientConfig,
} from 'cive'

import 'hardhat/types/runtime.js'

export type getPublicClientParameters = Partial<PublicClientConfig> &
  Required<Pick<PublicClientConfig, 'chain'>>

declare module 'hardhat/types/runtime.js' {
  interface HardhatRuntimeEnvironment {
    cive: {
      getPublicClient(config: getPublicClientParameters): Promise<PublicClient>
      getWalletClients(
        config?: Partial<WalletClientConfig>,
      ): Promise<[WalletClient, WalletClient]>
      getWalletClient(
        address: Address,
        config?: Partial<WalletClientConfig>,
      ): Promise<WalletClient>
    }
  }
}
