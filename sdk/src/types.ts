import type { PortableRegistry } from '@polkadot/types';
import type { BTreeMap, Struct, Text, U32, U64 } from '@polkadot/types-codec';

export interface FunctionParamMetadata extends Struct {
  name: Text;
  ty: U32;
};

export interface FunctionMetadata extends Struct {
  name: Text;
  inputs: FunctionParamMetadata[];
  output: U32;
};

export type ExtensionIdTy = Text;

export interface RuntimeMetadata extends Struct {
  types: PortableRegistry;
  extensions: BTreeMap<ExtensionIdTy, ExtensionMetadata>;
};

export interface ExtensionMetadata extends Struct {
  name: Text;
  functions: FunctionMetadata[];
};

export interface ProgramMetadata extends Struct {
  types: PortableRegistry;
  entrypoints: FunctionMetadata[]
};

export enum PvqError {
  FailedToDecode,
  InvalidPvqProgramFormat,
  QueryExceedsWeightLimit,
  Trap,
  MemoryAccessError,
  HostCallError,
  Other,
}

export interface PvqResultOk {
  ok: Uint8Array;
  err?: undefined;
}
export interface PvqResultErr {
  ok?: undefined;
  err: PvqError;
}
export type PvqResult = PvqResultOk | PvqResultErr;