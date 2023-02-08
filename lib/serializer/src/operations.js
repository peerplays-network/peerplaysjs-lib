import types from './types';
import SerializerImpl from './serializer';

const {
  // id_type,
  // varint32,
  uint8,
  uint16,
  uint32,
  int64,
  uint64,
  string,
  bytes,
  bool,
  array,
  nosort_array,
  protocol_id_type,
  object_id_type,
  vote_id,
  implementation_id_type,
  static_variant,
  map,
  set,
  public_key,
  address,
  time_point_sec,
  optional,
  variant_object,
  enumeration,
  sha256
} = types;

const future_extensions = types.void;

/*
When updating generated code
Replace:  operation = static_variant [
with:     operation.st_operations = [

Delete:
public_key = new Serializer(
    "public_key"
    key_data: bytes 33
);
*/

function Serializer(operation_name, serilization_types_object) {
  return new SerializerImpl(operation_name, serilization_types_object);
}
// Place-holder, their are dependencies on "operation" .. The final list of
// operations is not avialble until the very end of the generated code.
// See: operation.st_operations = ...
// module.exports["operation"] = operation;

const operation = static_variant();

// Custom-types follow Generated code:

// ##  Generated code follows
// # programs/js_operation_serializer > npm i -g decaffeinate
// ## -------------------------------
const transfer_operation_fee_parameters = new Serializer(
  'transfer_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const limit_order_create_operation_fee_parameters = new Serializer(
  'limit_order_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const limit_order_cancel_operation_fee_parameters = new Serializer(
  'limit_order_cancel_operation_fee_parameters',
  {
    fee: uint64
  }
);

const call_order_update_operation_fee_parameters = new Serializer(
  'call_order_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const fill_order_operation_fee_parameters = new Serializer(
  'fill_order_operation_fee_parameters'
);

const account_create_operation_fee_parameters = new Serializer(
  'account_create_operation_fee_parameters',
  {
    basic_fee: uint64,
    premium_fee: uint64,
    price_per_kbyte: uint32
  }
);

const account_update_operation_fee_parameters = new Serializer(
  'account_update_operation_fee_parameters',
  {
    fee: int64,
    price_per_kbyte: uint32
  }
);

const account_whitelist_operation_fee_parameters = new Serializer(
  'account_whitelist_operation_fee_parameters',
  {
    fee: int64
  }
);

const account_upgrade_operation_fee_parameters = new Serializer(
  'account_upgrade_operation_fee_parameters',
  {
    membership_annual_fee: uint64,
    membership_lifetime_fee: uint64
  }
);

const account_transfer_operation_fee_parameters = new Serializer(
  'account_transfer_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_create_operation_fee_parameters = new Serializer(
  'asset_create_operation_fee_parameters',
  {
    symbol3: uint64,
    symbol4: uint64,
    long_symbol: uint64,
    price_per_kbyte: uint32
  }
);

const asset_update_operation_fee_parameters = new Serializer(
  'asset_update_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const asset_update_bitasset_operation_fee_parameters = new Serializer(
  'asset_update_bitasset_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_update_feed_producers_operation_fee_parameters = new Serializer(
  'asset_update_feed_producers_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_issue_operation_fee_parameters = new Serializer(
  'asset_issue_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const asset_reserve_operation_fee_parameters = new Serializer(
  'asset_reserve_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_fund_fee_pool_operation_fee_parameters = new Serializer(
  'asset_fund_fee_pool_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_settle_operation_fee_parameters = new Serializer(
  'asset_settle_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_global_settle_operation_fee_parameters = new Serializer(
  'asset_global_settle_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_publish_feed_operation_fee_parameters = new Serializer(
  'asset_publish_feed_operation_fee_parameters',
  {
    fee: uint64
  }
);

const witness_create_operation_fee_parameters = new Serializer(
  'witness_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const witness_update_operation_fee_parameters = new Serializer(
  'witness_update_operation_fee_parameters',
  {
    fee: int64
  }
);

const proposal_create_operation_fee_parameters = new Serializer(
  'proposal_create_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const proposal_update_operation_fee_parameters = new Serializer(
  'proposal_update_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const proposal_delete_operation_fee_parameters = new Serializer(
  'proposal_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const withdraw_permission_create_operation_fee_parameters = new Serializer(
  'withdraw_permission_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const withdraw_permission_update_operation_fee_parameters = new Serializer(
  'withdraw_permission_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const withdraw_permission_claim_operation_fee_parameters = new Serializer(
  'withdraw_permission_claim_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const withdraw_permission_delete_operation_fee_parameters = new Serializer(
  'withdraw_permission_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const committee_member_create_operation_fee_parameters = new Serializer(
  'committee_member_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const committee_member_update_operation_fee_parameters = new Serializer(
  'committee_member_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const committee_member_update_global_parameters_operation_fee_parameters = new Serializer(
  'committee_member_update_global_parameters_operation_fee_parameters',
  {
    fee: uint64
  }
);

const vesting_balance_create_operation_fee_parameters = new Serializer(
  'vesting_balance_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const vesting_balance_withdraw_operation_fee_parameters = new Serializer(
  'vesting_balance_withdraw_operation_fee_parameters',
  {
    fee: uint64
  }
);

const worker_create_operation_fee_parameters = new Serializer(
  'worker_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const custom_operation_fee_parameters = new Serializer('custom_operation_fee_parameters', {
  fee: uint64,
  price_per_kbyte: uint32
});

const assert_operation_fee_parameters = new Serializer('assert_operation_fee_parameters', {
  fee: uint64
});

const balance_claim_operation_fee_parameters = new Serializer(
  'balance_claim_operation_fee_parameters'
);

const override_transfer_operation_fee_parameters = new Serializer(
  'override_transfer_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const transfer_to_blind_operation_fee_parameters = new Serializer(
  'transfer_to_blind_operation_fee_parameters',
  {
    fee: uint64,
    price_per_output: uint32
  }
);

const blind_transfer_operation_fee_parameters = new Serializer(
  'blind_transfer_operation_fee_parameters',
  {
    fee: uint64,
    price_per_output: uint32
  }
);

const transfer_from_blind_operation_fee_parameters = new Serializer(
  'transfer_from_blind_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_settle_cancel_operation_fee_parameters = new Serializer(
  'asset_settle_cancel_operation_fee_parameters'
);

const asset_claim_fees_operation_fee_parameters = new Serializer(
  'asset_claim_fees_operation_fee_parameters',
  {
    fee: uint64
  }
);

const fba_distribute_operation_fee_parameters = new Serializer(
  'fba_distribute_operation_fee_parameters',
  {}
);

const asset_update_dividend_operation_fee_parameters = new Serializer(
  'asset_update_dividend_operation_fee_parameters',
  {
    fee: uint64
  }
);

const asset_dividend_distribution_operation_fee_parameters = new Serializer(
  'asset_dividend_distribution_operation_fee_parameters',
  {
    distribution_base_fee: uint64,
    distribution_fee_per_holder: uint32
  }
);

const sport_create_operation_fee_parameters = new Serializer(
  'sport_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sport_update_operation_fee_parameters = new Serializer(
  'sport_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const event_group_create_operation_fee_parameters = new Serializer(
  'event_group_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const event_group_update_operation_fee_parameters = new Serializer(
  'event_group_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const event_create_operation_fee_parameters = new Serializer(
  'event_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const event_update_operation_fee_parameters = new Serializer(
  'event_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_rules_create_operation_fee_parameters = new Serializer(
  'betting_market_rules_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_rules_update_operation_fee_parameters = new Serializer(
  'betting_market_rules_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_group_create_operation_fee_parameters = new Serializer(
  'betting_market_group_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_create_operation_fee_parameters = new Serializer(
  'betting_market_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const bet_place_operation_fee_parameters = new Serializer(
  'bet_place_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_group_resolve_operation_fee_parameters = new Serializer(
  'betting_market_group_resolve_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_group_resolved_operation_fee_parameters = new Serializer(
  'betting_market_group_resolved_operation_fee_parameters'
);

const betting_market_group_cancel_unmatched_bets_operation_fee_parameters = new Serializer(
  'betting_market_group_cancel_unmatched_bets_operation_fee_parameters',
  {
    fee: uint64
  }
);

const bet_matched_operation_fee_parameters = new Serializer(
  'bet_matched_operation_fee_parameters'
);

const bet_cancel_operation_fee_parameters = new Serializer(
  'bet_cancel_operation_fee_parameters',
  {
    fee: uint64
  }
);

const bet_canceled_operation_fee_parameters = new Serializer(
  'bet_canceled_operation_fee_parameters'
);

const tournament_create_operation_fee_parameters = new Serializer(
  'tournament_create_operation_fee_parameters',
  {
    fee: int64
  }
);

const tournament_join_operation_fee_parameters = new Serializer(
  'tournament_join_operation_fee_parameters',
  {
    fee: int64
  }
);

const game_move_operation_fee_parameters = new Serializer(
  'game_move_operation_fee_parameters',
  {
    fee: int64
  }
);

const tournament_payout_operation_fee_parameters = new Serializer(
  'tournament_payout_operation_fee_parameters'
);

const tournament_leave_operation_fee_parameters = new Serializer(
  'tournament_leave_operation_fee_parameters',
  {
    fee: int64
  }
);

const betting_market_group_update_operation_fee_parameters = new Serializer(
  'betting_market_group_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const betting_market_update_operation_fee_parameters = new Serializer(
  'betting_market_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const bet_adjusted_operation_fee_parameters = new Serializer(
  'bet_adjusted_operation_fee_parameters'
);

const event_update_status_operation_fee_parameters = new Serializer(
  'event_update_status_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sport_delete_operation_fee_parameters = new Serializer(
  'sport_delete_operation_fee_parameters', 
  {
    fee: uint64
  }
);

const event_group_delete_operation_fee_parameters = new Serializer(
  'event_group_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const affiliate_payout_operation_fee_parameters = new Serializer(
  'affiliate_payout_operation_fee_parameters'
);

const affiliate_referral_payout_operation_fee_parameters = new Serializer(
  'affiliate_referral_payout_operation_fee_parameters'
);

const lottery_asset_create_operation_fee_parameters = new Serializer(
  'lottery_asset_create_operation_fee_parameters',
  {
    lottery_asset: uint64,
    price_per_kbyte: uint32
  }
);

