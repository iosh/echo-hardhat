// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

contract WithoutConstructorArgs {
  uint256 public data;
  address public owner;

  constructor() payable {
    owner = msg.sender;
  }

  function setData(uint256 newValue) external {
    data = newValue;
  }

  function getData() external view returns (uint256) {
    return data;
  }
}
