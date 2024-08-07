import { extendEnvironment } from 'hardhat/config.js'
import { getPublicClient } from './internal/client.js'

extendEnvironment((hre) => {
  const { provider } = hre.network

  hre.cive = {
    getPublicClient(config) {
      return getPublicClient(provider, config)
    },
  }
})
