const defaults = {
  core_asset: 'KSH',
  address_prefix: 'KSH',
  expire_in_secs: 15,
  expire_in_secs_proposal: 24 * 60 * 60,
  review_in_secs_committee: 24 * 60 * 60
};

const networks = {
  networks: {
    Peerplays: {
      core_asset: 'KSH',
      address_prefix: 'KSH',
      chain_id:
        '9dd7d963d226b6991b0001688df0716f1c25a9f2ea39d6d71b82d97212c6ab8f'
    },
    PeerplaysTestnet: {
      core_asset: 'KSH',
      address_prefix: 'KSH',
      chain_id:
        '9dd7d963d226b6991b0001688df0716f1c25a9f2ea39d6d71b82d97212c6ab8f'
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

  setPrefix(prefix = 'KSH') {
    this.address_prefix = prefix;
  }
}
export default new ChainConfig();
