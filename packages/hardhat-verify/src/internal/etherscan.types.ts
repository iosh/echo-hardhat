interface EtherscanGetSourceCodeNotOkResponse {
  status: 1
  message: 'NOTOK'
  result: string
}

interface EtherscanGetSourceCodeOkResponse {
  status: 0
  message: 'OK'
  result: string
}

//  interface EtherscanContract {
//   SourceCode: string
//   ABI: string
//   ContractName: string
//   CompilerVersion: string
//   OptimizationUsed: string
//   Runs: string
//   ConstructorArguments: string
//   EVMVersion: string
//   Library: string
//   LicenseType: string
//   Proxy: string
//   Implementation: string
//   SwarmSource: string
// }

export type EtherscanGetSourceCodeResponse =
  | EtherscanGetSourceCodeNotOkResponse
  | EtherscanGetSourceCodeOkResponse

interface EtherscanVerifyNotOkResponse {
  code: 1
  message: string
  data: string
}

interface EtherscanVerifyOkResponse {
  code: 0
  message: 'OK'
  result: string
}

export type ConfluxscanVerifyResponse =
  | EtherscanVerifyNotOkResponse
  | EtherscanVerifyOkResponse
