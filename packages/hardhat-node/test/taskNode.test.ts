import { beforeEach, describe, expect, test } from 'vitest'
import {
  TASK_CONFLUX_NODE,
  TASK_CONFLUX_NODE_SERVER_READY,
} from '../src/constants'
import { setWorkDir, unsetWorkDir } from './helpers'
describe('default', () => {
  beforeEach(() => {
    setWorkDir('default-config-project')
    return unsetWorkDir
  })

  test('default', async () => {
    const hre = await import('hardhat')

    hre.tasks[TASK_CONFLUX_NODE_SERVER_READY].setAction(async () => {
      const result = await fetch(
        `http://127.0.0.1:${config.jsonrpcLocalHttpPort}`,
        {
          headers: {
            'content-type': 'application/json',
          },
          body: '{"id":1,"jsonrpc":"2.0","params":["earliest"],"method":"cfx_epochNumber"}',
          method: 'POST',
        },
      ).then((res) => res.json() as Promise<{ result: string }>)
      expect(result.result).toMatchInlineSnapshot()
    })

    await hre.run(TASK_CONFLUX_NODE)
  })
})
