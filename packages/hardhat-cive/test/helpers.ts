import path from 'node:path'
import { resetHardhatContext } from 'hardhat/plugins-testing'

// Import this plugin type extensions for the HardhatRuntimeEnvironment
import '../src/internal/type-extensions'

export const setWorkDir = (fixtureProjectName: string) => {
  process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName))
}
export const unsetWorkDir = () => {
  process.chdir(path.resolve(`${__dirname}/..`))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
