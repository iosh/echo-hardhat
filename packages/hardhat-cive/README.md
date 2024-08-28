# @civex/hardhat-cive

> By now this plugin only support the `conflux core space` mainnet and testnet. It not support the hardhat network and conflux eSpace.

# Install

```bash
npm install --save-dev @civex/hardhat-cive cive
```

# Usage

And add the following statement to your hardhat.config.js:

```javascript
require("hardhat/config");
require("@civex/hardhat-cive");

const config = {
  // your config
};

module.exports = config;
```

Or, If you are using ESM:

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@civex/hardhat-cive";

const config: HardhatUserConfig = {
  // your config
};

export default config;
```

# Set the network

mainnet

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@civex/hardhat-cive";

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

testnet

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@civex/hardhat-cive";

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
