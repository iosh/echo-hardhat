import { extendEnvironment } from 'hardhat/config'
import {
  getPublicClient,
  getWalletClient,
  getWalletClients,
} from './internal/client'
import {
  deployContract,
  getContractAt,
  sendDeploymentTransaction,
} from './internal/contracts'
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
