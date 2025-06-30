import type { ApiBase } from '@polkadot/api/base';
import type { ApiTypes } from '@polkadot/api/types';
import { firstValueFrom } from 'rxjs';
import { ProgramRegistry } from './program-registry';
import type { ProgramMetadata } from './types';

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export class PvqProgram {
  public registry: ProgramRegistry;
  public api: ApiBase<ApiTypes>;
  private _entrypoint: Record<string, (params: unknown[]) => Uint8Array>;

  constructor(api: ApiBase<ApiTypes>, programMetadata: Record<string, unknown> | ProgramMetadata) {
    this.api = api;
    this.registry = new ProgramRegistry(programMetadata);
    this._entrypoint = this.createEntrypointMap();
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

  get entrypoint() {
    return this._entrypoint;
  }

  async metadata() {
    const codec: Uint8Array = await firstValueFrom(this.api.rx.call.pvqApi.metadata());
    return codec
  }
} 