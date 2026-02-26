use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

pub mod errors;
pub mod events;
pub mod state;

use errors::*;
use events::*;
use state::*;

declare_id!("B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7");

#[program]
pub mod model_registry {
    use super::*;

    /// Initialize the registry config singleton. Called once.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.total_models = 0;
        config.total_versions = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Publish a new model to the registry.
    /// Creates the on-chain record with weights hash and Arweave metadata URI.
    pub fn publish_model(
        ctx: Context<PublishModel>,
        model_name: String,
        weights_hash: [u8; 32],
        metadata_uri: String,
        license: u8,
    ) -> Result<()> {
        require!(!model_name.is_empty(), RegistryError::ModelNameEmpty);
        require!(
            model_name.len() <= Model::MAX_NAME_LEN,
            RegistryError::ModelNameTooLong
        );
        require!(!metadata_uri.is_empty(), RegistryError::MetadataUriEmpty);
        require!(
            metadata_uri.len() <= Model::MAX_URI_LEN,
            RegistryError::MetadataUriTooLong
        );
        require!(license <= 4, RegistryError::InvalidLicense);

        let clock = Clock::get()?;
        let model = &mut ctx.accounts.model;
        let config = &mut ctx.accounts.config;

        model.publisher = ctx.accounts.publisher.key();
        model.model_name = model_name.clone();
        model.weights_hash = weights_hash;
        model.metadata_uri = metadata_uri.clone();
        model.license = match license {
            0 => License::MIT,
            1 => License::Apache2,
            2 => License::GPL3,
            3 => License::CreativeCommons,
            _ => License::Custom,
        };
        model.version_count = 1;
        model.created_at = clock.unix_timestamp;
        model.updated_at = clock.unix_timestamp;
        model.is_deprecated = false;
        model.bump = ctx.bumps.model;

        config.total_models = config.total_models.checked_add(1).unwrap();
        config.total_versions = config.total_versions.checked_add(1).unwrap();

        // Create the first version record
        let version = &mut ctx.accounts.first_version;
        version.model = model.key();
        version.version = 1;
        version.weights_hash = weights_hash;
        version.metadata_uri = metadata_uri.clone();
        version.created_at = clock.unix_timestamp;
        version.bump = ctx.bumps.first_version;

        emit!(ModelPublished {
            publisher: ctx.accounts.publisher.key(),
            model_name,
            weights_hash,
            metadata_uri,
            license,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Add a new version to an existing model.
    pub fn add_version(
        ctx: Context<AddVersion>,
        weights_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        require!(!metadata_uri.is_empty(), RegistryError::MetadataUriEmpty);
        require!(
            metadata_uri.len() <= ModelVersion::MAX_URI_LEN,
            RegistryError::MetadataUriTooLong
        );

        let clock = Clock::get()?;
        let model = &mut ctx.accounts.model;
        let config = &mut ctx.accounts.config;

        require!(!model.is_deprecated, RegistryError::ModelDeprecated);
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            RegistryError::UnauthorizedPublisher
        );

        model.version_count = model.version_count.checked_add(1).unwrap();
        model.weights_hash = weights_hash;
        model.updated_at = clock.unix_timestamp;

        config.total_versions = config.total_versions.checked_add(1).unwrap();

        let version = &mut ctx.accounts.version;
        version.model = model.key();
        version.version = model.version_count;
        version.weights_hash = weights_hash;
        version.metadata_uri = metadata_uri.clone();
        version.created_at = clock.unix_timestamp;
        version.bump = ctx.bumps.version;

        emit!(VersionAdded {
            model: model.key(),
            publisher: ctx.accounts.publisher.key(),
            version: model.version_count,
            weights_hash,
            metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update the metadata URI of a model (e.g. updated README on Arweave).
    pub fn update_metadata(ctx: Context<UpdateMetadata>, new_metadata_uri: String) -> Result<()> {
        require!(
            !new_metadata_uri.is_empty(),
            RegistryError::MetadataUriEmpty
        );
        require!(
            new_metadata_uri.len() <= Model::MAX_URI_LEN,
            RegistryError::MetadataUriTooLong
        );

        let model = &mut ctx.accounts.model;
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            RegistryError::UnauthorizedPublisher
        );

        let clock = Clock::get()?;
        model.metadata_uri = new_metadata_uri.clone();
        model.updated_at = clock.unix_timestamp;

        emit!(MetadataUpdated {
            model: model.key(),
            publisher: ctx.accounts.publisher.key(),
            new_metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Mark a model as deprecated. The record stays, but signals to consumers.
    pub fn deprecate_model(ctx: Context<DeprecateModel>) -> Result<()> {
        let model = &mut ctx.accounts.model;
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            RegistryError::UnauthorizedPublisher
        );
        require!(!model.is_deprecated, RegistryError::AlreadyDeprecated);

        let clock = Clock::get()?;
        model.is_deprecated = true;
        model.updated_at = clock.unix_timestamp;

        emit!(ModelDeprecatedEvent {
            model: model.key(),
            publisher: ctx.accounts.publisher.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Transfer model ownership to a new publisher.
    pub fn transfer_ownership(
        ctx: Context<TransferOwnership>,
        new_publisher: Pubkey,
    ) -> Result<()> {
        let model = &mut ctx.accounts.model;
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            RegistryError::UnauthorizedPublisher
        );

        let clock = Clock::get()?;
        let old_publisher = model.publisher;
        model.publisher = new_publisher;
        model.updated_at = clock.unix_timestamp;

        emit!(OwnershipTransferred {
            model: model.key(),
            old_publisher,
            new_publisher,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// ─── Account Contexts ───────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = RegistryConfig::SIZE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, RegistryConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(model_name: String)]
pub struct PublishModel<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        init,
        payer = publisher,
        space = Model::SIZE,
        seeds = [b"model", publisher.key().as_ref(), hash(model_name.as_bytes()).to_bytes().as_ref()],
        bump,
    )]
    pub model: Account<'info, Model>,

    #[account(
        init,
        payer = publisher,
        space = ModelVersion::SIZE,
        seeds = [b"version", model.key().as_ref(), 1u32.to_le_bytes().as_ref()],
        bump,
    )]
    pub first_version: Account<'info, ModelVersion>,

    #[account(mut)]
    pub publisher: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddVersion<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(mut)]
    pub model: Account<'info, Model>,

    #[account(
        init,
        payer = publisher,
        space = ModelVersion::SIZE,
        seeds = [
            b"version",
            model.key().as_ref(),
            (model.version_count + 1).to_le_bytes().as_ref()
        ],
        bump,
    )]
    pub version: Account<'info, ModelVersion>,

    #[account(mut)]
    pub publisher: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(mut)]
    pub model: Account<'info, Model>,
    pub publisher: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeprecateModel<'info> {
    #[account(mut)]
    pub model: Account<'info, Model>,
    pub publisher: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(mut)]
    pub model: Account<'info, Model>,
    pub publisher: Signer<'info>,
}
