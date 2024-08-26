import type { Hex } from 'cive'
import type { Artifact } from 'hardhat/types/artifacts'
import {
  AmbigousLibraryNameError,
  MissingLibraryAddressError,
  OverlappingLibraryNamesError,
  UnnecessaryLibraryLinkError,
} from './errors'

export interface Libraries<Address = string> {
  [libraryName: string]: Address
}
export interface Link {
  sourceName: string
  libraryName: string
  address: string
}

async function throwOnAmbigousLibraryNameOrUnnecessaryLink(
  contractName: string,
  libraries: Libraries<Hex>,
  neededLibraries: Link[],
) {
  for (const linkedLibraryName of Object.keys(libraries)) {
    const matchingLibraries = neededLibraries.filter(
      ({ sourceName, libraryName }) =>
        libraryName === linkedLibraryName ||
        `${sourceName}:${libraryName}` === linkedLibraryName,
    )

    if (matchingLibraries.length > 1) {
      throw new AmbigousLibraryNameError(
        contractName,
        linkedLibraryName,
        matchingLibraries.map(
          ({ sourceName, libraryName }) => `${sourceName}:${libraryName}`,
        ),
      )
    }
    if (matchingLibraries.length === 0) {
      throw new UnnecessaryLibraryLinkError(contractName, linkedLibraryName)
    }
  }
}
async function throwOnMissingLibrariesAddress(
  contractName: string,
  libraries: Libraries<Hex>,
  neededLibraries: Link[],
) {
  const missingLibraries = []
  for (const { sourceName, libraryName } of neededLibraries) {
    const address =
      libraries[`${sourceName}:${libraryName}`] ?? libraries[libraryName]

    if (address === undefined) {
      missingLibraries.push({ sourceName, libraryName })
    }
  }

  if (missingLibraries.length > 0) {
    throw new MissingLibraryAddressError(contractName, missingLibraries)
  }
}
async function throwOnOverlappingLibraryNames(
  _contractName: string,
  libraries: Libraries<Hex>,
  neededLibraries: Link[],
) {
  for (const { sourceName, libraryName } of neededLibraries) {
    if (
      libraries[`${sourceName}:${libraryName}`] !== undefined &&
      libraries[libraryName] !== undefined
    ) {
      throw new OverlappingLibraryNamesError(sourceName, libraryName)
    }
  }
}

export async function linkBytecode(
  artifact: Artifact,
  libraries: Link[],
): Promise<Hex> {
  const { isHex } = await import('cive')
  let bytecode = artifact.bytecode

  // TODO: measure performance impact
  for (const { sourceName, libraryName, address } of libraries) {
    const linkReferences = artifact.linkReferences[sourceName][libraryName]
    for (const { start, length } of linkReferences) {
      bytecode =
        bytecode.substring(0, 2 + start * 2) +
        address.substring(2) +
        bytecode.substring(2 + (start + length) * 2)
    }
  }

  return isHex(bytecode) ? bytecode : `0x${bytecode}`
}

export async function resolveBytecodeWithLinkedLibraries(
  artifact: Artifact,
  libraries: Libraries<Hex>,
): Promise<Hex> {
  const { linkReferences } = artifact
  const neededLibraries: Link[] = []
  for (const [sourceName, sourceLibraries] of Object.entries(linkReferences)) {
    for (const libraryName of Object.keys(sourceLibraries)) {
      neededLibraries.push({
        sourceName,
        libraryName,
        address:
          libraries[`${sourceName}:${libraryName}`] ?? libraries[libraryName],
      })
    }
  }

  await throwOnAmbigousLibraryNameOrUnnecessaryLink(
    artifact.contractName,
    libraries,
    neededLibraries,
  )
  await throwOnOverlappingLibraryNames(
    artifact.contractName,
    libraries,
    neededLibraries,
  )
  await throwOnMissingLibrariesAddress(
    artifact.contractName,
    libraries,
    neededLibraries,
  )

  return linkBytecode(artifact, neededLibraries)
}
