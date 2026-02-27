# AgenC Model Registry

![AgenC Model Registry Banner](./assets/6e55571c-c0b8-401f-bd2f-c82c551caf8b.jpg)

**Program ID:** `B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7`

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
