import { type Config, createServer } from '@xcfx/node'
import { subtask, task, types } from 'hardhat/config'
import { HardhatPluginError } from 'hardhat/plugins'
import { TASK_CONFLUX_NODE, TASK_CONFLUX_NODE_SERVER_READY } from './constants'

subtask(TASK_CONFLUX_NODE_SERVER_READY)
  .addParam('nodeConfig', undefined, undefined, types.any)
  .addParam('server', undefined, undefined, types.any)
  .setAction(async ({ config }: { server: any; config: any }) => {
    console.info(`Started HTTP server on port ${config.jsonrpcLocalHttpPort}`)
  })

task(TASK_CONFLUX_NODE, 'Starts a local conflux node').setAction(
  async (_, { network, run }) => {
    if (network.name !== 'conflux') {
      throw new HardhatPluginError(
        '@civex/hardhat-node',
        'network must be conflux',
      )
    }
    const nodeConfig: Config = {
      jsonrpcLocalHttpPort: 12539,
      ...network.config,
    }
    const server = await createServer(nodeConfig)

    await server.start()

    await run(TASK_CONFLUX_NODE_SERVER_READY, {
      nodeConfig: nodeConfig,
      server,
    })
  },
)
