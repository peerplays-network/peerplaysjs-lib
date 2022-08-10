"use strict";

var ChainWebSocket = require('./ChainWebSocket');

var GrapheneApi = require('./GrapheneApi');

var ApisInstance = /*#__PURE__*/function () {
  function ApisInstance(ChainConfig) {
    this.chainConfig = ChainConfig;
  }
  /** @arg {string} connection .. */


  var _proto = ApisInstance.prototype;

  _proto.connect = function connect(cs) {
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
          });

          _this._net.init();

          _this._hist.init();

          _this._crypt.init();

          _this._bookie.init();
        });
      };

      return Promise.all([db_promise, _this._net.init(), _this._hist.init(), // Temporary squash crypto API error until the API is upgraded everywhere
      _this._crypt.init()["catch"](function (e) {
        return console.error('ApiInstance\tCrypto API Error', e);
      }), _this._bookie.init()]);
    });
  };

  _proto.close = function close() {
    this.ws_rpc.close();
    this.ws_rpc = null;
  };

  _proto.db_api = function db_api() {
    return this._db;
  };

  _proto.network_api = function network_api() {
    return this._net;
  };

  _proto.history_api = function history_api() {
    return this._hist;
  };

  _proto.crypto_api = function crypto_api() {
    return this._crypt;
  };

  _proto.bookie_api = function bookie_api() {
    return this._bookie;
  };

  _proto.setRpcConnectionStatusCallback = function setRpcConnectionStatusCallback(callback) {
    this.statusCb = callback;
  };

  return ApisInstance;
}();

module.exports = ApisInstance;