const ticket_purchase_operation_fee_parameters = new Serializer(
  'ticket_purchase_operation_fee_parameters',
  {
    fee: uint64
  }
);

const lottery_reward_operation_fee_parameters = new Serializer(
  'lottery_reward_operation_fee_parameters',
  {
    fee: uint64
  }
);

const lottery_end_operation_fee_parameters = new Serializer(
  'lottery_end_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sweeps_vesting_claim_operation_fee_parameters = new Serializer(
  'sweeps_vesting_claim_operation_fee_parameters',
  {
    fee: uint64
  }
);

const custom_permission_create_operation_fee_parameters = new Serializer(
  'custom_permission_create_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const custom_permission_update_operation_fee_parameters = new Serializer(
  'custom_permission_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const custom_permission_delete_operation_fee_parameters = new Serializer(
  'custom_permission_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const custom_account_authority_create_operation_fee_parameters = new Serializer(
  'custom_account_authority_create_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const custom_account_authority_update_operation_fee_parameters = new Serializer(
  'custom_account_authority_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const custom_account_authority_delete_operation_fee_parameters = new Serializer(
  'custom_account_authority_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const offer_operation_fee_parameters = new Serializer(
  'offer_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const bid_operation_fee_parameters = new Serializer(
  'bid_operation_fee_parameters',
  {
    fee: uint64
  }
);

const cancel_offer_operation_fee_parameters = new Serializer(
  'cancel_offer_operation_fee_parameters',
  {
    fee: uint64
  }
);

const finalize_offer_operation_fee_parameters = new Serializer(
  'finalize_offer_operation_fee_parameters',
  {
    fee: uint64
  }
);

const nft_metadata_create_operation_fee_parameters = new Serializer(
  'nft_metadata_create_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const nft_metadata_update_operation_fee_parameters = new Serializer(
  'nft_metadata_update_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const nft_mint_operation_fee_parameters = new Serializer(
  'nft_mint_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const nft_safe_transfer_from_operation_fee_parameters = new Serializer(
  'nft_safe_transfer_from_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const nft_approve_operation_fee_parameters = new Serializer(
  'nft_approve_operation_fee_parameters',
  {
    fee: uint64
  }
);

const nft_set_approval_for_all_operation_fee_parameters = new Serializer(
  'nft_set_approval_for_all_operation_fee_parameters',
  {
    fee: uint64
  }
);

const account_role_create_operation_fee_parameters = new Serializer(
  'account_role_create_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const account_role_update_operation_fee_parameters = new Serializer(
  'account_role_update_operation_fee_parameters',
  {
    fee: uint64,
    price_per_kbyte: uint32
  }
);

const account_role_delete_operation_fee_parameters = new Serializer(
  'account_role_delete_operation_fee_paramters',
  {
    fee: uint64
  }
);

const son_create_operation_fee_parameters = new Serializer(
  'son_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_update_operation_fee_parameters = new Serializer(
  'son_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_deregister_operation_fee_parameters = new Serializer(
  'son_deregister_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_heartbeat_operation_fee_parameters = new Serializer(
  'son_heartbeat_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_report_down_operation_fee_parameters = new Serializer(
  'son_report_down_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_maintenance_operation_fee_parameters = new Serializer(
  'son_maintenance_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_recreate_operation_fee_parameters = new Serializer(
  'son_wallet_recreate_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_update_operation_fee_parameters = new Serializer(
  'son_wallet_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_deposit_create_operation_fee_parameters = new Serializer(
  'son_wallet_deposit_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_deposit_process_operation_fee_parameters = new Serializer(
  'son_wallet_deposit_process_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_withdraw_create_operation_fee_parameters = new Serializer(
  'son_wallet_withdraw_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const son_wallet_withdraw_process_operation_fee_parameters = new Serializer(
  'son_wallet_withdraw_process_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_address_add_operation_fee_parameters = new Serializer(
  'sidechain_address_add_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_address_update_operation_fee_parameters = new Serializer(
  'sidechain_address_update_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_address_delete_operation_fee_parameters = new Serializer(
  'sidechain_address_delete_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_transaction_create_operation_fee_parameters = new Serializer(
  'sidechain_transaction_create_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_transaction_sign_operation_fee_parameters = new Serializer(
  'sidechain_transaction_sign_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_transaction_send_operation_fee_parameters = new Serializer(
  'sidechain_transaction_send_operation_fee_parameters',
  {
    fee: uint64
  }
);

const sidechain_transaction_settle_operation_fee_parameters = new Serializer(
  'sidechain_transaction_settle_operation_fee_parameters',
  {
    fee: uint64
  }
);

const nft_lottery_token_purchase_operation_fee_parameters = new Serializer(
  'nft_lottery_token_purchase_operation_fee_parameters',
  {
    fee: uint64
  }
);

const nft_lottery_reward_operation_fee_parameters = new Serializer(
  'nft_lottery_reward_operation_fee_parameters',
  {
    fee: uint64
  }
);

const nft_lottery_end_operation_fee_parameters = new Serializer(
  'nft_lottery_end_operation_fee_parameters',
  {
    fee: uint64
  }
);

const random_number_store_operation_fee_parameters = new Serializer(
  'random_number_store_operation_fee_parameters',
  {
    fee: uint64
  }
);

const fee_parameters = static_variant([
  transfer_operation_fee_parameters,
  limit_order_create_operation_fee_parameters,
  limit_order_cancel_operation_fee_parameters,
  call_order_update_operation_fee_parameters,
  fill_order_operation_fee_parameters,
  account_create_operation_fee_parameters,
  account_update_operation_fee_parameters,
  account_whitelist_operation_fee_parameters,
  account_upgrade_operation_fee_parameters,
  account_transfer_operation_fee_parameters,
  asset_create_operation_fee_parameters,
  asset_update_operation_fee_parameters,
  asset_update_bitasset_operation_fee_parameters,
  asset_update_feed_producers_operation_fee_parameters,
  asset_issue_operation_fee_parameters,
  asset_reserve_operation_fee_parameters,
  asset_fund_fee_pool_operation_fee_parameters,
  asset_settle_operation_fee_parameters,
  asset_global_settle_operation_fee_parameters,
  asset_publish_feed_operation_fee_parameters,
  witness_create_operation_fee_parameters,
  witness_update_operation_fee_parameters,
  proposal_create_operation_fee_parameters,
  proposal_update_operation_fee_parameters,
  proposal_delete_operation_fee_parameters,
  withdraw_permission_create_operation_fee_parameters,
  withdraw_permission_update_operation_fee_parameters,
  withdraw_permission_claim_operation_fee_parameters,
  withdraw_permission_delete_operation_fee_parameters,
  committee_member_create_operation_fee_parameters,
  committee_member_update_operation_fee_parameters,
  committee_member_update_global_parameters_operation_fee_parameters,
  vesting_balance_create_operation_fee_parameters,
  vesting_balance_withdraw_operation_fee_parameters,
  worker_create_operation_fee_parameters,
  custom_operation_fee_parameters,
  assert_operation_fee_parameters,
  balance_claim_operation_fee_parameters,
  override_transfer_operation_fee_parameters,
  transfer_to_blind_operation_fee_parameters,
  blind_transfer_operation_fee_parameters,
  transfer_from_blind_operation_fee_parameters,
  asset_settle_cancel_operation_fee_parameters,
  asset_claim_fees_operation_fee_parameters,
  fba_distribute_operation_fee_parameters,
  tournament_create_operation_fee_parameters,
  tournament_join_operation_fee_parameters,
  game_move_operation_fee_parameters,
  asset_update_dividend_operation_fee_parameters,
  asset_dividend_distribution_operation_fee_parameters,
  tournament_payout_operation_fee_parameters,
  tournament_leave_operation_fee_parameters,
  sport_create_operation_fee_parameters,
  sport_update_operation_fee_parameters,
  event_group_create_operation_fee_parameters,
  event_group_update_operation_fee_parameters,
  event_create_operation_fee_parameters,
  event_update_operation_fee_parameters,
  betting_market_rules_create_operation_fee_parameters,
  betting_market_rules_update_operation_fee_parameters,
  betting_market_group_create_operation_fee_parameters,
  betting_market_create_operation_fee_parameters,
  bet_place_operation_fee_parameters,
  betting_market_group_resolve_operation_fee_parameters,
  betting_market_group_resolved_operation_fee_parameters,
  bet_adjusted_operation_fee_parameters,
  betting_market_group_cancel_unmatched_bets_operation_fee_parameters,
  bet_matched_operation_fee_parameters,
  bet_cancel_operation_fee_parameters,
  bet_canceled_operation_fee_parameters,
  betting_market_group_update_operation_fee_parameters,
  betting_market_update_operation_fee_parameters,
  event_update_status_operation_fee_parameters,
  sport_delete_operation_fee_parameters,
  event_group_delete_operation_fee_parameters,
  affiliate_payout_operation_fee_parameters,
  affiliate_referral_payout_operation_fee_parameters,
  lottery_asset_create_operation_fee_parameters,
  ticket_purchase_operation_fee_parameters,
  lottery_reward_operation_fee_parameters,
  lottery_end_operation_fee_parameters,
  sweeps_vesting_claim_operation_fee_parameters,
  custom_permission_create_operation_fee_parameters,
  custom_permission_update_operation_fee_parameters,
  custom_permission_delete_operation_fee_parameters,
  custom_account_authority_create_operation_fee_parameters,
  custom_account_authority_update_operation_fee_parameters,
  custom_account_authority_delete_operation_fee_parameters,
  offer_operation_fee_parameters,
  bid_operation_fee_parameters,
  cancel_offer_operation_fee_parameters,
  finalize_offer_operation_fee_parameters,
  nft_metadata_create_operation_fee_parameters,
  nft_metadata_update_operation_fee_parameters,
  nft_mint_operation_fee_parameters,
  nft_safe_transfer_from_operation_fee_parameters,
  nft_approve_operation_fee_parameters,
  nft_set_approval_for_all_operation_fee_parameters,
  account_role_create_operation_fee_parameters,
  account_role_update_operation_fee_parameters,
  account_role_delete_operation_fee_parameters,
  son_create_operation_fee_parameters,
  son_update_operation_fee_parameters,
  son_deregister_operation_fee_parameters,
  son_heartbeat_operation_fee_parameters,
  son_report_down_operation_fee_parameters,
  son_maintenance_operation_fee_parameters,
  son_wallet_recreate_operation_fee_parameters,
  son_wallet_update_operation_fee_parameters,
  son_wallet_deposit_create_operation_fee_parameters,
  son_wallet_deposit_process_operation_fee_parameters,
  son_wallet_withdraw_create_operation_fee_parameters,
  son_wallet_withdraw_process_operation_fee_parameters,
  sidechain_address_add_operation_fee_parameters,
  sidechain_address_update_operation_fee_parameters,
  sidechain_address_delete_operation_fee_parameters,
  sidechain_transaction_create_operation_fee_parameters,
  sidechain_transaction_sign_operation_fee_parameters,
  sidechain_transaction_send_operation_fee_parameters,
  sidechain_transaction_settle_operation_fee_parameters,
  nft_lottery_token_purchase_operation_fee_parameters,
  nft_lottery_reward_operation_fee_parameters,
  nft_lottery_end_operation_fee_parameters,
  random_number_store_operation_fee_parameters
]);

