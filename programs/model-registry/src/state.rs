use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum License {
    MIT,
    Apache2,
    GPL3,
    CreativeCommons,
    Custom,
}

#[account]
pub struct RegistryConfig {
    pub authority: Pubkey,        // 32
    pub total_models: u64,         // 8
    pub total_versions: u64,       // 8
    pub bump: u8,                  // 1
}
// Total: 8 (discriminator) + 49 = 57 bytes

#[account]
pub struct Model {
    pub publisher: Pubkey,         // 32
    pub model_name: String,        // 4 + 64 = 68
    pub weights_hash: [u8; 32],    // 32
    pub metadata_uri: String,      // 4 + 128 = 132
    pub license: License,          // 1
    pub version_count: u32,        // 4
    pub created_at: i64,           // 8
    pub updated_at: i64,           // 8
    pub is_deprecated: bool,       // 1
    pub bump: u8,                  // 1
}
// Total: 8 (discriminator) + 287 = 295 bytes

#[account]
pub struct ModelVersion {
    pub model: Pubkey,             // 32
    pub version: u32,              // 4
    pub weights_hash: [u8; 32],    // 32
    pub metadata_uri: String,      // 4 + 128 = 132
    pub created_at: i64,           // 8
    pub bump: u8,                  // 1
}
// Total: 8 (discriminator) + 209 = 217 bytes
