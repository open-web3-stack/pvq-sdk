import { describe, test, expect, beforeEach } from 'bun:test'
import { u8aToHex } from '@polkadot/util'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { PvqProgram } from './pvq'
import sampleMetadata from './guests/guest-sum-balance.json'
import fs from 'fs'
import path from 'path'

describe('PvqProgram', () => {
  let program: PvqProgram
  let mockApi: ApiPromise
  let guestProgram: `0x${string}`

  beforeEach(() => {
    // Create a real API for testing
    mockApi = {} as ApiPromise
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm')
    guestProgram = u8aToHex(fs.readFileSync(guestPath))
    program = new PvqProgram(mockApi, guestProgram, sampleMetadata)
  })

  test('should create program instance', () => {
    expect(program).toBeDefined()
    expect(program.entrypoint).toBeDefined()
  })

  test('should have entrypoint methods with camelCase names', () => {
    expect(program.entrypoint.sumBalance).toBeDefined()
    expect(typeof program.entrypoint.sumBalance).toBe('function')
  })

  test('should fetch metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const metadata = await program.getMetadata()

    expect(metadata).toBeDefined()

    await api.disconnect()
  })

  test('should fetch and parse metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const metadata = await program.getMetadata()
    expect(metadata).toBeDefined()
    await api.disconnect()
  })

  test('should call pvqApi.executeQuery directly with raw args', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm')
    const guestProgram = u8aToHex(fs.readFileSync(guestPath))
    const args = '0x001500000004d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
    const gas_limit = undefined

    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const result = await program.api.call.pvqApi.executeQuery(guestProgram, args, gas_limit)
    expect(result).toBeDefined()
    await api.disconnect()
  })

  test('should execute sum_balance query via executeQuery method', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm')
    const guestProgram = u8aToHex(fs.readFileSync(guestPath))
    const gas_limit = undefined

    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const result = await program.executeQuery('sum_balance', { gasLimit: gas_limit }, [
      21,
      ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5'],
    ])
    expect(result).toBeDefined()
    await api.disconnect()
  })

  test('should execute sum_balance query via entrypoint method', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm')
    const guestProgram = u8aToHex(fs.readFileSync(guestPath))
    const gas_limit = undefined

    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const result = await program.entrypoint.sumBalance([21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']])
    expect(result).toBeDefined()
    await api.disconnect()
  })

  test('should execute query with custom gas limit', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm')
    const guestProgram = u8aToHex(fs.readFileSync(guestPath))
    const gas_limit = undefined

    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)
    const result = await program.entrypoint.sumBalance([21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']], {
      gasLimit: 1000000000000000000n,
    })
    expect(result).toBeDefined()
    await api.disconnect()
  })

  test('should check extensions successfully', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)

    const result = await program.checkExtensions()
    expect(typeof result).toBe('boolean')
    expect(program.extensionsMatched).toBeDefined()

    await api.disconnect()
  })

  test('should cache extensions check result', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestProgram, sampleMetadata)

    const result1 = await program.checkExtensions()

    const result2 = await program.checkExtensions()

    expect(result1).toBe(result2)
    expect(program.extensionsMatched).toBe(result1)

    await api.disconnect()
  })

  test('guest swap info', async () => {
    // Load guest swap info program
    const guestSwapInfoPath = path.resolve(__dirname, './guests/guest-swap-info.polkavm')
    const guestSwapInfoProgram = u8aToHex(fs.readFileSync(guestSwapInfoPath))

    // Load guest swap info metadata
    const guestSwapInfoMetadataPath = path.resolve(__dirname, './guests/guest-swap-info-metadata.json')
    const guestSwapInfoMetadata = JSON.parse(fs.readFileSync(guestSwapInfoMetadataPath, 'utf8'))

    const provider = new WsProvider('ws://127.0.0.1:8000')
    const api = await ApiPromise.create({ provider })
    const program = new PvqProgram(api, guestSwapInfoProgram, guestSwapInfoMetadata)

    // Test list pools
    const pools = await program.entrypoint.entrypointListPools([])

    await api.disconnect()
  })

  /*
  test('should handle extensions check failure gracefully', async () => {
    const mockApi = {
      rx: {
        call: {
          pvqApi: {
            metadata: () => Promise.reject(new Error('Network error'))
          }
        }
      },
      call: {
        pvqApi: {
          metadata: () => Promise.reject(new Error('Network error'))
        }
      }
    } as any;
    
    const program = new PvqProgram(mockApi, guestProgram, sampleMetadata);
    
    const result = await program.checkExtensions();
    expect(result).toBe(false);
    expect(program.extensionsMatched).toBe(false);
  });

  test('should throw error when extensions check fails in executeQuery', async () => {
    // 创建一个mock API，模拟getMetadata失败
    const mockApi = {
      rx: {
        call: {
          pvqApi: {
            metadata: () => Promise.reject(new Error('Network error'))
          }
        }
      },
      call: {
        pvqApi: {
          metadata: () => Promise.reject(new Error('Network error'))
        }
      }
    } as any;
    
    const program = new PvqProgram(mockApi, guestProgram, sampleMetadata);
    
    await expect(program.executeQuery('sum_balance', {}, [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]))
      .rejects.toThrow('Extensions check failed');
  });
  */
})
