(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.peerplays_ws = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.Manager = exports.ChainConfig = exports.Apis = undefined;

var _ApiInstances = require('./src/ApiInstances');

var _ApiInstances2 = _interopRequireDefault(_ApiInstances);

var _ConnectionManager = require('./src/ConnectionManager');

var _ConnectionManager2 = _interopRequireDefault(_ConnectionManager);

var _ChainConfig = require('./src/ChainConfig');

var _ChainConfig2 = _interopRequireDefault(_ChainConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Apis = _ApiInstances2.default;
exports.ChainConfig = _ChainConfig2.default;
exports.Manager = _ConnectionManager2.default;
},{"./src/ApiInstances":2,"./src/ChainConfig":3,"./src/ConnectionManager":5}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _ChainWebSocket = require('./ChainWebSocket');

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

var _GrapheneApi = require('./GrapheneApi');

var _GrapheneApi2 = _interopRequireDefault(_GrapheneApi);

var _ChainConfig = require('./ChainConfig');

var _ChainConfig2 = _interopRequireDefault(_ChainConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // var { List } = require("immutable");


var inst = void 0;

var ApisInstance = function () {
  function ApisInstance() {
    _classCallCheck(this, ApisInstance);
  }

  /** @arg {string} connection .. */
  ApisInstance.prototype.connect = function connect(cs, connectTimeout) {
    var _this = this;

    // console.log("INFO\tApiInstances\tconnect\t", cs);

    var rpc_user = '';
    var rpc_password = '';

    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && cs.indexOf('wss://') < 0) {
      throw new Error('Secure domains require wss connection');
    }

    this.ws_rpc = new _ChainWebSocket2.default(cs, this.statusCb, connectTimeout);

    this.init_promise = this.ws_rpc.login(rpc_user, rpc_password).then(function () {
      console.log('Connected to API node:', cs);
      _this._db = new _GrapheneApi2.default(_this.ws_rpc, 'database');
      _this._net = new _GrapheneApi2.default(_this.ws_rpc, 'network_broadcast');
      _this._hist = new _GrapheneApi2.default(_this.ws_rpc, 'history');
      _this._crypt = new _GrapheneApi2.default(_this.ws_rpc, 'crypto');
      _this._bookie = new _GrapheneApi2.default(_this.ws_rpc, 'bookie');
      var db_promise = _this._db.init().then(function () {
        return _this._db.exec('get_chain_id', []).then(function (_chain_id) {
          _this.chain_id = _chain_id;
          return _ChainConfig2.default.setChainId(_chain_id);
          // DEBUG console.log("chain_id1",this.chain_id)
        });
      });

      _this.ws_rpc.on_reconnect = function () {
        _this.ws_rpc.login('', '').then(function () {
          _this._db.init().then(function () {
            if (_this.statusCb) {
              _this.statusCb(_ChainWebSocket2.default.status.RECONNECTED);
            }
          });
          _this._net.init();
          _this._hist.init();
          _this._crypt.init();
          _this._bookie.init();
        });
      };

      return Promise.all([db_promise, _this._net.init(), _this._hist.init(),
      // Temporary squash crypto API error until the API is upgraded everywhere
      _this._crypt.init().catch(function (e) {
        return console.error('ApiInstance\tCrypto API Error', e);
      }), _this._bookie.init()]);
    });
  };

  ApisInstance.prototype.close = function close() {
    if (this.ws_rpc) {
      this.ws_rpc.close();
    }

    this.ws_rpc = null;
  };

  ApisInstance.prototype.db_api = function db_api() {
    return this._db;
  };

  ApisInstance.prototype.network_api = function network_api() {
    return this._net;
  };

  ApisInstance.prototype.history_api = function history_api() {
    return this._hist;
  };

  ApisInstance.prototype.crypto_api = function crypto_api() {
    return this._crypt;
  };

  ApisInstance.prototype.bookie_api = function bookie_api() {
    return this._bookie;
  };

  ApisInstance.prototype.setRpcConnectionStatusCallback = function setRpcConnectionStatusCallback(callback) {
    this.statusCb = callback;
  };

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

exports.default = {
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
    var connect = arguments[1];
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
    var connect = arguments[1];
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
  }
  // db: (method, ...args) => Apis.instance().db_api().exec(method, toStrings(args)),
  // network: (method, ...args) => Apis.instance().network_api().exec(method, toStrings(args)),
  // history: (method, ...args) => Apis.instance().history_api().exec(method, toStrings(args)),
  // crypto: (method, ...args) => Apis.instance().crypto_api().exec(method, toStrings(args))

};
},{"./ChainConfig":3,"./ChainWebSocket":4,"./GrapheneApi":6}],3:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
var ecc_config = {
  address_prefix: process.env.npm_config__graphene_ecc_default_address_prefix || 'GPH'
};

var _this = {
  core_asset: 'CORE',
  address_prefix: 'GPH',
  expire_in_secs: 15,
  expire_in_secs_proposal: 24 * 60 * 60,
  review_in_secs_committee: 24 * 60 * 60,
  networks: {
    BitShares: {
      core_asset: 'BTS',
      address_prefix: 'BTS',
      chain_id: '4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8'
    },
    Muse: {
      core_asset: 'MUSE',
      address_prefix: 'MUSE',
      chain_id: '45ad2d3f9ef92a49b55c2227eb06123f613bb35dd08bd876f2aea21925a67a67'
    },
    Test: {
      core_asset: 'TEST',
      address_prefix: 'TEST',
      chain_id: '39f5e2ede1f8bc1a3a54a7914414e3779e33193f1f5693510e73cb7a87617447'
    },
    Obelisk: {
      core_asset: 'GOV',
      address_prefix: 'FEW',
      chain_id: '1cfde7c388b9e8ac06462d68aadbd966b58f88797637d9af805b4560b0e9661e'
    },
    Peerplays: {
      core_asset: 'PPY',
      address_prefix: 'PPY',
      chain_id: '594e284d3c733afaaa34a5e99a39edb31e5192fab023101d691d952034902237'
    }
  },

  /** Set a few properties for known chain IDs. */
  setChainId: function setChainId(chain_id) {
    var ref = Object.keys(_this.networks);

    for (var i = 0, len = ref.length; i < len; i++) {
      var network_name = ref[i];
      var network = _this.networks[network_name];

      if (network.chain_id === chain_id) {
        _this.network_name = network_name;

        if (network.address_prefix) {
          _this.address_prefix = network.address_prefix;
          ecc_config.address_prefix = network.address_prefix;
        }

        // console.log("INFO    Configured for", network_name, ":", network.core_asset, "\n");

        return {
          network_name: network_name,
          network: network
        };
      }
    }

    if (!_this.network_name) {
      console.log('Unknown chain id (this may be a testnet)', chain_id);
    }
  },
  reset: function reset() {
    _this.core_asset = 'CORE';
    _this.address_prefix = 'GPH';
    ecc_config.address_prefix = 'GPH';
    _this.expire_in_secs = 15;
    _this.expire_in_secs_proposal = 24 * 60 * 60;

    console.log('Chain config reset');
  },
  setPrefix: function setPrefix() {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'GPH';

    _this.address_prefix = prefix;
    ecc_config.address_prefix = prefix;
  }
};

exports.default = _this;
}).call(this,require('_process'))

},{"_process":8}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SOCKET_DEBUG = false;
var WebSocketClient = null;

if (typeof WebSocket !== 'undefined') {
  WebSocketClient = WebSocket;
} else {
  WebSocketClient = require('ws'); // eslint-disable-line global-require
}

var SUBSCRIBE_OPERATIONS = ['set_subscribe_callback', 'subscribe_to_market', 'broadcast_transaction_with_callback', 'set_pending_transaction_callback'];

var UNSUBSCRIBE_OPERATIONS = ['unsubscribe_from_market', 'unsubscribe_from_accounts'];

var HEALTH_CHECK_INTERVAL = 10000;

