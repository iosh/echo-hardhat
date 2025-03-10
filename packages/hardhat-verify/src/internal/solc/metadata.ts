import type CborT from 'cbor'

import util from 'node:util'
import debug from 'debug'

export const METADATA_LENGTH = 2
export const SOLC_NOT_FOUND_IN_METADATA_VERSION_RANGE = '0.4.7 - 0.5.8'
export const MISSING_METADATA_VERSION_RANGE = '<0.4.7'

const log = debug('hardhat:hardhat-verify:metadata')

/**
 * Try to infer the Solidity compiler version from the bytecode metadata.
 *
 * Not all compiler releases produce the same bytecode:
 * Solc v0.4.7 was the first compiler to introduce metadata into the generated bytecode.
 * See https://docs.soliditylang.org/en/v0.4.7/miscellaneous.html#contract-metadata
 * Solc v0.4.26, the last release for the v0.4 series, does not feature the compiler version in its emitted metadata.
 * See https://docs.soliditylang.org/en/v0.4.26/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 * Solc v0.5.9 was the first compiler to introduce its version into the metadata.
 * See https://docs.soliditylang.org/en/v0.5.9/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 * Solc v0.6.0 features compiler version metadata.
 * See https://docs.soliditylang.org/en/v0.6.0/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 */
export function inferCompilerVersion(bytecode: Buffer): string {
  let solcMetadata: any
  try {
    solcMetadata = decodeSolcMetadata(bytecode)
  } catch {
    // The decoding failed. Unfortunately, our only option is to assume that this bytecode was emitted by an old version.
    // Technically, this bytecode could have been emitted by a compiler for another language altogether.
    log('Could not decode metadata.')
    return MISSING_METADATA_VERSION_RANGE
  }

  if (solcMetadata instanceof Buffer) {
    if (solcMetadata.length === 3) {
      const [major, minor, patch] = solcMetadata
      const solcVersion = `${major}.${minor}.${patch}`
      log(`Solc version detected in bytecode: ${solcVersion}`)
      return solcVersion
    }
    // probably unreachable
    log(
      `Found solc version field with ${solcMetadata.length} elements instead of three!`,
    )
  }

  // The embedded metadata was successfully decoded but there was no solc version in it.
  log('Could not detect solidity version in metadata.')
  return SOLC_NOT_FOUND_IN_METADATA_VERSION_RANGE
}

export function getMetadataSectionLength(bytecode: Buffer): number {
  return bytecode.slice(-METADATA_LENGTH).readUInt16BE(0) + METADATA_LENGTH
}

/**
 * Decode the bytecode metadata and return the solc version.
 */
function decodeSolcMetadata(bytecode: Buffer): any {
  const { decodeFirstSync } = require('cbor') as typeof CborT

  const metadataSectionLength = getMetadataSectionLength(bytecode)
  // The metadata and its length are in the last few bytes of the bytecode.
  const metadataPayload = bytecode.slice(
    -metadataSectionLength,
    -METADATA_LENGTH,
  )

  log(`Read metadata length ${metadataSectionLength}`)

  const lastMetadataBytes = metadataPayload.slice(-100)
  log(
    `Last ${
      lastMetadataBytes.length
    } bytes of metadata: ${lastMetadataBytes.toString('hex')}`,
  )

  const decodedMetadata = decodeFirstSync(metadataPayload, { required: true })

  log(`Metadata decoded: ${util.inspect(decodedMetadata)}`)

  return decodedMetadata.solc
}
