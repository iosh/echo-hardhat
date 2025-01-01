require('../../dist')
/**
 * @type  {import('hardhat/config').HardhatUserConfig}
 */
const config = {
  solidity: '0.8.19',
  networks: {
    conflux: {
      chainId: 1111,
    },
  },
}

module.exports = config
