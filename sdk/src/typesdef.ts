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
  ExtensionMetadata: {
    name: 'Text',
    functions: 'Vec<FunctionMetadata>',
  },
  RuntimeMetadata: {
    types: 'PortableRegistry',
    extensions: 'Vec<ExtensionMetadata>',
  },
  ProgramMetadata: {
    types: 'PortableRegistry',
    entrypoints: 'Vec<FunctionMetadata>',
  },
}