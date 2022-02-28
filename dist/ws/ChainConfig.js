"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

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
      core_asset: 'PPYTEST',
      address_prefix: 'PPYTEST',
      chain_id: 'be6b79295e728406cbb7494bcb626e62ad278fa4018699cf8f75739f4c1a81fd'
    }
  }
};

var ChainConfig = /*#__PURE__*/function () {
  function ChainConfig() {
    _classCallCheck(this, ChainConfig);

    this.reset();
  }

  _createClass(ChainConfig, [{
    key: "reset",
    value: function reset() {
      Object.assign(this, defaults);
    }
  }, {
    key: "setChainId",
    value: function setChainId(chainID) {
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
    }
  }, {
    key: "setPrefix",
    value: function setPrefix() {
      var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'PPY';
      this.address_prefix = prefix;
    }
  }]);

  return ChainConfig;
}();

var _default = new ChainConfig();

exports["default"] = _default;
module.exports = exports.default;