use anchor_lang::prelude::*;

#[error_code]
pub enum ModelRegistryError {
    #[msg("Model name exceeds maximum length of 64 characters")]
    ModelNameTooLong,

    #[msg("Metadata URI exceeds maximum length of 128 characters")]
    MetadataUriTooLong,

    #[msg("Model name cannot be empty")]
    ModelNameEmpty,

    #[msg("Metadata URI cannot be empty")]
    MetadataUriEmpty,

    #[msg("Only the model publisher can perform this action")]
    UnauthorizedPublisher,

    #[msg("Cannot add versions to a deprecated model")]
    ModelDeprecated,

    #[msg("Model is already deprecated")]
    AlreadyDeprecated,

    #[msg("Invalid license type")]
    InvalidLicense,
}
