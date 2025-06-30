import { describe, test, expect, beforeEach } from 'bun:test';
import { u8aToHex } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { PvqProgram } from './pvq';
import sampleMetadata from './guests/guest-sum-balance.json';
import fs from 'fs';
import path from 'path';

describe('PvqProgram', () => {
  let program: PvqProgram;
  let mockApi: ApiPromise;

  beforeEach(() => {
    // Create a real API for testing
    mockApi = {} as ApiPromise;
    program = new PvqProgram(mockApi, sampleMetadata);
  });

  test('should create program instance', () => {
    expect(program).toBeDefined();
    expect(program.entrypoint).toBeDefined();
  });

  test('should have entrypoint methods with camelCase names', () => {
    expect(program.entrypoint.sumBalance).toBeDefined();
    expect(typeof program.entrypoint.sumBalance).toBe('function');
  });

  test('should encode parameters using entrypoint method', () => {
    const params = [123, [new Uint8Array(32).fill(1)]];
    const encoded = program.entrypoint.sumBalance(params);

    console.log(u8aToHex(encoded));
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
  });

  test('should throw error when parameter count mismatch', () => {
    const params = [123]; // Only one parameter instead of two
    expect(() => {
      program.entrypoint.sumBalance(params);
    }).toThrow('Expected 2 parameters, but got 1');
  });

  test('should fetch metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, sampleMetadata);
    const metadata = await program.metadata();

    expect(metadata).toBeDefined();

    await api.disconnect();
  });

  test('should fetch and parse metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, sampleMetadata);
    const metadata = await program.metadata();
    console.log(metadata);
    expect(metadata).toBeDefined();
    await api.disconnect();
  });

  test('should call executeQuery with correct params', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    const guestProgram = u8aToHex(fs.readFileSync(guestPath));
    const args = '0x001500000004d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';
    const gas_limit = undefined;

    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, sampleMetadata);
    const result = await program.api.call.pvqApi.executeQuery(guestProgram, args, gas_limit);
    console.log('result', result.toJSON());
    expect(result).toBeDefined();
    await api.disconnect();
  });
}); 