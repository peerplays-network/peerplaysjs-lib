(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.peerplays_ws = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _ChainWebSocket = require("./ChainWebSocket");

var _ChainWebSocket2 = _interopRequireDefault(_ChainWebSocket);

var _GrapheneApi = require("./GrapheneApi");

var _GrapheneApi2 = _interopRequireDefault(_GrapheneApi);

var _ChainConfig = require("./ChainConfig");

var _ChainConfig2 = _interopRequireDefault(_ChainConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // var { List } = require("immutable");


var inst = void 0;

/**
    Configure: configure as follows `Apis.instance("ws://localhost:8090").init_promise`.  This returns a promise, once resolved the connection is ready.

    Import: import { Apis } from "@graphene/chain"

    Short-hand: Apis.db("method", "parm1", 2, 3, ...).  Returns a promise with results.

    Additional usage: Apis.instance().db_api().exec("method", ["method", "parm1", 2, 3, ...]).  Returns a promise with results.
*/

exports.default = {
    setRpcConnectionStatusCallback: function setRpcConnectionStatusCallback(callback) {
        this.statusCb = callback;
        if (inst) inst.setRpcConnectionStatusCallback(callback);
    },

    /**
        @arg {string} cs is only provided in the first call
        @return {Apis} singleton .. Check Apis.instance().init_promise to know when the connection is established
    */
    reset: function reset() {
        var cs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8090";
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
        var cs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ws://localhost:8090";
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
        return Apis.instance().chain_id;
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

var ApisInstance = function () {
    function ApisInstance() {
        _classCallCheck(this, ApisInstance);
    }

    /** @arg {string} connection .. */
    ApisInstance.prototype.connect = function connect(cs, connectTimeout) {
        var _this = this;

        // console.log("INFO\tApiInstances\tconnect\t", cs);

        var rpc_user = "",
            rpc_password = "";
        if (typeof window !== "undefined" && window.location && window.location.protocol === "https:" && cs.indexOf("wss://") < 0) {
            throw new Error("Secure domains require wss connection");
        }

        this.ws_rpc = new _ChainWebSocket2.default(cs, this.statusCb, connectTimeout);

        this.init_promise = this.ws_rpc.login(rpc_user, rpc_password).then(function () {
            console.log("Connected to API node:", cs);
            _this._db = new _GrapheneApi2.default(_this.ws_rpc, "database");
            _this._net = new _GrapheneApi2.default(_this.ws_rpc, "network_broadcast");
            _this._hist = new _GrapheneApi2.default(_this.ws_rpc, "history");
            _this._crypt = new _GrapheneApi2.default(_this.ws_rpc, "crypto");
            _this._bookie = new _GrapheneApi2.default(_this.ws_rpc, "bookie");
            var db_promise = _this._db.init().then(function () {
                //https://github.com/cryptonomex/graphene/wiki/chain-locked-tx
                return _this._db.exec("get_chain_id", []).then(function (_chain_id) {
                    _this.chain_id = _chain_id;
                    return _ChainConfig2.default.setChainId(_chain_id);
                    //DEBUG console.log("chain_id1",this.chain_id)
                });
            });
            _this.ws_rpc.on_reconnect = function () {
                _this.ws_rpc.login("", "").then(function () {
                    _this._db.init().then(function () {
                        if (_this.statusCb) _this.statusCb(_ChainWebSocket2.default.status.RECONNECTED);
                    });
                    _this._net.init();
                    _this._hist.init();
                    _this._crypt.init();
                    _this._bookie.init();
                });
            };
            return Promise.all([db_promise, _this._net.init(), _this._hist.init(), _this._crypt.init().catch(function (e) {
                return console.error("ApiInstance\tCrypto API Error", e);
            }), // Temporary squash crypto API error until the API is upgraded everywhere
            _this._bookie.init()]);
        });
    };

    ApisInstance.prototype.close = function close() {
        if (this.ws_rpc) this.ws_rpc.close();
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

module.exports = exports["default"];
},{"./ChainConfig":2,"./ChainWebSocket":3,"./GrapheneApi":4}],2:[function(require,module,exports){
(function (process){
"use strict";

exports.__esModule = true;
var _this = void 0;

var ecc_config = {
    address_prefix: process.env.npm_config__graphene_ecc_default_address_prefix || "GPH"
};

_this = {
    core_asset: "CORE",
    address_prefix: "GPH",
    expire_in_secs: 15,
    expire_in_secs_proposal: 24 * 60 * 60,
    review_in_secs_committee: 24 * 60 * 60,
    networks: {
        BitShares: {
            core_asset: "BTS",
            address_prefix: "BTS",
            chain_id: "4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8"
        },
        Muse: {
            core_asset: "MUSE",
            address_prefix: "MUSE",
            chain_id: "45ad2d3f9ef92a49b55c2227eb06123f613bb35dd08bd876f2aea21925a67a67"
        },
        Test: {
            core_asset: "TEST",
            address_prefix: "TEST",
            chain_id: "39f5e2ede1f8bc1a3a54a7914414e3779e33193f1f5693510e73cb7a87617447"
        },
        Obelisk: {
            core_asset: "GOV",
            address_prefix: "FEW",
            chain_id: "1cfde7c388b9e8ac06462d68aadbd966b58f88797637d9af805b4560b0e9661e"
        },
        Peerplays: {
            core_asset: "PPY",
            address_prefix: "PPY",
            chain_id: "594e284d3c733afaaa34a5e99a39edb31e5192fab023101d691d952034902237"
        }
    },

    /** Set a few properties for known chain IDs. */
    setChainId: function setChainId(chain_id) {

        var i = void 0,
            len = void 0,
            network = void 0,
            network_name = void 0,
            ref = void 0;
        ref = Object.keys(_this.networks);

        for (i = 0, len = ref.length; i < len; i++) {

            network_name = ref[i];
            network = _this.networks[network_name];

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
            console.log("Unknown chain id (this may be a testnet)", chain_id);
        }
    },

    reset: function reset() {
        _this.core_asset = "CORE";
        _this.address_prefix = "GPH";
        ecc_config.address_prefix = "GPH";
        _this.expire_in_secs = 15;
        _this.expire_in_secs_proposal = 24 * 60 * 60;

        console.log("Chain config reset");
    },

    setPrefix: function setPrefix() {
        var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "GPH";

        _this.address_prefix = prefix;
        ecc_config.address_prefix = prefix;
    }
};

exports.default = _this;
module.exports = exports["default"];
}).call(this,require('_process'))

},{"_process":5}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SOCKET_DEBUG = false;

var SUBSCRIBE_OPERATIONS = ['set_subscribe_callback', 'subscribe_to_market', 'broadcast_transaction_with_callback', 'set_pending_transaction_callback'];

var UNSUBSCRIBE_OPERATIONS = ['unsubscribe_from_market', 'unsubscribe_from_accounts'];

var HEALTH_CHECK_INTERVAL = 10000;

var ChainWebSocket = function () {

    /**
     *Creates an instance of ChainWebSocket.
     * @param {string}      serverAddress           The address of the websocket to connect to.
     * @param {function}    statusCb                A callback which will be called when status events occur.
     * @param {number}      [connectTimeout=10000]  The allowed time for a connection attempt to complete.
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

        // An incrementing ID for each request so that we can pair it with the response from the websocket.
        this.cbId = 0;

        // Objects to store key/value pairs for callbacks, subscription callbacks and unsubscribe callbacks.
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
            this.ws = new WebSocket(this.serverAddress);
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
     * any listeners that are still attached could prevent the old sockets from being garbage collected.
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
     * A function that is passed to a new promise that stores the resolve and reject callbacks in the state.
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

        var sub = false,
            callback = null;

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
            console.log.apply(null, arguments);
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
module.exports = exports['default'];
},{}],4:[function(require,module,exports){
"use strict";

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
            console.log("!!! GrapheneApi error: ", method, params, error, JSON.stringify(error));
            throw error;
        });
    };

    return GrapheneApi;
}();

exports.default = GrapheneApi;
module.exports = exports["default"];
},{}],5:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjanMvc3JjL0FwaUluc3RhbmNlcy5qcyIsImNqcy9zcmMvQ2hhaW5Db25maWcuanMiLCJjanMvc3JjL0NoYWluV2ViU29ja2V0LmpzIiwiY2pzL3NyYy9HcmFwaGVuZUFwaS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9DaGFpbldlYlNvY2tldCA9IHJlcXVpcmUoXCIuL0NoYWluV2ViU29ja2V0XCIpO1xuXG52YXIgX0NoYWluV2ViU29ja2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0NoYWluV2ViU29ja2V0KTtcblxudmFyIF9HcmFwaGVuZUFwaSA9IHJlcXVpcmUoXCIuL0dyYXBoZW5lQXBpXCIpO1xuXG52YXIgX0dyYXBoZW5lQXBpMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0dyYXBoZW5lQXBpKTtcblxudmFyIF9DaGFpbkNvbmZpZyA9IHJlcXVpcmUoXCIuL0NoYWluQ29uZmlnXCIpO1xuXG52YXIgX0NoYWluQ29uZmlnMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0NoYWluQ29uZmlnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH0gLy8gdmFyIHsgTGlzdCB9ID0gcmVxdWlyZShcImltbXV0YWJsZVwiKTtcblxuXG52YXIgaW5zdCA9IHZvaWQgMDtcblxuLyoqXG4gICAgQ29uZmlndXJlOiBjb25maWd1cmUgYXMgZm9sbG93cyBgQXBpcy5pbnN0YW5jZShcIndzOi8vbG9jYWxob3N0OjgwOTBcIikuaW5pdF9wcm9taXNlYC4gIFRoaXMgcmV0dXJucyBhIHByb21pc2UsIG9uY2UgcmVzb2x2ZWQgdGhlIGNvbm5lY3Rpb24gaXMgcmVhZHkuXG5cbiAgICBJbXBvcnQ6IGltcG9ydCB7IEFwaXMgfSBmcm9tIFwiQGdyYXBoZW5lL2NoYWluXCJcblxuICAgIFNob3J0LWhhbmQ6IEFwaXMuZGIoXCJtZXRob2RcIiwgXCJwYXJtMVwiLCAyLCAzLCAuLi4pLiAgUmV0dXJucyBhIHByb21pc2Ugd2l0aCByZXN1bHRzLlxuXG4gICAgQWRkaXRpb25hbCB1c2FnZTogQXBpcy5pbnN0YW5jZSgpLmRiX2FwaSgpLmV4ZWMoXCJtZXRob2RcIiwgW1wibWV0aG9kXCIsIFwicGFybTFcIiwgMiwgMywgLi4uXSkuICBSZXR1cm5zIGEgcHJvbWlzZSB3aXRoIHJlc3VsdHMuXG4qL1xuXG5leHBvcnRzLmRlZmF1bHQgPSB7XG4gICAgc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrOiBmdW5jdGlvbiBzZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5zdGF0dXNDYiA9IGNhbGxiYWNrO1xuICAgICAgICBpZiAoaW5zdCkgaW5zdC5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgICAgQGFyZyB7c3RyaW5nfSBjcyBpcyBvbmx5IHByb3ZpZGVkIGluIHRoZSBmaXJzdCBjYWxsXG4gICAgICAgIEByZXR1cm4ge0FwaXN9IHNpbmdsZXRvbiAuLiBDaGVjayBBcGlzLmluc3RhbmNlKCkuaW5pdF9wcm9taXNlIHRvIGtub3cgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZFxuICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICB2YXIgY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IFwid3M6Ly9sb2NhbGhvc3Q6ODA5MFwiO1xuICAgICAgICB2YXIgY29ubmVjdCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiA0MDAwO1xuXG4gICAgICAgIGlmIChpbnN0KSB7XG4gICAgICAgICAgICBpbnN0LmNsb3NlKCk7XG4gICAgICAgICAgICBpbnN0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0ID0gbmV3IEFwaXNJbnN0YW5jZSgpO1xuICAgICAgICBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayh0aGlzLnN0YXR1c0NiKTtcblxuICAgICAgICBpZiAoaW5zdCAmJiBjb25uZWN0KSB7XG4gICAgICAgICAgICBpbnN0LmNvbm5lY3QoY3MsIGNvbm5lY3RUaW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnN0O1xuICAgIH0sXG4gICAgaW5zdGFuY2U6IGZ1bmN0aW9uIGluc3RhbmNlKCkge1xuICAgICAgICB2YXIgY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IFwid3M6Ly9sb2NhbGhvc3Q6ODA5MFwiO1xuICAgICAgICB2YXIgY29ubmVjdCA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiA0MDAwO1xuXG4gICAgICAgIGlmICghaW5zdCkge1xuICAgICAgICAgICAgaW5zdCA9IG5ldyBBcGlzSW5zdGFuY2UoKTtcbiAgICAgICAgICAgIGluc3Quc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKHRoaXMuc3RhdHVzQ2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluc3QgJiYgY29ubmVjdCkge1xuICAgICAgICAgICAgaW5zdC5jb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5zdDtcbiAgICB9LFxuICAgIGNoYWluSWQ6IGZ1bmN0aW9uIGNoYWluSWQoKSB7XG4gICAgICAgIHJldHVybiBBcGlzLmluc3RhbmNlKCkuY2hhaW5faWQ7XG4gICAgfSxcbiAgICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgIGlmIChpbnN0KSB7XG4gICAgICAgICAgICBpbnN0LmNsb3NlKCk7XG4gICAgICAgICAgICBpbnN0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBkYjogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmRiX2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpLFxuICAgIC8vIG5ldHdvcms6IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5uZXR3b3JrX2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpLFxuICAgIC8vIGhpc3Rvcnk6IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5oaXN0b3J5X2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpLFxuICAgIC8vIGNyeXB0bzogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmNyeXB0b19hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKVxuXG59O1xuXG52YXIgQXBpc0luc3RhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFwaXNJbnN0YW5jZSgpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEFwaXNJbnN0YW5jZSk7XG4gICAgfVxuXG4gICAgLyoqIEBhcmcge3N0cmluZ30gY29ubmVjdGlvbiAuLiAqL1xuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uIGNvbm5lY3QoY3MsIGNvbm5lY3RUaW1lb3V0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJJTkZPXFx0QXBpSW5zdGFuY2VzXFx0Y29ubmVjdFxcdFwiLCBjcyk7XG5cbiAgICAgICAgdmFyIHJwY191c2VyID0gXCJcIixcbiAgICAgICAgICAgIHJwY19wYXNzd29yZCA9IFwiXCI7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5sb2NhdGlvbiAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgY3MuaW5kZXhPZihcIndzczovL1wiKSA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY3VyZSBkb21haW5zIHJlcXVpcmUgd3NzIGNvbm5lY3Rpb25cIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLndzX3JwYyA9IG5ldyBfQ2hhaW5XZWJTb2NrZXQyLmRlZmF1bHQoY3MsIHRoaXMuc3RhdHVzQ2IsIGNvbm5lY3RUaW1lb3V0KTtcblxuICAgICAgICB0aGlzLmluaXRfcHJvbWlzZSA9IHRoaXMud3NfcnBjLmxvZ2luKHJwY191c2VyLCBycGNfcGFzc3dvcmQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWQgdG8gQVBJIG5vZGU6XCIsIGNzKTtcbiAgICAgICAgICAgIF90aGlzLl9kYiA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCBcImRhdGFiYXNlXCIpO1xuICAgICAgICAgICAgX3RoaXMuX25ldCA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCBcIm5ldHdvcmtfYnJvYWRjYXN0XCIpO1xuICAgICAgICAgICAgX3RoaXMuX2hpc3QgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgXCJoaXN0b3J5XCIpO1xuICAgICAgICAgICAgX3RoaXMuX2NyeXB0ID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsIFwiY3J5cHRvXCIpO1xuICAgICAgICAgICAgX3RoaXMuX2Jvb2tpZSA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCBcImJvb2tpZVwiKTtcbiAgICAgICAgICAgIHZhciBkYl9wcm9taXNlID0gX3RoaXMuX2RiLmluaXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9jcnlwdG9ub21leC9ncmFwaGVuZS93aWtpL2NoYWluLWxvY2tlZC10eFxuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5fZGIuZXhlYyhcImdldF9jaGFpbl9pZFwiLCBbXSkudGhlbihmdW5jdGlvbiAoX2NoYWluX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNoYWluX2lkID0gX2NoYWluX2lkO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX0NoYWluQ29uZmlnMi5kZWZhdWx0LnNldENoYWluSWQoX2NoYWluX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgLy9ERUJVRyBjb25zb2xlLmxvZyhcImNoYWluX2lkMVwiLHRoaXMuY2hhaW5faWQpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF90aGlzLndzX3JwYy5vbl9yZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMud3NfcnBjLmxvZ2luKFwiXCIsIFwiXCIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fZGIuaW5pdCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLnN0YXR1c0NiKSBfdGhpcy5zdGF0dXNDYihfQ2hhaW5XZWJTb2NrZXQyLmRlZmF1bHQuc3RhdHVzLlJFQ09OTkVDVEVEKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9uZXQuaW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5faGlzdC5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9jcnlwdC5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9ib29raWUuaW5pdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbZGJfcHJvbWlzZSwgX3RoaXMuX25ldC5pbml0KCksIF90aGlzLl9oaXN0LmluaXQoKSwgX3RoaXMuX2NyeXB0LmluaXQoKS5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKFwiQXBpSW5zdGFuY2VcXHRDcnlwdG8gQVBJIEVycm9yXCIsIGUpO1xuICAgICAgICAgICAgfSksIC8vIFRlbXBvcmFyeSBzcXVhc2ggY3J5cHRvIEFQSSBlcnJvciB1bnRpbCB0aGUgQVBJIGlzIHVwZ3JhZGVkIGV2ZXJ5d2hlcmVcbiAgICAgICAgICAgIF90aGlzLl9ib29raWUuaW5pdCgpXSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLndzX3JwYykgdGhpcy53c19ycGMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy53c19ycGMgPSBudWxsO1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmRiX2FwaSA9IGZ1bmN0aW9uIGRiX2FwaSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RiO1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLm5ldHdvcmtfYXBpID0gZnVuY3Rpb24gbmV0d29ya19hcGkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uZXQ7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuaGlzdG9yeV9hcGkgPSBmdW5jdGlvbiBoaXN0b3J5X2FwaSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hpc3Q7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuY3J5cHRvX2FwaSA9IGZ1bmN0aW9uIGNyeXB0b19hcGkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcnlwdDtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5ib29raWVfYXBpID0gZnVuY3Rpb24gYm9va2llX2FwaSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Jvb2tpZTtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2sgPSBmdW5jdGlvbiBzZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5zdGF0dXNDYiA9IGNhbGxiYWNrO1xuICAgIH07XG5cbiAgICByZXR1cm4gQXBpc0luc3RhbmNlO1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xudmFyIF90aGlzID0gdm9pZCAwO1xuXG52YXIgZWNjX2NvbmZpZyA9IHtcbiAgICBhZGRyZXNzX3ByZWZpeDogcHJvY2Vzcy5lbnYubnBtX2NvbmZpZ19fZ3JhcGhlbmVfZWNjX2RlZmF1bHRfYWRkcmVzc19wcmVmaXggfHwgXCJHUEhcIlxufTtcblxuX3RoaXMgPSB7XG4gICAgY29yZV9hc3NldDogXCJDT1JFXCIsXG4gICAgYWRkcmVzc19wcmVmaXg6IFwiR1BIXCIsXG4gICAgZXhwaXJlX2luX3NlY3M6IDE1LFxuICAgIGV4cGlyZV9pbl9zZWNzX3Byb3Bvc2FsOiAyNCAqIDYwICogNjAsXG4gICAgcmV2aWV3X2luX3NlY3NfY29tbWl0dGVlOiAyNCAqIDYwICogNjAsXG4gICAgbmV0d29ya3M6IHtcbiAgICAgICAgQml0U2hhcmVzOiB7XG4gICAgICAgICAgICBjb3JlX2Fzc2V0OiBcIkJUU1wiLFxuICAgICAgICAgICAgYWRkcmVzc19wcmVmaXg6IFwiQlRTXCIsXG4gICAgICAgICAgICBjaGFpbl9pZDogXCI0MDE4ZDc4NDRjNzhmNmE2YzQxYzZhNTUyYjg5ODAyMjMxMGZjNWRlYzA2ZGE0NjdlZTc5MDVhOGRhZDUxMmM4XCJcbiAgICAgICAgfSxcbiAgICAgICAgTXVzZToge1xuICAgICAgICAgICAgY29yZV9hc3NldDogXCJNVVNFXCIsXG4gICAgICAgICAgICBhZGRyZXNzX3ByZWZpeDogXCJNVVNFXCIsXG4gICAgICAgICAgICBjaGFpbl9pZDogXCI0NWFkMmQzZjllZjkyYTQ5YjU1YzIyMjdlYjA2MTIzZjYxM2JiMzVkZDA4YmQ4NzZmMmFlYTIxOTI1YTY3YTY3XCJcbiAgICAgICAgfSxcbiAgICAgICAgVGVzdDoge1xuICAgICAgICAgICAgY29yZV9hc3NldDogXCJURVNUXCIsXG4gICAgICAgICAgICBhZGRyZXNzX3ByZWZpeDogXCJURVNUXCIsXG4gICAgICAgICAgICBjaGFpbl9pZDogXCIzOWY1ZTJlZGUxZjhiYzFhM2E1NGE3OTE0NDE0ZTM3NzllMzMxOTNmMWY1NjkzNTEwZTczY2I3YTg3NjE3NDQ3XCJcbiAgICAgICAgfSxcbiAgICAgICAgT2JlbGlzazoge1xuICAgICAgICAgICAgY29yZV9hc3NldDogXCJHT1ZcIixcbiAgICAgICAgICAgIGFkZHJlc3NfcHJlZml4OiBcIkZFV1wiLFxuICAgICAgICAgICAgY2hhaW5faWQ6IFwiMWNmZGU3YzM4OGI5ZThhYzA2NDYyZDY4YWFkYmQ5NjZiNThmODg3OTc2MzdkOWFmODA1YjQ1NjBiMGU5NjYxZVwiXG4gICAgICAgIH0sXG4gICAgICAgIFBlZXJwbGF5czoge1xuICAgICAgICAgICAgY29yZV9hc3NldDogXCJQUFlcIixcbiAgICAgICAgICAgIGFkZHJlc3NfcHJlZml4OiBcIlBQWVwiLFxuICAgICAgICAgICAgY2hhaW5faWQ6IFwiNTk0ZTI4NGQzYzczM2FmYWFhMzRhNWU5OWEzOWVkYjMxZTUxOTJmYWIwMjMxMDFkNjkxZDk1MjAzNDkwMjIzN1wiXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqIFNldCBhIGZldyBwcm9wZXJ0aWVzIGZvciBrbm93biBjaGFpbiBJRHMuICovXG4gICAgc2V0Q2hhaW5JZDogZnVuY3Rpb24gc2V0Q2hhaW5JZChjaGFpbl9pZCkge1xuXG4gICAgICAgIHZhciBpID0gdm9pZCAwLFxuICAgICAgICAgICAgbGVuID0gdm9pZCAwLFxuICAgICAgICAgICAgbmV0d29yayA9IHZvaWQgMCxcbiAgICAgICAgICAgIG5ldHdvcmtfbmFtZSA9IHZvaWQgMCxcbiAgICAgICAgICAgIHJlZiA9IHZvaWQgMDtcbiAgICAgICAgcmVmID0gT2JqZWN0LmtleXMoX3RoaXMubmV0d29ya3MpO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXG4gICAgICAgICAgICBuZXR3b3JrX25hbWUgPSByZWZbaV07XG4gICAgICAgICAgICBuZXR3b3JrID0gX3RoaXMubmV0d29ya3NbbmV0d29ya19uYW1lXTtcblxuICAgICAgICAgICAgaWYgKG5ldHdvcmsuY2hhaW5faWQgPT09IGNoYWluX2lkKSB7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5uZXR3b3JrX25hbWUgPSBuZXR3b3JrX25hbWU7XG5cbiAgICAgICAgICAgICAgICBpZiAobmV0d29yay5hZGRyZXNzX3ByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hZGRyZXNzX3ByZWZpeCA9IG5ldHdvcmsuYWRkcmVzc19wcmVmaXg7XG4gICAgICAgICAgICAgICAgICAgIGVjY19jb25maWcuYWRkcmVzc19wcmVmaXggPSBuZXR3b3JrLmFkZHJlc3NfcHJlZml4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiSU5GTyAgICBDb25maWd1cmVkIGZvclwiLCBuZXR3b3JrX25hbWUsIFwiOlwiLCBuZXR3b3JrLmNvcmVfYXNzZXQsIFwiXFxuXCIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbmV0d29ya19uYW1lOiBuZXR3b3JrX25hbWUsXG4gICAgICAgICAgICAgICAgICAgIG5ldHdvcms6IG5ldHdvcmtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFfdGhpcy5uZXR3b3JrX25hbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBjaGFpbiBpZCAodGhpcyBtYXkgYmUgYSB0ZXN0bmV0KVwiLCBjaGFpbl9pZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBfdGhpcy5jb3JlX2Fzc2V0ID0gXCJDT1JFXCI7XG4gICAgICAgIF90aGlzLmFkZHJlc3NfcHJlZml4ID0gXCJHUEhcIjtcbiAgICAgICAgZWNjX2NvbmZpZy5hZGRyZXNzX3ByZWZpeCA9IFwiR1BIXCI7XG4gICAgICAgIF90aGlzLmV4cGlyZV9pbl9zZWNzID0gMTU7XG4gICAgICAgIF90aGlzLmV4cGlyZV9pbl9zZWNzX3Byb3Bvc2FsID0gMjQgKiA2MCAqIDYwO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2hhaW4gY29uZmlnIHJlc2V0XCIpO1xuICAgIH0sXG5cbiAgICBzZXRQcmVmaXg6IGZ1bmN0aW9uIHNldFByZWZpeCgpIHtcbiAgICAgICAgdmFyIHByZWZpeCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogXCJHUEhcIjtcblxuICAgICAgICBfdGhpcy5hZGRyZXNzX3ByZWZpeCA9IHByZWZpeDtcbiAgICAgICAgZWNjX2NvbmZpZy5hZGRyZXNzX3ByZWZpeCA9IHByZWZpeDtcbiAgICB9XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBfdGhpcztcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgU09DS0VUX0RFQlVHID0gZmFsc2U7XG5cbnZhciBTVUJTQ1JJQkVfT1BFUkFUSU9OUyA9IFsnc2V0X3N1YnNjcmliZV9jYWxsYmFjaycsICdzdWJzY3JpYmVfdG9fbWFya2V0JywgJ2Jyb2FkY2FzdF90cmFuc2FjdGlvbl93aXRoX2NhbGxiYWNrJywgJ3NldF9wZW5kaW5nX3RyYW5zYWN0aW9uX2NhbGxiYWNrJ107XG5cbnZhciBVTlNVQlNDUklCRV9PUEVSQVRJT05TID0gWyd1bnN1YnNjcmliZV9mcm9tX21hcmtldCcsICd1bnN1YnNjcmliZV9mcm9tX2FjY291bnRzJ107XG5cbnZhciBIRUFMVEhfQ0hFQ0tfSU5URVJWQUwgPSAxMDAwMDtcblxudmFyIENoYWluV2ViU29ja2V0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgLyoqXG4gICAgICpDcmVhdGVzIGFuIGluc3RhbmNlIG9mIENoYWluV2ViU29ja2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIHNlcnZlckFkZHJlc3MgICAgICAgICAgIFRoZSBhZGRyZXNzIG9mIHRoZSB3ZWJzb2NrZXQgdG8gY29ubmVjdCB0by5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSAgICBzdGF0dXNDYiAgICAgICAgICAgICAgICBBIGNhbGxiYWNrIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gc3RhdHVzIGV2ZW50cyBvY2N1ci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gICAgICBbY29ubmVjdFRpbWVvdXQ9MTAwMDBdICBUaGUgYWxsb3dlZCB0aW1lIGZvciBhIGNvbm5lY3Rpb24gYXR0ZW1wdCB0byBjb21wbGV0ZS5cbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBDaGFpbldlYlNvY2tldChzZXJ2ZXJBZGRyZXNzLCBzdGF0dXNDYikge1xuICAgICAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDEwMDAwO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDaGFpbldlYlNvY2tldCk7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNDYiA9IHN0YXR1c0NiO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBzZXJ2ZXJBZGRyZXNzO1xuICAgICAgICB0aGlzLnRpbWVvdXRJbnRlcnZhbCA9IGNvbm5lY3RUaW1lb3V0O1xuXG4gICAgICAgIC8vIFRoZSBjdXJyZW5jdCBjb25uZWN0aW9uIHN0YXRlIG9mIHRoZSB3ZWJzb2NrZXQuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgLy8gQ2FsbGJhY2sgdG8gZXhlY3V0ZSB3aGVuIHRoZSB3ZWJzb2NrZXQgaXMgcmVjb25uZWN0ZWQuXG4gICAgICAgIHRoaXMub25fcmVjb25uZWN0ID0gbnVsbDtcblxuICAgICAgICAvLyBBbiBpbmNyZW1lbnRpbmcgSUQgZm9yIGVhY2ggcmVxdWVzdCBzbyB0aGF0IHdlIGNhbiBwYWlyIGl0IHdpdGggdGhlIHJlc3BvbnNlIGZyb20gdGhlIHdlYnNvY2tldC5cbiAgICAgICAgdGhpcy5jYklkID0gMDtcblxuICAgICAgICAvLyBPYmplY3RzIHRvIHN0b3JlIGtleS92YWx1ZSBwYWlycyBmb3IgY2FsbGJhY2tzLCBzdWJzY3JpcHRpb24gY2FsbGJhY2tzIGFuZCB1bnN1YnNjcmliZSBjYWxsYmFja3MuXG4gICAgICAgIHRoaXMuY2JzID0ge307XG4gICAgICAgIHRoaXMuc3VicyA9IHt9O1xuICAgICAgICB0aGlzLnVuc3ViID0ge307XG5cbiAgICAgICAgLy8gQ3VycmVudCBjb25uZWN0aW9uIHByb21pc2VzJyByZWplY3Rpb25cbiAgICAgICAgdGhpcy5jdXJyZW50UmVzb2x2ZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY3VycmVudFJlamVjdCA9IG51bGw7XG5cbiAgICAgICAgLy8gSGVhbHRoIGNoZWNrIGZvciB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tDaGFpbi5cbiAgICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG5cbiAgICAgICAgLy8gQ29weSB0aGUgY29uc3RhbnRzIHRvIHRoaXMgaW5zdGFuY2UuXG4gICAgICAgIHRoaXMuc3RhdHVzID0gQ2hhaW5XZWJTb2NrZXQuc3RhdHVzO1xuXG4gICAgICAgIC8vIEJpbmQgdGhlIGZ1bmN0aW9ucyB0byB0aGUgaW5zdGFuY2UuXG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uT3BlbiA9IHRoaXMub25Db25uZWN0aW9uT3Blbi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlID0gdGhpcy5vbkNvbm5lY3Rpb25DbG9zZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvblRlcm1pbmF0ZSA9IHRoaXMub25Db25uZWN0aW9uVGVybWluYXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uRXJyb3IgPSB0aGlzLm9uQ29ubmVjdGlvbkVycm9yLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uVGltZW91dCA9IHRoaXMub25Db25uZWN0aW9uVGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb24gPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uUHJvbWlzZSA9IHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IHRoaXMubGlzdGVuZXIuYmluZCh0aGlzKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGluaXRpYWwgY29ubmVjdGlvbiB0aGUgYmxvY2tjaGFpbi5cbiAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja2NoYWluLlxuICAgICAqXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uKCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgY3JlYXRlIGNvbm5lY3Rpb24nKTtcblxuICAgICAgICAvLyBDbGVhciBhbnkgcG9zc2libGUgcmVjb25uZWN0IHRpbWVycy5cbiAgICAgICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHByb21pc2UgZm9yIHRoaXMgY29ubmVjdGlvblxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdF9wcm9taXNlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3RfcHJvbWlzZSA9IG5ldyBQcm9taXNlKHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXR0ZW1wdCB0byBjcmVhdGUgdGhlIHdlYnNvY2tldFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJBZGRyZXNzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNldCBhIHRpbWVvdXQgdG8gdHJ5IGFuZCByZWNvbm5lY3QgaGVyZS5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuXG4gICAgICAgIC8vIEhhbmRsZSB0aW1lb3V0cyB0byB0aGUgd2Vic29ja2V0J3MgaW5pdGlhbCBjb25uZWN0aW9uLlxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQsIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLnJlc2V0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uIHJlc2V0Q29ubmVjdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2UgdGhlIFdlYnNvY2tldCBpZiBpdHMgc3RpbGwgJ2hhbGYtb3BlbidcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBvbmx5IGV2ZXIgaGF2ZSBvbmUgdGltZW91dCBydW5uaW5nIHRvIHJlY29ubmVjdC5cbiAgICAgICAgaWYgKCF0aGlzLnJlY29ubmVjdFRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCByZXNldCBjb25uZWN0aW9uJywgdGhpcy50aW1lb3V0SW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLmNyZWF0ZUNvbm5lY3Rpb24sIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlamVjdCB0aGUgY3VycmVudCBwcm9taXNlIGlmIHRoZXJlIGlzIG9uZS4gXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZWplY3QpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlamVjdChuZXcgRXJyb3IoJ0Nvbm5lY3Rpb24gYXR0ZW1wdCBmYWlsZWQ6ICcgKyB0aGlzLnNlcnZlckFkZHJlc3MpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBXZWJTb2NrZXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBhZGQgZXZlbnQgbGlzdGVuZXJzJyk7XG4gICAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIHRoaXMub25Db25uZWN0aW9uT3Blbik7XG4gICAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKTtcbiAgICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMub25Db25uZWN0aW9uRXJyb3IpO1xuICAgICAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmxpc3RlbmVyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHRoZSBldmVudCBsaXN0ZXJzIGZyb20gdGhlIFdlYlNvY2tldC4gSXRzIGltcG9ydGFudCB0byByZW1vdmUgdGhlIGV2ZW50IGxpc3RlcmVycyBcbiAgICAgKiBmb3IgZ2FyYmFhZ2UgY29sbGVjdGlvbi4gQmVjYXVzZSB3ZSBhcmUgY3JlYXRpbmcgYSBuZXcgV2ViU29ja2V0IG9uIGVhY2ggY29ubmVjdGlvbiBhdHRlbXB0XG4gICAgICogYW55IGxpc3RlbmVycyB0aGF0IGFyZSBzdGlsbCBhdHRhY2hlZCBjb3VsZCBwcmV2ZW50IHRoZSBvbGQgc29ja2V0cyBmcm9tIGJlaW5nIGdhcmJhZ2UgY29sbGVjdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgcmVtb3ZlIGV2ZW50IGxpc3RlbmVycycpO1xuICAgICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29wZW4nLCB0aGlzLm9uQ29ubmVjdGlvbk9wZW4pO1xuICAgICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSk7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLm9uQ29ubmVjdGlvbkVycm9yKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEEgZnVuY3Rpb24gdGhhdCBpcyBwYXNzZWQgdG8gYSBuZXcgcHJvbWlzZSB0aGF0IHN0b3JlcyB0aGUgcmVzb2x2ZSBhbmQgcmVqZWN0IGNhbGxiYWNrcyBpbiB0aGUgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlIEEgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBpcyByZXNvbHZlZC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgQSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkLlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY3JlYXRlQ29ubmVjdGlvblByb21pc2UgPSBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uUHJvbWlzZShyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IGNyZWF0ZVByb21pc2UnKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIHRoaXMuY3VycmVudFJlamVjdCA9IHJlamVjdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gYSBuZXcgV2Vic29ja2V0IGNvbm5lY3Rpb24gaXMgb3BlbmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25PcGVuID0gZnVuY3Rpb24gb25Db25uZWN0aW9uT3BlbigpIHtcblxuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ29ubmVjdGVkICcpO1xuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5jb25uZWN0aW9uVGltZW91dCk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIFRoaXMgd2lsbCB0cmlnZ2VyIHRoZSBsb2dpbiBwcm9jZXNzIGFzIHdlbGwgYXMgc29tZSBhZGRpdGlvbmFsIHNldHVwIGluIEFwaUluc3RhbmNlc1xuICAgICAgICBpZiAodGhpcy5vbl9yZWNvbm5lY3QpIHtcbiAgICAgICAgICAgIHRoaXMub25fcmVjb25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVzb2x2ZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLk9QRU4pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGNhbGxlZCB3aGVuIHRoZSBjb25uZWN0aW9uIGF0dGVtcHQgdGltZXMgb3V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25UaW1lb3V0ID0gZnVuY3Rpb24gb25Db25uZWN0aW9uVGltZW91dCgpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHRpbWVvdXQnKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZShuZXcgRXJyb3IoJ0Nvbm5lY3Rpb24gdGltZWQgb3V0LicpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIFdlYnNvY2tldCBpcyBub3QgcmVzcG9uZGluZyB0byB0aGUgaGVhbHRoIGNoZWNrcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uVGVybWluYXRlID0gZnVuY3Rpb24gb25Db25uZWN0aW9uVGVybWluYXRlKCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgdGVybWluYXRlJyk7XG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uQ2xvc2UobmV3IEVycm9yKCdDb25uZWN0aW9uIHdhcyB0ZXJtaW5hdGVkLicpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrY2hhaW4gaXMgY2xvc2VkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBlcnJvclxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uQ2xvc2UgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25DbG9zZShlcnJvcikge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ2xvc2UgJywgZXJyb3IpO1xuXG4gICAgICAgIHRoaXMucmVzZXRDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLkNMT1NFRCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIFdlYnNvY2tldCBlbmNvdW50ZXJzIGFuIGVycm9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSBlcnJvclxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uRXJyb3IgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25FcnJvcihlcnJvcikge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgT24gQ29ubmVjdGlvbiBFcnJvciAnLCBlcnJvcik7XG5cbiAgICAgICAgdGhpcy5yZXNldENvbm5lY3Rpb24oKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0dXNDYikge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDYihDaGFpbldlYlNvY2tldC5zdGF0dXMuRVJST1IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEVudHJ5IHBvaW50IHRvIG1ha2UgUlBDIGNhbGxzIG9uIHRoZSBCbG9ja0NoYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthcnJheX0gcGFyYW1zIEFuIGFycmF5IG9mIHBhcmFtcyB0byBiZSBwYXNzZWQgdG8gdGhlIHJwYyBjYWxsLiBbbWV0aG9kLCAuLi5wYXJhbXNdXG4gICAgICogQHJldHVybnMgQSBuZXcgcHJvbWlzZSBmb3IgdGhpcyBzcGVjaWZpYyBjYWxsLlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uIGNhbGwocGFyYW1zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENhbGwgbm90IGNvbm5lY3RlZC4gJyk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdEaXNjb25uZWN0ZWQgZnJvbSB0aGUgQmxvY2tDaGFpbi4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ2FsbCBjb25uZWN0ZWQuICcsIHBhcmFtcyk7XG5cbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICBtZXRob2Q6IHBhcmFtc1sxXSxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgaWQ6IHRoaXMuY2JJZCArIDFcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmNiSWQgPSByZXF1ZXN0LmlkO1xuXG4gICAgICAgIGlmIChTVUJTQ1JJQkVfT1BFUkFUSU9OUy5pbmNsdWRlcyhyZXF1ZXN0Lm1ldGhvZCkpIHtcbiAgICAgICAgICAgIC8vIFN0b3JlIGNhbGxiYWNrIGluIHN1YnMgbWFwXG4gICAgICAgICAgICB0aGlzLnN1YnNbcmVxdWVzdC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IHJlcXVlc3QucGFyYW1zWzJdWzBdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBSZXBsYWNlIGNhbGxiYWNrIHdpdGggdGhlIGNhbGxiYWNrIGlkXG4gICAgICAgICAgICByZXF1ZXN0LnBhcmFtc1syXVswXSA9IHJlcXVlc3QuaWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoVU5TVUJTQ1JJQkVfT1BFUkFUSU9OUy5pbmNsdWRlcyhyZXF1ZXN0Lm1ldGhvZCkpIHtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0LnBhcmFtc1syXVswXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgcGFyYW1ldGVyIG9mIHVuc3ViIG11c3QgYmUgdGhlIG9yaWdpbmFsIGNhbGxiYWNrJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB1blN1YkNiID0gcmVxdWVzdC5wYXJhbXNbMl0uc3BsaWNlKDAsIDEpWzBdO1xuXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIHN1YnNjcmlwdGlvblxuICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5zdWJzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3Vic1tpZF0uY2FsbGJhY2sgPT09IHVuU3ViQ2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51bnN1YltyZXF1ZXN0LmlkXSA9IGlkO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuaGVhbHRoQ2hlY2spIHtcbiAgICAgICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBzZXRUaW1lb3V0KHRoaXMub25Db25uZWN0aW9uVGVybWluYXRlLmJpbmQodGhpcyksIEhFQUxUSF9DSEVDS19JTlRFUlZBTCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgX3RoaXMuY2JzW3JlcXVlc3QuaWRdID0ge1xuICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgcmVzb2x2ZTogcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICByZWplY3Q6IHJlamVjdFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gU2V0IGFsbCByZXF1ZXN0cyB0byBiZSAnY2FsbCcgbWV0aG9kcy5cbiAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gJ2NhbGwnO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF90aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkocmVxdWVzdCkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5kZWJ1ZygnQ2F1Z2h0IGEgbmFzdHkgZXJyb3IgOiAnLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBtZXNzYWdlcyBhcmUgcmVjZWl2ZWQgb24gdGhlIFdlYnNvY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gcmVzcG9uc2UgVGhlIG1lc3NhZ2UgcmVjZWl2ZWQuIFxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUubGlzdGVuZXIgPSBmdW5jdGlvbiBsaXN0ZW5lcihyZXNwb25zZSkge1xuXG4gICAgICAgIHZhciByZXNwb25zZUpTT04gPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNwb25zZUpTT04gPSBKU09OLnBhcnNlKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVzcG9uc2VKU09OLmVycm9yID0gJ0Vycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICcgKyBlcnJvci5zdGFjaztcbiAgICAgICAgICAgIHRoaXMuZGVidWcoJ0Vycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICcsIHJlc3BvbnNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsZWFyIHRoZSBoZWFsdGggY2hlY2sgdGltZW91dCwgd2UndmUganVzdCByZWNlaXZlZCBhIGhlYWx0aHkgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICBpZiAodGhpcy5oZWFsdGhDaGVjaykge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuaGVhbHRoQ2hlY2spO1xuICAgICAgICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3ViID0gZmFsc2UsXG4gICAgICAgICAgICBjYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlSlNPTi5tZXRob2QgPT09ICdub3RpY2UnKSB7XG4gICAgICAgICAgICBzdWIgPSB0cnVlO1xuICAgICAgICAgICAgcmVzcG9uc2VKU09OLmlkID0gcmVzcG9uc2VKU09OLnBhcmFtc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3ViKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHRoaXMuY2JzW3Jlc3BvbnNlSlNPTi5pZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHRoaXMuc3Vic1tyZXNwb25zZUpTT04uaWRdLmNhbGxiYWNrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrICYmICFzdWIpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZUpTT04uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnKCctLS0tPiByZXNwb25zZUpTT04gOiAnLCByZXNwb25zZUpTT04pO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLnJlamVjdChyZXNwb25zZUpTT04uZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5yZXNvbHZlKHJlc3BvbnNlSlNPTi5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2JzW3Jlc3BvbnNlSlNPTi5pZF07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnVuc3ViW3Jlc3BvbnNlSlNPTi5pZF0pIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5zdWJzW3RoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXV07XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjYWxsYmFjayAmJiBzdWIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlSlNPTi5wYXJhbXNbMV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kZWJ1ZygnV2FybmluZzogdW5rbm93biB3ZWJzb2NrZXQgcmVzcG9uc2VKU09OOiAnLCByZXNwb25zZUpTT04pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvZ2luIHRvIHRoZSBCbG9ja2NoYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXIgVXNlcm5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgUGFzc3dvcmRcbiAgICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgYWZ0ZXIgbG9naW4uXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG4gICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBsb2dpbi4nLCB1c2VyLCBwYXNzd29yZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RfcHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczIuY2FsbChbMSwgJ2xvZ2luJywgW3VzZXIsIHBhc3N3b3JkXV0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xvc2UgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gY2xvc2UoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMud3MpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgICAgICAgICAgLy8gVHJ5IGFuZCBmaXJlIGNsb3NlIG9uIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuXG4gICAgICAgICAgICAvLyBDbGVhciBvdXIgcmVmZXJlbmNlcyBzbyB0aGF0IGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgb3VyIHRpbWVvdXRzIGZvciBjb25uZWN0aW9uIHRpbWVvdXQgYW5kIGhlYWx0aCBjaGVjay5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlY29ubmVjdFRpbWVvdXQpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY29ubmVjdGVkIGZsYWcuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgfTtcblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgICAgICBpZiAoU09DS0VUX0RFQlVHKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDaGFpbldlYlNvY2tldDtcbn0oKTtcblxuLy8gQ29uc3RhbnRzIGZvciBTVEFURVxuXG5cbkNoYWluV2ViU29ja2V0LnN0YXR1cyA9IHtcbiAgICBSRUNPTk5FQ1RFRDogJ3JlY29ubmVjdGVkJyxcbiAgICBPUEVOOiAnb3BlbicsXG4gICAgQ0xPU0VEOiAnY2xvc2VkJyxcbiAgICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhaW5XZWJTb2NrZXQ7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEdyYXBoZW5lQXBpID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyYXBoZW5lQXBpKHdzX3JwYywgYXBpX25hbWUpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEdyYXBoZW5lQXBpKTtcblxuICAgICAgICB0aGlzLndzX3JwYyA9IHdzX3JwYztcbiAgICAgICAgdGhpcy5hcGlfbmFtZSA9IGFwaV9uYW1lO1xuICAgIH1cblxuICAgIEdyYXBoZW5lQXBpLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICByZXR1cm4gdGhpcy53c19ycGMuY2FsbChbMSwgdGhpcy5hcGlfbmFtZSwgW11dKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgX3RoaXMuYXBpX2lkID0gcmVzcG9uc2U7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBHcmFwaGVuZUFwaS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3NfcnBjLmNhbGwoW3RoaXMuYXBpX2lkLCBtZXRob2QsIHBhcmFtc10pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCIhISEgR3JhcGhlbmVBcGkgZXJyb3I6IFwiLCBtZXRob2QsIHBhcmFtcywgZXJyb3IsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBHcmFwaGVuZUFwaTtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gR3JhcGhlbmVBcGk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