const fee_schedule = new Serializer('fee_schedule', {
  parameters: set(fee_parameters),
  scale: uint32
});

const void_result = new Serializer('void_result');

const asset = new Serializer('asset', {
  amount: int64,
  asset_id: protocol_id_type('asset')
});

const operation_result = static_variant([void_result, object_id_type, asset]);

const processed_transaction = new Serializer('processed_transaction', {
  ref_block_num: uint16,
  ref_block_prefix: uint32,
  expiration: time_point_sec,
  operations: array(operation),
  extensions: set(future_extensions),
  signatures: array(bytes(65)),
  operation_results: array(operation_result)
});

const signed_block = new Serializer('signed_block', {
  previous: bytes(20),
  timestamp: time_point_sec,
  witness: protocol_id_type('witness'),
  next_secret_hash: bytes(20),
  previous_secret: bytes(20),
  transaction_merkle_root: bytes(20),
  extensions: set(future_extensions),
  witness_signature: bytes(65),
  transactions: array(processed_transaction)
});

const block_header = new Serializer('block_header', {
  previous: bytes(20),
  timestamp: time_point_sec,
  witness: protocol_id_type('witness'),
  next_secret_hash: bytes(20),
  previous_secret: bytes(20),
  transaction_merkle_root: bytes(20),
  extensions: set(future_extensions)
});

const signed_block_header = new Serializer('signed_block_header', {
  previous: bytes(20),
  timestamp: time_point_sec,
  witness: protocol_id_type('witness'),
  next_secret_hash: bytes(20),
  previous_secret: bytes(20),
  transaction_merkle_root: bytes(20),
  extensions: set(future_extensions),
  witness_signature: bytes(65)
});

const memo_data = new Serializer('memo_data', {
  from: public_key,
  to: public_key,
  nonce: uint64,
  message: bytes()
});

const transfer = new Serializer('transfer', {
  fee: asset,
  from: protocol_id_type('account'),
  to: protocol_id_type('account'),
  amount: asset,
  memo: optional(memo_data),
  extensions: set(future_extensions)
});

const limit_order_create = new Serializer('limit_order_create', {
  fee: asset,
  seller: protocol_id_type('account'),
  amount_to_sell: asset,
  min_to_receive: asset,
  expiration: time_point_sec,
  fill_or_kill: bool,
  extensions: set(future_extensions)
});

const limit_order_cancel = new Serializer('limit_order_cancel', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  order: protocol_id_type('limit_order'),
  extensions: set(future_extensions)
});

const call_order_update = new Serializer('call_order_update', {
  fee: asset,
  funding_account: protocol_id_type('account'),
  delta_collateral: asset,
  delta_debt: asset,
  extensions: set(future_extensions)
});

const fill_order = new Serializer('fill_order', {
  fee: asset,
  order_id: object_id_type,
  account_id: protocol_id_type('account'),
  pays: asset,
  receives: asset
});

const authority = new Serializer('authority', {
  weight_threshold: uint32,
  account_auths: map(protocol_id_type('account'), uint16),
  key_auths: map(public_key, uint16),
  address_auths: map(address, uint16)
});

const account_options = new Serializer('account_options', {
  memo_key: public_key,
  voting_account: protocol_id_type('account'),
  num_witness: uint16,
  num_committee: uint16,
  num_son: uint16,
  votes: set(vote_id),
  extensions: set(future_extensions)
});

const account_create = new Serializer('account_create', {
  fee: asset,
  registrar: protocol_id_type('account'),
  referrer: protocol_id_type('account'),
  referrer_percent: uint16,
  name: string,
  owner: authority,
  active: authority,
  options: account_options,
  extensions: set(future_extensions)
});

// op.extensions.value.update_last_voting_time = true
const account_update_last_voting_time = new Serializer('update_last_voting_time', {
  value: {
    update_last_voting_time: bool
  }
});

const account_update = new Serializer('account_update', {
  fee: asset,
  account: protocol_id_type('account'),
  owner: optional(authority),
  active: optional(authority),
  new_options: optional(account_options),
  extensions: set(account_update_last_voting_time)
});

const account_whitelist = new Serializer('account_whitelist', {
  fee: asset,
  authorizing_account: protocol_id_type('account'),
  account_to_list: protocol_id_type('account'),
  new_listing: uint8,
  extensions: set(future_extensions)
});

const account_upgrade = new Serializer('account_upgrade', {
  fee: asset,
  account_to_upgrade: protocol_id_type('account'),
  upgrade_to_lifetime_member: bool,
  extensions: set(future_extensions)
});

const account_transfer = new Serializer('account_transfer', {
  fee: asset,
  account_id: protocol_id_type('account'),
  new_owner: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const price = new Serializer('price', {
  base: asset,
  quote: asset
});

const asset_options = new Serializer('asset_options', {
  max_supply: int64,
  market_fee_percent: uint16,
  max_market_fee: int64,
  issuer_permissions: uint16,
  flags: uint16,
  core_exchange_rate: price,
  whitelist_authorities: set(protocol_id_type('account')),
  blacklist_authorities: set(protocol_id_type('account')),
  whitelist_markets: set(protocol_id_type('asset')),
  blacklist_markets: set(protocol_id_type('asset')),
  description: string,
  extensions: set(future_extensions)
});

const bitasset_options = new Serializer('bitasset_options', {
  feed_lifetime_sec: uint32,
  minimum_feeds: uint8,
  force_settlement_delay_sec: uint32,
  force_settlement_offset_percent: uint16,
  maximum_force_settlement_volume: uint16,
  short_backing_asset: protocol_id_type('asset'),
  extensions: set(future_extensions)
});

const benefactor = new Serializer(
  'benefactor', {
    id: protocol_id_type('account'),
    share: uint16
  }
);

const lottery_asset_options = new Serializer(
  'lottery_asset_options', {
    benefactors: array(benefactor),
    owner: protocol_id_type('asset'),
    winning_tickets: nosort_array(uint16),
    ticket_price: asset,
    end_date: time_point_sec,
    ending_on_soldout: bool,
    is_active: bool
  }
);

const asset_create = new Serializer('asset_create', {
  fee: asset,
  issuer: protocol_id_type('account'),
  symbol: string,
  precision: uint8,
  common_options: asset_options,
  bitasset_opts: optional(bitasset_options),
  is_prediction_market: bool,
  extensions: set(future_extensions)
});

const asset_update = new Serializer('asset_update', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_update: protocol_id_type('asset'),
  new_issuer: optional(protocol_id_type('account')),
  new_options: asset_options,
  extensions: set(future_extensions)
});

const asset_update_bitasset = new Serializer('asset_update_bitasset', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_update: protocol_id_type('asset'),
  new_options: bitasset_options,
  extensions: set(future_extensions)
});

const asset_update_feed_producers = new Serializer('asset_update_feed_producers', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_update: protocol_id_type('asset'),
  new_feed_producers: set(protocol_id_type('account')),
  extensions: set(future_extensions)
});

const asset_issue = new Serializer('asset_issue', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_issue: asset,
  issue_to_account: protocol_id_type('account'),
  memo: optional(memo_data),
  extensions: set(future_extensions)
});

const asset_reserve = new Serializer('asset_reserve', {
  fee: asset,
  payer: protocol_id_type('account'),
  amount_to_reserve: asset,
  extensions: set(future_extensions)
});

const asset_fund_fee_pool = new Serializer('asset_fund_fee_pool', {
  fee: asset,
  from_account: protocol_id_type('account'),
  asset_id: protocol_id_type('asset'),
  amount: int64,
  extensions: set(future_extensions)
});

const asset_settle = new Serializer('asset_settle', {
  fee: asset,
  account: protocol_id_type('account'),
  amount: asset,
  extensions: set(future_extensions)
});

const asset_global_settle = new Serializer('asset_global_settle', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_settle: protocol_id_type('asset'),
  settle_price: price,
  extensions: set(future_extensions)
});

const price_feed = new Serializer('price_feed', {
  settlement_price: price,
  maintenance_collateral_ratio: uint16,
  maximum_short_squeeze_ratio: uint16,
  core_exchange_rate: price
});

const asset_publish_feed = new Serializer('asset_publish_feed', {
  fee: asset,
  publisher: protocol_id_type('account'),
  asset_id: protocol_id_type('asset'),
  feed: price_feed,
  extensions: set(future_extensions)
});

const witness_create = new Serializer('witness_create', {
  fee: asset,
  witness_account: protocol_id_type('account'),
  url: string,
  block_signing_key: public_key,
  initial_secret: bytes(20)
});

const witness_update = new Serializer('witness_update', {
  fee: asset,
  witness: protocol_id_type('witness'),
  witness_account: protocol_id_type('account'),
  new_url: optional(string),
  new_signing_key: optional(public_key),
  new_initial_secret: optional(bytes(20))
});

const op_wrapper = new Serializer('op_wrapper', {
  op: operation
});

const proposal_create = new Serializer('proposal_create', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  expiration_time: time_point_sec,
  proposed_ops: array(op_wrapper),
  review_period_seconds: optional(uint32),
  extensions: set(future_extensions)
});

