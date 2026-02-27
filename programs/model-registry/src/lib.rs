use anchor_lang::prelude::*;

declare_id!("B6nXK6Cuxbzp8muFFhZSoJqhSAL7BeNiH2bHiwAL5zk7");

#[program]
pub mod agenc_model_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
