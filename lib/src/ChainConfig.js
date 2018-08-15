let ecc_config = {
  address_prefix: process.env.npm_config__graphene_ecc_default_address_prefix || 'PPY'
};

const _this = {
  core_asset: 'PPY',
  address_prefix: 'PPY',
  expire_in_secs: 15,
  expire_in_secs_proposal: 24 * 60 * 60,
  review_in_secs_committee: 24 * 60 * 60,
  networks: {
    Peerplays: {
      core_asset: 'PPY',
      address_prefix: 'PPY',
      chain_id: '6b6b5f0ce7a36d323768e534f3edb41c6d6332a541a95725b98e28d140850134'
    },
    PeerplaysTestnet: {
      core_asset: 'PPYTEST',
      address_prefix: 'PPYTEST',
      chain_id: 'be6b79295e728406cbb7494bcb626e62ad278fa4018699cf8f75739f4c1a81fd'
    }
  },

  /** Set a few properties for known chain IDs. */
  setChainId(chain_id) {
    let ref = Object.keys(_this.networks);

    for (let i = 0, len = ref.length; i < len; i++) {
      let network_name = ref[i];
      let network = _this.networks[network_name];

      if (network.chain_id === chain_id) {
        _this.network_name = network_name;

        if (network.address_prefix) {
          _this.address_prefix = network.address_prefix;
          ecc_config.address_prefix = network.address_prefix;
        }

        return {
          network_name,
          network
        };
      }
    }

    if (!_this.network_name) {
      console.log('Unknown chain id (this may be a testnet)', chain_id);
    }
  },

  reset() {
    _this.core_asset = 'PPY';
    _this.address_prefix = 'PPY';
    ecc_config.address_prefix = 'PPY';
    _this.expire_in_secs = 15;
    _this.expire_in_secs_proposal = 24 * 60 * 60;
  },

  setPrefix(prefix = 'PPY') {
    _this.address_prefix = prefix;
    ecc_config.address_prefix = prefix;
  }
};

export default _this;
