use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

mod state;
mod errors;
mod events;

use state::*;
use errors::*;
use events::*;

declare_id!("3KyiM2oxJueFZmaUbFojSJ83pVkT1bWLiDLeUE8dJwY3");

#[program]
pub mod agenc_model_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.total_models = 0;
        config.total_versions = 0;
        config.bump = ctx.bumps.config;

        msg!("Registry initialized by: {:?}", ctx.accounts.authority.key());
        Ok(())
    }

    pub fn publish_model(
        ctx: Context<PublishModel>,
        model_name: String,
        weights_hash: [u8; 32],
        metadata_uri: String,
        license: u8,
    ) -> Result<()> {
        // Validate inputs
        require!(!model_name.is_empty(), ModelRegistryError::ModelNameEmpty);
        require!(model_name.len() <= 64, ModelRegistryError::ModelNameTooLong);
        require!(!metadata_uri.is_empty(), ModelRegistryError::MetadataUriEmpty);
        require!(metadata_uri.len() <= 128, ModelRegistryError::MetadataUriTooLong);
        require!(license <= 4, ModelRegistryError::InvalidLicense);

        let clock = Clock::get()?;
        let license_enum = match license {
            0 => License::MIT,
            1 => License::Apache2,
            2 => License::GPL3,
            3 => License::CreativeCommons,
            4 => License::Custom,
            _ => return Err(ModelRegistryError::InvalidLicense.into()),
        };

        // Initialize model account
        let model = &mut ctx.accounts.model;
        model.publisher = ctx.accounts.publisher.key();
        model.model_name = model_name.clone();
        model.weights_hash = weights_hash;
        model.metadata_uri = metadata_uri.clone();
        model.license = license_enum;
        model.version_count = 1;
        model.created_at = clock.unix_timestamp;
        model.updated_at = clock.unix_timestamp;
        model.is_deprecated = false;
        model.bump = ctx.bumps.model;

        // Initialize first version account
        let version = &mut ctx.accounts.first_version;
        version.model = ctx.accounts.model.key();
        version.version = 1;
        version.weights_hash = weights_hash;
        version.metadata_uri = metadata_uri.clone();
        version.created_at = clock.unix_timestamp;
        version.bump = ctx.bumps.first_version;

        // Update global counters
        let config = &mut ctx.accounts.config;
        config.total_models = config.total_models.checked_add(1).unwrap();
        config.total_versions = config.total_versions.checked_add(1).unwrap();

        // Emit event
        emit!(ModelPublished {
            model: ctx.accounts.model.key(),
            publisher: ctx.accounts.publisher.key(),
            model_name,
            weights_hash,
            metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn add_version(
        ctx: Context<AddVersion>,
        weights_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        // Validate inputs
        require!(!metadata_uri.is_empty(), ModelRegistryError::MetadataUriEmpty);
        require!(metadata_uri.len() <= 128, ModelRegistryError::MetadataUriTooLong);

        // Get model key before borrowing
        let model_key = ctx.accounts.model.key();
        let model = &mut ctx.accounts.model;

        // Check authorization
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            ModelRegistryError::UnauthorizedPublisher
        );

        // Check if model is deprecated
        require!(!model.is_deprecated, ModelRegistryError::ModelDeprecated);

        let clock = Clock::get()?;
        let new_version_number = model.version_count + 1;

        // Initialize new version account
        let version = &mut ctx.accounts.new_version;
        version.model = model_key;
        version.version = new_version_number;
        version.weights_hash = weights_hash;
        version.metadata_uri = metadata_uri.clone();
        version.created_at = clock.unix_timestamp;
        version.bump = ctx.bumps.new_version;

        // Update model account
        model.weights_hash = weights_hash;
        model.version_count = new_version_number;
        model.updated_at = clock.unix_timestamp;

        // Update global counter
        let config = &mut ctx.accounts.config;
        config.total_versions = config.total_versions.checked_add(1).unwrap();

        // Emit event
        emit!(VersionAdded {
            model: ctx.accounts.model.key(),
            version: new_version_number,
            weights_hash,
            metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        new_metadata_uri: String,
    ) -> Result<()> {
        // Validate inputs
        require!(!new_metadata_uri.is_empty(), ModelRegistryError::MetadataUriEmpty);
        require!(new_metadata_uri.len() <= 128, ModelRegistryError::MetadataUriTooLong);

        let model = &mut ctx.accounts.model;

        // Check authorization
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            ModelRegistryError::UnauthorizedPublisher
        );

        let clock = Clock::get()?;
        let old_metadata_uri = model.metadata_uri.clone();

        // Update metadata
        model.metadata_uri = new_metadata_uri.clone();
        model.updated_at = clock.unix_timestamp;

        // Emit event
        emit!(MetadataUpdated {
            model: ctx.accounts.model.key(),
            old_metadata_uri,
            new_metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn deprecate_model(ctx: Context<DeprecateModel>) -> Result<()> {
        let model = &mut ctx.accounts.model;

        // Check authorization
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            ModelRegistryError::UnauthorizedPublisher
        );

        // Check if already deprecated
        require!(!model.is_deprecated, ModelRegistryError::AlreadyDeprecated);

        let clock = Clock::get()?;

        // Mark as deprecated
        model.is_deprecated = true;
        model.updated_at = clock.unix_timestamp;

        // Emit event
        emit!(ModelDeprecatedEvent {
            model: ctx.accounts.model.key(),
            publisher: ctx.accounts.publisher.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn transfer_ownership(
        ctx: Context<TransferOwnership>,
        new_publisher: Pubkey,
    ) -> Result<()> {
        let model = &mut ctx.accounts.model;

        // Check authorization
        require!(
            model.publisher == ctx.accounts.publisher.key(),
            ModelRegistryError::UnauthorizedPublisher
        );

        let clock = Clock::get()?;
        let old_publisher = model.publisher;

        // Transfer ownership
        model.publisher = new_publisher;
        model.updated_at = clock.unix_timestamp;

        // Emit event
        emit!(OwnershipTransferred {
            model: ctx.accounts.model.key(),
            old_publisher,
            new_publisher,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 49,
        seeds = [b"config"],
        bump
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
        init,
        payer = publisher,
        space = 8 + 287,
        seeds = [
            b"model",
            publisher.key().as_ref(),
            hash(model_name.as_bytes()).to_bytes().as_ref(),
        ],
        bump
    )]
    pub model: Account<'info, Model>,

    #[account(
        init,
        payer = publisher,
        space = 8 + 209,
        seeds = [
            b"version",
            model.key().as_ref(),
            &1u32.to_le_bytes(),
        ],
        bump
    )]
    pub first_version: Account<'info, ModelVersion>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(mut)]
    pub publisher: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddVersion<'info> {
    #[account(mut)]
    pub model: Account<'info, Model>,

    #[account(
        init,
        payer = publisher,
        space = 8 + 209,
        seeds = [
            b"version",
            model.key().as_ref(),
            &(model.version_count + 1).to_le_bytes(),
        ],
        bump
    )]
    pub new_version: Account<'info, ModelVersion>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, RegistryConfig>,

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
