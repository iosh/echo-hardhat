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
import './internal/type-extensions'
import './internal/tasks'

extendEnvironment((hre) => {
  hre.cive = {
    getPublicClient(config) {
      return getPublicClient(hre, config)
    },

    getWalletClients(config) {
      return getWalletClients(hre, config)
    },

    getWalletClient(config) {
      return getWalletClient(hre, config)
    },

    deployContract: (contractName, constructorArgs, config) =>
      deployContract(hre, contractName, constructorArgs, config),

    sendDeploymentTransaction: (contractName, constructorArgs, config) =>
      sendDeploymentTransaction(hre, contractName, constructorArgs, config),

    getContractAt: (contractName, address, config) =>
      getContractAt(hre, contractName, address, config),
  }
})