var ChainWebSocket = function () {
  /**
   *Creates an instance of ChainWebSocket.
   * @param {string}    serverAddress           The address of the websocket to connect to.
   * @param {function}  statusCb                Called when status events occur.
   * @param {number}    [connectTimeout=10000]  The time for a connection attempt to complete.
   * @memberof ChainWebSocket
   */
  function ChainWebSocket(serverAddress, statusCb) {
    var connectTimeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10000;

    _classCallCheck(this, ChainWebSocket);

    this.statusCb = statusCb;
    this.serverAddress = serverAddress;
    this.timeoutInterval = connectTimeout;

    // The currenct connection state of the websocket.
    this.connected = false;
    this.reconnectTimeout = null;

    // Callback to execute when the websocket is reconnected.
    this.on_reconnect = null;

    // An incrementing ID for each request so that we can pair it with the
    // response from the websocket.
    this.cbId = 0;

    // Objects to store key/value pairs for callbacks, subscription callbacks
    // and unsubscribe callbacks.
    this.cbs = {};
    this.subs = {};
    this.unsub = {};

    // Current connection promises' rejection
    this.currentResolve = null;
    this.currentReject = null;

    // Health check for the connection to the BlockChain.
    this.healthCheck = null;

    // Copy the constants to this instance.
    this.status = ChainWebSocket.status;

    // Bind the functions to the instance.
    this.onConnectionOpen = this.onConnectionOpen.bind(this);
    this.onConnectionClose = this.onConnectionClose.bind(this);
    this.onConnectionTerminate = this.onConnectionTerminate.bind(this);
    this.onConnectionError = this.onConnectionError.bind(this);
    this.onConnectionTimeout = this.onConnectionTimeout.bind(this);
    this.createConnection = this.createConnection.bind(this);
    this.createConnectionPromise = this.createConnectionPromise.bind(this);
    this.listener = this.listener.bind(this);

    // Create the initial connection the blockchain.
    this.createConnection();
  }

  /**
   * Create the connection to the Blockchain.
   *
   * @returns
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.createConnection = function createConnection() {
    this.debug('!!! ChainWebSocket create connection');

    // Clear any possible reconnect timers.
    this.reconnectTimeout = null;

    // Create the promise for this connection
    if (!this.connect_promise) {
      this.connect_promise = new Promise(this.createConnectionPromise);
    }

    // Attempt to create the websocket
    try {
      this.ws = new WebSocketClient(this.serverAddress);
    } catch (error) {
      // Set a timeout to try and reconnect here.
      return this.resetConnection();
    }

    this.addEventListeners();

    // Handle timeouts to the websocket's initial connection.
    this.connectionTimeout = setTimeout(this.onConnectionTimeout, this.timeoutInterval);
  };

  /**
   * Reset the connection to the BlockChain.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.resetConnection = function resetConnection() {
    // Close the Websocket if its still 'half-open'
    this.close();

    // Make sure we only ever have one timeout running to reconnect.
    if (!this.reconnectTimeout) {
      this.debug('!!! ChainWebSocket reset connection', this.timeoutInterval);
      this.reconnectTimeout = setTimeout(this.createConnection, this.timeoutInterval);
    }

    // Reject the current promise if there is one.
    if (this.currentReject) {
      this.currentReject(new Error('Connection attempt failed: ' + this.serverAddress));
    }
  };

  /**
   * Add event listeners to the WebSocket.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.addEventListeners = function addEventListeners() {
    this.debug('!!! ChainWebSocket add event listeners');
    this.ws.addEventListener('open', this.onConnectionOpen);
    this.ws.addEventListener('close', this.onConnectionClose);
    this.ws.addEventListener('error', this.onConnectionError);
    this.ws.addEventListener('message', this.listener);
  };

  /**
   * Remove the event listers from the WebSocket. Its important to remove the event listerers
   * for garbaage collection. Because we are creating a new WebSocket on each connection attempt
   * any listeners that are still attached could prevent the old sockets from
   * being garbage collected.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.removeEventListeners = function removeEventListeners() {
    this.debug('!!! ChainWebSocket remove event listeners');
    this.ws.removeEventListener('open', this.onConnectionOpen);
    this.ws.removeEventListener('close', this.onConnectionClose);
    this.ws.removeEventListener('error', this.onConnectionError);
    this.ws.removeEventListener('message', this.listener);
  };

  /**
   * A function that is passed to a new promise that stores the resolve and reject callbacks
   * in the state.
   *
   * @param {function} resolve A callback to be executed when the promise is resolved.
   * @param {function} reject A callback to be executed when the promise is rejected.
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.createConnectionPromise = function createConnectionPromise(resolve, reject) {
    this.debug('!!! ChainWebSocket createPromise');
    this.currentResolve = resolve;
    this.currentReject = reject;
  };

  /**
   * Called when a new Websocket connection is opened.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.onConnectionOpen = function onConnectionOpen() {
    this.debug('!!! ChainWebSocket Connected ');

    this.connected = true;

    clearTimeout(this.connectionTimeout);
    this.connectionTimeout = null;

    // This will trigger the login process as well as some additional setup in ApiInstances
    if (this.on_reconnect) {
      this.on_reconnect();
    }

    if (this.currentResolve) {
      this.currentResolve();
    }

    if (this.statusCb) {
      this.statusCb(ChainWebSocket.status.OPEN);
    }
  };

  /**
   * called when the connection attempt times out.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.onConnectionTimeout = function onConnectionTimeout() {
    this.debug('!!! ChainWebSocket timeout');
    this.onConnectionClose(new Error('Connection timed out.'));
  };

  /**
   * Called when the Websocket is not responding to the health checks.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.onConnectionTerminate = function onConnectionTerminate() {
    this.debug('!!! ChainWebSocket terminate');
    this.onConnectionClose(new Error('Connection was terminated.'));
  };

  /**
   * Called when the connection to the Blockchain is closed.
   *
   * @param {*} error
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.onConnectionClose = function onConnectionClose(error) {
    this.debug('!!! ChainWebSocket Close ', error);
    this.resetConnection();

    if (this.statusCb) {
      this.statusCb(ChainWebSocket.status.CLOSED);
    }
  };

  /**
   * Called when the Websocket encounters an error.
   *
   * @param {*} error
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.onConnectionError = function onConnectionError(error) {
    this.debug('!!! ChainWebSocket On Connection Error ', error);
    this.resetConnection();

    if (this.statusCb) {
      this.statusCb(ChainWebSocket.status.ERROR);
    }
  };

  /**
   * Entry point to make RPC calls on the BlockChain.
   *
   * @param {array} params An array of params to be passed to the rpc call. [method, ...params]
   * @returns A new promise for this specific call.
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.call = function call(params) {
    var _this = this;

    if (!this.connected) {
      this.debug('!!! ChainWebSocket Call not connected. ');
      return Promise.reject(new Error('Disconnected from the BlockChain.'));
    }

    this.debug('!!! ChainWebSocket Call connected. ', params);

    var request = {
      method: params[1],
      params: params,
      id: this.cbId + 1
    };

    this.cbId = request.id;

    if (SUBSCRIBE_OPERATIONS.includes(request.method)) {
      // Store callback in subs map
      this.subs[request.id] = {
        callback: request.params[2][0]
      };

      // Replace callback with the callback id
      request.params[2][0] = request.id;
    }

    if (UNSUBSCRIBE_OPERATIONS.includes(request.method)) {
      if (typeof request.params[2][0] !== 'function') {
        throw new Error('First parameter of unsub must be the original callback');
      }

      var unSubCb = request.params[2].splice(0, 1)[0];

      // Find the corresponding subscription
      for (var id in this.subs) {
        // eslint-disable-line
        if (this.subs[id].callback === unSubCb) {
          this.unsub[request.id] = id;
          break;
        }
      }
    }

    if (!this.healthCheck) {
      this.healthCheck = setTimeout(this.onConnectionTerminate.bind(this), HEALTH_CHECK_INTERVAL);
    }

    return new Promise(function (resolve, reject) {
      _this.cbs[request.id] = {
        time: new Date(),
        resolve: resolve,
        reject: reject
      };

      // Set all requests to be 'call' methods.
      request.method = 'call';

      try {
        _this.ws.send(JSON.stringify(request));
      } catch (error) {
        _this.debug('Caught a nasty error : ', error);
      }
    });
  };

  /**
   * Called when messages are received on the Websocket.
   *
   * @param {*} response The message received.
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.listener = function listener(response) {
    var responseJSON = null;

    try {
      responseJSON = JSON.parse(response.data);
    } catch (error) {
      responseJSON.error = 'Error parsing response: ' + error.stack;
      this.debug('Error parsing response: ', response);
    }

    // Clear the health check timeout, we've just received a healthy response from the server.
    if (this.healthCheck) {
      clearTimeout(this.healthCheck);
      this.healthCheck = null;
    }

    var sub = false;
    var callback = null;

    if (responseJSON.method === 'notice') {
      sub = true;
      responseJSON.id = responseJSON.params[0];
    }

    if (!sub) {
      callback = this.cbs[responseJSON.id];
    } else {
      callback = this.subs[responseJSON.id].callback;
    }

    if (callback && !sub) {
      if (responseJSON.error) {
        this.debug('----> responseJSON : ', responseJSON);
        callback.reject(responseJSON.error);
      } else {
        callback.resolve(responseJSON.result);
      }

      delete this.cbs[responseJSON.id];

      if (this.unsub[responseJSON.id]) {
        delete this.subs[this.unsub[responseJSON.id]];
        delete this.unsub[responseJSON.id];
      }
    } else if (callback && sub) {
      callback(responseJSON.params[1]);
    } else {
      this.debug('Warning: unknown websocket responseJSON: ', responseJSON);
    }
  };

  /**
   * Login to the Blockchain.
   *
   * @param {string} user Username
   * @param {string} password Password
   * @returns A promise that is fulfilled after login.
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.login = function login(user, password) {
    var _this2 = this;

    this.debug('!!! ChainWebSocket login.', user, password);
    return this.connect_promise.then(function () {
      return _this2.call([1, 'login', [user, password]]);
    });
  };

  /**
   * Close the connection to the Blockchain.
   *
   * @memberof ChainWebSocket
   */


  ChainWebSocket.prototype.close = function close() {
    if (this.ws) {
      this.removeEventListeners();

      // Try and fire close on the connection.
      this.ws.close();

      // Clear our references so that it can be garbage collected.
      this.ws = null;
    }

    // Clear our timeouts for connection timeout and health check.
    clearTimeout(this.connectionTimeout);
    this.connectionTimeout = null;

    clearTimeout(this.healthCheck);
    this.healthCheck = null;

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = null;

    // Toggle the connected flag.
    this.connected = false;
  };

  ChainWebSocket.prototype.debug = function debug() {
    if (SOCKET_DEBUG) {
      for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      console.log.apply(null, params);
    }
  };

  return ChainWebSocket;
}();

