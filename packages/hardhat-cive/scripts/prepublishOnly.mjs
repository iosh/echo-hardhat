import fs from 'node:fs/promises'
import path from 'node:path'

const packageJsonPath = path.join(import.meta.dirname, '../package.json')

const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))

// NOTE: We explicitly don't want to publish the type field.
// We create a separate package.json for `dist/cjs` and `dist/esm` that has the type field.

delete pkg.type

await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2))
