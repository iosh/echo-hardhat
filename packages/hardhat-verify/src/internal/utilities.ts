import path from 'node:path'
import type { JsonFragment } from '@ethersproject/abi'
import type { SolidityConfig } from 'hardhat/types'

import {
  ABIArgumentLengthError,
  ABIArgumentOverflowError,
  ABIArgumentTypeError,
  type CivexHardhatVerifyError,
  EtherscanVersionNotSupportedError,
  ExclusiveConstructorArgumentsError,
  ImportingModuleError,
  InvalidConstructorArgumentsModuleError,
  InvalidLibrariesModuleError,
} from './errors'

import {
  type ABIArgumentTypeErrorType,
  isABIArgumentLengthError,
  isABIArgumentOverflowError,
  isABIArgumentTypeError,
} from './abi-validation-extras'
import type { LibraryToAddress } from './solc/artifacts'

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Prints verification errors to the console.
 * @param errors - An object containing verification errors, where the keys
 * are the names of verification subtasks and the values are HardhatVerifyError
 * objects describing the specific errors.
 * @remarks This function formats and logs the verification errors to the
 * console with a red color using picocolors. Each error is displayed along with the
 * name of the verification provider it belongs to.
 * @example
 * const errors: Record<string, HardhatVerifyError> = {
 *   verify:etherscan: { message: 'Error message for Etherscan' },
 *   verify:sourcify: { message: 'Error message for Sourcify' },
 *   verify:blockscout: { message: 'Error message for Blockscout' },
 *   // Add more errors here...
 * };
 * printVerificationErrors(errors);
 * // Output:
 * // hardhat-verify found one or more errors during the verification process:
 * //
 * // Etherscan:
 * // Error message for Etherscan
 * //
 * // Sourcify:
 * // Error message for Sourcify
 * //
 * // Blockscout:
 * // Error message for Blockscout
 * //
 * // ... (more errors if present)
 */
export function printVerificationErrors(
  errors: Record<string, CivexHardhatVerifyError>,
) {
  let errorMessage =
    'hardhat-verify found one or more errors during the verification process:\n\n'

  for (const [subtaskLabel, error] of Object.entries(errors)) {
    errorMessage += `${subtaskLabel}:\n${error.message}\n\n`
  }

  console.error(errorMessage)
}

/**
 * Returns the list of constructor arguments from the constructorArgsModule
 * or the constructorArgsParams if the first is not defined.
 */
export async function resolveConstructorArguments(
  constructorArgsParams: string[],
  constructorArgsModule?: string,
): Promise<string[]> {
  if (constructorArgsModule === undefined) {
    return constructorArgsParams
  }

  if (constructorArgsParams.length > 0) {
    throw new ExclusiveConstructorArgumentsError()
  }

  const constructorArgsModulePath = path.resolve(
    process.cwd(),
    constructorArgsModule,
  )

  try {
    const constructorArguments = (await import(constructorArgsModulePath))
      .default

    if (!Array.isArray(constructorArguments)) {
      throw new InvalidConstructorArgumentsModuleError(
        constructorArgsModulePath,
      )
    }

    return constructorArguments
  } catch (error: any) {
    throw new ImportingModuleError('constructor arguments list', error)
  }
}

/**
 * Returns a dictionary of library addresses from the librariesModule or
 * an empty object if not defined.
 */
export async function resolveLibraries(
  librariesModule?: string,
): Promise<LibraryToAddress> {
  if (librariesModule === undefined) {
    return {}
  }

  const librariesModulePath = path.resolve(process.cwd(), librariesModule)

  try {
    const libraries = (await import(librariesModulePath)).default

    if (typeof libraries !== 'object' || Array.isArray(libraries)) {
      throw new InvalidLibrariesModuleError(librariesModulePath)
    }

    return libraries
  } catch (error: any) {
    throw new ImportingModuleError('libraries dictionary', error)
  }
}

/**
 * Retrieves the list of Solidity compiler versions for a given Solidity
 * configuration.
 * It checks that the versions are supported by Etherscan, and throws an
 * error if any are not.
 */
export async function getCompilerVersions({
  compilers,
  overrides,
}: SolidityConfig): Promise<string[]> {
  {
    const compilerVersions = compilers.map(({ version }) => version)
    if (overrides !== undefined) {
      for (const { version } of Object.values(overrides)) {
        compilerVersions.push(version)
      }
    }

    // Etherscan only supports solidity versions higher than or equal to v0.4.11.
    // See https://etherscan.io/solcversions
    const supportedSolcVersionRange = '>=0.4.11'
    const semver = await import('semver')
    if (
      compilerVersions.some(
        (version) => !semver.satisfies(version, supportedSolcVersionRange),
      )
    ) {
      throw new EtherscanVersionNotSupportedError()
    }

    return compilerVersions
  }
}

/**
 * Encodes the constructor arguments for a given contract.
 */
export async function encodeArguments(
  abi: JsonFragment[],
  sourceName: string,
  contractName: string,
  constructorArguments: any[],
): Promise<string> {
  const { Interface } = await import('@ethersproject/abi')

  const contractInterface = new Interface(abi)
  let encodedConstructorArguments: any
  try {
    // encodeDeploy doesn't catch subtle type mismatches, such as a number
    // being passed when a string is expected, so we have to validate the
    // scenario manually.
    const expectedConstructorArgs = contractInterface.deploy.inputs
    constructorArguments.forEach((arg, i) => {
      if (
        expectedConstructorArgs[i]?.type === 'string' &&
        typeof arg !== 'string'
      ) {
        throw new ABIArgumentTypeError({
          code: 'INVALID_ARGUMENT',
          argument: expectedConstructorArgs[i].name,
          value: arg,
          reason: 'invalid string value',
        } as ABIArgumentTypeErrorType)
      }
    })

    encodedConstructorArguments = contractInterface
      .encodeDeploy(constructorArguments)
      .replace('0x', '')
  } catch (error) {
    if (isABIArgumentLengthError(error)) {
      throw new ABIArgumentLengthError(sourceName, contractName, error)
    }
    if (isABIArgumentTypeError(error)) {
      throw new ABIArgumentTypeError(error)
    }
    if (isABIArgumentOverflowError(error)) {
      throw new ABIArgumentOverflowError(error)
    }

    // Should be unreachable.
    throw error
  }

  return encodedConstructorArguments
}

export interface ValidationResponse {
  isPending(): void
  isFailure(): void
  isSuccess(): void
  isOk(): void
}
