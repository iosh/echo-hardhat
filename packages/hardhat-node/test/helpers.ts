import path from 'node:path'

export const setWorkDir = (fixtureProjectName: string) => {
  process.chdir(path.join(__dirname, fixtureProjectName))
}
export const unsetWorkDir = () => {
  process.chdir(path.resolve(`${__dirname}/..`))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
