# @open-web3/pvq

PVQ (Programmable Virtual Query) SDK for Polkadot ecosystem

## Installation

```bash
npm install @open-web3/pvq
# or
yarn add @open-web3/pvq
# or
pnpm add @open-web3/pvq
```

## Usage

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

## Development

```bash
# Install dependencies
pnpm install

# Build the SDK
cd sdk && pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```
