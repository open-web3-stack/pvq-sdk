# PVQ SDK

A TypeScript SDK for interacting with PolkaVM Query (PVQ)

## Installation

```bash
# Install the published package
npm install @open-web3/pvq
# or
yarn add @open-web3/pvq
# or
pnpm add @open-web3/pvq

# Or install from source
pnpm add pvq-sdk
```

## Quick Start

```typescript
import { ApiPromise } from '@polkadot/api';
import { PvqProgram } from '@open-web3/pvq';

// Connect to a Polkadot node
const api = await ApiPromise.create({
  provider: 'ws://localhost:9944'
});

// Create PVQ program instance
const program = new PvqProgram(
  api,
  guestProgramBytes, // Uint8Array or hex string
  programMetadata    // Program metadata object
);

// Execute a query
const result = await program.entrypoint.sumBalance([
  21, 
  ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']
], { 
  gasLimit: 1000000000000000000n 
});

console.log('Query result:', result);
```

## Usage Examples

### Basic Program Execution

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { PvqProgram } from '@open-web3/pvq';

async function executeProgram() {
  const provider = new WsProvider('ws://127.0.0.1:8000');
  const api = await ApiPromise.create({ provider });

  const guestProgram = '0x...'; // Your program bytecode
  const metadata = {
    // Your program metadata
  };

  const program = new PvqProgram(api, guestProgram, metadata);

  try {
    // Execute with default gas limit
    const result = await program.entrypoint.sumBalance([21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]);
    console.log('Success:', result.toJSON());
  } catch (error) {
    console.error('Execution failed:', error);
  }

  await api.disconnect();
}
```

### Custom Gas Limit

```typescript
// Execute with custom gas limit
const result = await program.entrypoint.sumBalance(
  [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']],
  { gasLimit: 1000000000000000000n }
);
```

### Direct Entrypoint Execution

```typescript
// Execute using entrypoint identifier
const result = await program.executeQuery('sum_balance', { gasLimit: 1000000n }, [21, ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5']]);
```

### Fetching Metadata

```typescript
// Fetch metadata from the chain
const metadata = await program.getMetadata();
console.log('Chain metadata:', metadata);
```

### Checking Extensions

```typescript
// Check whether the program's extensions match the extensions on the current chain
const matched = await program.checkExtensions();
console.log('Extensions matched:', matched); // true or throws error if not matched

// You can also check the cached result
console.log('Cached result:', program.extensionsMatched); // true/false/undefined
```

## API Reference

### PvqProgram

Main class for interacting with PVQ programs.

#### Constructor

```typescript
new PvqProgram(
  api: ApiBase<ApiTypes>,
  guestProgram: Uint8Array | `0x${string}`,
  programMetadata: Record<string, unknown>
)
```

#### Methods

- `executeQuery(entrypoint, options, params)` - Execute a query on the program
- `checkExtensions()` - Check if required extensions are available
- `getMetadata()` - Get runtime metadata

#### Properties

- `entrypoint` - Object containing all available entrypoints as camelCase methods
- `extensionsMatched` - Boolean indicating if extensions check passed

## Program Metadata Format

Your program metadata should follow this structure:

```json
{
  "types": {
    "types": [
      {
        "id": 0,
        "type": {
          "def": { "primitive": "u32" }
        }
      },
      {
        "id": 1,
        "type": {
          "def": { "array": { "len": 32, "type": 2 } }
        }
      },
      {
        "id": 2,
        "type": {
          "def": { "primitive": "u8" }
        }
      },
      {
        "id": 3,
        "type": {
          "def": { "primitive": "u64" }
        }
      },
      {
        "id": 4,
        "type": {
          "def": { "sequence": { "type": 1 } }
        }
      }
    ]
  },
  "extension_fns": [
    [
      "4071833530116166512",
      1,
      {
        "name": "balance",
        "inputs": [
          { "name": "asset", "ty": 0 },
          { "name": "who", "ty": 1 }
        ],
        "output": 3
      }
    ]
  ],
  "entrypoints": [
    {
      "name": "sum_balance",
      "inputs": [
        { "name": "asset", "ty": 0 },
        { "name": "accounts", "ty": 4 }
      ],
      "output": 3
    }
  ]
}
```