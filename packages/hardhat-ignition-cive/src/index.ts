import '@nomicfoundation/hardhat-ignition'
import '@civex/hardhat-cive'
import { extendEnvironment } from 'hardhat/config.js'
import { HardhatPluginError, lazyObject } from 'hardhat/plugins.js'

import './type-extensions.js'

extendEnvironment((hre) => {
  if (
    hre.ignition !== undefined &&
    hre.ignition.type !== 'stub' &&
    hre.ignition.type !== 'cive'
  ) {
    throw new HardhatPluginError(
      '@civex/hardhat-cive',
      `Found ${hre.ignition.type} and cive, but only one Hardhat Ignition extension plugin can be used at a time.`,
    )
  }

  hre.ignition = lazyObject(() => {
    const { CiveIgnitionHelper } = require('./cive-ignition-helper.js')

    return new CiveIgnitionHelper(hre)
  })
})
