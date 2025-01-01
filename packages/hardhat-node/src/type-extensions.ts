import 'hardhat/types/config'
import 'hardhat/types/runtime'
import type { Config } from '@xcfx/node'

declare module 'hardhat/types/config' {
  interface NetworksConfig {
    conflux?: Config
  }

  interface NetworksUserConfig {
    conflux?: Config
  }
}
