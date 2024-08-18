import { parseCFX } from 'cive'
import { TASK_CLEAN, TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { beforeEach, describe, expect, test } from 'vitest'
import { setWorkDir, unsetWorkDir } from './helpers'

describe('default', () => {
  beforeEach(() => {
    setWorkDir('hardhat-project')
    return unsetWorkDir
  })

  test('default', async () => {
    const hre = await import('hardhat')
    expect(hre.cive).toMatchInlineSnapshot(`
      {
        "deployContract": [Function],
        "getContractAt": [Function],
        "getPublicClient": [Function],
        "getWalletClient": [Function],
        "getWalletClients": [Function],
        "sendDeploymentTransaction": [Function],
      }
    `)
  })
})

describe('client', () => {
  beforeEach(async () => {
    setWorkDir('hardhat-project')

    const hre = await import('hardhat')
    hre.run(TASK_COMPILE, { quiet: true })

    return () => {
      hre.run(TASK_CLEAN)
      unsetWorkDir()
    }
  })

  test('public client', async () => {
    const hre = await import('hardhat')

    const client = await hre.cive.getPublicClient()
    const status = await client.getStatus()

    expect(status.chainId).toMatchInlineSnapshot('1')
    expect(status.networkId).toMatchInlineSnapshot('1')
  })

  test('wallet client', async () => {
    const hre = await import('hardhat')

    const publicClient = await hre.cive.getPublicClient()

    const [fromWalletClient, toWalletClient] = await hre.cive.getWalletClients()
    const fromAddress = fromWalletClient.account.address
    const toAddress = toWalletClient.account.address
    const fromBalanceBefore = await publicClient.getBalance({
      address: fromAddress,
    })
    const toBalanceBefore = await publicClient.getBalance({
      address: toAddress,
    })

    const cfxAmount = parseCFX('0.0001')

    const hash = await fromWalletClient.sendTransaction({
      to: toAddress,
      value: cfxAmount,
    })

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      retryCount: 15,
    })

    const transactionFee = receipt.gasUsed * receipt.effectiveGasPrice

    const fromBalanceAfter = await publicClient.getBalance({
      address: fromAddress,
    })
    const toBalanceAfter = await publicClient.getBalance({
      address: toAddress,
    })

    expect(receipt).toBeDefined()
    expect(receipt.outcomeStatus).toBe('success')
    expect(fromBalanceAfter).toEqual(
      fromBalanceBefore - cfxAmount - transactionFee,
    )

    expect(toBalanceAfter).toEqual(toBalanceBefore + cfxAmount)
  })
})

describe('contracts', () => {
  beforeEach(async () => {
    setWorkDir('hardhat-project')

    const hre = await import('hardhat')
    await hre.run(TASK_COMPILE, { quiet: true })

    return async () => {
      await hre.run(TASK_CLEAN)
      unsetWorkDir()
    }
  })

  test('deployContract', async () => {
    const hre = await import('hardhat')
    const contract = await hre.cive.deployContract(
      'WithoutConstructorArgs',
      [],
      { retryCount: 15 },
    )
    const hash = await contract.write.setData([50n])
    const publicClient = await hre.cive.getPublicClient()

    await publicClient.waitForTransactionReceipt({
      hash,
      retryCount: 15,
    })

    const data = await contract.read.getData()

    expect(data).toEqual(50n)
  })

  test('deployContract with args', async () => {
    const hre = await import('hardhat')

    const [defaultWalletClient] = await hre.cive.getWalletClients()
    const contract = await hre.cive.deployContract(
      'WithConstructorArgs',
      [50n],
      { retryCount: 15 },
    )

    const data = await contract.read.getData()

    const owner = await contract.read.getOwner()
    expect(data).toEqual(50n)
    expect(owner).toEqual(defaultWalletClient.account.address)
  })

  test('deploy with other account', async () => {
    const hre = await import('hardhat')
    const [_, walletClient] = await hre.cive.getWalletClients()
    const contract = await hre.cive.deployContract(
      'WithoutConstructorArgs',
      [],
      { client: { wallet: walletClient } },
    )

    const owner = await contract.read.getOwner()

    expect(owner).toEqual(walletClient.account.address)
  })

  test('deploy with cfx', async () => {
    const hre = await import('hardhat')
    const publicClient = await hre.cive.getPublicClient()

    const cfxAmount = parseCFX('0.0001')
    const contract = await hre.cive.deployContract(
      'WithoutConstructorArgs',
      [],
      { retryCount: 15, value: cfxAmount },
    )

    const contractBalance = await publicClient.getBalance({
      address: contract.address,
    })

    expect(contractBalance).toEqual(cfxAmount)
  })

  test('deploy with normal library linked', async () => {
    const hre = await import('hardhat')
    const cfxAmount = parseCFX('0.0001')
    const normalLibContract = await hre.cive.deployContract('NormalLib', [], {
      retryCount: 15,
      value: cfxAmount,
    })
    const contract = await hre.cive.deployContract('OnlyNormalLib', [], {
      retryCount: 15,
      libraries: {
        NormalLib: normalLibContract.address,
      },
    })

    expect(await contract.read.getNumber([2n])).toBe(4n)
  })

  test('deploy with constructor library linked', async () => {
    const hre = await import('hardhat')
    const ctorLibContract = await hre.cive.deployContract(
      'contracts/WithLibs.sol:ConstructorLib',
      [],
      {
        retryCount: 15,
      },
    )
    const contract = await hre.cive.deployContract('OnlyConstructorLib', [2n], {
      retryCount: 15,
      libraries: {
        ConstructorLib: ctorLibContract.address,
      },
    })

    expect(await contract.read.getNumber([])).toBe(8n)
  })

  test('deploy with both normal and constructor libraries linked', async () => {
    const hre = await import('hardhat')
    const ctorLibContract = await hre.cive.deployContract(
      'contracts/WithLibs.sol:ConstructorLib',
    )
    const normalLibContract = await hre.cive.deployContract('NormalLib')

    const contract = await hre.cive.deployContract('BothLibs', [3n], {
      libraries: {
        ConstructorLib: ctorLibContract.address,
        NormalLib: normalLibContract.address,
      },
    })
    expect(await contract.read.getNumber([])).toEqual(12n)
    expect(await contract.read.getNumber([5n])).toEqual(10n)
  })
})
