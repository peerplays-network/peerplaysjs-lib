"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ChainWebSocket = _interopRequireDefault(require("./ChainWebSocket"));

var _GrapheneApi = _interopRequireDefault(require("./GrapheneApi"));

var _ChainConfig = _interopRequireDefault(require("./ChainConfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var inst;

var ApisInstance = /*#__PURE__*/function () {
  function ApisInstance() {
    _classCallCheck(this, ApisInstance);
  }

  _createClass(ApisInstance, [{
    key: "connect",
    value:
    /** @arg {string} connection .. */
    function connect(cs, connectTimeout) {
      var _this = this;

      var rpc_user = '';
      var rpc_password = '';

      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && cs.indexOf('wss://') < 0) {
        throw new Error('Secure domains require wss connection');
      }

      this.ws_rpc = new _ChainWebSocket["default"](cs, this.statusCb, connectTimeout);
      this.init_promise = this.ws_rpc.login(rpc_user, rpc_password).then(function () {
        console.log('Connected to API node:', cs);
        _this._db = new _GrapheneApi["default"](_this.ws_rpc, 'database');
        _this._net = new _GrapheneApi["default"](_this.ws_rpc, 'network_broadcast');
        _this._hist = new _GrapheneApi["default"](_this.ws_rpc, 'history');
        _this._crypto = new _GrapheneApi["default"](_this.ws_rpc, 'crypto');
        _this._bookie = new _GrapheneApi["default"](_this.ws_rpc, 'bookie');

        var db_promise = _this._db.init().then(function () {
          return _this._db.exec('get_chain_id', []).then(function (_chain_id) {
            _this.chain_id = _chain_id;
            return _ChainConfig["default"].setChainId(_chain_id);
          });
        });

        _this.ws_rpc.on_reconnect = function () {
          _this.ws_rpc.login('', '').then(function () {
            _this._db.init().then(function () {
              if (_this.statusCb) {
                _this.statusCb(_ChainWebSocket["default"].status.RECONNECTED);
              }
            })["catch"](function (error) {
              console.error(error);
            });

            _this._net.init();

            _this._hist.init();

            _this._crypto.init();

            _this._bookie.init();
          })["catch"](function (error) {
            console.error(error);
          });
        };

        return Promise.all([db_promise, _this._net.init(), _this._hist.init(), // Temporary squash crypto API error until the API is upgraded everywhere
        _this._crypto.init()["catch"](function (e) {
          return console.error('ApiInstance\tCrypto API Error', e);
        }), _this._bookie.init()]);
      });
    }
  }, {
    key: "close",
    value: function close() {
      if (this.ws_rpc) {
        this.ws_rpc.close();
      }

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
      return this._crypto;
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
/**
    Configure: configure as follows `Apis.instance("ws://localhost:8090").init_promise`.  This
    returns a promise, once resolved the connection is ready.

    Import: import { Apis } from "@graphene/chain"

    Short-hand: Apis.db("method", "parm1", 2, 3, ...).  Returns a promise with results.

    Additional usage: Apis.instance().db_api().exec("method", ["method", "parm1", 2, 3, ...]).
    Returns a promise with results.
*/


var _default = {
  setRpcConnectionStatusCallback: function setRpcConnectionStatusCallback(callback) {
    this.statusCb = callback;

    if (inst) {
      inst.setRpcConnectionStatusCallback(callback);
    }
  },

  /**
        @arg {string} cs is only provided in the first call
        @return {Apis} singleton .. Check Apis.instance().init_promise to
        know when the connection is established
    */
  reset: function reset() {
    var cs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'ws://localhost:8090';
    var connect = arguments.length > 1 ? arguments[1] : undefined;
    var connectTimeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4000;

    if (inst) {
      inst.close();
      inst = null;
    }

    inst = new ApisInstance();
    inst.setRpcConnectionStatusCallback(this.statusCb);

    if (inst && connect) {
      inst.connect(cs, connectTimeout);
    }

    return inst;
  },
  instance: function instance() {
    var cs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'ws://localhost:8090';
    var connect = arguments.length > 1 ? arguments[1] : undefined;
    var connectTimeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4000;

    if (!inst) {
      inst = new ApisInstance();
      inst.setRpcConnectionStatusCallback(this.statusCb);
    }

    if (inst && connect) {
      inst.connect(cs, connectTimeout);
    }

    return inst;
  },
  chainId: function chainId() {
    return this.instance().chain_id;
  },
  close: function close() {
    if (inst) {
      inst.close();
      inst = null;
    }
  } // db: (method, ...args) => Apis.instance().db_api().exec(method, toStrings(args)),
  // network: (method, ...args) => Apis.instance().network_api().exec(method, toStrings(args)),
  // history: (method, ...args) => Apis.instance().history_api().exec(method, toStrings(args)),
  // crypto: (method, ...args) => Apis.instance().crypto_api().exec(method, toStrings(args))

};
exports["default"] = _default;
module.exports = exports.default;