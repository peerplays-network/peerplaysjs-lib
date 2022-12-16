'use strict';

exports.__esModule = true;
exports['default'] = void 0;
var defaults = {
  core_asset: 'PPY',
  address_prefix: 'PPY',
  expire_in_secs: 15,
  expire_in_secs_proposal: 24 * 60 * 60,
  review_in_secs_committee: 24 * 60 * 60
};
var networks = {
  networks: {
    Peerplays: {
      core_asset: 'PPY',
      address_prefix: 'PPY',
      chain_id: '6b6b5f0ce7a36d323768e534f3edb41c6d6332a541a95725b98e28d140850134'
    },
    PeerplaysTestnet: {
      core_asset: 'TEST',
      address_prefix: 'TEST',
      chain_id: '2c25aae5835fd54020329d4f150b04867e72cbd8f7f7b900a7c3da8a329a6014'
    }
  }
};

var ChainConfig = /*#__PURE__*/function () {
  function ChainConfig() {
    this.reset();
  }

  var _proto = ChainConfig.prototype;

  _proto.reset = function reset() {
    Object.assign(this, defaults);
  };

  _proto.setChainId = function setChainId(chainID) {
    var ref = Object.keys(networks);

    for (var i = 0, len = ref.length; i < len; i++) {
      var network_name = ref[i];
      var network = networks[network_name];

      if (network.chain_id === chainID) {
        this.network_name = network_name;

        if (network.address_prefix) {
          this.address_prefix = network.address_prefix;
        }

        return {
          network_name: network_name,
          network: network
        };
      }
    }

    if (!this.network_name) {
      console.log('Unknown chain id (this may be a testnet)', chainID);
    }
  };

  _proto.setPrefix = function setPrefix(prefix) {
    if (prefix === void 0) {
      prefix = 'PPY';
    }

    this.address_prefix = prefix;
  };

  return ChainConfig;
}();

var _default = new ChainConfig();

exports['default'] = _default;