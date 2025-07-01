export const typesDef = {
  '[u8;32]': 'AccountId',
  FunctionParamMetadata: {
    name: 'Text',
    ty: 'Compact<u32>',
  },
  FunctionMetadata: {
    name: 'Text',
    inputs: 'Vec<FunctionParamMetadata>',
    output: 'Compact<u32>',
  },
  ExtensionIdTy: 'u64',
  ExtensionMetadata: {
    name: 'Text',
    functions: 'Vec<FunctionMetadata>',
  },
  RuntimeMetadata: {
    types: 'PortableRegistry',
    extensions: 'BTreeMap<ExtensionIdTy, ExtensionMetadata>',
  },
  ProgramMetadata: {
    types: 'PortableRegistry',
    entrypoints: 'Vec<FunctionMetadata>',
  },
}