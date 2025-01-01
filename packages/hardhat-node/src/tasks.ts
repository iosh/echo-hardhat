import { type Config, createServer } from '@xcfx/node'
import { subtask, task, types } from 'hardhat/config'
import { TASK_CONFLUX_NODE, TASK_CONFLUX_NODE_SERVER_READY } from './constants'

subtask(TASK_CONFLUX_NODE_SERVER_READY)
  .addParam('nodeConfig', undefined, undefined, types.any)
  .addParam('confluxServer', undefined, undefined, types.any)
  .setAction(async ({ nodeConfig }: { nodeConfig: any }) => {
    console.info(
      `Started HTTP server on port ${nodeConfig.jsonrpcLocalHttpPort}`,
    )
  })

task(TASK_CONFLUX_NODE, 'Starts a local conflux node').setAction(
  async (_, { config, run }) => {
    const nodeConfig: Config = {
      jsonrpcLocalHttpPort: 12539,
      ...config.conflux,
    }
    const confluxServer = await createServer(nodeConfig)

    await confluxServer.start()

    await run(TASK_CONFLUX_NODE_SERVER_READY, {
      nodeConfig: nodeConfig,
      confluxServer,
    })
  },
)
