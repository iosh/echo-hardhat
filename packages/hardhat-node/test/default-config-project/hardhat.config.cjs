require('../../dist')
/**
 * @type  {import('hardhat/config').HardhatUserConfig}
 */
const config = {
  solidity: '0.8.19',
  networks: {
    conflux: {
      url: 'http://127.0.0.1:12539',
      chainId: 1111,
    },
  },
  conflux: {
    chainId: 1111,
    jsonrpcLocalHttpPort: 12539,
  },
}

module.exports = config
