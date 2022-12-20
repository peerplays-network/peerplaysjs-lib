const defaults = {
  core_asset: 'PPY',
  address_prefix: 'PPY',
  expire_in_secs: 15,
  expire_in_secs_proposal: 24 * 60 * 60,
  review_in_secs_committee: 24 * 60 * 60
};

const networks = {
  networks: {
    Peerplays: {
      core_asset: 'PPY',
      address_prefix: 'PPY',
      chain_id:
        '6b6b5f0ce7a36d323768e534f3edb41c6d6332a541a95725b98e28d140850134'
    },
    PeerplaysTestnet: {
      core_asset: 'TEST',
      address_prefix: 'TEST',
      chain_id:
        '2c25aae5835fd54020329d4f150b04867e72cbd8f7f7b900a7c3da8a329a6014'
    }
  }
};

class ChainConfig {
  constructor() {
    this.reset();
  }

  reset() {
    Object.assign(this, defaults);
  }

  setChainId(chainID) {
    let ref = Object.keys(networks);

    for (let i = 0, len = ref.length; i < len; i++) {
      let network_name = ref[i];
      let network = networks[network_name];

      if (network.chain_id === chainID) {
        this.network_name = network_name;

        if (network.address_prefix) {
          this.address_prefix = network.address_prefix;
        }

        return {
          network_name,
          network
        };
      }
    }

    if (!this.network_name) {
      console.log('Unknown chain id (this may be a testnet)', chainID);
    }
  }

  setPrefix(prefix = 'PPY') {
    this.address_prefix = prefix;
  }
}
export default new ChainConfig();
