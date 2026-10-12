use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
mod errors;
mod fhe;
use crate::errors::ErrorCode as AtmosError;
use crate::fhe::{verify_carbon_threshold, check_fraud_risk, combine_approval_gate, VerifyThresholdOutput};

// Account sizing: discriminator (8) + owner (32) + co2_ciphertext (32) + verified (1) + status (1)
const CARBON_PROJECT_SIZE: usize = 8 + 32 + 32 + 1 + 1;

// NOTE: This module integrates DWallet Encrypt FHE graphs. The real implementation
// depends on the Encrypt pre-alpha crates. The code below provides the Anchor
// instruction wiring and stubs for the three encrypt graphs described in the
// integration guide. Replace stubs with actual `encrypt_fn` graphs and calls.

declare_id!("11111111111111111111111111111111");

#[program]
pub mod atmos_carbon_encrypt {
    use super::*;

    pub fn register_project(ctx: Context<RegisterProject>, params: RegisterParams) -> Result<()> {
        let project_key = ctx.accounts.project.key();
        let project = &mut ctx.accounts.project;
        project.owner = *ctx.accounts.owner.to_account_info().key;
        // Store the provided ciphertext account pubkey as reference
        project.co2_ciphertext = *ctx.accounts.co2_ciphertext_account.to_account_info().key;
        project.status = ProjectStatus::Registered;
        emit!(ProjectRegistered { project: project_key, owner: project.owner });
        Ok(())
    }

    pub fn execute_threshold_check(ctx: Context<ExecuteCheck>) -> Result<()> {
        // Only allow the project's owner (or designated executor) to run threshold checks
        require!(ctx.accounts.executor.key() == ctx.accounts.project.owner, AtmosError::Unauthorized);

        // Read ciphertext bytes from the provided account
        let co2_ai = ctx.accounts.co2_ciphertext_account.to_account_info();
        let data = co2_ai.data.borrow();
        let bytes: &[u8] = &data;

        // Call FHE verify stub with placeholder params (min_threshold and price ciphertext)
        let result: VerifyThresholdOutput = verify_carbon_threshold(bytes, 0_u64, &[]);

        // Call fraud check stub (placeholder)
        let low_risk = check_fraud_risk(bytes, 0_u64);

        let approved = combine_approval_gate(result.is_valid, low_risk);

        emit!(GraphExecutedEvent { project: *ctx.accounts.project.to_account_info().key, success: approved });
        Ok(())
    }

    pub fn finalise_verification(ctx: Context<Finalise>) -> Result<()> {
        let project_key = ctx.accounts.project.key();
        let project = &mut ctx.accounts.project;
        // Only allow the project's owner (or designated authority) to finalise verification
        require!(ctx.accounts.authority.key() == project.owner, AtmosError::Unauthorized);
        project.verified = true;
        project.status = ProjectStatus::Verified;
        emit!(ProjectVerified { project: project_key, verified: true });
        Ok(())
    }

    pub fn mint_carbon_token(ctx: Context<MintCarbon>, _amount: u64) -> Result<()> {
        // Only allow minting by the project's owner/mint authority
        require!(ctx.accounts.mint_authority.key() == ctx.accounts.project.owner, AtmosError::Unauthorized);
        // Minting SPL tokens should be delegated to a CPI to the token program or
        // handled by the off-chain service using the project's mint address.
        emit!(CarbonTokenMinted { project: *ctx.accounts.project.to_account_info().key });
        Ok(())
    }
}

// ----------------- Accounts & Events -----------------

#[account]
pub struct CarbonProject {
    pub owner: Pubkey,
    pub co2_ciphertext: Pubkey, // PDA or account that stores ciphertext
    pub verified: bool,
    pub status: ProjectStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProjectStatus {
    Draft,
    Registered,
    VerificationInProgress,
    Verified,
    Minted,
}

#[derive(Accounts)]
pub struct RegisterProject<'info> {
    #[account(init, payer = owner, space = CARBON_PROJECT_SIZE)]
    pub project: Account<'info, CarbonProject>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: This account stores raw ciphertext bytes; no Anchor-typed checks are enforced here.
    pub co2_ciphertext_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RegisterParams {
    pub co2_ciphertext: Pubkey,
}

#[derive(Accounts)]
pub struct ExecuteCheck<'info> {
    #[account(mut)]
    pub project: Account<'info, CarbonProject>,
    pub executor: Signer<'info>,
    /// CHECK: This account stores raw ciphertext bytes referenced by `project.co2_ciphertext`.
    /// The program reads bytes directly and applies application-level validation.
    pub co2_ciphertext_account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Finalise<'info> {
    #[account(mut)]
    pub project: Account<'info, CarbonProject>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintCarbon<'info> {
    #[account(mut)]
    pub project: Account<'info, CarbonProject>,
    pub mint_authority: Signer<'info>,
}

// Events
#[event]
pub struct ProjectRegistered {
    pub project: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct GraphExecutedEvent {
    pub project: Pubkey,
    pub success: bool,
}

#[event]
pub struct ProjectVerified {
    pub project: Pubkey,
    pub verified: bool,
}

#[event]
pub struct CarbonTokenMinted {
    pub project: Pubkey,
}
