import type { HardhatRuntimeEnvironment } from 'hardhat/types'

import path from 'node:path'

declare module 'mocha' {
  interface Context {
    hre: HardhatRuntimeEnvironment
  }
}

export const setWorkDir = () => {
  process.chdir(path.join(__dirname, 'fixture-projects'))
}
export const unsetWorkDir = () => {
  process.chdir(path.resolve(`${__dirname}/..`))
}
