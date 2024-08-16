import { extendEnvironment } from 'hardhat/config.js'
import {
  getPublicClient,
  getWalletClient,
  getWalletClients,
} from './internal/client.js'
import {
  deployContract,
  getContractAt,
  sendDeploymentTransaction,
} from './internal/contracts.js'

extendEnvironment((hre) => {
  const { provider } = hre.network

  hre.cive = {
    getPublicClient(config) {
      return getPublicClient(hre, config)
    },

    getWalletClients(config) {
      const accounts = hre.network.config.accounts
      return getWalletClients(accounts, provider, config)
    },

    getWalletClient(config) {
      const accounts = hre.network.config.accounts
      return getWalletClient(accounts, provider, config)
    },

    deployContract: (contractName, constructorArgs, config) =>
      deployContract(hre, contractName, constructorArgs, config),

    sendDeploymentTransaction: (contractName, constructorArgs, config) =>
      sendDeploymentTransaction(hre, contractName, constructorArgs, config),

    getContractAt: (contractName, address, config) =>
      getContractAt(hre, contractName, address, config),
  }
})
