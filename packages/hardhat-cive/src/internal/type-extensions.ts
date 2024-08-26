import 'hardhat/types/runtime'
import type { PublicClientConfig, WalletClientConfig } from 'cive'
import type {
  PublicClient,
  WalletClient,
  deployContract,
  getContractAt,
  sendDeploymentTransaction,
} from '../types'
import type { getWalletClientsParameters } from './client'

declare module 'hardhat/types/runtime' {
  interface HardhatRuntimeEnvironment {
    cive: {
      getPublicClient(
        config?: Partial<PublicClientConfig>,
      ): Promise<PublicClient>
      getWalletClients(
        config?: Partial<WalletClientConfig>,
      ): Promise<WalletClient[]>
      getWalletClient(config: getWalletClientsParameters): Promise<WalletClient>

      deployContract: typeof deployContract
      sendDeploymentTransaction: typeof sendDeploymentTransaction
      getContractAt: typeof getContractAt
    }
  }
}

declare module 'hardhat/types/artifacts' {
  interface ArtifactsMap {}

  interface Artifacts {
    readArtifact<ArgT extends keyof ArtifactsMap>(
      contractNameOrFullyQualifiedName: ArgT,
    ): Promise<ArtifactsMap[ArgT]>

    readArtifactSync<ArgT extends keyof ArtifactsMap>(
      contractNameOrFullyQualifiedName: ArgT,
    ): ArtifactsMap[ArgT]
  }
}
