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

contract Test {
    address public savedAddress;
    uint256 public value;
    constructor() {
        savedAddress = msg.sender;
    }

    function setSavedAddress(address _address) public {
        savedAddress = _address;
    }

    function getSavedAddress() public view returns (address) {
        return savedAddress;
    }

    function setValue(uint256 _value) public {
        value = _value;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}


```

Run `npx hardhat compile`to compile your contracts and produce types in the artifacts directory.

3. Create a `contracts.ts` inside the scripts directory:

```ts
import hre from "hardhat";

async function main() {
  const testContract = await hre.cive.deployContract("Test");

  const defaultAddress = await testContract.read.getSavedAddress();

  console.log("default address is ", defaultAddress); //default address is cfxtest:....

  const hash = await testContract.write.setSavedAddress([
    "cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw",
  ]); // Zero Address

  // sends a tx, so we need to wait for it to be mined
  const publicClient = await hre.cive.getPublicClient();

  await publicClient.waitForTransactionReceipt({ hash });

  const newAddress = await testContract.read.getSavedAddress();

  console.log("new address is ", newAddress); // new address is  cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw

  const defaultValue = await testContract.read.getValue();

  console.log("default value is ", defaultValue); // default value is  0n

  const hash2 = await testContract.write.setValue([100n]);

  await publicClient.waitForTransactionReceipt({ hash: hash2 });

  const newValue = await testContract.read.getValue();

  console.log("new value is ", newValue); // new value is  100n
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

If you are getting the `Timed out while waiting for transaction with hash` error, you can try again, or set the `retryCount` to a higher value.

```ts
await publicClient.waitForTransactionReceipt({ hash, retryCount: 11 }); // default retryCount is 6
```

4. Run `npx hardhat run scripts/contracts.ts --network conflux`

You need to specify the network you want to use. Because this plugin is only support the `conflux core space` mainnet and testnet.

Read more about cive: https://github.com/iosh/cive
