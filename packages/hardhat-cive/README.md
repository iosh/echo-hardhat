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

1. Set the network

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

2. Create a `MyToken.sol` file inside your project's `contracts` folder.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MyToken {
  uint256 public totalSupply;

  constructor(uint256 _initialSupply) {
    totalSupply = _initialSupply;
  }

  function increaseSupply(uint256 _amount) public {
    require(_amount > 0, "Amount must be greater than 0");
    totalSupply += _amount;
  }

  function getCurrentSupply() public view returns (uint256) {
    return totalSupply;
  }
}

```

Run `npx hardhat compile`to compile your contracts and produce types in the artifacts directory.

3. Create a `contracts.ts` inside the scripts directory:

```ts
import hre from "hardhat";

async function main() {
  const myToken = await hre.cive.deployContract("MyToken", [1_000_000n]);
  const initialSupply = await myToken.read.totalSupply();
  console.log(`Initial supply of MyToken: ${initialSupply}`); // Initial supply of MyToken: 1000000
  const hash = await myToken.write.increaseSupply([500_000n]);
  // increaseSupply sends a tx, so we need to wait for it to be mined
  const publicClient = await hre.cive.getPublicClient();

  await publicClient.waitForTransactionReceipt({ hash });

  const newSupply = await myToken.read.getCurrentSupply();
  console.log(`New supply of MyToken: ${newSupply}`); // New supply of MyToken: 1500000
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

4. Run `npx hardhat run scripts/contracts.ts --network conflux`

You need to specify the network you want to use. Because this plugin is only support the `conflux core space` mainnet and testnet.



Read more about cive: https://github.com/iosh/cive