// Constants for STATE


ChainWebSocket.status = {
  RECONNECTED: 'reconnected',
  OPEN: 'open',
  CLOSED: 'closed',
  ERROR: 'error'
};

exports.default = ChainWebSocket;
},{"ws":7}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _ApiInstances = require('./ApiInstances');

var _ApiInstances2 = _interopRequireDefault(_ApiInstances);

var _ChainWebSocket = require('./ChainWebSocket');

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Manager = function () {
  function Manager(_ref) {
    var url = _ref.url,
        urls = _ref.urls;

    _classCallCheck(this, Manager);

    this.url = url;
    this.urls = urls.filter(function (a) {
      return a !== url;
    });
  }

  Manager.prototype.logFailure = function logFailure(url) {
    console.error('Unable to connect to', url + ', skipping to next full node API server');
  };

  Manager.prototype.connect = function connect() {
    var _connect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.url;

    return new Promise(function (resolve, reject) {
      _ApiInstances2.default.instance(url, _connect).init_promise.then(resolve).catch(function (error) {
        _ApiInstances2.default.instance().close();
        reject(error);
      });
    });
  };

  Manager.prototype.connectWithFallback = function connectWithFallback() {
    var connect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.url;
    var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    var _this = this;

    var resolve = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var reject = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    if (reject && index > this.urls.length - 1) {
      return reject(new Error('Tried ' + (index + 1) + ' connections, none of which worked: ' + JSON.stringify(this.urls.concat(this.url))));
    }

    var fallback = function fallback(resolve, reject) {
      _this.logFailure(url);
      return _this.connectWithFallback(connect, _this.urls[index], index + 1, resolve, reject);
    };

    if (resolve && reject) {
      return this.connect(connect, url).then(resolve).catch(function () {
        fallback(resolve, reject);
      });
    }

    return new Promise(function (resolve, reject) {
      _this.connect(connect).then(resolve).catch(function () {
        fallback(resolve, reject);
      });
    });
  };

  Manager.prototype.checkConnections = function checkConnections() {
    var rpc_user = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var rpc_password = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    var _this2 = this;

    var resolve = arguments[2];
    var reject = arguments[3];

    var connectionStartTimes = {};

    var checkFunction = function checkFunction(resolve, reject) {
      var fullList = _this2.urls.concat(_this2.url);
      var connectionPromises = [];

      fullList.forEach(function (url) {
        var conn = new _ChainWebSocket2.default(url, function () {});
        connectionStartTimes[url] = new Date().getTime();
        connectionPromises.push(function () {
          return conn.login(rpc_user, rpc_password).then(function () {
            var _ref2;

            conn.close();
            return _ref2 = {}, _ref2[url] = new Date().getTime() - connectionStartTimes[url], _ref2;
          }).catch(function () {
            if (url === _this2.url) {
              _this2.url = _this2.urls[0];
            } else {
              _this2.urls = _this2.urls.filter(function (a) {
                return a !== url;
              });
            }

            conn.close();
            return null;
          });
        });
      });

      Promise.all(connectionPromises.map(function (a) {
        return a();
      })).then(function (res) {
        resolve(res.filter(function (a) {
          return !!a;
        }).reduce(function (f, a) {
          var key = Object.keys(a)[0];
          f[key] = a[key];
          return f;
        }, {}));
      }).catch(function () {
        return _this2.checkConnections(rpc_user, rpc_password, resolve, reject);
      });
    };

    if (resolve && reject) {
      checkFunction(resolve, reject);
    } else {
      return new Promise(checkFunction);
    }
  };

  return Manager;
}();

exports.default = Manager;
},{"./ApiInstances":2,"./ChainWebSocket":4}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GrapheneApi = function () {
  function GrapheneApi(ws_rpc, api_name) {
    _classCallCheck(this, GrapheneApi);

    this.ws_rpc = ws_rpc;
    this.api_name = api_name;
  }

  GrapheneApi.prototype.init = function init() {
    var _this = this;

    return this.ws_rpc.call([1, this.api_name, []]).then(function (response) {
      _this.api_id = response;
      return _this;
    });
  };

  GrapheneApi.prototype.exec = function exec(method, params) {
    return this.ws_rpc.call([this.api_id, method, params]).catch(function (error) {
      console.log('!!! GrapheneApi error: ', method, params, error, JSON.stringify(error));
      throw error;
    });
  };

  return GrapheneApi;
}();

