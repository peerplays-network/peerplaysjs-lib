"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var ChainWebSocket = require('./ChainWebSocket');

var GrapheneApi = require('./GrapheneApi');

var ApisInstance = /*#__PURE__*/function () {
  function ApisInstance(ChainConfig) {
    _classCallCheck(this, ApisInstance);

    this.chainConfig = ChainConfig;
  }
  /** @arg {string} connection .. */


  _createClass(ApisInstance, [{
    key: "connect",
    value: function connect(cs) {
      var _this = this;

      // console.log("INFO\tApiInstances\tconnect\t", cs);
      var rpc_user = '';
      var rpc_password = '';

      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && cs.indexOf('wss://') < 0) {
        throw new Error('Secure domains require wss connection');
      }

      this.ws_rpc = new ChainWebSocket(cs, this.statusCb);
      this.init_promise = this.ws_rpc.login(rpc_user, rpc_password).then(function () {
        // console.log("Login done");
        _this._db = new GrapheneApi(_this.ws_rpc, 'database');
        _this._net = new GrapheneApi(_this.ws_rpc, 'network_broadcast');
        _this._hist = new GrapheneApi(_this.ws_rpc, 'history');
        _this._crypt = new GrapheneApi(_this.ws_rpc, 'crypto');
        _this._bookie = new GrapheneApi(_this.ws_rpc, 'bookie');

        var db_promise = _this._db.init().then(function () {
          return _this._db.exec('get_chain_id', []).then(function (_chain_id) {
            _this.chain_id = _chain_id;

            if (_this.chainConfig) {
              return _this.chainConfig.setChainId(_chain_id);
            }

            return _chain_id;
          });
        });

        _this.ws_rpc.on_reconnect = function () {
          _this.ws_rpc.login('', '').then(function () {
            _this._db.init().then(function () {
              if (_this.statusCb) {
                _this.statusCb('reconnect');
              }
            })["catch"](function (error) {
              console.error(error);
            });

            _this._net.init();

            _this._hist.init();

            _this._crypt.init();

            _this._bookie.init();
          })["catch"](function (error) {
            console.error(error);
          });
        };

        return Promise.all([db_promise, _this._net.init(), _this._hist.init(), // Temporary squash crypto API error until the API is upgraded everywhere
        _this._crypt.init()["catch"](function (e) {
          return console.error('ApiInstance\tCrypto API Error', e);
        }), _this._bookie.init()]);
      });
    }
  }, {
    key: "close",
    value: function close() {
      this.ws_rpc.close();
      this.ws_rpc = null;
    }
  }, {
    key: "db_api",
    value: function db_api() {
      return this._db;
    }
  }, {
    key: "network_api",
    value: function network_api() {
      return this._net;
    }
  }, {
    key: "history_api",
    value: function history_api() {
      return this._hist;
    }
  }, {
    key: "crypto_api",
    value: function crypto_api() {
      return this._crypt;
    }
  }, {
    key: "bookie_api",
    value: function bookie_api() {
      return this._bookie;
    }
  }, {
    key: "setRpcConnectionStatusCallback",
    value: function setRpcConnectionStatusCallback(callback) {
      this.statusCb = callback;
    }
  }]);

  return ApisInstance;
}();

module.exports = ApisInstance;