use anchor_lang::prelude::*;

#[event]
pub struct ModelPublished {
    pub model: Pubkey,
    pub publisher: Pubkey,
    pub model_name: String,
    pub weights_hash: [u8; 32],
    pub metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct VersionAdded {
    pub model: Pubkey,
    pub version: u32,
    pub weights_hash: [u8; 32],
    pub metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct MetadataUpdated {
    pub model: Pubkey,
    pub old_metadata_uri: String,
    pub new_metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct ModelDeprecatedEvent {
    pub model: Pubkey,
    pub publisher: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OwnershipTransferred {
    pub model: Pubkey,
    pub old_publisher: Pubkey,
    pub new_publisher: Pubkey,
    pub timestamp: i64,
}
