import type { ApiBase } from '@polkadot/api/base';
import type { ApiTypes } from '@polkadot/api/types';
import type { Bytes } from '@polkadot/types-codec';
import { compactStripLength, u8aToHex, type BN } from '@polkadot/util';
import { firstValueFrom } from 'rxjs';
import { parseFunctionMetadata, ProgramRegistry, type Entrypoint } from './program-registry';
import type { ProgramMetadata, RuntimeMetadata } from './types';
import { TypeRegistry } from '@polkadot/types';
import { typesDef } from './typesdef';


function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export interface ExecuteQueryOptions {
  gasLimit?: bigint | string | number | BN;
}

export class PvqProgram {
  public registry: ProgramRegistry;
  public api: ApiBase<ApiTypes>;
  public guestProgram: Bytes;
  private _entrypoints: Record<string, (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>>;
  private _extensionsMatched: boolean | undefined = undefined;

  constructor(api: ApiBase<ApiTypes>, guestProgram: Uint8Array | `0x${string}`, programMetadata: Record<string, unknown>) {
    this.api = api;
    this.registry = new ProgramRegistry(programMetadata);
    this._entrypoints = this.createEntrypointMap();
    this.guestProgram = this.registry.registry.createType('Bytes', guestProgram);
  }

  public async checkExtensions(): Promise<boolean> {
    if (this._extensionsMatched !== undefined) {
      return this._extensionsMatched;
    }

    const metadata = await this.getMetadata();
    const registry = new TypeRegistry();
    registry.register(typesDef)
    const lookup = registry.createType('PortableRegistry', metadata.types.toJSON(), true);
    // attach the lookup to the registry - now the types are known
    registry.setLookup(lookup);

    for (const fn of this.registry.extensionFns) {
      const id = this.registry.registry.createType('u64', fn.id);

      let finded = false;
      for (const [key, extension] of metadata.extensions.entries()) {
        if (key.toHex() === id.toHex()) {
          finded = true;
          const extensionFn = extension.functions[fn.index];
          const { signature } = parseFunctionMetadata(extensionFn, registry);
          if (signature !== fn.signature) {
            this._extensionsMatched = false;
            throw new Error(`Extension function signature mismatch: ${signature} !== ${fn.signature}`);
          }
        }
      }
      if (!finded) {
        this._extensionsMatched = false;
        throw new Error(`Extension function not found: ${fn.id}`);
      }
    }

    this._extensionsMatched = true;
    return true;
  }

  public get extensionsMatched(): boolean | undefined {
    return this._extensionsMatched;
  }

  private createEntrypointMap(): Record<string, (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>> {
    const entrypoints = this.registry.entrypoints;
    const entrypointMap: Record<string, (params: unknown[], options?: ExecuteQueryOptions) => Promise<unknown>> = {};

    for (const entrypoint of entrypoints) {
      const camelCaseName = toCamelCase(entrypoint.identifier);
      entrypointMap[camelCaseName] = (params: unknown[], { gasLimit = undefined }: ExecuteQueryOptions = {}) => {
        return this.executeQuery(entrypoint.identifier, { gasLimit }, params);
      };
    }

    return entrypointMap;
  }

  public async executeQuery(entrypoint: string | Entrypoint, { gasLimit = undefined }: ExecuteQueryOptions = {}, params: unknown[]) {
    const matched = await this.checkExtensions();
    console.log('matched', matched);
    if (!matched) {
      throw new Error('Extensions check failed. Please ensure the required extensions are available.');
    }

    const result = await firstValueFrom(
      this.api.rx.call.pvqApi.executeQuery(
        this.guestProgram.toU8a(),
        u8aToHex(this.registry.findEntrypoint(entrypoint).toU8a(params)),
        gasLimit
      )
    );

    if ('isOk' in result) {
      if (result.isOk) {
        const entry = this.registry.findEntrypoint(entrypoint);
        if (entry && entry.returnType) {
          const value = this.registry.registry.createType(entry.returnType.type, (result as any).asOk);
          return value;
        } else {
          throw new Error('No return type found');
        }
      }
    }
    if ('isErr' in result) {
      if (result.isErr) {
        throw new Error(`PvqError: ${(result as any).asErr.toString()}`);
      }
    }
    throw new Error('Invalid result');
  }

  get entrypoint() {
    return this._entrypoints;
  }

  async getMetadata(): Promise<RuntimeMetadata> {
    const codec: Uint8Array = await firstValueFrom(this.api.rx.call.pvqApi.metadata());
    const [, data] = compactStripLength(codec)
    return this.registry.registry.createType('RuntimeMetadata', data) as RuntimeMetadata;
  }
}

