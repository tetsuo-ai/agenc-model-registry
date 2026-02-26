use anchor_lang::prelude::*;

/// License types for published models
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
#[repr(u8)]
pub enum License {
    #[default]
    MIT = 0,
    Apache2 = 1,
    GPL3 = 2,
    CreativeCommons = 3,
    Custom = 4,
}

/// Registry configuration singleton
/// PDA seeds: ["config"]
#[account]
pub struct RegistryConfig {
    /// Authority who initialized the registry
    pub authority: Pubkey,
    /// Total models published
    pub total_models: u64,
    /// Total versions across all models
    pub total_versions: u64,
    /// Bump seed
    pub bump: u8,
}

impl RegistryConfig {
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        8 +  // total_models
        8 +  // total_versions
        1;   // bump
}

/// On-chain model record — the permanent proof a model exists
/// PDA seeds: ["model", publisher, model_name_hash]
#[account]
pub struct Model {
    /// Publisher wallet
    pub publisher: Pubkey,
    /// Human-readable model name (max 64 chars)
    pub model_name: String,
    /// SHA-256 hash of model weights (latest version)
    pub weights_hash: [u8; 32],
    /// Arweave URI for metadata JSON (max 128 chars)
    pub metadata_uri: String,
    /// License type
    pub license: License,
    /// Number of versions published
    pub version_count: u32,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Whether the publisher has deprecated this model
    pub is_deprecated: bool,
    /// Bump seed
    pub bump: u8,
}

impl Model {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_URI_LEN: usize = 128;

    pub const SIZE: usize = 8 +  // discriminator
        32 +                      // publisher
        (4 + Self::MAX_NAME_LEN) + // model_name (string prefix + max data)
        32 +                      // weights_hash
        (4 + Self::MAX_URI_LEN) + // metadata_uri (string prefix + max data)
        1 +                       // license
        4 +                       // version_count
        8 +                       // created_at
        8 +                       // updated_at
        1 +                       // is_deprecated
        1;                        // bump
}

/// Version record for a model — append-only history
/// PDA seeds: ["version", model, version_number.to_le_bytes()]
#[account]
pub struct ModelVersion {
    /// Parent model account
    pub model: Pubkey,
    /// Version number (1-indexed)
    pub version: u32,
    /// SHA-256 hash of this version's weights
    pub weights_hash: [u8; 32],
    /// Arweave URI for this version's metadata
    pub metadata_uri: String,
    /// Publish timestamp
    pub created_at: i64,
    /// Bump seed
    pub bump: u8,
}

impl ModelVersion {
    pub const MAX_URI_LEN: usize = 128;

    pub const SIZE: usize = 8 +  // discriminator
        32 +                      // model
        4 +                       // version
        32 +                      // weights_hash
        (4 + Self::MAX_URI_LEN) + // metadata_uri
        8 +                       // created_at
        1;                        // bump
}
