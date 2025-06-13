import { Pvqapi } from './metadata';
import { describe, expect, it } from 'bun:test'
import { hello } from './index'
import { TypeRegistry } from '@polkadot/types'
import { compactStripLength, hexToU8a } from '@polkadot/util'
import { ApiPromise } from '@polkadot/api';

const TEST_HEX =
  '0x1d02140000000506000400000500000800000505000c0000032000000010001000000503000834457874656e73696f6e436f726504346861735f657874656e73696f6e04086964000448457874656e73696f6e46756e6769626c65730830746f74616c5f737570706c790414617373657408001c62616c616e636508146173736574080c77686f0c00'

const METADATA_JSON = {
  types: {
    types: [
      { id: 0, type: { path: [], params: [], def: { primitive: 'U64' }, docs: [] } },
      { id: 1, type: { path: [], params: [], def: { primitive: 'Bool' }, docs: [] } },
      { id: 2, type: { path: [], params: [], def: { primitive: 'U32' }, docs: [] } },
      { id: 3, type: { path: [], params: [], def: { array: { len: 32, type: 4 } }, docs: [] } },
      { id: 4, type: { path: [], params: [], def: { primitive: 'U8' }, docs: [] } },
    ],
  },
  extensions: [
    { name: 'ExtensionCore', functions: [{ name: 'has_extension', inputs: [{ name: 'id', ty: 0 }], output: 1 }] },
    {
      name: 'ExtensionFungibles',
      functions: [
        { name: 'total_supply', inputs: [{ name: 'asset', ty: 2 }], output: 0 },
        {
          name: 'balance',
          inputs: [
            { name: 'asset', ty: 2 },
            { name: 'who', ty: 3 },
          ],
          output: 0,
        },
      ],
    },
  ],
}

describe('metadata', () => {
  it('should generate metadata', () => {
    const pvqApi = new Pvqapi(TEST_HEX)
    expect(pvqApi.metadata.toJSON()).toEqual(METADATA_JSON)
  })
})
