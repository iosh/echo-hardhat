import 'hardhat/types/config'
import 'hardhat/types/runtime'
import type { Config } from '@xcfx/node'

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    conflux?: Config
  }

  interface HardhatConfig {
    conflux?: Config
  }
}
