export const typesDef = {
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
  PvqMetadata: {
    types: 'PortableRegistry',
    extensions: 'Vec<ExtensionMetadata>',
  },
}