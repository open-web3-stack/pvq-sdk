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
  let guestProgram: `0x${string}`;


  beforeEach(() => {
    // Create a real API for testing
    mockApi = {} as ApiPromise;
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    guestProgram = u8aToHex(fs.readFileSync(guestPath));
    program = new PvqProgram(mockApi, guestProgram, sampleMetadata);
  });

  test('should create program instance', () => {
    expect(program).toBeDefined();
    expect(program.entrypoint).toBeDefined();
  });

  test('should have entrypoint methods with camelCase names', () => {
    expect(program.entrypoint.sumBalance).toBeDefined();
    expect(typeof program.entrypoint.sumBalance).toBe('function');
  });

  test('should fetch metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const metadata = await program.metadata();

    expect(metadata).toBeDefined();

    await api.disconnect();
  });

  test('should fetch and parse metadata from chain', async () => {
    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const metadata = await program.metadata();
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
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const result = await program.api.call.pvqApi.executeQuery(guestProgram, args, gas_limit);
    console.log('guestProgram', guestProgram.length);
    console.log('args', args.length);
    expect(result).toBeDefined();
    await api.disconnect();
  });

  test('should call executeQuery with correct params', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    const guestProgram = u8aToHex(fs.readFileSync(guestPath));
    const gas_limit = undefined;

    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const result = await program.executeQuery('sum_balance', { gasLimit: gas_limit }, [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]);
    // console.log('result', result.toJSON());
    expect(result).toBeDefined();
    await api.disconnect();
  });

  test('should call executeQuery with correct params', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    const guestProgram = u8aToHex(fs.readFileSync(guestPath));
    const gas_limit = undefined;

    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const result = await program.executeQuery('sum_balance', { gasLimit: gas_limit }, [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]);
    console.log('result', result);
    expect(result).toBeDefined();
    await api.disconnect();
  });

  test('sum_balance', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    const guestProgram = u8aToHex(fs.readFileSync(guestPath));
    const gas_limit = undefined;

    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const result = await program.entrypoint.sumBalance([21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]);
    expect(result).toBeDefined();
    await api.disconnect();
  });

  test('gas_limit', async () => {
    const guestPath = path.resolve(__dirname, './guests/guest-sum-balance.polkavm');
    const guestProgram = u8aToHex(fs.readFileSync(guestPath));
    const gas_limit = undefined;

    const provider = new WsProvider('ws://127.0.0.1:8000');
    const api = await ApiPromise.create({ provider });
    const program = new PvqProgram(api, guestProgram, sampleMetadata);
    const result = await program.entrypoint.sumBalance([21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']], { gasLimit: 1000000000000000000n });
    expect(result).toBeDefined();
    await api.disconnect();
  });
}); 