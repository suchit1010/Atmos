use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("FHE graph execution failed")]
    FheExecutionFailed,

    #[msg("Unauthorized action")]
    Unauthorized,

    #[msg("Invalid ciphertext or parameters")]
    InvalidCiphertext,
}
