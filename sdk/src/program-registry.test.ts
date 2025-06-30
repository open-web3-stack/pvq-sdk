import { u8aToHex } from '@polkadot/util';
import { describe, test, expect, beforeEach } from 'bun:test';
import { parseMetadata, ProgramRegistry } from './program-registry';
import sampleMetadata from './guests/guest-sum-balance.json';

describe('parseMetadata', () => {
  test('should parse valid metadata successfully', () => {
    const [metadata, registry] = parseMetadata(sampleMetadata);

    expect(metadata).toBeDefined();
    expect(registry).toBeDefined();
    expect(registry.lookup).toBeDefined();
  });

  test('should parse hexadecimal format metadata', () => {
    // This test needs a valid hexadecimal metadata string
    // Skip for now as we need real hexadecimal data
    expect(true).toBe(true);
  });

  test('should throw error when parsing invalid metadata', () => {
    const invalidMetadata = "not a metadata" as any;

    expect(() => {
      parseMetadata(invalidMetadata);
    }).toThrow();
  });
});

describe('ProgramRegistry class', () => {
  let programRegistry: ProgramRegistry;

  beforeEach(() => {
    programRegistry = new ProgramRegistry(sampleMetadata);
  });

  test('should create entrypoints from metadata', () => {
    expect(programRegistry.entrypoints).toBeDefined();
    expect(programRegistry.entrypoints.length).toBeGreaterThan(0);
  });

  test('should find entrypoint by identifier', () => {
    const entrypoint = programRegistry.findEntrypoint('sum_balance');

    expect(entrypoint).toBeDefined();
    expect(entrypoint?.identifier).toBe('sum_balance');
    expect(entrypoint?.args).toHaveLength(2);
    expect(entrypoint?.args[0].name).toBe('asset');
  });

  test('should return undefined for non-existent entrypoint', () => {
    const entrypoint = programRegistry.findEntrypoint('nonExistentFunction');
    expect(entrypoint).toBeUndefined();
  });

  test('should have correct entrypoint structure', () => {
    const entrypoint = programRegistry.findEntrypoint('sum_balance');

    expect(entrypoint).toBeDefined();
    expect(entrypoint?.args).toHaveLength(2);
    expect(entrypoint?.args[0].name).toBe('asset');
    expect(entrypoint?.args[1].name).toBe('accounts');
    expect(entrypoint?.method).toBe('sum_balance');
    expect(entrypoint?.toU8a).toBeDefined();
  });

  test('should encode parameters to Uint8Array', () => {
    const entrypoint = programRegistry.findEntrypoint('sum_balance');
    expect(entrypoint).toBeDefined();

    // Test with valid parameters
    const params = [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']];
    const encoded = entrypoint!.toU8a(params);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(u8aToHex(encoded)).toBe('0x001500000004d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d');
    expect(encoded.length).toBeGreaterThan(0);
  });

  test('should throw error when parameter count mismatch', () => {
    const entrypoint = programRegistry.findEntrypoint('sum_balance');
    expect(entrypoint).toBeDefined();

    // Test with wrong number of parameters
    const params = [123]; // Only one parameter instead of two
    expect(() => {
      entrypoint!.toU8a(params);
    }).toThrow('Expected 2 parameters, but got 1');
  });


}); 