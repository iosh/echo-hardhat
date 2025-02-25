# @civex/hardhat-verify

Hardhat plugin for verifying smart contracts on Conflux Network.

## Installation

```bash
npm install --save-dev @civex/hardhat-verify
```

## Configuration

Add the following to your `hardhat.config.js` or `hardhat.config.ts`:

```javascript
require("hardhat/config");
require("@civex/hardhat-cive");
require("@civex/hardhat-verify");
const config = {
  // your config
};

module.exports = config;
```

## Network Configuration

### Mainnet

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@civex/hardhat-cive";
import "@civex/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    conflux: {
      chainId: 1029,
      url: "https://main.confluxrpc.com",
      accounts: ["0x..."],
    },
  },
};

export default config;
```

### Testnet

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@civex/hardhat-cive";
import "@civex/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    conflux: {
      chainId: 1,
      url: "https://test.confluxrpc.com",
      accounts: ["0x..."],
    },
  },
};

export default config;
```

Then you can run the `hardhat verify` command:

```bash
npx hardhat verify --network conflux <CONTRACT_ADDRESS>
```

Example:

```bash
npx hardhat verify --network conflux cfxtest:ach5d6mu280u43p6707s9c5csymzsa19s2uxzstd0p
```

## Supported Networks

- Conflux Mainnet (chainId: 1029)
- Conflux Testnet (chainId: 1)
