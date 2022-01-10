use anchor_lang::prelude::*;

declare_id!("FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH");

#[program]
pub mod mock_oracles {
    use pyth_client::{Price, PriceStatus, PriceType};
    use quick_protobuf::serialize_into_slice;
    use switchboard_program::{AggregatorState, FastRoundResultAccountData, RoundResult, SwitchboardAccountType};
    use switchboard_program::mod_AggregatorState::Configs;
    use super::*;
    /// Write data to an account
    pub fn write(ctx: Context<Write>, offset: u64, data: Vec<u8>) -> ProgramResult {
        let offset = offset as usize;
        let account_data = &mut ctx.accounts.target.try_borrow_mut_data()?;
        account_data[offset..offset+data.len()].copy_from_slice(&data[..]);
        Ok(())
    }

    pub fn write_pyth_price(ctx: Context<Write>, price: i64, expo:i32, slot: u64) -> ProgramResult {
        let account_data = &mut ctx.accounts.target.try_borrow_mut_data()?;
        let mut price_data:Price = unsafe {
            std::mem::zeroed()
        };
        price_data.ptype = PriceType::Price;
        price_data.valid_slot = slot;
        price_data.agg.price = price;
        price_data.expo = expo;
        price_data.agg.status = PriceStatus::Trading;


        account_data.copy_from_slice( unsafe { &std::mem::transmute::<Price, [u8;std::mem::size_of::<Price>()]>(price_data) });
        Ok(())
    }

    #[allow(clippy::field_reassign_with_default)]
    pub fn write_switchboard_price(ctx: Context<Write>, price:u64, expo: u8, slot: u64, board_type: u8) -> ProgramResult {
        let account_data = &mut ctx.accounts.target.try_borrow_mut_data()?;
        let price = price as f64 * (10u32.pow(expo as u32) as f64);
        if board_type == 0 {
            account_data[0] = SwitchboardAccountType::TYPE_AGGREGATOR as u8;
            let mut aggregator: AggregatorState = AggregatorState::default();

            aggregator.configs = Some(
                Configs {
                    min_confirmations: Some(0),
                    ..Configs::default()
                });
            let last_round_result = RoundResult {
                round_open_slot: Some(slot),
                result: Some(price),
                num_success: Some(5),
                ..RoundResult::default()
            };
            aggregator.last_round_result = Some(last_round_result);
            serialize_into_slice(&aggregator, &mut account_data[1..]).unwrap();
        } else {
            account_data[0] = SwitchboardAccountType::TYPE_AGGREGATOR_RESULT_PARSE_OPTIMIZED as u8;
            let mut fast_data = FastRoundResultAccountData::default();
            fast_data.result.result = price;
            fast_data.result.round_open_slot = slot;
            fast_data.result.num_success = 10;
            account_data[1..].copy_from_slice(unsafe { &std::mem::transmute::<FastRoundResultAccountData, [u8;std::mem::size_of::<FastRoundResultAccountData>()]>(fast_data) } );
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Write<'info> {
    #[account(mut)]
    pub target: Signer<'info>,
}