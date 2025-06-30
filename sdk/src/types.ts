import type { PortableRegistry } from '@polkadot/types';
import type { Struct, Text, U32 } from '@polkadot/types-codec';

interface FunctionParamMetadata extends Struct {
  name: Text;
  ty: U32;
};

interface FunctionMetadata extends Struct {
  name: Text;
  inputs: FunctionParamMetadata[];
  output: U32;
};

export interface ProgramMetadata extends Struct {
  types: PortableRegistry;
  entrypoints: FunctionMetadata[];
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