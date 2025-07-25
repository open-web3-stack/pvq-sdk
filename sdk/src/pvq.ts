import type { ApiPromise } from '@polkadot/api'
import type { ApiRx } from '@polkadot/api/cjs/bundle'
import { TypeRegistry } from '@polkadot/types'
import type { Bytes } from '@polkadot/types-codec'
import { compactStripLength, u8aToHex, u8aToU8a, type BN } from '@polkadot/util'
import { firstValueFrom } from 'rxjs'
import { parseFunctionMetadata, ProgramRegistry, type Entrypoint } from './program-registry'
import type { RuntimeMetadata } from './types'
import { typesDef } from './typesdef'
import type { Codec } from '@polkadot/types/types'

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export interface ExecuteQueryOptions {
  gasLimit?: bigint | string | number | BN
}

export class PvqProgram {
  public registry: ProgramRegistry
  public api: ApiPromise | ApiRx
  public guestProgram: Bytes
  private _entrypoints: Record<string, (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>>
  private _extensionsMatched: boolean | undefined = undefined

  constructor(
    api: ApiPromise | ApiRx,
    guestProgram: Uint8Array | `0x${string}`,
    programMetadata: Record<string, unknown>,
  ) {
    this.api = api
    this.registry = new ProgramRegistry(programMetadata)
    this._entrypoints = this.createEntrypointMap()
    this.guestProgram = this.registry.registry.createType('Bytes', u8aToHex(u8aToU8a(guestProgram)))
  }

  public async checkExtensions(): Promise<boolean> {
    if (this._extensionsMatched !== undefined) {
      return this._extensionsMatched
    }

    const metadata = await this.getMetadata()
    const registry = new TypeRegistry()
    registry.register(typesDef)
    const lookup = registry.createType('PortableRegistry', metadata.types.toJSON(), true)
    // attach the lookup to the registry - now the types are known
    registry.setLookup(lookup)

    for (const fn of this.registry.extensionFns) {
      const id = this.registry.registry.createType('u64', fn.id)

      let finded = false
      for (const [key] of metadata.extensions.entries()) {
        if (key.toString() === id.toString()) {
          finded = true
          break
          // const extensionFn = extension.functions[fn.index]
          // const result = parseFunctionMetadata(extensionFn, registry)
          // if (result.signature !== fn.signature) {
          //   this._extensionsMatched = false
          //   throw new Error(`Extension function signature mismatch: ${result.signature} !== ${fn.signature}`)
          // }
        }
      }
      if (!finded) {
        this._extensionsMatched = false
        throw new Error(`Extension function not found: ${fn.id}`)
      }
    }

    this._extensionsMatched = true
    return true
  }

  public get extensionsMatched(): boolean | undefined {
    return this._extensionsMatched
  }

  private createEntrypointMap(): Record<
    string,
    (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>
  > {
    const entrypoints = this.registry.entrypoints
    const entrypointMap: Record<string, (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>> = {}

    for (const entrypoint of entrypoints) {
      const camelCaseName = toCamelCase(entrypoint.identifier)
      entrypointMap[camelCaseName] = (params: unknown[], { gasLimit = undefined }: ExecuteQueryOptions = {}) => {
        return this.executeQuery(entrypoint.identifier, { gasLimit }, params)
      }
    }

    return entrypointMap
  }

  /**
   * Execute a query on the PVQ program
   * @template T - The expected return type (defaults to Codec)
   * @param entrypoint - The entrypoint identifier, Entrypoint object, or index
   * @param options - Execution options including gas limit
   * @param params - Parameters to pass to the entrypoint
   * @returns Promise resolving to the query result of type T
   */
  public async executeQuery<T = Codec>(
    entrypoint: string | Entrypoint | number,
    { gasLimit = undefined }: ExecuteQueryOptions = {},
    params: unknown[],
  ): Promise<T> {
    const matched = await this.checkExtensions()
    if (!matched) {
      throw new Error('Extensions check failed. Please ensure the required extensions are available.')
    }

    const result = await firstValueFrom(
      this.api.rx.call.pvqApi.executeQuery(
        this.guestProgram.toU8a(),
        u8aToHex(this.registry.findEntrypoint(entrypoint).toU8a(params)),
        gasLimit,
      ),
    )

    if ('isOk' in result) {
      if (result.isOk) {
        const entry = this.registry.findEntrypoint(entrypoint)
        if (entry && entry.returnType) {
          const value = this.registry.registry.createType(entry.returnType.type, (result as any).asOk)
          return value as T
        } else {
          throw new Error('No return type found')
        }
      }
    }
    if ('isErr' in result) {
      if (result.isErr) {
        throw new Error(`PvqError: ${(result as any).asErr.toString()}`)
      }
    }
    throw new Error('Invalid result')
  }

  get entrypoint() {
    return this._entrypoints
  }

  async getMetadata(): Promise<RuntimeMetadata> {
    const codec: Uint8Array = await firstValueFrom(this.api.rx.call.pvqApi.metadata())
    const [, data] = compactStripLength(codec)
    return this.registry.registry.createType('RuntimeMetadata', data) as RuntimeMetadata
  }
}

export { ProgramRegistry, parseFunctionMetadata }
