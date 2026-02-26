use anchor_lang::prelude::*;

#[error_code]
pub enum RegistryError {
    #[msg("Model name exceeds 64 characters")]
    ModelNameTooLong,

    #[msg("Metadata URI exceeds 128 characters")]
    MetadataUriTooLong,

    #[msg("Model name cannot be empty")]
    ModelNameEmpty,

    #[msg("Metadata URI cannot be empty")]
    MetadataUriEmpty,

    #[msg("Only the model publisher can perform this action")]
    UnauthorizedPublisher,

    #[msg("Model has been deprecated")]
    ModelDeprecated,

    #[msg("Model is already deprecated")]
    AlreadyDeprecated,

    #[msg("Invalid license type")]
    InvalidLicense,
}