const proposal_update = new Serializer('proposal_update', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  proposal: protocol_id_type('proposal'),
  active_approvals_to_add: set(protocol_id_type('account')),
  active_approvals_to_remove: set(protocol_id_type('account')),
  owner_approvals_to_add: set(protocol_id_type('account')),
  owner_approvals_to_remove: set(protocol_id_type('account')),
  key_approvals_to_add: set(public_key),
  key_approvals_to_remove: set(public_key),
  extensions: set(future_extensions)
});

const proposal_delete = new Serializer('proposal_delete', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  using_owner_authority: bool,
  proposal: protocol_id_type('proposal'),
  extensions: set(future_extensions)
});

const withdraw_permission_create = new Serializer('withdraw_permission_create', {
  fee: asset,
  withdraw_from_account: protocol_id_type('account'),
  authorized_account: protocol_id_type('account'),
  withdrawal_limit: asset,
  withdrawal_period_sec: uint32,
  periods_until_expiration: uint32,
  period_start_time: time_point_sec
});

const withdraw_permission_update = new Serializer('withdraw_permission_update', {
  fee: asset,
  withdraw_from_account: protocol_id_type('account'),
  authorized_account: protocol_id_type('account'),
  permission_to_update: protocol_id_type('withdraw_permission'),
  withdrawal_limit: asset,
  withdrawal_period_sec: uint32,
  period_start_time: time_point_sec,
  periods_until_expiration: uint32
});

const withdraw_permission_claim = new Serializer('withdraw_permission_claim', {
  fee: asset,
  withdraw_permission: protocol_id_type('withdraw_permission'),
  withdraw_from_account: protocol_id_type('account'),
  withdraw_to_account: protocol_id_type('account'),
  amount_to_withdraw: asset,
  memo: optional(memo_data)
});

const withdraw_permission_delete = new Serializer('withdraw_permission_delete', {
  fee: asset,
  withdraw_from_account: protocol_id_type('account'),
  authorized_account: protocol_id_type('account'),
  withdrawal_permission: protocol_id_type('withdraw_permission')
});

const committee_member_create = new Serializer('committee_member_create', {
  fee: asset,
  committee_member_account: protocol_id_type('account'),
  url: string
});

const committee_member_update = new Serializer('committee_member_update', {
  fee: asset,
  committee_member: protocol_id_type('committee_member'),
  committee_member_account: protocol_id_type('account'),
  new_url: optional(string)
});

const parameter_extension = new Serializer('parameter_extension', {
  min_bet_multiplier: optional(uint32),
  max_bet_multiplier: optional(uint32),
  betting_rake_fee_percentage: optional(uint16),
  permitted_betting_odds_increments: optional(map(uint32, uint32)),
  live_betting_delay_time: optional(uint16),
  sweeps_distribution_percentage: optional(uint16),
  sweeps_distribution_asset: optional(protocol_id_type('asset')),
  sweeps_vesting_accumulator_account: optional(protocol_id_type('account')),
  rbac_max_permissions_per_account: optional(uint16),
  rbac_max_account_authority_lifetime: optional(uint32),
  rbac_max_authorities_per_permission: optional(uint16),
  account_roles_max_per_account: optional(uint16),
  account_roles_max_lifetime: optional(uint32),
  gpos_period: optional(uint32),
  gpos_subperiod: optional(uint32),
  gpos_period_start: optional(uint32),
  gpos_vesting_lockin_period: optional(uint32),
  son_vesting_amount: optional(uint32),
  son_vesting_period: optional(uint32),
  son_pay_max: optional(uint32),
  son_pay_time: optional(uint32),
  son_deregister_time: optional(uint32),
  son_heartbeat_frequency: optional(uint32),
  son_down_time: optional(uint32),
  son_bitcoin_min_tx_confirmations: optional(uint16),
  son_account: optional(protocol_id_type('account')),
  btc_asset: optional(protocol_id_type('asset'))
});

const chain_parameters = new Serializer('chain_parameters', {
  current_fees: fee_schedule,
  block_interval: uint8,
  maintenance_interval: uint32,
  maintenance_skip_slots: uint8,
  committee_proposal_review_period: uint32,
  maximum_transaction_size: uint32,
  maximum_block_size: uint32,
  maximum_time_until_expiration: uint32,
  maximum_proposal_lifetime: uint32,
  maximum_asset_whitelist_authorities: uint8,
  maximum_asset_feed_publishers: uint8,
  maximum_witness_count: uint16,
  maximum_committee_count: uint16,
  maximum_son_count: uint16,
  maximum_authority_membership: uint16,
  reserve_percent_of_fee: uint16,
  network_percent_of_fee: uint16,
  lifetime_referrer_percent_of_fee: uint16,
  cashback_vesting_period_seconds: uint32,
  cashback_vesting_threshold: int64,
  count_non_member_votes: bool,
  allow_non_member_whitelists: bool,
  witness_pay_per_block: int64,
  worker_budget_per_day: int64,
  max_predicate_opcode: uint16,
  fee_liquidation_threshold: int64,
  accounts_per_fee_scale: uint16,
  account_fee_scale_bitshifts: uint8,
  max_authority_depth: uint8,
  witness_schedule_algorithm: uint8,
  min_round_delay: uint32,
  max_round_delay: uint32,
  min_time_per_commit_move: uint32,
  max_time_per_commit_move: uint32,
  min_time_per_reveal_move: uint32,
  max_time_per_reveal_move: uint32,
  rake_fee_percentage: uint16,
  maximum_registration_deadline: uint32,
  maximum_players_in_tournament: uint16,
  maximum_tournament_whitelist_length: uint16,
  maximum_tournament_start_time_in_future: uint32,
  maximum_tournament_start_delay: uint32,
  maximum_tournament_number_of_wins: uint16,
  extensions: parameter_extension
});

const committee_member_update_global_parameters = new Serializer(
  'committee_member_update_global_parameters',
  {
    fee: asset,
    new_parameters: chain_parameters
  }
);

const linear_vesting_policy_initializer = new Serializer(
  'linear_vesting_policy_initializer',
  {
    begin_timestamp: time_point_sec,
    vesting_cliff_seconds: uint32,
    vesting_duration_seconds: uint32
  }
);

const cdd_vesting_policy_initializer = new Serializer('cdd_vesting_policy_initializer', {
  start_claim: time_point_sec,
  vesting_seconds: uint32
});

const dormant_vesting_policy_initializer = new Serializer('dormant_vesting_policy_initializer', {});

const vesting_policy_initializer = static_variant([
  linear_vesting_policy_initializer,
  cdd_vesting_policy_initializer,
  dormant_vesting_policy_initializer
]);

const vesting_balance_type = enumeration([ 'normal', 'gpos', 'son' ]);

const vesting_balance_create = new Serializer('vesting_balance_create', {
  fee: asset,
  creator: protocol_id_type('account'),
  owner: protocol_id_type('account'),
  amount: asset,
  policy: vesting_policy_initializer,
  balance_type: vesting_balance_type
});

const vesting_balance_withdraw = new Serializer('vesting_balance_withdraw', {
  fee: asset,
  vesting_balance: protocol_id_type('vesting_balance'),
  owner: protocol_id_type('account'),
  amount: asset
});

const refund_worker_initializer = new Serializer('refund_worker_initializer');

const vesting_balance_worker_initializer = new Serializer(
  'vesting_balance_worker_initializer',
  {
    pay_vesting_period_days: uint16
  }
);

const burn_worker_initializer = new Serializer('burn_worker_initializer');

const worker_initializer = static_variant([
  refund_worker_initializer,
  vesting_balance_worker_initializer,
  burn_worker_initializer
]);

const worker_create = new Serializer('worker_create', {
  fee: asset,
  owner: protocol_id_type('account'),
  work_begin_date: time_point_sec,
  work_end_date: time_point_sec,
  daily_pay: int64,
  name: string,
  url: string,
  initializer: worker_initializer
});

const custom = new Serializer('custom', {
  fee: asset,
  payer: protocol_id_type('account'),
  required_auths: set(protocol_id_type('account')),
  id: uint16,
  data: bytes()
});

const account_name_eq_lit_predicate = new Serializer('account_name_eq_lit_predicate', {
  account_id: protocol_id_type('account'),
  name: string
});

const asset_symbol_eq_lit_predicate = new Serializer('asset_symbol_eq_lit_predicate', {
  asset_id: protocol_id_type('asset'),
  symbol: string
});

const block_id_predicate = new Serializer('block_id_predicate', {
  id: bytes(20)
});

const predicate = static_variant([
  account_name_eq_lit_predicate,
  asset_symbol_eq_lit_predicate,
  block_id_predicate
]);

const assert = new Serializer('assert', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  predicates: array(predicate),
  required_auths: set(protocol_id_type('account')),
  extensions: set(future_extensions)
});

const balance_claim = new Serializer('balance_claim', {
  fee: asset,
  deposit_to_account: protocol_id_type('account'),
  balance_to_claim: protocol_id_type('balance'),
  balance_owner_key: public_key,
  total_claimed: asset
});

const override_transfer = new Serializer('override_transfer', {
  fee: asset,
  issuer: protocol_id_type('account'),
  from: protocol_id_type('account'),
  to: protocol_id_type('account'),
  amount: asset,
  memo: optional(memo_data),
  extensions: set(future_extensions)
});

const stealth_confirmation = new Serializer('stealth_confirmation', {
  one_time_key: public_key,
  to: optional(public_key),
  encrypted_memo: bytes()
});

const blind_output = new Serializer('blind_output', {
  commitment: bytes(33),
  range_proof: bytes(),
  owner: authority,
  stealth_memo: optional(stealth_confirmation)
});

const transfer_to_blind = new Serializer('transfer_to_blind', {
  fee: asset,
  amount: asset,
  from: protocol_id_type('account'),
  blinding_factor: bytes(32),
  outputs: array(blind_output)
});

const blind_input = new Serializer('blind_input', {
  commitment: bytes(33),
  owner: authority
});

const blind_transfer = new Serializer('blind_transfer', {
  fee: asset,
  inputs: array(blind_input),
  outputs: array(blind_output)
});

const transfer_from_blind = new Serializer('transfer_from_blind', {
  fee: asset,
  amount: asset,
  to: protocol_id_type('account'),
  blinding_factor: bytes(32),
  inputs: array(blind_input)
});

const asset_settle_cancel = new Serializer('asset_settle_cancel', {
  fee: asset,
  settlement: protocol_id_type('force_settlement'),
  account: protocol_id_type('account'),
  amount: asset,
  extensions: set(future_extensions)
});

