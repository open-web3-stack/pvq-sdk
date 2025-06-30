import { TypeRegistry } from '@polkadot/types';
import type { ChainProperties } from '@polkadot/types/interfaces';
import type { TypeDef } from '@polkadot/types/types';
import { compactStripLength, hexToU8a, isHex, u8aConcat } from '@polkadot/util';
import type { ProgramMetadata } from './types';
import { typesDef } from './typesdef';

export interface Param {
  name: string;
  type: TypeDef;
}

export interface Entrypoint {
  args: Param[];
  identifier: string;
  index: number;
  method: string;
  returnType?: TypeDef | null;
  toU8a: (params: unknown[]) => Uint8Array;
}

export function parseMetadata(hexOrJSON: `0x${string}` | Record<string, unknown> | ProgramMetadata | Uint8Array, chainProperties?: ChainProperties) {
  const registry = new TypeRegistry();

  registry.register(typesDef)

  if (isHex(hexOrJSON)) {
    [, hexOrJSON] = compactStripLength(hexToU8a(hexOrJSON))
  }

  let metadata: ProgramMetadata;
  try {
    metadata = registry.createType('ProgramMetadata', hexOrJSON) as unknown as ProgramMetadata;
  } catch (error) {
    throw new Error(`Unable to parse metadata: ${error}, input: ${hexOrJSON}`);
  }

  const lookup = registry.createType('PortableRegistry', (metadata as any).types.toJSON(), true);

  // attach the lookup to the registry - now the types are known
  registry.setLookup(lookup);

  if (chainProperties) {
    registry.setChainProperties(chainProperties);
  }

  // warm-up the actual type, pre-use
  lookup.types.forEach(({ id }) =>
    lookup.getTypeDef(id)
  );

  return [metadata, registry] as const;
}

export class ProgramRegistry {
  metadata: ProgramMetadata;
  registry: TypeRegistry;
  entrypoints: Entrypoint[];

  constructor(ProgramMetadata: Record<string, unknown> | ProgramMetadata) {
    [this.metadata, this.registry] = parseMetadata(ProgramMetadata);
    this.entrypoints = this.metadata.entrypoints.map((entrypoint, index) =>
      this.createEntrypoint(entrypoint, index)
    );
  }

  private createEntrypoint(func: any, entrypointIndex: number): Entrypoint {
    const args: Param[] = func.inputs.map((input: any) => ({
      name: input.name.toString(),
      type: this.registry.lookup.getTypeDef(input.ty.toNumber())
    }));

    const returnType = func.output.toNumber() !== 0
      ? this.registry.lookup.getTypeDef(func.output.toNumber())
      : null;

    return {
      args,
      identifier: func.name.toString(),
      index: entrypointIndex,
      method: func.name.toString(),
      returnType,
      toU8a: (params: unknown[]) => {
        if (params.length !== args.length) {
          throw new Error(`Expected ${args.length} parameters, but got ${params.length}`);
        }

        const encodedParams: Uint8Array[] = [];

        for (let i = 0; i < args.length; i++) {
          const param = params[i];
          const typeDef = args[i].type;

          try {
            // Create type instance using registry
            const typeInstance = this.registry.createType(typeDef.type, param);
            encodedParams.push(typeInstance.toU8a());
          } catch (error) {
            throw new Error(`Failed to encode parameter "${args[i].name}": ${error}`);
          }
        }

        // Concatenate all encoded parameters
        const totalLength = encodedParams.reduce((sum, encoded) => sum + encoded.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;

        for (const encoded of encodedParams) {
          result.set(encoded, offset);
          offset += encoded.length;
        }

        return u8aConcat(this.registry.createType('u8', entrypointIndex).toU8a(), result);
      }
    };
  }

  findEntrypoint(identifier: string | Entrypoint | number): Entrypoint {
    if (typeof identifier === 'number') {
      return this.entrypoints[identifier];
    }
    if (typeof identifier === 'string') {
      const entrypoint = this.entrypoints.find(entrypoint => entrypoint.identifier === identifier);
      if (!entrypoint) {
        throw new Error(`Entrypoint ${identifier} not found`);
      }
      return entrypoint;
    }
    return identifier;
  }
}