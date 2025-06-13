import type { PortableRegistry } from '@polkadot/types';
import type { Struct, Text, U32 } from '@polkadot/types-codec';

interface FunctionParamMetadata extends Struct {
  name: Text;
  ty: U32;
};

interface FunctionMetadata extends Struct {
  name: Text,
  inputs: FunctionParamMetadata[],
  output: U32,
};

interface ExtensionMetadata extends Struct {
  name: Text;
  functions: FunctionMetadata[];
};

export interface PvqMetadata extends Struct {
  types: PortableRegistry;
  extensions: ExtensionMetadata[];
};