const asset_claim_fees = new Serializer('asset_claim_fees', {
  fee: asset,
  issuer: protocol_id_type('account'),
  amount_to_claim: asset,
  extensions: set(future_extensions)
});

const fba_distribute = new Serializer('fba_distribute', {
  fee: asset,
  account_id: protocol_id_type('account'),
  fba_id: protocol_id_type('fba_accumulator'),
  amount: int64
});

const rock_paper_scissors_game_options = new Serializer('rock_paper_scissors_game_options', {
  insurance_enabled: bool,
  time_per_commit_move: uint32,
  time_per_reveal_move: uint32,
  number_of_gestures: uint8
});

const game_specific_details = static_variant([rock_paper_scissors_game_options]);

const tournament_options = new Serializer('tournament_options', {
  type_of_game: uint16,
  registration_deadline: time_point_sec,
  number_of_players: uint32,
  buy_in: asset,
  whitelist: set(protocol_id_type('account')),
  start_time: optional(time_point_sec),
  start_delay: optional(uint32),
  round_delay: uint32,
  number_of_wins: uint32,
  meta: variant_object,
  game_options: game_specific_details
});

const tournament_create = new Serializer('tournament_create', {
  fee: asset,
  creator: protocol_id_type('account'),
  options: tournament_options,
  extensions: set(future_extensions)
});

const tournament_join = new Serializer('tournament_join', {
  fee: asset,
  payer_account_id: protocol_id_type('account'),
  player_account_id: protocol_id_type('account'),
  tournament_id: protocol_id_type('tournament'),
  buy_in: asset,
  extensions: set(future_extensions)
});

const rock_paper_scissors_gesture = enumeration([
  'rock',
  'paper',
  'scissors',
  'spock',
  'lizard'
]);

const rock_paper_scissors_throw_commit = new Serializer('rock_paper_scissors_throw_commit', {
  nonce1: uint64,
  throw_hash: sha256
});

const rock_paper_scissors_throw_reveal = new Serializer('rock_paper_scissors_throw_reveal', {
  nonce2: uint64,
  gesture: rock_paper_scissors_gesture
});

const game_specific_moves = static_variant([
  rock_paper_scissors_throw_commit,
  rock_paper_scissors_throw_reveal
]);

const game_move = new Serializer('game_move', {
  fee: asset,
  game_id: protocol_id_type('game'),
  player_account_id: protocol_id_type('account'),
  move: game_specific_moves,
  extensions: set(future_extensions)
});

const dividend_asset_options = new Serializer('dividend_asset_options', {
  next_payout_time: optional(time_point_sec),
  payout_interval: optional(uint32),
  minimum_fee_percentage: uint64,
  minimum_distribution_interval: optional(uint32),
  extensions: set(future_extensions)
});

const asset_update_dividend = new Serializer('asset_update_dividend', {
  fee: asset,
  issuer: protocol_id_type('account'),
  asset_to_update: protocol_id_type('asset'),
  new_options: dividend_asset_options,
  extensions: set(future_extensions)
});

const asset_dividend_distribution = new Serializer('asset_dividend_distribution', {
  fee: asset,
  dividend_asset_id: protocol_id_type('asset'),
  account_id: protocol_id_type('account'),
  amounts: set(asset),
  extensions: set(future_extensions)
});

const sport_create = new Serializer('sport_create', {
  fee: asset,
  name: map(string, string),
  extensions: set(future_extensions)
});

const sport_update = new Serializer('sport_update', {
  fee: asset,
  sport_id: protocol_id_type('sport'),
  new_name: optional(map(string, string)),
  extensions: set(future_extensions)
});

const event_group_create = new Serializer('event_group_create', {
  fee: asset,
  name: map(string, string),
  sport_id: object_id_type,
  extensions: set(future_extensions)
});

const event_group_update = new Serializer('event_group_update', {
  fee: asset,
  new_sport_id: optional(protocol_id_type('sport')),
  new_name: optional(map(string, string)),
  event_group_id: protocol_id_type('event_group'),
  extensions: set(future_extensions)
});

const event_create = new Serializer('event_create', {
  fee: asset,
  name: map(string, string),
  season: map(string, string),
  start_time: optional(time_point_sec),
  event_group_id: object_id_type,
  extensions: set(future_extensions)
});

const event_update = new Serializer('event_update', {
  fee: asset,
  event_id: protocol_id_type('event'),
  new_event_group_id: optional(protocol_id_type('event_group')),
  new_name: optional(map(string, string)),
  new_season: optional(map(string, string)),
  new_start_time: optional(time_point_sec),
  is_live_market: optional(bool),
  extensions: set(future_extensions)
});

const betting_market_rules_create = new Serializer('betting_market_rules_create', {
  fee: asset,
  name: map(string, string),
  description: map(string, string),
  extensions: set(future_extensions)
});

const betting_market_rules_update = new Serializer('betting_market_rules_update', {
  fee: asset,
  new_name: optional(map(string, string)),
  new_description: optional(map(string, string)),
  extensions: set(future_extensions),
  betting_market_rules_id: protocol_id_type('betting_market_rules')
});

const betting_market_group_create = new Serializer('betting_market_group_create', {
  fee: asset,
  description: map(string, string),
  event_id: object_id_type,
  rules_id: object_id_type,
  asset_id: protocol_id_type('asset'),
  extensions: set(future_extensions)
});

const betting_market_create = new Serializer('betting_market_create', {
  fee: asset,
  group_id: object_id_type,
  description: map(string, string),
  payout_condition: map(string, string),
  extensions: set(future_extensions)
});

const bet_type = enumeration(['back', 'lay']);

const bet_place = new Serializer('bet_place', {
  fee: asset,
  bettor_id: protocol_id_type('account'),
  betting_market_id: protocol_id_type('betting_market'),
  amount_to_bet: asset,
  backer_multiplier: uint32,
  back_or_lay: bet_type,
  extensions: set(future_extensions)
});

const betting_market_resolution_type = enumeration([
  'win',
  'not_win',
  'cancel',
  'BETTING_MARKET_RESOLUTION_COUNT'
]);

const betting_market_group_resolve = new Serializer('betting_market_group_resolve', {
  fee: asset,
  betting_market_group_id: protocol_id_type('betting_market_group'),
  resolutions: map(protocol_id_type('betting_market'), betting_market_resolution_type),
  extensions: set(future_extensions)
});

const betting_market_group_resolved = new Serializer('betting_market_group_resolved', {
  bettor_id: protocol_id_type('account'),
  betting_market_group_id: protocol_id_type('betting_market_group'),
  resolutions: map(protocol_id_type('betting_market'), betting_market_resolution_type),
  winnings: int64,
  fees_paid: int64,
  fee: asset
});

const betting_market_group_cancel_unmatched_bets = new Serializer(
  'betting_market_group_cancel_unmatched_bets',
  {
    fee: asset,
    betting_market_group_id: protocol_id_type('betting_market_group'),
    extensions: set(future_extensions)
  }
);

const bet_matched = new Serializer('bet_matched', {
  bettor_id: protocol_id_type('account'),
  bet_id: protocol_id_type('bet'),
  betting_market_id: protocol_id_type('betting_market'),
  amount_bet: asset,
  fees_paid: int64,
  backer_multiplier: uint32,
  guaranteed_winnings_returned: int64
});

const bet_cancel = new Serializer('bet_cancel', {
  fee: asset,
  bettor_id: protocol_id_type('account'),
  bet_to_cancel: protocol_id_type('bet'),
  extensions: set(future_extensions)
});

const bet_canceled = new Serializer('bet_canceled', {
  bettor_id: protocol_id_type('account'),
  bet_id: protocol_id_type('bet'),
  stake_returned: asset,
  unused_fees_returned: asset
});

const payout_type = enumeration(['prize_award', 'buyin_refund', 'rake_fee']);

const tournament_payout = new Serializer('tournament_payout', {
  fee: asset,
  payout_account_id: protocol_id_type('account'),
  tournament_id: protocol_id_type('tournament'),
  payout_amount: asset,
  type: payout_type,
  extensions: set(future_extensions)
});

const tournament_leave = new Serializer('tournament_leave', {
  fee: asset,
  canceling_account_id: protocol_id_type('account'),
  player_account_id: protocol_id_type('account'),
  tournament_id: protocol_id_type('tournament'),
  extensions: set(future_extensions)
});

const betting_market_group_update = new Serializer('betting_market_group_update', {
  fee: asset,
  betting_market_group_id: protocol_id_type('betting_market_group'),
  new_description: optional(map(string, string)),
  new_rules_id: optional(protocol_id_type('betting_market_rules')),
  freeze: optional(bool),
  delay_bets: optional(bool),
  extensions: set(future_extensions)
});

const betting_market_update = new Serializer('betting_market_update', {
  fee: asset,
  betting_market_id: protocol_id_type('betting_market'),
  new_group_id: optional(protocol_id_type('betting_market_group')),
  new_description: optional(map(string, string)),
  new_payout_condition: optional(map(string, string)),
  extensions: set(future_extensions)
});

const bet_adjusted = new Serializer('bet_adjusted', {
  bettor_id: protocol_id_type('account'),
  bet_id: protocol_id_type('bet'),
  stake_returned: asset
});

//dummy operations for missing operations - To be added if required in frontend
const event_update_status =  new Serializer('event_update_status');
const sport_delete = new Serializer('sport_delete');
const event_group_delete = new Serializer('event_group_delete');
const affiliate_payout = new Serializer('affiliate_payout');
const affiliate_referral_payout = new Serializer('affiliate_referral_payout');

//lottery operations
const lottery_asset_create = new Serializer('lottery_asset_create', {
  fee: asset,
  issuer: protocol_id_type('account'),
  symbol: string,
  precision: uint8,
  common_options: asset_options,
  bitasset_opts: optional(bitasset_options),
  is_prediction_market: bool,
  extensions: lottery_asset_options
});

const ticket_purchase = new Serializer('ticket_purchase', {
  fee: asset,
  lottery: protocol_id_type('asset'),
  buyer: protocol_id_type('account'),
  tickets_to_buy: uint64,
  amount: asset,
  extensions: set(future_extensions)
});

