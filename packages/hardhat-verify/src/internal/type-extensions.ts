import type { ConfluxscanConfig } from '../types'

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    confluxscan?: Partial<ConfluxscanConfig>
  }

  interface HardhatConfig {
    confluxscan: ConfluxscanConfig
  }
}
