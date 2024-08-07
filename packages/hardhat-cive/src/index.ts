import { extendEnvironment } from 'hardhat/config.js'
import { getPublicClient, getWalletClients } from './internal/client.js'

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
  }
})
