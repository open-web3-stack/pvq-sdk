import { TypeRegistry } from '@polkadot/types';
import type { ChainProperties } from '@polkadot/types/interfaces';
import { compactStripLength, hexToU8a, isHex } from '@polkadot/util';
import type { PvqMetadata } from './types';
import { typesDef } from './typesdef';



export function parseMetadata(hexOrJSON: `0x${string}` | Record<string, unknown> | PvqMetadata | Uint8Array, chainProperties?: ChainProperties) {
  const registry = new TypeRegistry();

  registry.register(typesDef)

  if (isHex(hexOrJSON)) {
    [, hexOrJSON] = compactStripLength(hexToU8a(hexOrJSON))
  }

  let metadata: PvqMetadata;
  try {
    metadata = registry.createType('PvqMetadata', hexOrJSON) as unknown as PvqMetadata;
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

export class Metadata {
  metadata: PvqMetadata;
  registry: TypeRegistry;

  constructor(pvqmetadata: `0x${string}` | Record<string, unknown> | PvqMetadata) {
    [this.metadata, this.registry] = parseMetadata(pvqmetadata as `0x${string}`);
  }
}