const lottery_reward = new Serializer('lottery_reward', {
  fee: asset,
  lottery: protocol_id_type('asset'),
  winner: protocol_id_type('account'),
  amount: asset,
  win_percentage: uint16,
  is_benefactor_reward: bool,
  extensions: set(future_extensions) 
});

const lottery_end = new Serializer('lottery_end', {
  fee: asset,
  lottery: protocol_id_type('asset'),
  participants: map((protocol_id_type('account')), array(uint16)),
  extensions: set(future_extensions)
});

const sweeps_vesting_claim = new Serializer('sweeps_vesting_claim', {fee: asset,
  account: protocol_id_type('account'),
  amount_to_claim: asset,
  extensions: set(future_extensions)  
});

const custom_permission_create = new Serializer('custom_permission_create',{
  fee: asset,
  owner_account: protocol_id_type('account'),
  permission_name: string,
  auth: authority,
  extensions: set(future_extensions)
});

const custom_permission_update = new Serializer('custom_permission_update',{
  fee: asset,
  permission_id: protocol_id_type('custom_permission'),
  new_auth: optional(authority),
  owner_account: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const custom_permission_delete = new Serializer('custom_permission_delete',{
  fee: asset,
  permission_id: protocol_id_type('custom_permission'),
  owner_account: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const custom_account_authority_create = new Serializer('custom_account_authority_create', {
  fee: asset,
  permission_id: protocol_id_type('custom_permission'),
  operation_type: uint32,
  valid_from: time_point_sec,
  valid_to: time_point_sec,
  owner_account: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const custom_account_authority_update = new Serializer('custom_account_authority_update',{
  fee: asset,
  auth_id: protocol_id_type('custom_account_authority'),
  new_valid_from: optional(time_point_sec),
  new_valid_to: optional(time_point_sec),
  owner_account: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const custom_account_authority_delete = new Serializer('custom_account_authority_delete',{
  fee: asset,
  auth_id: protocol_id_type('custom_account_authority'),
  owner_account: protocol_id_type('account'),
  extensions: set(future_extensions)
});

const offer = new Serializer('offer', {
  fee: asset,
  item_ids: set(protocol_id_type('nft')),
  issuer: protocol_id_type('account'),
  minimum_price: asset,
  maximum_price: asset,
  buying_item: bool,
  offer_expiration_date: time_point_sec,
  memo: optional(memo_data),
  extensions: set(future_extensions)
});

const bid = new Serializer('bid', {
  fee: asset,
  bidder: protocol_id_type('account'),
  bid_price: asset,
  offer_id: protocol_id_type('offer'),
  extensions: set(future_extensions)
});

const cancel_offer = new Serializer('cancel_offer', {
  fee: asset,
  issuer: protocol_id_type('account'),
  offer_id: protocol_id_type('offer'),
  extensions: set(future_extensions)
});

const result_type = enumeration([
  'Expired',
  'ExpiredNoBid',
  'Cancelled'
]);

const finalize_offer = new Serializer('finalize_offer', {
  fee: asset,
  fee_paying_account: protocol_id_type('account'),
  offer_id: protocol_id_type('offer'),
  result: result_type,
  extensions: set(future_extensions)
});

const nft_lottery_benefactor = new Serializer(
  'nft_lottery_benefactor', {
    id: protocol_id_type('account'),
    share: uint16
  }
);

const nft_lottery_options = new Serializer(
  'nft_lottery_options', {
    benefactors: array(nft_lottery_benefactor),
    winning_tickets: nosort_array(uint16),
    ticket_price: asset,
    end_date: time_point_sec,
    ending_on_soldout: bool,
    is_active: bool,
    delete_tickets_after_draw: bool,
    progressive_jackpots: array(protocol_id_type('nft_metadata'))
  }
);

const nft_metadata_create = new Serializer('nft_metadata_create', {
  fee: asset,
  owner: protocol_id_type('account'),
  name: string,
  symbol: string,
  base_uri: string,
  revenue_partner: optional(protocol_id_type('account')),
  revenue_split: optional(uint16),
  is_transferable: bool,
  is_sellable: bool,
  account_role: optional(protocol_id_type('account_role')),
  max_supply: optional(uint64),
  lottery_options: optional(nft_lottery_options),
  extensions: set(future_extensions)
});

const nft_metadata_update = new Serializer('nft_metadata_update', {
  fee: asset,
  owner: protocol_id_type('account'),
  nft_metadata_id: protocol_id_type('nft_metadata'),
  name: optional(string),
  symbol: optional(string),
  base_uri: optional(string),
  revenue_partner: optional(protocol_id_type('account')),
  revenue_split: optional(uint16),
  is_transferable: optional(bool),
  is_sellable: optional(bool),
  account_role: optional(protocol_id_type('account_role')),
  extensions: set(future_extensions)
});

const nft_mint = new Serializer('nft_mint', {
  fee: asset,
  payer: protocol_id_type('account'),
  nft_metadata_id: protocol_id_type('nft_metadata'),
  owner: protocol_id_type('account'),
  approved: protocol_id_type('account'),
  approved_operators: set(protocol_id_type('account')),
  token_uri: string,
  extensions: set(future_extensions)
});

const nft_safe_transfer_from = new Serializer('nft_safe_transfer_from', {
  fee: asset,
  operator_: protocol_id_type('account'),
  from: protocol_id_type('account'),
  to: protocol_id_type('account'),
  token_id: protocol_id_type('nft'),
  data: string,
  extensions: set(future_extensions)
});

const nft_approve = new Serializer('nft_approve', {
  fee: asset,
  operator_: protocol_id_type('account'),
  approved: protocol_id_type('account'),
  token_id: protocol_id_type('nft'),
  extensions: set(future_extensions)
});

const nft_set_approval_for_all = new Serializer('nft_set_approval_for_all', {
  fee: asset,
  owner: protocol_id_type('account'),
  operator_: protocol_id_type('account'),
  approved: bool,
  extensions: set(future_extensions)
});

const account_role_create = new Serializer('account_role_create', {
  fee: asset,
  owner: protocol_id_type('account'),
  name: string,
  metadata: string,
  allowed_operations: set(uint32),
  whitelisted_accounts: set(protocol_id_type('account')),
  valid_from: time_point_sec,
  extensions: set(future_extensions)
});

const account_role_update = new Serializer('account_role_update', {
  fee: asset,
  owner: protocol_id_type('account'),
  account_role_id: protocol_id_type('account_role'),
  name: optional(string),
  metadata: optional(string),
  allowed_operations_to_add: set(uint32),
  allowed_operations_to_remove: set(uint32),
  accounts_to_add: set(protocol_id_type('account')),
  accounts_to_remove: set(protocol_id_type('account')),
  valid_to: optional(time_point_sec),
  extensions: set(future_extensions)
});

const account_role_delete = new Serializer('account_role_delete', {
  fee: asset,
  owner: protocol_id_type('account'),
  account_role_id: protocol_id_type('account_role'),
  extensions: set(future_extensions)
});

const sidechain_type = enumeration([
  'unknown',
  'bitcoin',
  'ethereum',
  'eos',
  'peerplays'
]);

const son_create = new Serializer('son_create', {
  fee: asset,
  owner_account: protocol_id_type('account'),
  url: string,
  deposit: protocol_id_type('vesting_balance'),
  signing_key: public_key,
  sidechain_public_keys: map(sidechain_type, string),
  pay_vb: protocol_id_type('vesting_balance')
});

const son_update = new Serializer('son_update', {
  fee: asset,
  son_id: protocol_id_type('son'),
  owner_account: protocol_id_type('account'),
  new_url: optional(string),
  new_deposit: optional(protocol_id_type('vesting_balance')),
  new_signing_key: optional(public_key),
  new_sidechain_public_keys: optional(map(sidechain_type, string)),
  new_pay_vb: optional(protocol_id_type('vesting_balance'))
});

const son_deregister = new Serializer('son_deregister', {
  fee: asset,
  son_id: protocol_id_type('son'),
  payer: protocol_id_type('account')
});

const son_heartbeat = new Serializer('son_heartbeat', {
  fee: asset,
  son_id: protocol_id_type('son'),
  owner_account: protocol_id_type('account'),
  ts: time_point_sec
});

const son_report_down = new Serializer('son_report_down', {
  fee: asset,
  son_id: protocol_id_type('son'),
  payer: protocol_id_type('account'),
  down_ts: time_point_sec
});

const son_maintenance_request_type = enumeration([ 
  'request_maintenance',
  'cancel_request_maintenance'
]);

const son_maintenance = new Serializer('son_maintenance', {
  fee: asset,
  son_id: protocol_id_type('son'),
  owner_account: protocol_id_type('account'),
  request_type: son_maintenance_request_type
});

const son_info = new Serializer('son_info', {
  son_id: protocol_id_type('son'),
  weight: uint16,
  signing_key: public_key,
  sidechain_public_keys: map(sidechain_type, string)
});

const son_wallet_recreate = new Serializer('son_wallet_recreate', {
  fee: asset,
  payer: protocol_id_type('account'),
  sons: set(son_info)
});

const son_wallet_update = new Serializer('son_wallet_update', {
  fee: asset,
  payer: protocol_id_type('account'),
  son_wallet_id: protocol_id_type('son_wallet'),
  sidechain: sidechain_type,
  address: string
});

const son_wallet_deposit_create = new Serializer('son_wallet_deposit_create', {
  fee: asset,
  payer: protocol_id_type('account'),
  son_id: protocol_id_type('son'),
  timestamp: time_point_sec,
  block_num: uint32,
  sidechain: sidechain_type,
  sidechain_uid: string,
  sidechain_transaction_id: string,
  sidechain_from: string,
  sidechain_to: string,
  sidechain_currency: string,
  sidechain_amount: int64,
  peerplays_from: protocol_id_type('account'),
  peerplays_to: protocol_id_type('account'),
  peerplays_asset: asset
});

const son_wallet_deposit_process = new Serializer('son_wallet_deposit_process', {
  fee: asset,
  payer: protocol_id_type('account'),
  son_wallet_deposit_id: protocol_id_type('son_wallet_deposit')
});

const son_wallet_withdraw_create = new Serializer('son_wallet_withdraw_create', {
  fee: asset,
  payer: protocol_id_type('account'),
  son_id: protocol_id_type('son'),
  timestamp: time_point_sec,
  block_num: uint32,
  sidechain: sidechain_type,
  peerplays_uid: string,
  peerplays_transaction_id: string,
  peerplays_from: protocol_id_type('account'),
  peerplays_asset: asset,
  withdraw_sidechain: sidechain_type,
  withdraw_address: string,
  withdraw_currency: string,
  withdraw_amount: int64
});

const son_wallet_withdraw_process = new Serializer('son_wallet_withdraw_process', {
  fee: asset,
  payer: protocol_id_type('account'),
  son_wallet_withdraw_id: protocol_id_type('son_wallet_withdraw')
});

const sidechain_address_add = new Serializer('sidechain_address_add', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain_address_account: protocol_id_type('account'),
  sidechain: sidechain_type,
  deposit_public_key: string,
  deposit_address: string,
  deposit_address_data: string,
  withdraw_public_key: string,
  withdraw_address: string
});

const sidechain_address_update = new Serializer('sidechain_address_update', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain_address_id: protocol_id_type('sidechain_address'),
  sidechain_address_account: protocol_id_type('account'),
  sidechain: sidechain_type,
  deposit_public_key: optional(string),
  deposit_address: optional(string),
  deposit_address_data: optional(string),
  withdraw_public_key: optional(string),
  withdraw_address: optional(string)
});

const sidechain_address_delete = new Serializer('sidechain_address_delete', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain_address_id: protocol_id_type('sidechain_address'),
  sidechain_address_account: protocol_id_type('account'),
  sidechain: sidechain_type
});

const sidechain_transaction_create = new Serializer('sidechain_transaction_create', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain: sidechain_type,
  object_id: protocol_id_type('object'),
  transaction: string,
  signers: set(son_info)
});

const sidechain_transaction_sign = new Serializer('sidechain_transaction_sign', {
  fee: asset,
  signer: protocol_id_type('son'),
  payer: protocol_id_type('account'),
  sidechain_transaction_id: protocol_id_type('sidechain_transaction'),
  signature: string
});

const sidechain_transaction_send = new Serializer('sidechain_transaction_send', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain_transaction_id: protocol_id_type('sidechain_transaction'),
  sidechain_transaction: string
});

const sidechain_transaction_settle = new Serializer('sidechain_transaction_settle', {
  fee: asset,
  payer: protocol_id_type('account'),
  sidechain_transaction_id: protocol_id_type('sidechain_transaction')
});

const nft_lottery_token_purchase = new Serializer('nft_lottery_token_purchase', {
  fee: asset,
  lottery_id: protocol_id_type('nft_metadata'),
  buyer: protocol_id_type('account'),
  tickets_to_buy: uint64,
  amount: asset,
  extensions: set(future_extensions)
});

const nft_lottery_reward = new Serializer('nft_lottery_reward', {
  fee: asset,
  lottery_id: protocol_id_type('nft_metadata'),
  winner: protocol_id_type('account'),
  amount: asset,
  win_percentage: uint16,
  is_benefactor_reward: bool,
  winner_ticket_id: uint64,
  extensions: set(future_extensions)
});

const nft_lottery_end = new Serializer('nft_lottery_end', {
  fee: asset,
  lottery_id: protocol_id_type('nft_metadata'),
  extensions: set(future_extensions)
});

const random_number_store = new Serializer('random_number_store', {
  fee: asset,
  account: protocol_id_type('account'),
  random_number: array(uint64),
  data: string
});

operation.st_operations = [
  transfer,
  limit_order_create,
  limit_order_cancel,
  call_order_update,
  fill_order,
  account_create,
  account_update,
  account_whitelist,
  account_upgrade,
  account_transfer,
  asset_create,
  asset_update,
  asset_update_bitasset,
  asset_update_feed_producers,
  asset_issue,
  asset_reserve,
  asset_fund_fee_pool,
  asset_settle,
  asset_global_settle,
  asset_publish_feed,
  witness_create,
  witness_update,
  proposal_create,
  proposal_update,
  proposal_delete,
  withdraw_permission_create,
  withdraw_permission_update,
  withdraw_permission_claim,
  withdraw_permission_delete,
  committee_member_create,
  committee_member_update,
  committee_member_update_global_parameters,
  vesting_balance_create,
  vesting_balance_withdraw,
  worker_create,
  custom,
  assert,
  balance_claim,
  override_transfer,
  transfer_to_blind,
  blind_transfer,
  transfer_from_blind,
  asset_settle_cancel,
  asset_claim_fees,
  fba_distribute,
  tournament_create,
  tournament_join,
  game_move,
  asset_update_dividend,
  asset_dividend_distribution,
  tournament_payout,
  tournament_leave,
  sport_create,
  sport_update,
  event_group_create,
  event_group_update,
  event_create,
  event_update,
  betting_market_rules_create,
  betting_market_rules_update,
  betting_market_group_create,
  betting_market_create,
  bet_place,
  betting_market_group_resolve,
  betting_market_group_resolved,
  bet_adjusted,
  betting_market_group_cancel_unmatched_bets,
  bet_matched,
  bet_cancel,
  bet_canceled,
  betting_market_group_update,
  betting_market_update,
  event_update_status,
  sport_delete,
  event_group_delete,
  affiliate_payout,
  affiliate_referral_payout,
  lottery_asset_create,
  ticket_purchase,
  lottery_reward,
  lottery_end,
  sweeps_vesting_claim,
  custom_permission_create,
  custom_permission_update,
  custom_permission_delete,
  custom_account_authority_create,
  custom_account_authority_update,
  custom_account_authority_delete,
  offer,
  bid,
  cancel_offer,
  finalize_offer,
  nft_metadata_create,
  nft_metadata_update,
  nft_mint,
  nft_safe_transfer_from,
  nft_approve,
  nft_set_approval_for_all,
  account_role_create,
  account_role_update,
  account_role_delete,
  son_create,
  son_update,
  son_deregister,
  son_heartbeat,
  son_report_down,
  son_maintenance,
  son_wallet_recreate,
  son_wallet_update,
  son_wallet_deposit_create,
  son_wallet_deposit_process,
  son_wallet_withdraw_create,
  son_wallet_withdraw_process,
  sidechain_address_add,
  sidechain_address_update,
  sidechain_address_delete,
  sidechain_transaction_create,
  sidechain_transaction_sign,
  sidechain_transaction_send,
  sidechain_transaction_settle,
  nft_lottery_token_purchase,
  nft_lottery_reward,
  nft_lottery_end,
  random_number_store
];

const transaction = new Serializer('transaction', {
  ref_block_num: uint16,
  ref_block_prefix: uint32,
  expiration: time_point_sec,
  operations: array(operation),
  extensions: set(future_extensions)
});

const signed_transaction = new Serializer('signed_transaction', {
  ref_block_num: uint16,
  ref_block_prefix: uint32,
  expiration: time_point_sec,
  operations: array(operation),
  extensions: set(future_extensions),
  signatures: array(bytes(65))
});
// # -------------------------------
// #  Generated code end
// # -------------------------------

// Betting Objects

const sport = new Serializer('sport', {
  id: protocol_id_type('sport'),
  name: map(string, string)
});

const event_group = new Serializer('event_group', {
  id: protocol_id_type('event_group'),
  name: map(string, string),
  sport_id: protocol_id_type('sport')
});

const event_status = enumeration([
  'upcoming',
  'in_progress',
  'frozen',
  'finished',
  'completed',
  'canceled',
  'STATUS_COUNT'
]);

const betting_market_status = enumeration([
  'unresolved',
  'frozen',
  'graded',
  'canceled',
  'settled'
]);

const betting_market_group_status = enumeration([
  'upcoming',
  'in_play',
  'closed',
  'graded',
  're-grading',
  'settled',
  'frozen',
  'canceled'
]);

const event = new Serializer('event', {
  id: protocol_id_type('event'),
  name: map(string, string),
  season: map(string, string),
  start_time: optional(time_point_sec),
  event_group_id: protocol_id_type('event_group'),
  is_live_market: bool,
  status: event_status,
  scores: array(string)
});

const betting_market_rules = new Serializer('betting_market_rules', {
  id: protocol_id_type('betting_market_rules'),
  name: map(string, string),
  description: map(string, string)
});

const betting_market_group = new Serializer('betting_market_group', {
  id: protocol_id_type('betting_market_group'),
  description: map(string, string),
  event_id: protocol_id_type('event'),
  rules_id: protocol_id_type('betting_market_rules'),
  asset_id: protocol_id_type('asset'),
  total_matched_bets_amount: uint64,
  frozen: bool,
  delay_bets: bool,
  status: betting_market_group_status
});

const betting_market = new Serializer('betting_market', {
  id: protocol_id_type('betting_market'),
  group_id: protocol_id_type('betting_market_group'),
  description: map(string, string),
  payout_condition: map(string, string),
  status: betting_market_status
});

const bet = new Serializer('bet', {
  id: protocol_id_type('bet'),
  bettor_id: protocol_id_type('account'),
  betting_market_id: protocol_id_type('betting_market'),
  amount_to_bet: asset,
  backer_multiplier: uint32,
  back_or_lay: bet_type
});

const betting_market_position = new Serializer('betting_market_position', {
  id: implementation_id_type('betting_market_position'),
  bettor_id: protocol_id_type('account'),
  betting_market_id: protocol_id_type('betting_market'),
  pay_if_payout_condition: int64,
  pay_if_not_payout_condition: int64,
  pay_if_canceled: int64,
  pay_if_not_canceled: int64,
  fees_collected: int64
});

const global_betting_statistics = new Serializer('global_betting_statistics', {
  id: implementation_id_type('global_betting_statistics'),
  number_of_active_events: uint32,
  total_amount_staked: map(protocol_id_type('asset'), int64)
});

// eof Betting Objects

// Custom Types

const stealth_memo_data = new Serializer('stealth_memo_data', {
  from: optional(public_key),
  amount: asset,
  blinding_factor: bytes(32),
  commitment: bytes(33),
  check: uint32
});
// var stealth_confirmation = new Serializer(
//     "stealth_confirmation", {
//     one_time_key: public_key,
//     to: optional( public_key ),
//     encrypted_memo: stealth_memo_data
// })

export {
  operation,
  transfer_operation_fee_parameters,
  limit_order_create_operation_fee_parameters,
  limit_order_cancel_operation_fee_parameters,
  call_order_update_operation_fee_parameters,
  fill_order_operation_fee_parameters,
  account_create_operation_fee_parameters,
  account_update_operation_fee_parameters,
  account_whitelist_operation_fee_parameters,
  account_upgrade_operation_fee_parameters,
  account_transfer_operation_fee_parameters,
  asset_create_operation_fee_parameters,
  asset_update_operation_fee_parameters,
  asset_update_bitasset_operation_fee_parameters,
  asset_update_feed_producers_operation_fee_parameters,
  asset_issue_operation_fee_parameters,
  asset_reserve_operation_fee_parameters,
  asset_fund_fee_pool_operation_fee_parameters,
  asset_settle_operation_fee_parameters,
  asset_global_settle_operation_fee_parameters,
  asset_publish_feed_operation_fee_parameters,
  witness_create_operation_fee_parameters,
  witness_update_operation_fee_parameters,
  proposal_create_operation_fee_parameters,
  proposal_update_operation_fee_parameters,
  proposal_delete_operation_fee_parameters,
  withdraw_permission_create_operation_fee_parameters,
  withdraw_permission_update_operation_fee_parameters,
  withdraw_permission_claim_operation_fee_parameters,
  withdraw_permission_delete_operation_fee_parameters,
  committee_member_create_operation_fee_parameters,
  committee_member_update_operation_fee_parameters,
  committee_member_update_global_parameters_operation_fee_parameters,
  vesting_balance_create_operation_fee_parameters,
  vesting_balance_withdraw_operation_fee_parameters,
  worker_create_operation_fee_parameters,
  custom_operation_fee_parameters,
  assert_operation_fee_parameters,
  balance_claim_operation_fee_parameters,
  override_transfer_operation_fee_parameters,
  transfer_to_blind_operation_fee_parameters,
  blind_transfer_operation_fee_parameters,
  transfer_from_blind_operation_fee_parameters,
  asset_settle_cancel_operation_fee_parameters,
  asset_claim_fees_operation_fee_parameters,
  fba_distribute_operation_fee_parameters,
  asset_update_dividend_operation_fee_parameters,
  asset_dividend_distribution_operation_fee_parameters,
  sport_create_operation_fee_parameters,
  sport_update_operation_fee_parameters,
  event_group_create_operation_fee_parameters,
  event_group_update_operation_fee_parameters,
  event_create_operation_fee_parameters,
  event_update_operation_fee_parameters,
  betting_market_rules_create_operation_fee_parameters,
  betting_market_rules_update_operation_fee_parameters,
  betting_market_group_create_operation_fee_parameters,
  betting_market_create_operation_fee_parameters,
  bet_place_operation_fee_parameters,
  betting_market_group_resolve_operation_fee_parameters,
  betting_market_group_resolved_operation_fee_parameters,
  betting_market_group_cancel_unmatched_bets_operation_fee_parameters,
  bet_matched_operation_fee_parameters,
  bet_cancel_operation_fee_parameters,
  bet_canceled_operation_fee_parameters,
  tournament_create_operation_fee_parameters,
  tournament_join_operation_fee_parameters,
  game_move_operation_fee_parameters,
  tournament_payout_operation_fee_parameters,
  tournament_leave_operation_fee_parameters,
  betting_market_group_update_operation_fee_parameters,
  betting_market_update_operation_fee_parameters,
  bet_adjusted_operation_fee_parameters,
  event_update_status_operation_fee_parameters,
  sport_delete_operation_fee_parameters,
  event_group_delete_operation_fee_parameters,
  affiliate_payout_operation_fee_parameters,
  affiliate_referral_payout_operation_fee_parameters,
  lottery_asset_create_operation_fee_parameters,
  ticket_purchase_operation_fee_parameters,
  lottery_reward_operation_fee_parameters,
  lottery_end_operation_fee_parameters,
  sweeps_vesting_claim_operation_fee_parameters,
  custom_permission_create_operation_fee_parameters,
  custom_permission_update_operation_fee_parameters,
  custom_permission_delete_operation_fee_parameters,
  custom_account_authority_create_operation_fee_parameters,
  custom_account_authority_update_operation_fee_parameters,
  custom_account_authority_delete_operation_fee_parameters,
  nft_metadata_create_operation_fee_parameters,
  nft_metadata_update_operation_fee_parameters,
  nft_mint_operation_fee_parameters,
  offer_operation_fee_parameters,
  bid_operation_fee_parameters,
  cancel_offer_operation_fee_parameters,
  finalize_offer_operation_fee_parameters,
  nft_safe_transfer_from_operation_fee_parameters,
  nft_approve_operation_fee_parameters,
  nft_set_approval_for_all_operation_fee_parameters,
  account_role_create_operation_fee_parameters,
  account_role_update_operation_fee_parameters,
  account_role_delete_operation_fee_parameters,
  son_create_operation_fee_parameters,
  son_update_operation_fee_parameters,
  son_deregister_operation_fee_parameters,
  son_heartbeat_operation_fee_parameters,
  son_report_down_operation_fee_parameters,
  son_maintenance_operation_fee_parameters,
  son_wallet_recreate_operation_fee_parameters,
  son_wallet_update_operation_fee_parameters,
  son_wallet_deposit_create_operation_fee_parameters,
  son_wallet_deposit_process_operation_fee_parameters,
  son_wallet_withdraw_create_operation_fee_parameters,
  son_wallet_withdraw_process_operation_fee_parameters,
  sidechain_address_add_operation_fee_parameters,
  sidechain_address_update_operation_fee_parameters,
  sidechain_address_delete_operation_fee_parameters,
  sidechain_transaction_create_operation_fee_parameters,
  sidechain_transaction_sign_operation_fee_parameters,
  sidechain_transaction_send_operation_fee_parameters,
  sidechain_transaction_settle_operation_fee_parameters,
  nft_lottery_token_purchase_operation_fee_parameters,
  nft_lottery_reward_operation_fee_parameters,
  nft_lottery_end_operation_fee_parameters,
  random_number_store_operation_fee_parameters,
  fee_schedule,
  void_result,
  asset,
  processed_transaction,
  signed_block,
  block_header,
  signed_block_header,
  memo_data,
  transfer,
  limit_order_create,
  limit_order_cancel,
  call_order_update,
  fill_order,
  authority,
  account_options,
  account_create,
  account_update_last_voting_time,
  account_update,
  account_whitelist,
  account_upgrade,
  account_transfer,
  price,
  asset_options,
  bitasset_options,
  asset_create,
  asset_update,
  asset_update_bitasset,
  asset_update_feed_producers,
  asset_issue,
  asset_reserve,
  asset_fund_fee_pool,
  asset_settle,
  asset_global_settle,
  price_feed,
  asset_publish_feed,
  witness_create,
  witness_update,
  op_wrapper,
  proposal_create,
  proposal_update,
  proposal_delete,
  withdraw_permission_create,
  withdraw_permission_update,
  withdraw_permission_claim,
  withdraw_permission_delete,
  committee_member_create,
  committee_member_update,
  chain_parameters,
  committee_member_update_global_parameters,
  linear_vesting_policy_initializer,
  cdd_vesting_policy_initializer,
  vesting_policy_initializer,
  vesting_balance_type,
  vesting_balance_create,
  vesting_balance_withdraw,
  refund_worker_initializer,
  vesting_balance_worker_initializer,
  burn_worker_initializer,
  worker_create,
  custom,
  account_name_eq_lit_predicate,
  asset_symbol_eq_lit_predicate,
  block_id_predicate,
  assert,
  balance_claim,
  override_transfer,
  stealth_confirmation,
  blind_output,
  transfer_to_blind,
  blind_input,
  blind_transfer,
  transfer_from_blind,
  asset_settle_cancel,
  asset_claim_fees,
  fba_distribute,
  rock_paper_scissors_game_options,
  tournament_options,
  tournament_create,
  tournament_join,
  rock_paper_scissors_gesture,
  rock_paper_scissors_throw_commit,
  rock_paper_scissors_throw_reveal,
  game_move,
  dividend_asset_options,
  asset_update_dividend,
  asset_dividend_distribution,
  sport_create,
  sport_update,
  event_group_create,
  event_group_update,
  event_create,
  event_update,
  betting_market_rules_create,
  betting_market_rules_update,
  betting_market_group_create,
  betting_market_create,
  bet_type,
  bet_place,
  betting_market_resolution_type,
  betting_market_group_resolve,
  betting_market_group_resolved,
  betting_market_group_cancel_unmatched_bets,
  bet_matched,
  bet_cancel,
  bet_canceled,
  payout_type,
  tournament_payout,
  tournament_leave,
  betting_market_group_update,
  betting_market_update,
  bet_adjusted,
  transaction,
  signed_transaction,
  sport,
  event_group,
  event,
  betting_market_rules,
  betting_market_group,
  betting_market,
  bet,
  betting_market_position,
  global_betting_statistics,
  stealth_memo_data,
  event_update_status,
  sport_delete,
  event_group_delete,
  affiliate_payout,
  affiliate_referral_payout,
  lottery_asset_create,
  ticket_purchase,
  lottery_reward,
  lottery_end,
  sweeps_vesting_claim,
  custom_permission_create,
  custom_permission_update,
  custom_permission_delete,
  custom_account_authority_create,
  custom_account_authority_update,
  custom_account_authority_delete,
  nft_metadata_create,
  nft_metadata_update,
  nft_mint,
  nft_safe_transfer_from,
  nft_approve,
  nft_set_approval_for_all,
  offer,
  bid,
  cancel_offer,
  result_type,
  finalize_offer,
  account_role_create,
  account_role_update,
  account_role_delete,
  son_create,
  son_update,
  son_deregister,
  son_heartbeat,
  son_report_down,
  son_maintenance,
  son_wallet_recreate,
  son_wallet_update,
  son_wallet_deposit_create,
  son_wallet_deposit_process,
  son_wallet_withdraw_create,
  son_wallet_withdraw_process,
  sidechain_address_add,
  sidechain_address_update,
  sidechain_address_delete,
  sidechain_transaction_create,
  sidechain_transaction_sign,
  sidechain_transaction_send,
  sidechain_transaction_settle,
  nft_lottery_benefactor,
  nft_lottery_options,
  nft_lottery_token_purchase,
  nft_lottery_reward,
  nft_lottery_end,
  random_number_store
};
