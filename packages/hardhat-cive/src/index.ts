import { extendEnvironment } from 'hardhat/config.js'
import {
  getPublicClient,
  getWalletClient,
  getWalletClients,
} from './internal/client.js'

extendEnvironment((hre) => {
  const { provider } = hre.network

  hre.cive = {
    getPublicClient(config) {
      return getPublicClient(provider, config)
    },

    getWalletClients(config) {
      const accounts = hre.network.config.accounts
      return getWalletClients(accounts, provider, config)
    },

    getWalletClient(config) {
      const accounts = hre.network.config.accounts
      return getWalletClient(accounts, provider, config)
    },
  }
})
