# AgenC Model Registry

![AgenC Model Registry Banner](./assets/6e55571c-c0b8-401f-bd2f-c82c551caf8b.jpg)

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue)](https://www.anchor-lang.com)
[![Arweave](https://img.shields.io/badge/Arweave-Permanent%20Storage-222326?logo=arweave&logoColor=white)](https://arweave.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Program ID:** `3KyiM2oxJueFZmaUbFojSJ83pVkT1bWLiDLeUE8dJwY3`

## Overview

AgenC Model Registry is a decentralized AI model registry built on Solana with Arweave for permanent storage. Publish, discover, and manage AI models in a trustless, permissionless environment.

## Features

- **Decentralized Storage**: Models stored permanently on Arweave
- **Solana Integration**: On-chain registry powered by Solana smart contracts
- **Trustless Publishing**: Permissionless model publishing and discovery
- **Immutable Records**: Permanent, tamper-proof model metadata

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.75+
- Solana CLI
- Anchor Framework

### Installation

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test
```

### Deployment

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Development

```bash
# Start local validator
solana-test-validator

# Deploy locally
anchor deploy

# Run tests
anchor test
```

## License

MIT
