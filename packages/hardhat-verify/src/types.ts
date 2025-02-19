export interface ChainConfig {
  network: string
  chainId: number
  urls: {
    apiURL: string
    browserURL: string
  }
}

export interface ConfluxscanConfig {
  apiKey: ApiKey
  customChains: ChainConfig[]
  enabled: boolean
}

export type ApiKey = string | Record<string, string>
