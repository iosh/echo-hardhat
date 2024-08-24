import type { CiveIgnitionHelper } from './cive-ignition-helper.js'

import 'hardhat/types/runtime.js'

declare module 'hardhat/types/runtime.js' {
  export interface HardhatRuntimeEnvironment {
    ignition: CiveIgnitionHelper
  }
}
