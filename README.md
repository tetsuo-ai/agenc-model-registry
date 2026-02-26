# Model Registry

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue)](https://www.anchor-lang.com)
[![Arweave](https://img.shields.io/badge/Arweave-Permanent%20Storage-222326?logo=arweave&logoColor=white)](https://arweave.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Decentralized, uncensorable AI model registry on Solana. No single entity can memory-hole a model once published. The on-chain record persists forever — anyone can re-host and verify integrity via the weights hash.

## Why

HuggingFace is a centralized gatekeeper for the AI ecosystem. If someone trains a model and publishes it, a decentralized system means no single entity can remove it. Even if no one is seeding the files, the on-chain record persists and anyone can re-host.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend    │────>│   Solana     │     │  Arweave    │
│  (React)     │    │  Program     │     │  (Irys)     │
│              │────>│  (Registry)  │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                     ▲
      │                    │ metadata_uri ────────┘
      └────────────────────┘
         1. Hash weights locally
         2. Upload metadata to Arweave
         3. Register on-chain with hash + URI
```

**On-chain (~350 bytes per model):** model name, publisher, SHA-256 weights hash, metadata URI, license, timestamps

**Arweave:** model card, README, training details, download links, framework info

## Program

Program ID: `B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7`

### Instructions

| Instruction | Description |
|---|---|
| `initialize` | Create registry config singleton |
| `publish_model` | Publish a new model with weights hash + Arweave metadata URI |
| `add_version` | Add a new version to an existing model |
| `update_metadata` | Update the metadata URI |
| `deprecate_model` | Mark a model as deprecated (record stays) |
| `transfer_ownership` | Transfer model to a new publisher |

### Accounts

| Account | PDA Seeds | Description |
|---|---|---|
| `RegistryConfig` | `["config"]` | Singleton with global counters |
| `Model` | `["model", publisher, sha256(name)]` | Permanent model record |
| `ModelVersion` | `["version", model, version_num]` | Append-only version history |

## Frontend

Browse, publish, and verify models through a simple React UI.

- **Browse** — Search and filter all registered models
- **Publish** — Hash weights in-browser, upload metadata to Arweave, register on Solana
- **Detail** — View model card, verify weights hash, version history

## Quick Start

### Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.30.1
- [Node.js](https://nodejs.org/) 18+
- A Solana wallet keypair (`solana-keygen new`)

### Build & Test

```bash
# Build the program
anchor build

# Start local validator with the program
solana-test-validator --reset \
  --bpf-program B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7 \
  target/deploy/model_registry.so

# Run tests (in another terminal)
ANCHOR_PROVIDER_URL=http://localhost:8899 \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
```

### Run the Frontend

```bash
cd app
npm install
npm run dev
```

### Deploy to Devnet

```bash
solana program deploy target/deploy/model_registry.so --url devnet
```

## How It Works

1. **Publisher** fills in model info and selects a weights file
2. **Browser** computes SHA-256 hash of the weights locally — the file never leaves your machine
3. **Metadata** (description, README, training details) is uploaded to Arweave via Irys
4. **On-chain transaction** stores the publisher, model name, weights hash, and Arweave URI permanently on Solana
5. **Anyone** can download the model from any source and verify: `sha256sum model.bin` must match the on-chain hash
6. **No single entity** can remove the record. The frontend is replaceable — anyone can re-deploy it

## Project Structure

```
model-registry/
├── programs/model-registry/src/
│   ├── lib.rs          # Program entry + 6 instructions
│   ├── state.rs        # Account structs (Model, ModelVersion, RegistryConfig)
│   ├── errors.rs       # Custom error codes
│   └── events.rs       # Events for off-chain indexing
├── app/src/
│   ├── pages/          # Browse, Publish, ModelDetail
│   ├── components/     # Header, ModelCard, UploadProgress
│   ├── hooks/          # useRegistry (program interaction)
│   └── lib/            # Anchor setup, Arweave uploader
└── tests/
    └── model-registry.ts  # 7 integration tests
```

## License

MIT

---

<p align="center">
  Made by <a href="https://github.com/tetsuo-ai"><b>Tetsuo</b></a>
</p>
