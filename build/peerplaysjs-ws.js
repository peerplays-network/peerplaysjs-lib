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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var inst = void 0;

var ApisInstance = function () {
  function ApisInstance() {
    _classCallCheck(this, ApisInstance);
  }

  /** @arg {string} connection .. */
  ApisInstance.prototype.connect = function connect(cs, connectTimeout) {
    var _this = this;

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
      _this._crypto = new _GrapheneApi2.default(_this.ws_rpc, 'crypto');
      _this._bookie = new _GrapheneApi2.default(_this.ws_rpc, 'bookie');
      var db_promise = _this._db.init().then(function () {
        return _this._db.exec('get_chain_id', []).then(function (_chain_id) {
          _this.chain_id = _chain_id;
          return _ChainConfig2.default.setChainId(_chain_id);
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
          _this._crypto.init();
          _this._bookie.init();
        });
      };

      return Promise.all([db_promise, _this._net.init(), _this._hist.init(),
      // Temporary squash crypto API error until the API is upgraded everywhere
      _this._crypto.init().catch(function (e) {
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
    return this._crypto;
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
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var ChainConfig = function () {
  function ChainConfig() {
    _classCallCheck(this, ChainConfig);

    this.reset();
  }

  ChainConfig.prototype.reset = function reset() {
    Object.assign(this, defaults);
  };

  ChainConfig.prototype.setChainId = function setChainId(chainID) {
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

  ChainConfig.prototype.setPrefix = function setPrefix() {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'PPY';

    this.address_prefix = prefix;
  };

  return ChainConfig;
}();

exports.default = new ChainConfig();
},{}],4:[function(require,module,exports){
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

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvQXBpSW5zdGFuY2VzLmpzIiwiZGlzdC9zcmMvQ2hhaW5Db25maWcuanMiLCJkaXN0L3NyYy9DaGFpbldlYlNvY2tldC5qcyIsImRpc3Qvc3JjL0Nvbm5lY3Rpb25NYW5hZ2VyLmpzIiwiZGlzdC9zcmMvR3JhcGhlbmVBcGkuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzLk1hbmFnZXIgPSBleHBvcnRzLkNoYWluQ29uZmlnID0gZXhwb3J0cy5BcGlzID0gdW5kZWZpbmVkO1xuXG52YXIgX0FwaUluc3RhbmNlcyA9IHJlcXVpcmUoJy4vc3JjL0FwaUluc3RhbmNlcycpO1xuXG52YXIgX0FwaUluc3RhbmNlczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9BcGlJbnN0YW5jZXMpO1xuXG52YXIgX0Nvbm5lY3Rpb25NYW5hZ2VyID0gcmVxdWlyZSgnLi9zcmMvQ29ubmVjdGlvbk1hbmFnZXInKTtcblxudmFyIF9Db25uZWN0aW9uTWFuYWdlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Db25uZWN0aW9uTWFuYWdlcik7XG5cbnZhciBfQ2hhaW5Db25maWcgPSByZXF1aXJlKCcuL3NyYy9DaGFpbkNvbmZpZycpO1xuXG52YXIgX0NoYWluQ29uZmlnMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0NoYWluQ29uZmlnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZXhwb3J0cy5BcGlzID0gX0FwaUluc3RhbmNlczIuZGVmYXVsdDtcbmV4cG9ydHMuQ2hhaW5Db25maWcgPSBfQ2hhaW5Db25maWcyLmRlZmF1bHQ7XG5leHBvcnRzLk1hbmFnZXIgPSBfQ29ubmVjdGlvbk1hbmFnZXIyLmRlZmF1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX0NoYWluV2ViU29ja2V0ID0gcmVxdWlyZSgnLi9DaGFpbldlYlNvY2tldCcpO1xuXG52YXIgX0NoYWluV2ViU29ja2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0NoYWluV2ViU29ja2V0KTtcblxudmFyIF9HcmFwaGVuZUFwaSA9IHJlcXVpcmUoJy4vR3JhcGhlbmVBcGknKTtcblxudmFyIF9HcmFwaGVuZUFwaTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9HcmFwaGVuZUFwaSk7XG5cbnZhciBfQ2hhaW5Db25maWcgPSByZXF1aXJlKCcuL0NoYWluQ29uZmlnJyk7XG5cbnZhciBfQ2hhaW5Db25maWcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ2hhaW5Db25maWcpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgaW5zdCA9IHZvaWQgMDtcblxudmFyIEFwaXNJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQXBpc0luc3RhbmNlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlzSW5zdGFuY2UpO1xuICB9XG5cbiAgLyoqIEBhcmcge3N0cmluZ30gY29ubmVjdGlvbiAuLiAqL1xuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB2YXIgcnBjX3VzZXIgPSAnJztcbiAgICB2YXIgcnBjX3Bhc3N3b3JkID0gJyc7XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgJiYgY3MuaW5kZXhPZignd3NzOi8vJykgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3VyZSBkb21haW5zIHJlcXVpcmUgd3NzIGNvbm5lY3Rpb24nKTtcbiAgICB9XG5cbiAgICB0aGlzLndzX3JwYyA9IG5ldyBfQ2hhaW5XZWJTb2NrZXQyLmRlZmF1bHQoY3MsIHRoaXMuc3RhdHVzQ2IsIGNvbm5lY3RUaW1lb3V0KTtcblxuICAgIHRoaXMuaW5pdF9wcm9taXNlID0gdGhpcy53c19ycGMubG9naW4ocnBjX3VzZXIsIHJwY19wYXNzd29yZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ29ubmVjdGVkIHRvIEFQSSBub2RlOicsIGNzKTtcbiAgICAgIF90aGlzLl9kYiA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCAnZGF0YWJhc2UnKTtcbiAgICAgIF90aGlzLl9uZXQgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgJ25ldHdvcmtfYnJvYWRjYXN0Jyk7XG4gICAgICBfdGhpcy5faGlzdCA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCAnaGlzdG9yeScpO1xuICAgICAgX3RoaXMuX2NyeXB0byA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCAnY3J5cHRvJyk7XG4gICAgICBfdGhpcy5fYm9va2llID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsICdib29raWUnKTtcbiAgICAgIHZhciBkYl9wcm9taXNlID0gX3RoaXMuX2RiLmluaXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLl9kYi5leGVjKCdnZXRfY2hhaW5faWQnLCBbXSkudGhlbihmdW5jdGlvbiAoX2NoYWluX2lkKSB7XG4gICAgICAgICAgX3RoaXMuY2hhaW5faWQgPSBfY2hhaW5faWQ7XG4gICAgICAgICAgcmV0dXJuIF9DaGFpbkNvbmZpZzIuZGVmYXVsdC5zZXRDaGFpbklkKF9jaGFpbl9pZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIF90aGlzLndzX3JwYy5vbl9yZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aGlzLndzX3JwYy5sb2dpbignJywgJycpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIF90aGlzLl9kYi5pbml0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuc3RhdHVzQ2IpIHtcbiAgICAgICAgICAgICAgX3RoaXMuc3RhdHVzQ2IoX0NoYWluV2ViU29ja2V0Mi5kZWZhdWx0LnN0YXR1cy5SRUNPTk5FQ1RFRCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgX3RoaXMuX25ldC5pbml0KCk7XG4gICAgICAgICAgX3RoaXMuX2hpc3QuaW5pdCgpO1xuICAgICAgICAgIF90aGlzLl9jcnlwdG8uaW5pdCgpO1xuICAgICAgICAgIF90aGlzLl9ib29raWUuaW5pdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbZGJfcHJvbWlzZSwgX3RoaXMuX25ldC5pbml0KCksIF90aGlzLl9oaXN0LmluaXQoKSxcbiAgICAgIC8vIFRlbXBvcmFyeSBzcXVhc2ggY3J5cHRvIEFQSSBlcnJvciB1bnRpbCB0aGUgQVBJIGlzIHVwZ3JhZGVkIGV2ZXJ5d2hlcmVcbiAgICAgIF90aGlzLl9jcnlwdG8uaW5pdCgpLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdBcGlJbnN0YW5jZVxcdENyeXB0byBBUEkgRXJyb3InLCBlKTtcbiAgICAgIH0pLCBfdGhpcy5fYm9va2llLmluaXQoKV0pO1xuICAgIH0pO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy53c19ycGMpIHtcbiAgICAgIHRoaXMud3NfcnBjLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy53c19ycGMgPSBudWxsO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuZGJfYXBpID0gZnVuY3Rpb24gZGJfYXBpKCkge1xuICAgIHJldHVybiB0aGlzLl9kYjtcbiAgfTtcblxuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLm5ldHdvcmtfYXBpID0gZnVuY3Rpb24gbmV0d29ya19hcGkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25ldDtcbiAgfTtcblxuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmhpc3RvcnlfYXBpID0gZnVuY3Rpb24gaGlzdG9yeV9hcGkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hpc3Q7XG4gIH07XG5cbiAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5jcnlwdG9fYXBpID0gZnVuY3Rpb24gY3J5cHRvX2FwaSgpIHtcbiAgICByZXR1cm4gdGhpcy5fY3J5cHRvO1xuICB9O1xuXG4gIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuYm9va2llX2FwaSA9IGZ1bmN0aW9uIGJvb2tpZV9hcGkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Jvb2tpZTtcbiAgfTtcblxuICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayA9IGZ1bmN0aW9uIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjaykge1xuICAgIHRoaXMuc3RhdHVzQ2IgPSBjYWxsYmFjaztcbiAgfTtcblxuICByZXR1cm4gQXBpc0luc3RhbmNlO1xufSgpO1xuXG4vKipcbiAgICBDb25maWd1cmU6IGNvbmZpZ3VyZSBhcyBmb2xsb3dzIGBBcGlzLmluc3RhbmNlKFwid3M6Ly9sb2NhbGhvc3Q6ODA5MFwiKS5pbml0X3Byb21pc2VgLiAgVGhpc1xuICAgIHJldHVybnMgYSBwcm9taXNlLCBvbmNlIHJlc29sdmVkIHRoZSBjb25uZWN0aW9uIGlzIHJlYWR5LlxuXG4gICAgSW1wb3J0OiBpbXBvcnQgeyBBcGlzIH0gZnJvbSBcIkBncmFwaGVuZS9jaGFpblwiXG5cbiAgICBTaG9ydC1oYW5kOiBBcGlzLmRiKFwibWV0aG9kXCIsIFwicGFybTFcIiwgMiwgMywgLi4uKS4gIFJldHVybnMgYSBwcm9taXNlIHdpdGggcmVzdWx0cy5cblxuICAgIEFkZGl0aW9uYWwgdXNhZ2U6IEFwaXMuaW5zdGFuY2UoKS5kYl9hcGkoKS5leGVjKFwibWV0aG9kXCIsIFtcIm1ldGhvZFwiLCBcInBhcm0xXCIsIDIsIDMsIC4uLl0pLlxuICAgIFJldHVybnMgYSBwcm9taXNlIHdpdGggcmVzdWx0cy5cbiovXG5cbmV4cG9ydHMuZGVmYXVsdCA9IHtcbiAgc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrOiBmdW5jdGlvbiBzZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICB0aGlzLnN0YXR1c0NiID0gY2FsbGJhY2s7XG5cbiAgICBpZiAoaW5zdCkge1xuICAgICAgaW5zdC5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICAgICAgQGFyZyB7c3RyaW5nfSBjcyBpcyBvbmx5IHByb3ZpZGVkIGluIHRoZSBmaXJzdCBjYWxsXG4gICAgICAgIEByZXR1cm4ge0FwaXN9IHNpbmdsZXRvbiAuLiBDaGVjayBBcGlzLmluc3RhbmNlKCkuaW5pdF9wcm9taXNlIHRvXG4gICAgICAgIGtub3cgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZFxuICAgICovXG4gIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICB2YXIgY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6ICd3czovL2xvY2FsaG9zdDo4MDkwJztcbiAgICB2YXIgY29ubmVjdCA9IGFyZ3VtZW50c1sxXTtcbiAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDQwMDA7XG5cbiAgICBpZiAoaW5zdCkge1xuICAgICAgaW5zdC5jbG9zZSgpO1xuICAgICAgaW5zdCA9IG51bGw7XG4gICAgfVxuXG4gICAgaW5zdCA9IG5ldyBBcGlzSW5zdGFuY2UoKTtcbiAgICBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayh0aGlzLnN0YXR1c0NiKTtcblxuICAgIGlmIChpbnN0ICYmIGNvbm5lY3QpIHtcbiAgICAgIGluc3QuY29ubmVjdChjcywgY29ubmVjdFRpbWVvdXQpO1xuICAgIH1cblxuICAgIHJldHVybiBpbnN0O1xuICB9LFxuICBpbnN0YW5jZTogZnVuY3Rpb24gaW5zdGFuY2UoKSB7XG4gICAgdmFyIGNzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiAnd3M6Ly9sb2NhbGhvc3Q6ODA5MCc7XG4gICAgdmFyIGNvbm5lY3QgPSBhcmd1bWVudHNbMV07XG4gICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiA0MDAwO1xuXG4gICAgaWYgKCFpbnN0KSB7XG4gICAgICBpbnN0ID0gbmV3IEFwaXNJbnN0YW5jZSgpO1xuICAgICAgaW5zdC5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2sodGhpcy5zdGF0dXNDYik7XG4gICAgfVxuXG4gICAgaWYgKGluc3QgJiYgY29ubmVjdCkge1xuICAgICAgaW5zdC5jb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluc3Q7XG4gIH0sXG4gIGNoYWluSWQ6IGZ1bmN0aW9uIGNoYWluSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UoKS5jaGFpbl9pZDtcbiAgfSxcbiAgY2xvc2U6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIGlmIChpbnN0KSB7XG4gICAgICBpbnN0LmNsb3NlKCk7XG4gICAgICBpbnN0ID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgLy8gZGI6IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5kYl9hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKSxcbiAgLy8gbmV0d29yazogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLm5ldHdvcmtfYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSksXG4gIC8vIGhpc3Rvcnk6IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5oaXN0b3J5X2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpLFxuICAvLyBjcnlwdG86IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5jcnlwdG9fYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSlcblxufTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgY29yZV9hc3NldDogJ1BQWScsXG4gIGFkZHJlc3NfcHJlZml4OiAnUFBZJyxcbiAgZXhwaXJlX2luX3NlY3M6IDE1LFxuICBleHBpcmVfaW5fc2Vjc19wcm9wb3NhbDogMjQgKiA2MCAqIDYwLFxuICByZXZpZXdfaW5fc2Vjc19jb21taXR0ZWU6IDI0ICogNjAgKiA2MFxufTtcblxudmFyIG5ldHdvcmtzID0ge1xuICBuZXR3b3Jrczoge1xuICAgIFBlZXJwbGF5czoge1xuICAgICAgY29yZV9hc3NldDogJ1BQWScsXG4gICAgICBhZGRyZXNzX3ByZWZpeDogJ1BQWScsXG4gICAgICBjaGFpbl9pZDogJzZiNmI1ZjBjZTdhMzZkMzIzNzY4ZTUzNGYzZWRiNDFjNmQ2MzMyYTU0MWE5NTcyNWI5OGUyOGQxNDA4NTAxMzQnXG4gICAgfSxcbiAgICBQZWVycGxheXNUZXN0bmV0OiB7XG4gICAgICBjb3JlX2Fzc2V0OiAnUFBZVEVTVCcsXG4gICAgICBhZGRyZXNzX3ByZWZpeDogJ1BQWVRFU1QnLFxuICAgICAgY2hhaW5faWQ6ICdiZTZiNzkyOTVlNzI4NDA2Y2JiNzQ5NGJjYjYyNmU2MmFkMjc4ZmE0MDE4Njk5Y2Y4Zjc1NzM5ZjRjMWE4MWZkJ1xuICAgIH1cbiAgfVxufTtcblxudmFyIENoYWluQ29uZmlnID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBDaGFpbkNvbmZpZygpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ2hhaW5Db25maWcpO1xuXG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgQ2hhaW5Db25maWcucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBkZWZhdWx0cyk7XG4gIH07XG5cbiAgQ2hhaW5Db25maWcucHJvdG90eXBlLnNldENoYWluSWQgPSBmdW5jdGlvbiBzZXRDaGFpbklkKGNoYWluSUQpIHtcbiAgICB2YXIgcmVmID0gT2JqZWN0LmtleXMobmV0d29ya3MpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIG5ldHdvcmtfbmFtZSA9IHJlZltpXTtcbiAgICAgIHZhciBuZXR3b3JrID0gbmV0d29ya3NbbmV0d29ya19uYW1lXTtcblxuICAgICAgaWYgKG5ldHdvcmsuY2hhaW5faWQgPT09IGNoYWluSUQpIHtcbiAgICAgICAgdGhpcy5uZXR3b3JrX25hbWUgPSBuZXR3b3JrX25hbWU7XG5cbiAgICAgICAgaWYgKG5ldHdvcmsuYWRkcmVzc19wcmVmaXgpIHtcbiAgICAgICAgICB0aGlzLmFkZHJlc3NfcHJlZml4ID0gbmV0d29yay5hZGRyZXNzX3ByZWZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmV0d29ya19uYW1lOiBuZXR3b3JrX25hbWUsXG4gICAgICAgICAgbmV0d29yazogbmV0d29ya1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5uZXR3b3JrX25hbWUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdVbmtub3duIGNoYWluIGlkICh0aGlzIG1heSBiZSBhIHRlc3RuZXQpJywgY2hhaW5JRCk7XG4gICAgfVxuICB9O1xuXG4gIENoYWluQ29uZmlnLnByb3RvdHlwZS5zZXRQcmVmaXggPSBmdW5jdGlvbiBzZXRQcmVmaXgoKSB7XG4gICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJ1BQWSc7XG5cbiAgICB0aGlzLmFkZHJlc3NfcHJlZml4ID0gcHJlZml4O1xuICB9O1xuXG4gIHJldHVybiBDaGFpbkNvbmZpZztcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gbmV3IENoYWluQ29uZmlnKCk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgU09DS0VUX0RFQlVHID0gZmFsc2U7XG52YXIgV2ViU29ja2V0Q2xpZW50ID0gbnVsbDtcblxuaWYgKHR5cGVvZiBXZWJTb2NrZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gIFdlYlNvY2tldENsaWVudCA9IFdlYlNvY2tldDtcbn0gZWxzZSB7XG4gIFdlYlNvY2tldENsaWVudCA9IHJlcXVpcmUoJ3dzJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ2xvYmFsLXJlcXVpcmVcbn1cblxudmFyIFNVQlNDUklCRV9PUEVSQVRJT05TID0gWydzZXRfc3Vic2NyaWJlX2NhbGxiYWNrJywgJ3N1YnNjcmliZV90b19tYXJrZXQnLCAnYnJvYWRjYXN0X3RyYW5zYWN0aW9uX3dpdGhfY2FsbGJhY2snLCAnc2V0X3BlbmRpbmdfdHJhbnNhY3Rpb25fY2FsbGJhY2snXTtcblxudmFyIFVOU1VCU0NSSUJFX09QRVJBVElPTlMgPSBbJ3Vuc3Vic2NyaWJlX2Zyb21fbWFya2V0JywgJ3Vuc3Vic2NyaWJlX2Zyb21fYWNjb3VudHMnXTtcblxudmFyIEhFQUxUSF9DSEVDS19JTlRFUlZBTCA9IDEwMDAwO1xuXG52YXIgQ2hhaW5XZWJTb2NrZXQgPSBmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKkNyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgQ2hhaW5XZWJTb2NrZXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgICBzZXJ2ZXJBZGRyZXNzICAgICAgICAgICBUaGUgYWRkcmVzcyBvZiB0aGUgd2Vic29ja2V0IHRvIGNvbm5lY3QgdG8uXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259ICBzdGF0dXNDYiAgICAgICAgICAgICAgICBDYWxsZWQgd2hlbiBzdGF0dXMgZXZlbnRzIG9jY3VyLlxuICAgKiBAcGFyYW0ge251bWJlcn0gICAgW2Nvbm5lY3RUaW1lb3V0PTEwMDAwXSAgVGhlIHRpbWUgZm9yIGEgY29ubmVjdGlvbiBhdHRlbXB0IHRvIGNvbXBsZXRlLlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG4gIGZ1bmN0aW9uIENoYWluV2ViU29ja2V0KHNlcnZlckFkZHJlc3MsIHN0YXR1c0NiKSB7XG4gICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAxMDAwMDtcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDaGFpbldlYlNvY2tldCk7XG5cbiAgICB0aGlzLnN0YXR1c0NiID0gc3RhdHVzQ2I7XG4gICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gc2VydmVyQWRkcmVzcztcbiAgICB0aGlzLnRpbWVvdXRJbnRlcnZhbCA9IGNvbm5lY3RUaW1lb3V0O1xuXG4gICAgLy8gVGhlIGN1cnJlbmN0IGNvbm5lY3Rpb24gc3RhdGUgb2YgdGhlIHdlYnNvY2tldC5cbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IG51bGw7XG5cbiAgICAvLyBDYWxsYmFjayB0byBleGVjdXRlIHdoZW4gdGhlIHdlYnNvY2tldCBpcyByZWNvbm5lY3RlZC5cbiAgICB0aGlzLm9uX3JlY29ubmVjdCA9IG51bGw7XG5cbiAgICAvLyBBbiBpbmNyZW1lbnRpbmcgSUQgZm9yIGVhY2ggcmVxdWVzdCBzbyB0aGF0IHdlIGNhbiBwYWlyIGl0IHdpdGggdGhlXG4gICAgLy8gcmVzcG9uc2UgZnJvbSB0aGUgd2Vic29ja2V0LlxuICAgIHRoaXMuY2JJZCA9IDA7XG5cbiAgICAvLyBPYmplY3RzIHRvIHN0b3JlIGtleS92YWx1ZSBwYWlycyBmb3IgY2FsbGJhY2tzLCBzdWJzY3JpcHRpb24gY2FsbGJhY2tzXG4gICAgLy8gYW5kIHVuc3Vic2NyaWJlIGNhbGxiYWNrcy5cbiAgICB0aGlzLmNicyA9IHt9O1xuICAgIHRoaXMuc3VicyA9IHt9O1xuICAgIHRoaXMudW5zdWIgPSB7fTtcblxuICAgIC8vIEN1cnJlbnQgY29ubmVjdGlvbiBwcm9taXNlcycgcmVqZWN0aW9uXG4gICAgdGhpcy5jdXJyZW50UmVzb2x2ZSA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50UmVqZWN0ID0gbnVsbDtcblxuICAgIC8vIEhlYWx0aCBjaGVjayBmb3IgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG5cbiAgICAvLyBDb3B5IHRoZSBjb25zdGFudHMgdG8gdGhpcyBpbnN0YW5jZS5cbiAgICB0aGlzLnN0YXR1cyA9IENoYWluV2ViU29ja2V0LnN0YXR1cztcblxuICAgIC8vIEJpbmQgdGhlIGZ1bmN0aW9ucyB0byB0aGUgaW5zdGFuY2UuXG4gICAgdGhpcy5vbkNvbm5lY3Rpb25PcGVuID0gdGhpcy5vbkNvbm5lY3Rpb25PcGVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSA9IHRoaXMub25Db25uZWN0aW9uQ2xvc2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvblRlcm1pbmF0ZSA9IHRoaXMub25Db25uZWN0aW9uVGVybWluYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkNvbm5lY3Rpb25FcnJvciA9IHRoaXMub25Db25uZWN0aW9uRXJyb3IuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQgPSB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb24gPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb24uYmluZCh0aGlzKTtcbiAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlID0gdGhpcy5jcmVhdGVDb25uZWN0aW9uUHJvbWlzZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyLmJpbmQodGhpcyk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGluaXRpYWwgY29ubmVjdGlvbiB0aGUgYmxvY2tjaGFpbi5cbiAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9uID0gZnVuY3Rpb24gY3JlYXRlQ29ubmVjdGlvbigpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgY3JlYXRlIGNvbm5lY3Rpb24nKTtcblxuICAgIC8vIENsZWFyIGFueSBwb3NzaWJsZSByZWNvbm5lY3QgdGltZXJzLlxuICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IG51bGw7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHByb21pc2UgZm9yIHRoaXMgY29ubmVjdGlvblxuICAgIGlmICghdGhpcy5jb25uZWN0X3Byb21pc2UpIHtcbiAgICAgIHRoaXMuY29ubmVjdF9wcm9taXNlID0gbmV3IFByb21pc2UodGhpcy5jcmVhdGVDb25uZWN0aW9uUHJvbWlzZSk7XG4gICAgfVxuXG4gICAgLy8gQXR0ZW1wdCB0byBjcmVhdGUgdGhlIHdlYnNvY2tldFxuICAgIHRyeSB7XG4gICAgICB0aGlzLndzID0gbmV3IFdlYlNvY2tldENsaWVudCh0aGlzLnNlcnZlckFkZHJlc3MpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBTZXQgYSB0aW1lb3V0IHRvIHRyeSBhbmQgcmVjb25uZWN0IGhlcmUuXG4gICAgICByZXR1cm4gdGhpcy5yZXNldENvbm5lY3Rpb24oKTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG5cbiAgICAvLyBIYW5kbGUgdGltZW91dHMgdG8gdGhlIHdlYnNvY2tldCdzIGluaXRpYWwgY29ubmVjdGlvbi5cbiAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQsIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVzZXQgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAqXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5yZXNldENvbm5lY3Rpb24gPSBmdW5jdGlvbiByZXNldENvbm5lY3Rpb24oKSB7XG4gICAgLy8gQ2xvc2UgdGhlIFdlYnNvY2tldCBpZiBpdHMgc3RpbGwgJ2hhbGYtb3BlbidcbiAgICB0aGlzLmNsb3NlKCk7XG5cbiAgICAvLyBNYWtlIHN1cmUgd2Ugb25seSBldmVyIGhhdmUgb25lIHRpbWVvdXQgcnVubmluZyB0byByZWNvbm5lY3QuXG4gICAgaWYgKCF0aGlzLnJlY29ubmVjdFRpbWVvdXQpIHtcbiAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCByZXNldCBjb25uZWN0aW9uJywgdGhpcy50aW1lb3V0SW50ZXJ2YWwpO1xuICAgICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLmNyZWF0ZUNvbm5lY3Rpb24sIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgICB9XG5cbiAgICAvLyBSZWplY3QgdGhlIGN1cnJlbnQgcHJvbWlzZSBpZiB0aGVyZSBpcyBvbmUuXG4gICAgaWYgKHRoaXMuY3VycmVudFJlamVjdCkge1xuICAgICAgdGhpcy5jdXJyZW50UmVqZWN0KG5ldyBFcnJvcignQ29ubmVjdGlvbiBhdHRlbXB0IGZhaWxlZDogJyArIHRoaXMuc2VydmVyQWRkcmVzcykpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQWRkIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgV2ViU29ja2V0LlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgYWRkIGV2ZW50IGxpc3RlbmVycycpO1xuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIHRoaXMub25Db25uZWN0aW9uT3Blbik7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIHRoaXMub25Db25uZWN0aW9uQ2xvc2UpO1xuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLm9uQ29ubmVjdGlvbkVycm9yKTtcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmxpc3RlbmVyKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBldmVudCBsaXN0ZXJzIGZyb20gdGhlIFdlYlNvY2tldC4gSXRzIGltcG9ydGFudCB0byByZW1vdmUgdGhlIGV2ZW50IGxpc3RlcmVyc1xuICAgKiBmb3IgZ2FyYmFhZ2UgY29sbGVjdGlvbi4gQmVjYXVzZSB3ZSBhcmUgY3JlYXRpbmcgYSBuZXcgV2ViU29ja2V0IG9uIGVhY2ggY29ubmVjdGlvbiBhdHRlbXB0XG4gICAqIGFueSBsaXN0ZW5lcnMgdGhhdCBhcmUgc3RpbGwgYXR0YWNoZWQgY291bGQgcHJldmVudCB0aGUgb2xkIHNvY2tldHMgZnJvbVxuICAgKiBiZWluZyBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICpcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHJlbW92ZSBldmVudCBsaXN0ZW5lcnMnKTtcbiAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29wZW4nLCB0aGlzLm9uQ29ubmVjdGlvbk9wZW4pO1xuICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xvc2UnLCB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKTtcbiAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5vbkNvbm5lY3Rpb25FcnJvcik7XG4gICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lcik7XG4gIH07XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gdGhhdCBpcyBwYXNzZWQgdG8gYSBuZXcgcHJvbWlzZSB0aGF0IHN0b3JlcyB0aGUgcmVzb2x2ZSBhbmQgcmVqZWN0IGNhbGxiYWNrc1xuICAgKiBpbiB0aGUgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmUgQSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgQSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkLlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY3JlYXRlQ29ubmVjdGlvblByb21pc2UgPSBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uUHJvbWlzZShyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgY3JlYXRlUHJvbWlzZScpO1xuICAgIHRoaXMuY3VycmVudFJlc29sdmUgPSByZXNvbHZlO1xuICAgIHRoaXMuY3VycmVudFJlamVjdCA9IHJlamVjdDtcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gYSBuZXcgV2Vic29ja2V0IGNvbm5lY3Rpb24gaXMgb3BlbmVkLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uT3BlbiA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvbk9wZW4oKSB7XG4gICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENvbm5lY3RlZCAnKTtcblxuICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLmNvbm5lY3Rpb25UaW1lb3V0KTtcbiAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIFRoaXMgd2lsbCB0cmlnZ2VyIHRoZSBsb2dpbiBwcm9jZXNzIGFzIHdlbGwgYXMgc29tZSBhZGRpdGlvbmFsIHNldHVwIGluIEFwaUluc3RhbmNlc1xuICAgIGlmICh0aGlzLm9uX3JlY29ubmVjdCkge1xuICAgICAgdGhpcy5vbl9yZWNvbm5lY3QoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50UmVzb2x2ZSkge1xuICAgICAgdGhpcy5jdXJyZW50UmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0YXR1c0NiKSB7XG4gICAgICB0aGlzLnN0YXR1c0NiKENoYWluV2ViU29ja2V0LnN0YXR1cy5PUEVOKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIGNhbGxlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGF0dGVtcHQgdGltZXMgb3V0LlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uVGltZW91dCA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvblRpbWVvdXQoKSB7XG4gICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHRpbWVvdXQnKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKG5ldyBFcnJvcignQ29ubmVjdGlvbiB0aW1lZCBvdXQuJykpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgV2Vic29ja2V0IGlzIG5vdCByZXNwb25kaW5nIHRvIHRoZSBoZWFsdGggY2hlY2tzLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uVGVybWluYXRlID0gZnVuY3Rpb24gb25Db25uZWN0aW9uVGVybWluYXRlKCkge1xuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCB0ZXJtaW5hdGUnKTtcbiAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKG5ldyBFcnJvcignQ29ubmVjdGlvbiB3YXMgdGVybWluYXRlZC4nKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja2NoYWluIGlzIGNsb3NlZC5cbiAgICpcbiAgICogQHBhcmFtIHsqfSBlcnJvclxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uQ2xvc2UgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25DbG9zZShlcnJvcikge1xuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDbG9zZSAnLCBlcnJvcik7XG5cbiAgICB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLkNMT1NFRCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgV2Vic29ja2V0IGVuY291bnRlcnMgYW4gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gZXJyb3JcbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvbkVycm9yID0gZnVuY3Rpb24gb25Db25uZWN0aW9uRXJyb3IoZXJyb3IpIHtcbiAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgT24gQ29ubmVjdGlvbiBFcnJvciAnLCBlcnJvcik7XG5cbiAgICB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLkVSUk9SKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEVudHJ5IHBvaW50IHRvIG1ha2UgUlBDIGNhbGxzIG9uIHRoZSBCbG9ja0NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0ge2FycmF5fSBwYXJhbXMgQW4gYXJyYXkgb2YgcGFyYW1zIHRvIGJlIHBhc3NlZCB0byB0aGUgcnBjIGNhbGwuIFttZXRob2QsIC4uLnBhcmFtc11cbiAgICogQHJldHVybnMgQSBuZXcgcHJvbWlzZSBmb3IgdGhpcyBzcGVjaWZpYyBjYWxsLlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIGNhbGwocGFyYW1zKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICghdGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDYWxsIG5vdCBjb25uZWN0ZWQuICcpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignRGlzY29ubmVjdGVkIGZyb20gdGhlIEJsb2NrQ2hhaW4uJykpO1xuICAgIH1cblxuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDYWxsIGNvbm5lY3RlZC4gJywgcGFyYW1zKTtcblxuICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgbWV0aG9kOiBwYXJhbXNbMV0sXG4gICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgIGlkOiB0aGlzLmNiSWQgKyAxXG4gICAgfTtcblxuICAgIHRoaXMuY2JJZCA9IHJlcXVlc3QuaWQ7XG5cbiAgICBpZiAoU1VCU0NSSUJFX09QRVJBVElPTlMuaW5jbHVkZXMocmVxdWVzdC5tZXRob2QpKSB7XG4gICAgICAvLyBTdG9yZSBjYWxsYmFjayBpbiBzdWJzIG1hcFxuICAgICAgdGhpcy5zdWJzW3JlcXVlc3QuaWRdID0ge1xuICAgICAgICBjYWxsYmFjazogcmVxdWVzdC5wYXJhbXNbMl1bMF1cbiAgICAgIH07XG5cbiAgICAgIC8vIFJlcGxhY2UgY2FsbGJhY2sgd2l0aCB0aGUgY2FsbGJhY2sgaWRcbiAgICAgIHJlcXVlc3QucGFyYW1zWzJdWzBdID0gcmVxdWVzdC5pZDtcbiAgICB9XG5cbiAgICBpZiAoVU5TVUJTQ1JJQkVfT1BFUkFUSU9OUy5pbmNsdWRlcyhyZXF1ZXN0Lm1ldGhvZCkpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVxdWVzdC5wYXJhbXNbMl1bMF0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBwYXJhbWV0ZXIgb2YgdW5zdWIgbXVzdCBiZSB0aGUgb3JpZ2luYWwgY2FsbGJhY2snKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHVuU3ViQ2IgPSByZXF1ZXN0LnBhcmFtc1syXS5zcGxpY2UoMCwgMSlbMF07XG5cbiAgICAgIC8vIEZpbmQgdGhlIGNvcnJlc3BvbmRpbmcgc3Vic2NyaXB0aW9uXG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnN1YnMpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICBpZiAodGhpcy5zdWJzW2lkXS5jYWxsYmFjayA9PT0gdW5TdWJDYikge1xuICAgICAgICAgIHRoaXMudW5zdWJbcmVxdWVzdC5pZF0gPSBpZDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5oZWFsdGhDaGVjaykge1xuICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IHNldFRpbWVvdXQodGhpcy5vbkNvbm5lY3Rpb25UZXJtaW5hdGUuYmluZCh0aGlzKSwgSEVBTFRIX0NIRUNLX0lOVEVSVkFMKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgX3RoaXMuY2JzW3JlcXVlc3QuaWRdID0ge1xuICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgICByZWplY3Q6IHJlamVjdFxuICAgICAgfTtcblxuICAgICAgLy8gU2V0IGFsbCByZXF1ZXN0cyB0byBiZSAnY2FsbCcgbWV0aG9kcy5cbiAgICAgIHJlcXVlc3QubWV0aG9kID0gJ2NhbGwnO1xuXG4gICAgICB0cnkge1xuICAgICAgICBfdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KHJlcXVlc3QpKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIF90aGlzLmRlYnVnKCdDYXVnaHQgYSBuYXN0eSBlcnJvciA6ICcsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIG9uIHRoZSBXZWJzb2NrZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gcmVzcG9uc2UgVGhlIG1lc3NhZ2UgcmVjZWl2ZWQuXG4gICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgKi9cblxuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5saXN0ZW5lciA9IGZ1bmN0aW9uIGxpc3RlbmVyKHJlc3BvbnNlKSB7XG4gICAgdmFyIHJlc3BvbnNlSlNPTiA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2VKU09OID0gSlNPTi5wYXJzZShyZXNwb25zZS5kYXRhKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVzcG9uc2VKU09OLmVycm9yID0gJ0Vycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICcgKyBlcnJvci5zdGFjaztcbiAgICAgIHRoaXMuZGVidWcoJ0Vycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhciB0aGUgaGVhbHRoIGNoZWNrIHRpbWVvdXQsIHdlJ3ZlIGp1c3QgcmVjZWl2ZWQgYSBoZWFsdGh5IHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlci5cbiAgICBpZiAodGhpcy5oZWFsdGhDaGVjaykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGVhbHRoQ2hlY2spO1xuICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHN1YiA9IGZhbHNlO1xuICAgIHZhciBjYWxsYmFjayA9IG51bGw7XG5cbiAgICBpZiAocmVzcG9uc2VKU09OLm1ldGhvZCA9PT0gJ25vdGljZScpIHtcbiAgICAgIHN1YiA9IHRydWU7XG4gICAgICByZXNwb25zZUpTT04uaWQgPSByZXNwb25zZUpTT04ucGFyYW1zWzBdO1xuICAgIH1cblxuICAgIGlmICghc3ViKSB7XG4gICAgICBjYWxsYmFjayA9IHRoaXMuY2JzW3Jlc3BvbnNlSlNPTi5pZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrID0gdGhpcy5zdWJzW3Jlc3BvbnNlSlNPTi5pZF0uY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrICYmICFzdWIpIHtcbiAgICAgIGlmIChyZXNwb25zZUpTT04uZXJyb3IpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnLS0tLT4gcmVzcG9uc2VKU09OIDogJywgcmVzcG9uc2VKU09OKTtcbiAgICAgICAgY2FsbGJhY2sucmVqZWN0KHJlc3BvbnNlSlNPTi5lcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjay5yZXNvbHZlKHJlc3BvbnNlSlNPTi5yZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBkZWxldGUgdGhpcy5jYnNbcmVzcG9uc2VKU09OLmlkXTtcblxuICAgICAgaWYgKHRoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXSkge1xuICAgICAgICBkZWxldGUgdGhpcy5zdWJzW3RoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXV07XG4gICAgICAgIGRlbGV0ZSB0aGlzLnVuc3ViW3Jlc3BvbnNlSlNPTi5pZF07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjYWxsYmFjayAmJiBzdWIpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3BvbnNlSlNPTi5wYXJhbXNbMV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYnVnKCdXYXJuaW5nOiB1bmtub3duIHdlYnNvY2tldCByZXNwb25zZUpTT046ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBMb2dpbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXIgVXNlcm5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIFBhc3N3b3JkXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCBhZnRlciBsb2dpbi5cbiAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAqL1xuXG5cbiAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlciwgcGFzc3dvcmQpIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBsb2dpbi4nLCB1c2VyLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdF9wcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIF90aGlzMi5jYWxsKFsxLCAnbG9naW4nLCBbdXNlciwgcGFzc3dvcmRdXSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja2NoYWluLlxuICAgKlxuICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICovXG5cblxuICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy53cykge1xuICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVycygpO1xuXG4gICAgICAvLyBUcnkgYW5kIGZpcmUgY2xvc2Ugb24gdGhlIGNvbm5lY3Rpb24uXG4gICAgICB0aGlzLndzLmNsb3NlKCk7XG5cbiAgICAgIC8vIENsZWFyIG91ciByZWZlcmVuY2VzIHNvIHRoYXQgaXQgY2FuIGJlIGdhcmJhZ2UgY29sbGVjdGVkLlxuICAgICAgdGhpcy53cyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXIgb3VyIHRpbWVvdXRzIGZvciBjb25uZWN0aW9uIHRpbWVvdXQgYW5kIGhlYWx0aCBjaGVjay5cbiAgICBjbGVhclRpbWVvdXQodGhpcy5jb25uZWN0aW9uVGltZW91dCk7XG4gICAgdGhpcy5jb25uZWN0aW9uVGltZW91dCA9IG51bGw7XG5cbiAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG5cbiAgICBjbGVhclRpbWVvdXQodGhpcy5yZWNvbm5lY3RUaW1lb3V0KTtcbiAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgLy8gVG9nZ2xlIHRoZSBjb25uZWN0ZWQgZmxhZy5cbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICB9O1xuXG4gIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgIGlmIChTT0NLRVRfREVCVUcpIHtcbiAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBwYXJhbXMgPSBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgcGFyYW1zW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZy5hcHBseShudWxsLCBwYXJhbXMpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gQ2hhaW5XZWJTb2NrZXQ7XG59KCk7XG5cbi8vIENvbnN0YW50cyBmb3IgU1RBVEVcblxuXG5DaGFpbldlYlNvY2tldC5zdGF0dXMgPSB7XG4gIFJFQ09OTkVDVEVEOiAncmVjb25uZWN0ZWQnLFxuICBPUEVOOiAnb3BlbicsXG4gIENMT1NFRDogJ2Nsb3NlZCcsXG4gIEVSUk9SOiAnZXJyb3InXG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBDaGFpbldlYlNvY2tldDsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfQXBpSW5zdGFuY2VzID0gcmVxdWlyZSgnLi9BcGlJbnN0YW5jZXMnKTtcblxudmFyIF9BcGlJbnN0YW5jZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQXBpSW5zdGFuY2VzKTtcblxudmFyIF9DaGFpbldlYlNvY2tldCA9IHJlcXVpcmUoJy4vQ2hhaW5XZWJTb2NrZXQnKTtcblxudmFyIF9DaGFpbldlYlNvY2tldDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DaGFpbldlYlNvY2tldCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBNYW5hZ2VyKF9yZWYpIHtcbiAgICB2YXIgdXJsID0gX3JlZi51cmwsXG4gICAgICAgIHVybHMgPSBfcmVmLnVybHM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTWFuYWdlcik7XG5cbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLnVybHMgPSB1cmxzLmZpbHRlcihmdW5jdGlvbiAoYSkge1xuICAgICAgcmV0dXJuIGEgIT09IHVybDtcbiAgICB9KTtcbiAgfVxuXG4gIE1hbmFnZXIucHJvdG90eXBlLmxvZ0ZhaWx1cmUgPSBmdW5jdGlvbiBsb2dGYWlsdXJlKHVybCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VuYWJsZSB0byBjb25uZWN0IHRvJywgdXJsICsgJywgc2tpcHBpbmcgdG8gbmV4dCBmdWxsIG5vZGUgQVBJIHNlcnZlcicpO1xuICB9O1xuXG4gIE1hbmFnZXIucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KCkge1xuICAgIHZhciBfY29ubmVjdCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogdHJ1ZTtcblxuICAgIHZhciB1cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHRoaXMudXJsO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIF9BcGlJbnN0YW5jZXMyLmRlZmF1bHQuaW5zdGFuY2UodXJsLCBfY29ubmVjdCkuaW5pdF9wcm9taXNlLnRoZW4ocmVzb2x2ZSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIF9BcGlJbnN0YW5jZXMyLmRlZmF1bHQuaW5zdGFuY2UoKS5jbG9zZSgpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgTWFuYWdlci5wcm90b3R5cGUuY29ubmVjdFdpdGhGYWxsYmFjayA9IGZ1bmN0aW9uIGNvbm5lY3RXaXRoRmFsbGJhY2soKSB7XG4gICAgdmFyIGNvbm5lY3QgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHRydWU7XG4gICAgdmFyIHVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogdGhpcy51cmw7XG4gICAgdmFyIGluZGV4ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAwO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciByZXNvbHZlID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiBudWxsO1xuICAgIHZhciByZWplY3QgPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IG51bGw7XG5cbiAgICBpZiAocmVqZWN0ICYmIGluZGV4ID4gdGhpcy51cmxzLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdUcmllZCAnICsgKGluZGV4ICsgMSkgKyAnIGNvbm5lY3Rpb25zLCBub25lIG9mIHdoaWNoIHdvcmtlZDogJyArIEpTT04uc3RyaW5naWZ5KHRoaXMudXJscy5jb25jYXQodGhpcy51cmwpKSkpO1xuICAgIH1cblxuICAgIHZhciBmYWxsYmFjayA9IGZ1bmN0aW9uIGZhbGxiYWNrKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgX3RoaXMubG9nRmFpbHVyZSh1cmwpO1xuICAgICAgcmV0dXJuIF90aGlzLmNvbm5lY3RXaXRoRmFsbGJhY2soY29ubmVjdCwgX3RoaXMudXJsc1tpbmRleF0sIGluZGV4ICsgMSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9O1xuXG4gICAgaWYgKHJlc29sdmUgJiYgcmVqZWN0KSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KGNvbm5lY3QsIHVybCkudGhlbihyZXNvbHZlKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZhbGxiYWNrKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgX3RoaXMuY29ubmVjdChjb25uZWN0KS50aGVuKHJlc29sdmUpLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZmFsbGJhY2socmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIE1hbmFnZXIucHJvdG90eXBlLmNoZWNrQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiBjaGVja0Nvbm5lY3Rpb25zKCkge1xuICAgIHZhciBycGNfdXNlciA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogJyc7XG4gICAgdmFyIHJwY19wYXNzd29yZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogJyc7XG5cbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIHZhciByZXNvbHZlID0gYXJndW1lbnRzWzJdO1xuICAgIHZhciByZWplY3QgPSBhcmd1bWVudHNbM107XG5cbiAgICB2YXIgY29ubmVjdGlvblN0YXJ0VGltZXMgPSB7fTtcblxuICAgIHZhciBjaGVja0Z1bmN0aW9uID0gZnVuY3Rpb24gY2hlY2tGdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBmdWxsTGlzdCA9IF90aGlzMi51cmxzLmNvbmNhdChfdGhpczIudXJsKTtcbiAgICAgIHZhciBjb25uZWN0aW9uUHJvbWlzZXMgPSBbXTtcblxuICAgICAgZnVsbExpc3QuZm9yRWFjaChmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHZhciBjb25uID0gbmV3IF9DaGFpbldlYlNvY2tldDIuZGVmYXVsdCh1cmwsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICAgICAgY29ubmVjdGlvblN0YXJ0VGltZXNbdXJsXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICBjb25uZWN0aW9uUHJvbWlzZXMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbm4ubG9naW4ocnBjX3VzZXIsIHJwY19wYXNzd29yZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3JlZjI7XG5cbiAgICAgICAgICAgIGNvbm4uY2xvc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBfcmVmMiA9IHt9LCBfcmVmMlt1cmxdID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBjb25uZWN0aW9uU3RhcnRUaW1lc1t1cmxdLCBfcmVmMjtcbiAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodXJsID09PSBfdGhpczIudXJsKSB7XG4gICAgICAgICAgICAgIF90aGlzMi51cmwgPSBfdGhpczIudXJsc1swXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF90aGlzMi51cmxzID0gX3RoaXMyLnVybHMuZmlsdGVyKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEgIT09IHVybDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbm4uY2xvc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBQcm9taXNlLmFsbChjb25uZWN0aW9uUHJvbWlzZXMubWFwKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHJldHVybiBhKCk7XG4gICAgICB9KSkudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIHJlc29sdmUocmVzLmZpbHRlcihmdW5jdGlvbiAoYSkge1xuICAgICAgICAgIHJldHVybiAhIWE7XG4gICAgICAgIH0pLnJlZHVjZShmdW5jdGlvbiAoZiwgYSkge1xuICAgICAgICAgIHZhciBrZXkgPSBPYmplY3Qua2V5cyhhKVswXTtcbiAgICAgICAgICBmW2tleV0gPSBhW2tleV07XG4gICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgIH0sIHt9KSk7XG4gICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfdGhpczIuY2hlY2tDb25uZWN0aW9ucyhycGNfdXNlciwgcnBjX3Bhc3N3b3JkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmIChyZXNvbHZlICYmIHJlamVjdCkge1xuICAgICAgY2hlY2tGdW5jdGlvbihyZXNvbHZlLCByZWplY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoY2hlY2tGdW5jdGlvbik7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBNYW5hZ2VyO1xufSgpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBNYW5hZ2VyOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEdyYXBoZW5lQXBpID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBHcmFwaGVuZUFwaSh3c19ycGMsIGFwaV9uYW1lKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEdyYXBoZW5lQXBpKTtcblxuICAgIHRoaXMud3NfcnBjID0gd3NfcnBjO1xuICAgIHRoaXMuYXBpX25hbWUgPSBhcGlfbmFtZTtcbiAgfVxuXG4gIEdyYXBoZW5lQXBpLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgcmV0dXJuIHRoaXMud3NfcnBjLmNhbGwoWzEsIHRoaXMuYXBpX25hbWUsIFtdXSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgIF90aGlzLmFwaV9pZCA9IHJlc3BvbnNlO1xuICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH0pO1xuICB9O1xuXG4gIEdyYXBoZW5lQXBpLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24gZXhlYyhtZXRob2QsIHBhcmFtcykge1xuICAgIHJldHVybiB0aGlzLndzX3JwYy5jYWxsKFt0aGlzLmFwaV9pZCwgbWV0aG9kLCBwYXJhbXNdKS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCchISEgR3JhcGhlbmVBcGkgZXJyb3I6ICcsIG1ldGhvZCwgcGFyYW1zLCBlcnJvciwgSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBHcmFwaGVuZUFwaTtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gR3JhcGhlbmVBcGk7IiwiIl19
