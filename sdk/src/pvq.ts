import type { ApiBase } from '@polkadot/api/base';
import type { ApiTypes } from '@polkadot/api/types';
import { firstValueFrom } from 'rxjs';
import { ProgramRegistry, type Entrypoint } from './program-registry';
import type { ProgramMetadata, PvqResult } from './types';
import { hexToU8a, type BN, compactAddLength, compactFromU8a, u8aToHex } from '@polkadot/util';
import type { Bytes } from '@polkadot/types-codec';



function decodePvqResult(data: Uint8Array): PvqResult {
  const flag = data[0];
  if (flag === 0x00) {
    return { ok: data.slice(1) };
  } else if (flag === 0x01) {
    const errorIndex = data[1];
    return { err: errorIndex };
  }
  throw new Error('Invalid PvqResult encoding');
}
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
  private _entrypoint: Record<string, (params: unknown[]) => Uint8Array>;

  constructor(api: ApiBase<ApiTypes>, guestProgram: Uint8Array | `0x${string}`, programMetadata: Record<string, unknown> | ProgramMetadata) {
    this.api = api;
    this.registry = new ProgramRegistry(programMetadata);
    this._entrypoint = this.createEntrypointMap();
    this.guestProgram = this.registry.registry.createType('Bytes', guestProgram);
  }


  private createEntrypointMap(): Record<string, (params: unknown[]) => Uint8Array> {
    const entrypoints = this.registry.entrypoints;
    const entrypointMap: Record<string, (params: unknown[]) => Uint8Array> = {};

    for (const entrypoint of entrypoints) {
      const camelCaseName = toCamelCase(entrypoint.identifier);
      entrypointMap[camelCaseName] = entrypoint.toU8a;
    }

    return entrypointMap;
  }

  public async executeQuery(entrypoint: string | Entrypoint, { gasLimit = undefined }: ExecuteQueryOptions, params: unknown[]) {
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
    return this._entrypoint;
  }

  async metadata() {
    const codec: Uint8Array = await firstValueFrom(this.api.rx.call.pvqApi.metadata());
    return codec
  }
}