exports.default = GrapheneApi;
},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvQXBpSW5zdGFuY2VzLmpzIiwiZGlzdC9zcmMvQ2hhaW5Db25maWcuanMiLCJkaXN0L3NyYy9DaGFpbldlYlNvY2tldC5qcyIsImRpc3Qvc3JjL0Nvbm5lY3Rpb25NYW5hZ2VyLmpzIiwiZGlzdC9zcmMvR3JhcGhlbmVBcGkuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5NYW5hZ2VyID0gZXhwb3J0cy5DaGFpbkNvbmZpZyA9IGV4cG9ydHMuQXBpcyA9IHVuZGVmaW5lZDtcblxudmFyIF9BcGlJbnN0YW5jZXMgPSByZXF1aXJlKCcuL3NyYy9BcGlJbnN0YW5jZXMnKTtcblxudmFyIF9BcGlJbnN0YW5jZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQXBpSW5zdGFuY2VzKTtcblxudmFyIF9Db25uZWN0aW9uTWFuYWdlciA9IHJlcXVpcmUoJy4vc3JjL0Nvbm5lY3Rpb25NYW5hZ2VyJyk7XG5cbnZhciBfQ29ubmVjdGlvbk1hbmFnZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ29ubmVjdGlvbk1hbmFnZXIpO1xuXG52YXIgX0NoYWluQ29uZmlnID0gcmVxdWlyZSgnLi9zcmMvQ2hhaW5Db25maWcnKTtcblxudmFyIF9DaGFpbkNvbmZpZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DaGFpbkNvbmZpZyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuQXBpcyA9IF9BcGlJbnN0YW5jZXMyLmRlZmF1bHQ7XG5leHBvcnRzLkNoYWluQ29uZmlnID0gX0NoYWluQ29uZmlnMi5kZWZhdWx0O1xuZXhwb3J0cy5NYW5hZ2VyID0gX0Nvbm5lY3Rpb25NYW5hZ2VyMi5kZWZhdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9DaGFpbldlYlNvY2tldCA9IHJlcXVpcmUoJy4vQ2hhaW5XZWJTb2NrZXQnKTtcblxudmFyIF9DaGFpbldlYlNvY2tldDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DaGFpbldlYlNvY2tldCk7XG5cbnZhciBfR3JhcGhlbmVBcGkgPSByZXF1aXJlKCcuL0dyYXBoZW5lQXBpJyk7XG5cbnZhciBfR3JhcGhlbmVBcGkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfR3JhcGhlbmVBcGkpO1xuXG52YXIgX0NoYWluQ29uZmlnID0gcmVxdWlyZSgnLi9DaGFpbkNvbmZpZycpO1xuXG52YXIgX0NoYWluQ29uZmlnMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0NoYWluQ29uZmlnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH0gLy8gdmFyIHsgTGlzdCB9ID0gcmVxdWlyZShcImltbXV0YWJsZVwiKTtcblxuXG52YXIgaW5zdCA9IHZvaWQgMDtcblxudmFyIEFwaXNJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQXBpc0luc3RhbmNlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlzSW5zdGFuY2UpO1xuICB9XG5cbiAgLyoqIEBhcmcge3N0cmluZ30gY29ubmVjdGlvbiAuLiAqL1xuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBjb25zb2xlLmxvZyhcIklORk9cXHRBcGlJbnN0YW5jZXNcXHRjb25uZWN0XFx0XCIsIGNzKTtcblxuICAgIHZhciBycGNfdXNlciA9ICcnO1xuICAgIHZhciBycGNfcGFzc3dvcmQgPSAnJztcblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyAmJiBjcy5pbmRleE9mKCd3c3M6Ly8nKSA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2VjdXJlIGRvbWFpbnMgcmVxdWlyZSB3c3MgY29ubmVjdGlvbicpO1xuICAgIH1cblxuICAgIHRoaXMud3NfcnBjID0gbmV3IF9DaGFpbldlYlNvY2tldDIuZGVmYXVsdChjcywgdGhpcy5zdGF0dXNDYiwgY29ubmVjdFRpbWVvdXQpO1xuXG4gICAgdGhpcy5pbml0X3Byb21pc2UgPSB0aGlzLndzX3JwYy5sb2dpbihycGNfdXNlciwgcnBjX3Bhc3N3b3JkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdDb25uZWN0ZWQgdG8gQVBJIG5vZGU6JywgY3MpO1xuICAgICAgX3RoaXMuX2RiID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsICdkYXRhYmFzZScpO1xuICAgICAgX3RoaXMuX25ldCA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCAnbmV0d29ya19icm9hZGNhc3QnKTtcbiAgICAgIF90aGlzLl9oaXN0ID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsICdoaXN0b3J5Jyk7XG4gICAgICBfdGhpcy5fY3J5cHQgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgJ2NyeXB0bycpO1xuICAgICAgX3RoaXMuX2Jvb2tpZSA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCAnYm9va2llJyk7XG4gICAgICB2YXIgZGJfcHJvbWlzZSA9IF90aGlzLl9kYi5pbml0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5fZGIuZXhlYygnZ2V0X2NoYWluX2lkJywgW10pLnRoZW4oZnVuY3Rpb24gKF9jaGFpbl9pZCkge1xuICAgICAgICAgIF90aGlzLmNoYWluX2lkID0gX2NoYWluX2lkO1xuICAgICAgICAgIHJldHVybiBfQ2hhaW5Db25maWcyLmRlZmF1bHQuc2V0Q2hhaW5JZChfY2hhaW5faWQpO1xuICAgICAgICAgIC8vIERFQlVHIGNvbnNvbGUubG9nKFwiY2hhaW5faWQxXCIsdGhpcy5jaGFpbl9pZClcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgX3RoaXMud3NfcnBjLm9uX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMud3NfcnBjLmxvZ2luKCcnLCAnJykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgX3RoaXMuX2RiLmluaXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5zdGF0dXNDYikge1xuICAgICAgICAgICAgICBfdGhpcy5zdGF0dXNDYihfQ2hhaW5XZWJTb2NrZXQyLmRlZmF1bHQuc3RhdHVzLlJFQ09OTkVDVEVEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBfdGhpcy5fbmV0LmluaXQoKTtcbiAgICAgICAgICBfdGhpcy5faGlzdC5pbml0KCk7XG4gICAgICAgICAgX3RoaXMuX2NyeXB0LmluaXQoKTtcbiAgICAgICAgICBfdGhpcy5fYm9va2llLmluaXQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW2RiX3Byb21pc2UsIF90aGlzLl9uZXQuaW5pdCgpLCBfdGhpcy5faGlzdC5pbml0KCksXG4gICAgICAvLyBUZW1wb3Jhcnkgc3F1YXNoIGNyeXB0byBBUEkgZXJyb3IgdW50aWwgdGhlIEFQSSBpcyB1cGdyYWRlZCBldmVyeXdoZXJlXG4gICAgICBfdGhpcy5fY3J5cHQuaW5pdCgpLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdBcGlJbnN0YW5jZVxcdENyeXB0byBBUEkgRXJyb3InLCBlKTtcbiAgICAgIH0pLCBfdGhpcy5fYm9va2llLmluaXQoKV0pO1xuICAgIH0pO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy53c19ycGMpIHtcbiAgICAgIHRoaXMud3NfcnBjLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy53c19ycGMgPSBudWxsO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuZGJfYXBpID0gZnVuY3Rpb24gZGJfYXBpKCkge1xuICAgIHJldHVybiB0aGlzLl9kYjtcbiAgfTtcblxuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLm5ldHdvcmtfYXBpID0gZnVuY3Rpb24gbmV0d29ya19hcGkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25ldDtcbiAgfTtcblxuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmhpc3RvcnlfYXBpID0gZnVuY3Rpb24gaGlzdG9yeV9hcGkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hpc3Q7XG4gIH07XG5cbiAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5jcnlwdG9fYXBpID0gZnVuY3Rpb24gY3J5cHRvX2FwaSgpIHtcbiAgICByZXR1cm4gdGhpcy5fY3J5cHQ7XG4gIH07XG5cbiAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5ib29raWVfYXBpID0gZnVuY3Rpb24gYm9va2llX2FwaSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYm9va2llO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrID0gZnVuY3Rpb24gc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5zdGF0dXNDYiA9IGNhbGxiYWNrO1xuICB9O1xuXG4gIHJldHVybiBBcGlzSW5zdGFuY2U7XG59KCk7XG5cbi8qKlxuICAgIENvbmZpZ3VyZTogY29uZmlndXJlIGFzIGZvbGxvd3MgYEFwaXMuaW5zdGFuY2UoXCJ3czovL2xvY2FsaG9zdDo4MDkwXCIpLmluaXRfcHJvbWlzZWAuICBUaGlzXG4gICAgcmV0dXJucyBhIHByb21pc2UsIG9uY2UgcmVzb2x2ZWQgdGhlIGNvbm5lY3Rpb24gaXMgcmVhZHkuXG5cbiAgICBJbXBvcnQ6IGltcG9ydCB7IEFwaXMgfSBmcm9tIFwiQGdyYXBoZW5lL2NoYWluXCJcblxuICAgIFNob3J0LWhhbmQ6IEFwaXMuZGIoXCJtZXRob2RcIiwgXCJwYXJtMVwiLCAyLCAzLCAuLi4pLiAgUmV0dXJucyBhIHByb21pc2Ugd2l0aCByZXN1bHRzLlxuXG4gICAgQWRkaXRpb25hbCB1c2FnZTogQXBpcy5pbnN0YW5jZSgpLmRiX2FwaSgpLmV4ZWMoXCJtZXRob2RcIiwgW1wibWV0aG9kXCIsIFwicGFybTFcIiwgMiwgMywgLi4uXSkuXG4gICAgUmV0dXJucyBhIHByb21pc2Ugd2l0aCByZXN1bHRzLlxuKi9cblxuZXhwb3J0cy5kZWZhdWx0ID0ge1xuICBzZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2s6IGZ1bmN0aW9uIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIHRoaXMuc3RhdHVzQ2IgPSBjYWxsYmFjaztcblxuICAgIGlmIChpbnN0KSB7XG4gICAgICBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgICAgICBAYXJnIHtzdHJpbmd9IGNzIGlzIG9ubHkgcHJvdmlkZWQgaW4gdGhlIGZpcnN0IGNhbGxcbiAgICAgICAgQHJldHVybiB7QXBpc30gc2luZ2xldG9uIC4uIENoZWNrIEFwaXMuaW5zdGFuY2UoKS5pbml0X3Byb21pc2UgdG9cbiAgICAgICAga25vdyB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkXG4gICAgKi9cbiAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIHZhciBjcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJ3dzOi8vbG9jYWxob3N0OjgwOTAnO1xuICAgIHZhciBjb25uZWN0ID0gYXJndW1lbnRzWzFdO1xuICAgIHZhciBjb25uZWN0VGltZW91dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogNDAwMDtcblxuICAgIGlmIChpbnN0KSB7XG4gICAgICBpbnN0LmNsb3NlKCk7XG4gICAgICBpbnN0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpbnN0ID0gbmV3IEFwaXNJbnN0YW5jZSgpO1xuICAgIGluc3Quc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKHRoaXMuc3RhdHVzQ2IpO1xuXG4gICAgaWYgKGluc3QgJiYgY29ubmVjdCkge1xuICAgICAgaW5zdC5jb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluc3Q7XG4gIH0sXG4gIGluc3RhbmNlOiBmdW5jdGlvbiBpbnN0YW5jZSgpIHtcbiAgICB2YXIgY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICd3czovL2xvY2FsaG9zdDo4MDkwJztcbiAgICB2YXIgY29ubmVjdCA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDQwMDA7XG5cbiAgICBpZiAoIWluc3QpIHtcbiAgICAgIGluc3QgPSBuZXcgQXBpc0luc3RhbmNlKCk7XG4gICAgICBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayh0aGlzLnN0YXR1c0NiKTtcbiAgICB9XG5cbiAgICBpZiAoaW5zdCAmJiBjb25uZWN0KSB7XG4gICAgICBpbnN0LmNvbm5lY3QoY3MsIGNvbm5lY3RUaW1lb3V0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zdDtcbiAgfSxcbiAgY2hhaW5JZDogZnVuY3Rpb24gY2hhaW5JZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZSgpLmNoYWluX2lkO1xuICB9LFxuICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgaWYgKGluc3QpIHtcbiAgICAgIGluc3QuY2xvc2UoKTtcbiAgICAgIGluc3QgPSBudWxsO1xuICAgIH1cbiAgfVxuICAvLyBkYjogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmRiX2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpLFxuICAvLyBuZXR3b3JrOiAobWV0aG9kLCAuLi5hcmdzKSA9PiBBcGlzLmluc3RhbmNlKCkubmV0d29ya19hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKSxcbiAgLy8gaGlzdG9yeTogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmhpc3RvcnlfYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSksXG4gIC8vIGNyeXB0bzogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmNyeXB0b19hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKVxuXG59OyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbnZhciBlY2NfY29uZmlnID0ge1xuICBhZGRyZXNzX3ByZWZpeDogcHJvY2Vzcy5lbnYubnBtX2NvbmZpZ19fZ3JhcGhlbmVfZWNjX2RlZmF1bHRfYWRkcmVzc19wcmVmaXggfHwgJ0dQSCdcbn07XG5cbnZhciBfdGhpcyA9IHtcbiAgY29yZV9hc3NldDogJ0NPUkUnLFxuICBhZGRyZXNzX3ByZWZpeDogJ0dQSCcsXG4gIGV4cGlyZV9pbl9zZWNzOiAxNSxcbiAgZXhwaXJlX2luX3NlY3NfcHJvcG9zYWw6IDI0ICogNjAgKiA2MCxcbiAgcmV2aWV3X2luX3NlY3NfY29tbWl0dGVlOiAyNCAqIDYwICogNjAsXG4gIG5ldHdvcmtzOiB7XG4gICAgQml0U2hhcmVzOiB7XG4gICAgICBjb3JlX2Fzc2V0OiAnQlRTJyxcbiAgICAgIGFkZHJlc3NfcHJlZml4OiAnQlRTJyxcbiAgICAgIGNoYWluX2lkOiAnNDAxOGQ3ODQ0Yzc4ZjZhNmM0MWM2YTU1MmI4OTgwMjIzMTBmYzVkZWMwNmRhNDY3ZWU3OTA1YThkYWQ1MTJjOCdcbiAgICB9LFxuICAgIE11c2U6IHtcbiAgICAgIGNvcmVfYXNzZXQ6ICdNVVNFJyxcbiAgICAgIGFkZHJlc3NfcHJlZml4OiAnTVVTRScsXG4gICAgICBjaGFpbl9pZDogJzQ1YWQyZDNmOWVmOTJhNDliNTVjMjIyN2ViMDYxMjNmNjEzYmIzNWRkMDhiZDg3NmYyYWVhMjE5MjVhNjdhNjcnXG4gICAgfSxcbiAgICBUZXN0OiB7XG4gICAgICBjb3JlX2Fzc2V0OiAnVEVTVCcsXG4gICAgICBhZGRyZXNzX3ByZWZpeDogJ1RFU1QnLFxuICAgICAgY2hhaW5faWQ6ICczOWY1ZTJlZGUxZjhiYzFhM2E1NGE3OTE0NDE0ZTM3NzllMzMxOTNmMWY1NjkzNTEwZTczY2I3YTg3NjE3NDQ3J1xuICAgIH0sXG4gICAgT2JlbGlzazoge1xuICAgICAgY29yZV9hc3NldDogJ0dPVicsXG4gICAgICBhZGRyZXNzX3ByZWZpeDogJ0ZFVycsXG4gICAgICBjaGFpbl9pZDogJzFjZmRlN2MzODhiOWU4YWMwNjQ2MmQ2OGFhZGJkOTY2YjU4Zjg4Nzk3NjM3ZDlhZjgwNWI0NTYwYjBlOTY2MWUnXG4gICAgfSxcbiAgICBQZWVycGxheXM6IHtcbiAgICAgIGNvcmVfYXNzZXQ6ICdQUFknLFxuICAgICAgYWRkcmVzc19wcmVmaXg6ICdQUFknLFxuICAgICAgY2hhaW5faWQ6ICc1OTRlMjg0ZDNjNzMzYWZhYWEzNGE1ZTk5YTM5ZWRiMzFlNTE5MmZhYjAyMzEwMWQ2OTFkOTUyMDM0OTAyMjM3J1xuICAgIH1cbiAgfSxcblxuICAvKiogU2V0IGEgZmV3IHByb3BlcnRpZXMgZm9yIGtub3duIGNoYWluIElEcy4gKi9cbiAgc2V0Q2hhaW5JZDogZnVuY3Rpb24gc2V0Q2hhaW5JZChjaGFpbl9pZCkge1xuICAgIHZhciByZWYgPSBPYmplY3Qua2V5cyhfdGhpcy5uZXR3b3Jrcyk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgbmV0d29ya19uYW1lID0gcmVmW2ldO1xuICAgICAgdmFyIG5ldHdvcmsgPSBfdGhpcy5uZXR3b3Jrc1tuZXR3b3JrX25hbWVdO1xuXG4gICAgICBpZiAobmV0d29yay5jaGFpbl9pZCA9PT0gY2hhaW5faWQpIHtcbiAgICAgICAgX3RoaXMubmV0d29ya19uYW1lID0gbmV0d29ya19uYW1lO1xuXG4gICAgICAgIGlmIChuZXR3b3JrLmFkZHJlc3NfcHJlZml4KSB7XG4gICAgICAgICAgX3RoaXMuYWRkcmVzc19wcmVmaXggPSBuZXR3b3JrLmFkZHJlc3NfcHJlZml4O1xuICAgICAgICAgIGVjY19jb25maWcuYWRkcmVzc19wcmVmaXggPSBuZXR3b3JrLmFkZHJlc3NfcHJlZml4O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJJTkZPICAgIENvbmZpZ3VyZWQgZm9yXCIsIG5ldHdvcmtfbmFtZSwgXCI6XCIsIG5ldHdvcmsuY29yZV9hc3NldCwgXCJcXG5cIik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuZXR3b3JrX25hbWU6IG5ldHdvcmtfbmFtZSxcbiAgICAgICAgICBuZXR3b3JrOiBuZXR3b3JrXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFfdGhpcy5uZXR3b3JrX25hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdVbmtub3duIGNoYWluIGlkICh0aGlzIG1heSBiZSBhIHRlc3RuZXQpJywgY2hhaW5faWQpO1xuICAgIH1cbiAgfSxcbiAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIF90aGlzLmNvcmVfYXNzZXQgPSAnQ09SRSc7XG4gICAgX3RoaXMuYWRkcmVzc19wcmVmaXggPSAnR1BIJztcbiAgICBlY2NfY29uZmlnLmFkZHJlc3NfcHJlZml4ID0gJ0dQSCc7XG4gICAgX3RoaXMuZXhwaXJlX2luX3NlY3MgPSAxNTtcbiAgICBfdGhpcy5leHBpcmVfaW5fc2Vjc19wcm9wb3NhbCA9IDI0ICogNjAgKiA2MDtcblxuICAgIGNvbnNvbGUubG9nKCdDaGFpbiBjb25maWcgcmVzZXQnKTtcbiAgfSxcbiAgc2V0UHJlZml4OiBmdW5jdGlvbiBzZXRQcmVmaXgoKSB7XG4gICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJ0dQSCc7XG5cbiAgICBfdGhpcy5hZGRyZXNzX3ByZWZpeCA9IHByZWZpeDtcbiAgICBlY2NfY29uZmlnLmFkZHJlc3NfcHJlZml4ID0gcHJlZml4O1xuICB9XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBfdGhpczsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBTT0NLRVRfREVCVUcgPSBmYWxzZTtcbnZhciBXZWJTb2NrZXRDbGllbnQgPSBudWxsO1xuXG5pZiAodHlwZW9mIFdlYlNvY2tldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgV2ViU29ja2V0Q2xpZW50ID0gV2ViU29ja2V0O1xufSBlbHNlIHtcbiAgV2ViU29ja2V0Q2xpZW50ID0gcmVxdWlyZSgnd3MnKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBnbG9iYWwtcmVxdWlyZVxufVxuXG52YXIgU1VCU0NSSUJFX09QRVJBVElPTlMgPSBbJ3NldF9zdWJzY3JpYmVfY2FsbGJhY2snLCAnc3Vic2NyaWJlX3RvX21hcmtldCcsICdicm9hZGNhc3RfdHJhbnNhY3Rpb25fd2l0aF9jYWxsYmFjaycsICdzZXRfcGVuZGluZ190cmFuc2FjdGlvbl9jYWxsYmFjayddO1xuXG52YXIgVU5TVUJTQ1JJQkVfT1BFUkFUSU9OUyA9IFsndW5zdWJzY3JpYmVfZnJvbV9tYXJrZXQnLCAndW5zdWJzY3JpYmVfZnJvbV9hY2NvdW50cyddO1xuXG52YXIgSEVBTFRIX0NIRUNLX0lOVEVSVkFMID0gMTAwMDA7XG5cbnZhciBDaGFpbldlYlNvY2tldCA9IGZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBDaGFpbldlYlNvY2tldC5cbiAgICogQHBhcmFtIHtzdHJpbmd9ICAgIHNlcnZlckFkZHJlc3MgICAgICAgICAgIFRoZSBhZGRyZXNzIG9mIHRoZSB3ZWJzb2NrZXQgdG8gY29ubmVjdCB0by5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gIHN0YXR1c0NiICAgICAgICAgICAgICAgIENhbGxlZCB3aGVuIHN0YXR1cyBldmVudHMgb2NjdXIuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSAgICBbY29ubmVjdFRpbWVvdXQ9MTAwMDBdICBUaGUgdGltZSBmb3IgYSBjb25uZWN0aW9uIGF0dGVtcHQgdG8gY29tcGxldGUuXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cbiAgZnVuY3Rpb24gQ2hhaW5XZWJTb2NrZXQoc2VydmVyQWRkcmVzcywgc3RhdHVzQ2IpIHtcbiAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDEwMDAwO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIENoYWluV2ViU29ja2V0KTtcblxuICAgIHRoaXMuc3RhdHVzQ2IgPSBzdGF0dXNDYjtcbiAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBzZXJ2ZXJBZGRyZXNzO1xuICAgIHRoaXMudGltZW91dEludGVydmFsID0gY29ubmVjdFRpbWVvdXQ7XG5cbiAgICAvLyBUaGUgY3VycmVuY3QgY29ubmVjdGlvbiBzdGF0ZSBvZiB0aGUgd2Vic29ja2V0LlxuICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIENhbGxiYWNrIHRvIGV4ZWN1dGUgd2hlbiB0aGUgd2Vic29ja2V0IGlzIHJlY29ubmVjdGVkLlxuICAgIHRoaXMub25fcmVjb25uZWN0ID0gbnVsbDtcblxuICAgIC8vIEFuIGluY3JlbWVudGluZyBJRCBmb3IgZWFjaCByZXF1ZXN0IHNvIHRoYXQgd2UgY2FuIHBhaXIgaXQgd2l0aCB0aGVcbiAgICAvLyByZXNwb25zZSBmcm9tIHRoZSB3ZWJzb2NrZXQuXG4gICAgdGhpcy5jYklkID0gMDtcblxuICAgIC8vIE9iamVjdHMgdG8gc3RvcmUga2V5L3ZhbHVlIHBhaXJzIGZvciBjYWxsYmFja3MsIHN1YnNjcmlwdGlvbiBjYWxsYmFja3NcbiAgICAvLyBhbmQgdW5zdWJzY3JpYmUgY2FsbGJhY2tzLlxuICAgIHRoaXMuY2JzID0ge307XG4gICAgdGhpcy5zdWJzID0ge307XG4gICAgdGhpcy51bnN1YiA9IHt9O1xuXG4gICAgLy8gQ3VycmVudCBjb25uZWN0aW9uIHByb21pc2VzJyByZWplY3Rpb25cbiAgICB0aGlzLmN1cnJlbnRSZXNvbHZlID0gbnVsbDtcbiAgICB0aGlzLmN1cnJlbnRSZWplY3QgPSBudWxsO1xuXG4gICAgLy8gSGVhbHRoIGNoZWNrIGZvciB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tDaGFpbi5cbiAgICB0aGlzLmhlYWx0aENoZWNrID0gbnVsbDtcblxuICAgIC8vIENvcHkgdGhlIGNvbnN0YW50cyB0byB0aGlzIGluc3RhbmNlLlxuICAgIHRoaXMuc3RhdHVzID0gQ2hhaW5XZWJTb2NrZXQuc3RhdHVzO1xuXG4gICAgLy8gQmluZCB0aGUgZnVuY3Rpb25zIHRvIHRoZSBpbnN0YW5jZS5cbiAgICB0aGlzLm9uQ29ubmVjdGlvbk9wZW4gPSB0aGlzLm9uQ29ubmVjdGlvbk9wZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlID0gdGhpcy5vbkNvbm5lY3Rpb25DbG9zZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25Db25uZWN0aW9uVGVybWluYXRlID0gdGhpcy5vbkNvbm5lY3Rpb25UZXJtaW5hdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkVycm9yID0gdGhpcy5vbkNvbm5lY3Rpb25FcnJvci5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25Db25uZWN0aW9uVGltZW91dCA9IHRoaXMub25Db25uZWN0aW9uVGltZW91dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbiA9IHRoaXMuY3JlYXRlQ29ubmVjdGlvbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UgPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5saXN0ZW5lciA9IHRoaXMubGlzdGVuZXIuYmluZCh0aGlzKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgaW5pdGlhbCBjb25uZWN0aW9uIHRoZSBibG9ja2NoYWluLlxuICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnNcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uKCkge1xuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBjcmVhdGUgY29ubmVjdGlvbicpO1xuXG4gICAgLy8gQ2xlYXIgYW55IHBvc3NpYmxlIHJlY29ubmVjdCB0aW1lcnMuXG4gICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIENyZWF0ZSB0aGUgcHJvbWlzZSBmb3IgdGhpcyBjb25uZWN0aW9uXG4gICAgaWYgKCF0aGlzLmNvbm5lY3RfcHJvbWlzZSkge1xuICAgICAgdGhpcy5jb25uZWN0X3Byb21pc2UgPSBuZXcgUHJvbWlzZSh0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKTtcbiAgICB9XG5cbiAgICAvLyBBdHRlbXB0IHRvIGNyZWF0ZSB0aGUgd2Vic29ja2V0XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0Q2xpZW50KHRoaXMuc2VydmVyQWRkcmVzcyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIFNldCBhIHRpbWVvdXQgdG8gdHJ5IGFuZCByZWNvbm5lY3QgaGVyZS5cbiAgICAgIHJldHVybiB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuICAgIH1cblxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgIC8vIEhhbmRsZSB0aW1lb3V0cyB0byB0aGUgd2Vic29ja2V0J3MgaW5pdGlhbCBjb25uZWN0aW9uLlxuICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMub25Db25uZWN0aW9uVGltZW91dCwgdGhpcy50aW1lb3V0SW50ZXJ2YWwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tDaGFpbi5cbiAgICpcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLnJlc2V0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uIHJlc2V0Q29ubmVjdGlvbigpIHtcbiAgICAvLyBDbG9zZSB0aGUgV2Vic29ja2V0IGlmIGl0cyBzdGlsbCAnaGFsZi1vcGVuJ1xuICAgIHRoaXMuY2xvc2UoKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSBvbmx5IGV2ZXIgaGF2ZSBvbmUgdGltZW91dCBydW5uaW5nIHRvIHJlY29ubmVjdC5cbiAgICBpZiAoIXRoaXMucmVjb25uZWN0VGltZW91dCkge1xuICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHJlc2V0IGNvbm5lY3Rpb24nLCB0aGlzLnRpbWVvdXRJbnRlcnZhbCk7XG4gICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuY3JlYXRlQ29ubmVjdGlvbiwgdGhpcy50aW1lb3V0SW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIC8vIFJlamVjdCB0aGUgY3VycmVudCBwcm9taXNlIGlmIHRoZXJlIGlzIG9uZS5cbiAgICBpZiAodGhpcy5jdXJyZW50UmVqZWN0KSB7XG4gICAgICB0aGlzLmN1cnJlbnRSZWplY3QobmV3IEVycm9yKCdDb25uZWN0aW9uIGF0dGVtcHQgZmFpbGVkOiAnICsgdGhpcy5zZXJ2ZXJBZGRyZXNzKSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBXZWJTb2NrZXQuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBhZGQgZXZlbnQgbGlzdGVuZXJzJyk7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgdGhpcy5vbkNvbm5lY3Rpb25PcGVuKTtcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSk7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMub25Db25uZWN0aW9uRXJyb3IpO1xuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubGlzdGVuZXIpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGV2ZW50IGxpc3RlcnMgZnJvbSB0aGUgV2ViU29ja2V0LiBJdHMgaW1wb3J0YW50IHRvIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVyZXJzXG4gICAqIGZvciBnYXJiYWFnZSBjb2xsZWN0aW9uLiBCZWNhdXNlIHdlIGFyZSBjcmVhdGluZyBhIG5ldyBXZWJTb2NrZXQgb24gZWFjaCBjb25uZWN0aW9uIGF0dGVtcHRcbiAgICogYW55IGxpc3RlbmVycyB0aGF0IGFyZSBzdGlsbCBhdHRhY2hlZCBjb3VsZCBwcmV2ZW50IHRoZSBvbGQgc29ja2V0cyBmcm9tXG4gICAqIGJlaW5nIGdhcmJhZ2UgY29sbGVjdGVkLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycygpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgcmVtb3ZlIGV2ZW50IGxpc3RlbmVycycpO1xuICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3BlbicsIHRoaXMub25Db25uZWN0aW9uT3Blbik7XG4gICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbG9zZScsIHRoaXMub25Db25uZWN0aW9uQ2xvc2UpO1xuICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLm9uQ29ubmVjdGlvbkVycm9yKTtcbiAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmxpc3RlbmVyKTtcbiAgfTtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB0aGF0IGlzIHBhc3NlZCB0byBhIG5ldyBwcm9taXNlIHRoYXQgc3RvcmVzIHRoZSByZXNvbHZlIGFuZCByZWplY3QgY2FsbGJhY2tzXG4gICAqIGluIHRoZSBzdGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBBIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlamVjdCBBIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQuXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9uUHJvbWlzZSA9IGZ1bmN0aW9uIGNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBjcmVhdGVQcm9taXNlJyk7XG4gICAgdGhpcy5jdXJyZW50UmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgdGhpcy5jdXJyZW50UmVqZWN0ID0gcmVqZWN0O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBhIG5ldyBXZWJzb2NrZXQgY29ubmVjdGlvbiBpcyBvcGVuZWQuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25PcGVuID0gZnVuY3Rpb24gb25Db25uZWN0aW9uT3BlbigpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ29ubmVjdGVkICcpO1xuXG4gICAgdGhpcy5jb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuXG4gICAgLy8gVGhpcyB3aWxsIHRyaWdnZXIgdGhlIGxvZ2luIHByb2Nlc3MgYXMgd2VsbCBhcyBzb21lIGFkZGl0aW9uYWwgc2V0dXAgaW4gQXBpSW5zdGFuY2VzXG4gICAgaWYgKHRoaXMub25fcmVjb25uZWN0KSB7XG4gICAgICB0aGlzLm9uX3JlY29ubmVjdCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmN1cnJlbnRSZXNvbHZlKSB7XG4gICAgICB0aGlzLmN1cnJlbnRSZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLk9QRU4pO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogY2FsbGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gYXR0ZW1wdCB0aW1lcyBvdXQuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25UaW1lb3V0ID0gZnVuY3Rpb24gb25Db25uZWN0aW9uVGltZW91dCgpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgdGltZW91dCcpO1xuICAgIHRoaXMub25Db25uZWN0aW9uQ2xvc2UobmV3IEVycm9yKCdDb25uZWN0aW9uIHRpbWVkIG91dC4nKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHRoZSBXZWJzb2NrZXQgaXMgbm90IHJlc3BvbmRpbmcgdG8gdGhlIGhlYWx0aCBjaGVja3MuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25UZXJtaW5hdGUgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25UZXJtaW5hdGUoKSB7XG4gICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHRlcm1pbmF0ZScpO1xuICAgIHRoaXMub25Db25uZWN0aW9uQ2xvc2UobmV3IEVycm9yKCdDb25uZWN0aW9uIHdhcyB0ZXJtaW5hdGVkLicpKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrY2hhaW4gaXMgY2xvc2VkLlxuICAgKlxuICAgKiBAcGFyYW0geyp9IGVycm9yXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25DbG9zZSA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvbkNsb3NlKGVycm9yKSB7XG4gICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENsb3NlICcsIGVycm9yKTtcbiAgICB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLkNMT1NFRCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgV2Vic29ja2V0IGVuY291bnRlcnMgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gZXJyb3JcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvbkVycm9yID0gZnVuY3Rpb24gb25Db25uZWN0aW9uRXJyb3IoZXJyb3IpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgT24gQ29ubmVjdGlvbiBFcnJvciAnLCBlcnJvcik7XG4gICAgdGhpcy5yZXNldENvbm5lY3Rpb24oKTtcblxuICAgIGlmICh0aGlzLnN0YXR1c0NiKSB7XG4gICAgICB0aGlzLnN0YXR1c0NiKENoYWluV2ViU29ja2V0LnN0YXR1cy5FUlJPUik7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBFbnRyeSBwb2ludCB0byBtYWtlIFJQQyBjYWxscyBvbiB0aGUgQmxvY2tDaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHthcnJheX0gcGFyYW1zIEFuIGFycmF5IG9mIHBhcmFtcyB0byBiZSBwYXNzZWQgdG8gdGhlIHJwYyBjYWxsLiBbbWV0aG9kLCAuLi5wYXJhbXNdXG4gICAqIEByZXR1cm5zIEEgbmV3IHByb21pc2UgZm9yIHRoaXMgc3BlY2lmaWMgY2FsbC5cbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiBjYWxsKHBhcmFtcykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ2FsbCBub3QgY29ubmVjdGVkLiAnKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Rpc2Nvbm5lY3RlZCBmcm9tIHRoZSBCbG9ja0NoYWluLicpKTtcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ2FsbCBjb25uZWN0ZWQuICcsIHBhcmFtcyk7XG5cbiAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgIG1ldGhvZDogcGFyYW1zWzFdLFxuICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICBpZDogdGhpcy5jYklkICsgMVxuICAgIH07XG5cbiAgICB0aGlzLmNiSWQgPSByZXF1ZXN0LmlkO1xuXG4gICAgaWYgKFNVQlNDUklCRV9PUEVSQVRJT05TLmluY2x1ZGVzKHJlcXVlc3QubWV0aG9kKSkge1xuICAgICAgLy8gU3RvcmUgY2FsbGJhY2sgaW4gc3VicyBtYXBcbiAgICAgIHRoaXMuc3Vic1tyZXF1ZXN0LmlkXSA9IHtcbiAgICAgICAgY2FsbGJhY2s6IHJlcXVlc3QucGFyYW1zWzJdWzBdXG4gICAgICB9O1xuXG4gICAgICAvLyBSZXBsYWNlIGNhbGxiYWNrIHdpdGggdGhlIGNhbGxiYWNrIGlkXG4gICAgICByZXF1ZXN0LnBhcmFtc1syXVswXSA9IHJlcXVlc3QuaWQ7XG4gICAgfVxuXG4gICAgaWYgKFVOU1VCU0NSSUJFX09QRVJBVElPTlMuaW5jbHVkZXMocmVxdWVzdC5tZXRob2QpKSB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3QucGFyYW1zWzJdWzBdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgcGFyYW1ldGVyIG9mIHVuc3ViIG11c3QgYmUgdGhlIG9yaWdpbmFsIGNhbGxiYWNrJyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB1blN1YkNiID0gcmVxdWVzdC5wYXJhbXNbMl0uc3BsaWNlKDAsIDEpWzBdO1xuXG4gICAgICAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIHN1YnNjcmlwdGlvblxuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5zdWJzKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgaWYgKHRoaXMuc3Vic1tpZF0uY2FsbGJhY2sgPT09IHVuU3ViQ2IpIHtcbiAgICAgICAgICB0aGlzLnVuc3ViW3JlcXVlc3QuaWRdID0gaWQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVhbHRoQ2hlY2spIHtcbiAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBzZXRUaW1lb3V0KHRoaXMub25Db25uZWN0aW9uVGVybWluYXRlLmJpbmQodGhpcyksIEhFQUxUSF9DSEVDS19JTlRFUlZBTCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIF90aGlzLmNic1tyZXF1ZXN0LmlkXSA9IHtcbiAgICAgICAgdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgcmVzb2x2ZTogcmVzb2x2ZSxcbiAgICAgICAgcmVqZWN0OiByZWplY3RcbiAgICAgIH07XG5cbiAgICAgIC8vIFNldCBhbGwgcmVxdWVzdHMgdG8gYmUgJ2NhbGwnIG1ldGhvZHMuXG4gICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdjYWxsJztcblxuICAgICAgdHJ5IHtcbiAgICAgICAgX3RoaXMud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBfdGhpcy5kZWJ1ZygnQ2F1Z2h0IGEgbmFzdHkgZXJyb3IgOiAnLCBlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIG1lc3NhZ2VzIGFyZSByZWNlaXZlZCBvbiB0aGUgV2Vic29ja2V0LlxuICAgKlxuICAgKiBAcGFyYW0geyp9IHJlc3BvbnNlIFRoZSBtZXNzYWdlIHJlY2VpdmVkLlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUubGlzdGVuZXIgPSBmdW5jdGlvbiBsaXN0ZW5lcihyZXNwb25zZSkge1xuICAgIHZhciByZXNwb25zZUpTT04gPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlc3BvbnNlSlNPTiA9IEpTT04ucGFyc2UocmVzcG9uc2UuZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlc3BvbnNlSlNPTi5lcnJvciA9ICdFcnJvciBwYXJzaW5nIHJlc3BvbnNlOiAnICsgZXJyb3Iuc3RhY2s7XG4gICAgICB0aGlzLmRlYnVnKCdFcnJvciBwYXJzaW5nIHJlc3BvbnNlOiAnLCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXIgdGhlIGhlYWx0aCBjaGVjayB0aW1lb3V0LCB3ZSd2ZSBqdXN0IHJlY2VpdmVkIGEgaGVhbHRoeSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgaWYgKHRoaXMuaGVhbHRoQ2hlY2spIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhlYWx0aENoZWNrKTtcbiAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBzdWIgPSBmYWxzZTtcbiAgICB2YXIgY2FsbGJhY2sgPSBudWxsO1xuXG4gICAgaWYgKHJlc3BvbnNlSlNPTi5tZXRob2QgPT09ICdub3RpY2UnKSB7XG4gICAgICBzdWIgPSB0cnVlO1xuICAgICAgcmVzcG9uc2VKU09OLmlkID0gcmVzcG9uc2VKU09OLnBhcmFtc1swXTtcbiAgICB9XG5cbiAgICBpZiAoIXN1Yikge1xuICAgICAgY2FsbGJhY2sgPSB0aGlzLmNic1tyZXNwb25zZUpTT04uaWRdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayA9IHRoaXMuc3Vic1tyZXNwb25zZUpTT04uaWRdLmNhbGxiYWNrO1xuICAgIH1cblxuICAgIGlmIChjYWxsYmFjayAmJiAhc3ViKSB7XG4gICAgICBpZiAocmVzcG9uc2VKU09OLmVycm9yKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJy0tLS0+IHJlc3BvbnNlSlNPTiA6ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgICAgIGNhbGxiYWNrLnJlamVjdChyZXNwb25zZUpTT04uZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sucmVzb2x2ZShyZXNwb25zZUpTT04ucmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgZGVsZXRlIHRoaXMuY2JzW3Jlc3BvbnNlSlNPTi5pZF07XG5cbiAgICAgIGlmICh0aGlzLnVuc3ViW3Jlc3BvbnNlSlNPTi5pZF0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc3Vic1t0aGlzLnVuc3ViW3Jlc3BvbnNlSlNPTi5pZF1dO1xuICAgICAgICBkZWxldGUgdGhpcy51bnN1YltyZXNwb25zZUpTT04uaWRdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2FsbGJhY2sgJiYgc3ViKSB7XG4gICAgICBjYWxsYmFjayhyZXNwb25zZUpTT04ucGFyYW1zWzFdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWJ1ZygnV2FybmluZzogdW5rbm93biB3ZWJzb2NrZXQgcmVzcG9uc2VKU09OOiAnLCByZXNwb25zZUpTT04pO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTG9naW4gdG8gdGhlIEJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VyIFVzZXJuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCBQYXNzd29yZFxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgYWZ0ZXIgbG9naW4uXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG4gICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgbG9naW4uJywgdXNlciwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3RfcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfdGhpczIuY2FsbChbMSwgJ2xvZ2luJywgW3VzZXIsIHBhc3N3b3JkXV0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZSB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICpcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgaWYgKHRoaXMud3MpIHtcbiAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgICAgLy8gVHJ5IGFuZCBmaXJlIGNsb3NlIG9uIHRoZSBjb25uZWN0aW9uLlxuICAgICAgdGhpcy53cy5jbG9zZSgpO1xuXG4gICAgICAvLyBDbGVhciBvdXIgcmVmZXJlbmNlcyBzbyB0aGF0IGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgIH1cblxuICAgIC8vIENsZWFyIG91ciB0aW1lb3V0cyBmb3IgY29ubmVjdGlvbiB0aW1lb3V0IGFuZCBoZWFsdGggY2hlY2suXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuaGVhbHRoQ2hlY2spO1xuICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucmVjb25uZWN0VGltZW91dCk7XG4gICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIFRvZ2dsZSB0aGUgY29ubmVjdGVkIGZsYWcuXG4gICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgfTtcblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICBpZiAoU09DS0VUX0RFQlVHKSB7XG4gICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgcGFyYW1zID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIHBhcmFtc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2cuYXBwbHkobnVsbCwgcGFyYW1zKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIENoYWluV2ViU29ja2V0O1xufSgpO1xuXG4vLyBDb25zdGFudHMgZm9yIFNUQVRFXG5cblxuQ2hhaW5XZWJTb2NrZXQuc3RhdHVzID0ge1xuICBSRUNPTk5FQ1RFRDogJ3JlY29ubmVjdGVkJyxcbiAgT1BFTjogJ29wZW4nLFxuICBDTE9TRUQ6ICdjbG9zZWQnLFxuICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhaW5XZWJTb2NrZXQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX0FwaUluc3RhbmNlcyA9IHJlcXVpcmUoJy4vQXBpSW5zdGFuY2VzJyk7XG5cbnZhciBfQXBpSW5zdGFuY2VzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0FwaUluc3RhbmNlcyk7XG5cbnZhciBfQ2hhaW5XZWJTb2NrZXQgPSByZXF1aXJlKCcuL0NoYWluV2ViU29ja2V0Jyk7XG5cbnZhciBfQ2hhaW5XZWJTb2NrZXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ2hhaW5XZWJTb2NrZXQpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgTWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTWFuYWdlcihfcmVmKSB7XG4gICAgdmFyIHVybCA9IF9yZWYudXJsLFxuICAgICAgICB1cmxzID0gX3JlZi51cmxzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1hbmFnZXIpO1xuXG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy51cmxzID0gdXJscy5maWx0ZXIoZnVuY3Rpb24gKGEpIHtcbiAgICAgIHJldHVybiBhICE9PSB1cmw7XG4gICAgfSk7XG4gIH1cblxuICBNYW5hZ2VyLnByb3RvdHlwZS5sb2dGYWlsdXJlID0gZnVuY3Rpb24gbG9nRmFpbHVyZSh1cmwpIHtcbiAgICBjb25zb2xlLmVycm9yKCdVbmFibGUgdG8gY29ubmVjdCB0bycsIHVybCArICcsIHNraXBwaW5nIHRvIG5leHQgZnVsbCBub2RlIEFQSSBzZXJ2ZXInKTtcbiAgfTtcblxuICBNYW5hZ2VyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgICB2YXIgX2Nvbm5lY3QgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHRydWU7XG5cbiAgICB2YXIgdXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB0aGlzLnVybDtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBfQXBpSW5zdGFuY2VzMi5kZWZhdWx0Lmluc3RhbmNlKHVybCwgX2Nvbm5lY3QpLmluaXRfcHJvbWlzZS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICBfQXBpSW5zdGFuY2VzMi5kZWZhdWx0Lmluc3RhbmNlKCkuY2xvc2UoKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIE1hbmFnZXIucHJvdG90eXBlLmNvbm5lY3RXaXRoRmFsbGJhY2sgPSBmdW5jdGlvbiBjb25uZWN0V2l0aEZhbGxiYWNrKCkge1xuICAgIHZhciBjb25uZWN0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB0cnVlO1xuICAgIHZhciB1cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHRoaXMudXJsO1xuICAgIHZhciBpbmRleCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogMDtcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgcmVzb2x2ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogbnVsbDtcbiAgICB2YXIgcmVqZWN0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiBudWxsO1xuXG4gICAgaWYgKHJlamVjdCAmJiBpbmRleCA+IHRoaXMudXJscy5sZW5ndGggLSAxKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVHJpZWQgJyArIChpbmRleCArIDEpICsgJyBjb25uZWN0aW9ucywgbm9uZSBvZiB3aGljaCB3b3JrZWQ6ICcgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnVybHMuY29uY2F0KHRoaXMudXJsKSkpKTtcbiAgICB9XG5cbiAgICB2YXIgZmFsbGJhY2sgPSBmdW5jdGlvbiBmYWxsYmFjayhyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIF90aGlzLmxvZ0ZhaWx1cmUodXJsKTtcbiAgICAgIHJldHVybiBfdGhpcy5jb25uZWN0V2l0aEZhbGxiYWNrKGNvbm5lY3QsIF90aGlzLnVybHNbaW5kZXhdLCBpbmRleCArIDEsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgfTtcblxuICAgIGlmIChyZXNvbHZlICYmIHJlamVjdCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdChjb25uZWN0LCB1cmwpLnRoZW4ocmVzb2x2ZSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICBmYWxsYmFjayhyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIF90aGlzLmNvbm5lY3QoY29ubmVjdCkudGhlbihyZXNvbHZlKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZhbGxiYWNrKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBNYW5hZ2VyLnByb3RvdHlwZS5jaGVja0Nvbm5lY3Rpb25zID0gZnVuY3Rpb24gY2hlY2tDb25uZWN0aW9ucygpIHtcbiAgICB2YXIgcnBjX3VzZXIgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICcnO1xuICAgIHZhciBycGNfcGFzc3dvcmQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6ICcnO1xuXG4gICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICB2YXIgcmVzb2x2ZSA9IGFyZ3VtZW50c1syXTtcbiAgICB2YXIgcmVqZWN0ID0gYXJndW1lbnRzWzNdO1xuXG4gICAgdmFyIGNvbm5lY3Rpb25TdGFydFRpbWVzID0ge307XG5cbiAgICB2YXIgY2hlY2tGdW5jdGlvbiA9IGZ1bmN0aW9uIGNoZWNrRnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgZnVsbExpc3QgPSBfdGhpczIudXJscy5jb25jYXQoX3RoaXMyLnVybCk7XG4gICAgICB2YXIgY29ubmVjdGlvblByb21pc2VzID0gW107XG5cbiAgICAgIGZ1bGxMaXN0LmZvckVhY2goZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB2YXIgY29ubiA9IG5ldyBfQ2hhaW5XZWJTb2NrZXQyLmRlZmF1bHQodXJsLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICAgIGNvbm5lY3Rpb25TdGFydFRpbWVzW3VybF0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgY29ubmVjdGlvblByb21pc2VzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBjb25uLmxvZ2luKHJwY191c2VyLCBycGNfcGFzc3dvcmQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIF9yZWYyO1xuXG4gICAgICAgICAgICBjb25uLmNsb3NlKCk7XG4gICAgICAgICAgICByZXR1cm4gX3JlZjIgPSB7fSwgX3JlZjJbdXJsXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gY29ubmVjdGlvblN0YXJ0VGltZXNbdXJsXSwgX3JlZjI7XG4gICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHVybCA9PT0gX3RoaXMyLnVybCkge1xuICAgICAgICAgICAgICBfdGhpczIudXJsID0gX3RoaXMyLnVybHNbMF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfdGhpczIudXJscyA9IF90aGlzMi51cmxzLmZpbHRlcihmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhICE9PSB1cmw7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25uLmNsb3NlKCk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgUHJvbWlzZS5hbGwoY29ubmVjdGlvblByb21pc2VzLm1hcChmdW5jdGlvbiAoYSkge1xuICAgICAgICByZXR1cm4gYSgpO1xuICAgICAgfSkpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICByZXNvbHZlKHJlcy5maWx0ZXIoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICByZXR1cm4gISFhO1xuICAgICAgICB9KS5yZWR1Y2UoZnVuY3Rpb24gKGYsIGEpIHtcbiAgICAgICAgICB2YXIga2V5ID0gT2JqZWN0LmtleXMoYSlbMF07XG4gICAgICAgICAgZltrZXldID0gYVtrZXldO1xuICAgICAgICAgIHJldHVybiBmO1xuICAgICAgICB9LCB7fSkpO1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLmNoZWNrQ29ubmVjdGlvbnMocnBjX3VzZXIsIHJwY19wYXNzd29yZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBpZiAocmVzb2x2ZSAmJiByZWplY3QpIHtcbiAgICAgIGNoZWNrRnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGNoZWNrRnVuY3Rpb24pO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gTWFuYWdlcjtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gTWFuYWdlcjsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBHcmFwaGVuZUFwaSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gR3JhcGhlbmVBcGkod3NfcnBjLCBhcGlfbmFtZSkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBHcmFwaGVuZUFwaSk7XG5cbiAgICB0aGlzLndzX3JwYyA9IHdzX3JwYztcbiAgICB0aGlzLmFwaV9uYW1lID0gYXBpX25hbWU7XG4gIH1cblxuICBHcmFwaGVuZUFwaS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHJldHVybiB0aGlzLndzX3JwYy5jYWxsKFsxLCB0aGlzLmFwaV9uYW1lLCBbXV0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICBfdGhpcy5hcGlfaWQgPSByZXNwb25zZTtcbiAgICAgIHJldHVybiBfdGhpcztcbiAgICB9KTtcbiAgfTtcblxuICBHcmFwaGVuZUFwaS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcbiAgICByZXR1cm4gdGhpcy53c19ycGMuY2FsbChbdGhpcy5hcGlfaWQsIG1ldGhvZCwgcGFyYW1zXSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnISEhIEdyYXBoZW5lQXBpIGVycm9yOiAnLCBtZXRob2QsIHBhcmFtcywgZXJyb3IsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gR3JhcGhlbmVBcGk7XG59KCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IEdyYXBoZW5lQXBpOyIsIiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
