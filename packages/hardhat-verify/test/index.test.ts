import { TASK_CLEAN, TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { beforeEach, describe, expect, test } from 'vitest'
import { setWorkDir, unsetWorkDir } from './helpers'

import { TASK_VERIFY } from '../src/internal/task-names'
beforeEach(async () => {
  setWorkDir()

  const hre = await import('hardhat')

  await hre.run(TASK_COMPILE, { quiet: true })

  return () => {
    hre.run(TASK_CLEAN)
    unsetWorkDir()
  }
})
describe('Hardhat project', () => {
  test('default', async () => {
    const hre = await import('hardhat')
    //@ts-ignore
    const contract = await hre.cive.deployContract(
      'WithoutConstructorArgs',
      [],
      {
        retryCount: 20,
      },
    )
    const response = await hre.run(TASK_VERIFY, {
      address: contract.address,
    })

    expect(response).toMatchInlineSnapshot()
  })
})
