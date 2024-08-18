import type { HttpNetworkConfig } from 'hardhat/types/config.js'

export const defaultHttpNetworkConfig: HttpNetworkConfig = {
  url: 'http://127.0.0.1:12537',
  gas: 21000,
  gasPrice: 1000000000,
  gasMultiplier: 1.2,
  timeout: 30000,
  httpHeaders: {},
  accounts: [
    '02f09385eab7b9966a45005d4e42dd73f72f7427d9e5276d26de53cea49eb177',
    '1c1eddd27492886d9e7681c8420b93faf12d22233f76036342fca12352949e5a',
    '314437eda883112564e85bcabcdea684a17223c42aca92d707624abd4f2ad6d8',
    '202334094742f128b99f150e4c5f8bf9ca71cc05d7e1599c9edf82323d5df873',
    '4c7135bfc409401a34dd060a4256160b6386f92cfa25ededac55dac20a0a4707',
    'cecc91ad75e58a2a29b85827b9d0bb513eb06cecfc0df691a0e8b4989280667c',
    '96a141a5442eca262abbeb5d36be1d77fadcbee35e137f0fa47214dff91a37d0',
  ],
}
