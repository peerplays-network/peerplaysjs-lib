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

        // Clear our timeouts for connection timeout and health check.
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;

        clearTimeout(this.healthCheck);
        this.healthCheck = null;

        // Toggle the connected flag.
        this.connected = false;

        // Close the Websocket if its still 'half-open'
        if (this.ws) {
            // Clean up the event listeners from the previous socket.
            this.removeEventListeners();
            this.ws.close();
        }

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

        console.log('CLOSE IS FIRED!');

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjanMvc3JjL0FwaUluc3RhbmNlcy5qcyIsImNqcy9zcmMvQ2hhaW5Db25maWcuanMiLCJjanMvc3JjL0NoYWluV2ViU29ja2V0LmpzIiwiY2pzL3NyYy9HcmFwaGVuZUFwaS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfQ2hhaW5XZWJTb2NrZXQgPSByZXF1aXJlKFwiLi9DaGFpbldlYlNvY2tldFwiKTtcblxudmFyIF9DaGFpbldlYlNvY2tldDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DaGFpbldlYlNvY2tldCk7XG5cbnZhciBfR3JhcGhlbmVBcGkgPSByZXF1aXJlKFwiLi9HcmFwaGVuZUFwaVwiKTtcblxudmFyIF9HcmFwaGVuZUFwaTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9HcmFwaGVuZUFwaSk7XG5cbnZhciBfQ2hhaW5Db25maWcgPSByZXF1aXJlKFwiLi9DaGFpbkNvbmZpZ1wiKTtcblxudmFyIF9DaGFpbkNvbmZpZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DaGFpbkNvbmZpZyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9IC8vIHZhciB7IExpc3QgfSA9IHJlcXVpcmUoXCJpbW11dGFibGVcIik7XG5cblxudmFyIGluc3QgPSB2b2lkIDA7XG5cbi8qKlxuICAgIENvbmZpZ3VyZTogY29uZmlndXJlIGFzIGZvbGxvd3MgYEFwaXMuaW5zdGFuY2UoXCJ3czovL2xvY2FsaG9zdDo4MDkwXCIpLmluaXRfcHJvbWlzZWAuICBUaGlzIHJldHVybnMgYSBwcm9taXNlLCBvbmNlIHJlc29sdmVkIHRoZSBjb25uZWN0aW9uIGlzIHJlYWR5LlxuXG4gICAgSW1wb3J0OiBpbXBvcnQgeyBBcGlzIH0gZnJvbSBcIkBncmFwaGVuZS9jaGFpblwiXG5cbiAgICBTaG9ydC1oYW5kOiBBcGlzLmRiKFwibWV0aG9kXCIsIFwicGFybTFcIiwgMiwgMywgLi4uKS4gIFJldHVybnMgYSBwcm9taXNlIHdpdGggcmVzdWx0cy5cblxuICAgIEFkZGl0aW9uYWwgdXNhZ2U6IEFwaXMuaW5zdGFuY2UoKS5kYl9hcGkoKS5leGVjKFwibWV0aG9kXCIsIFtcIm1ldGhvZFwiLCBcInBhcm0xXCIsIDIsIDMsIC4uLl0pLiAgUmV0dXJucyBhIHByb21pc2Ugd2l0aCByZXN1bHRzLlxuKi9cblxuZXhwb3J0cy5kZWZhdWx0ID0ge1xuICAgIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjazogZnVuY3Rpb24gc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQ2IgPSBjYWxsYmFjaztcbiAgICAgICAgaWYgKGluc3QpIGluc3Quc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICAgIEBhcmcge3N0cmluZ30gY3MgaXMgb25seSBwcm92aWRlZCBpbiB0aGUgZmlyc3QgY2FsbFxuICAgICAgICBAcmV0dXJuIHtBcGlzfSBzaW5nbGV0b24gLi4gQ2hlY2sgQXBpcy5pbnN0YW5jZSgpLmluaXRfcHJvbWlzZSB0byBrbm93IHdoZW4gdGhlIGNvbm5lY3Rpb24gaXMgZXN0YWJsaXNoZWRcbiAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgdmFyIGNzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBcIndzOi8vbG9jYWxob3N0OjgwOTBcIjtcbiAgICAgICAgdmFyIGNvbm5lY3QgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIHZhciBjb25uZWN0VGltZW91dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogNDAwMDtcblxuICAgICAgICBpZiAoaW5zdCkge1xuICAgICAgICAgICAgaW5zdC5jbG9zZSgpO1xuICAgICAgICAgICAgaW5zdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaW5zdCA9IG5ldyBBcGlzSW5zdGFuY2UoKTtcbiAgICAgICAgaW5zdC5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2sodGhpcy5zdGF0dXNDYik7XG5cbiAgICAgICAgaWYgKGluc3QgJiYgY29ubmVjdCkge1xuICAgICAgICAgICAgaW5zdC5jb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5zdDtcbiAgICB9LFxuICAgIGluc3RhbmNlOiBmdW5jdGlvbiBpbnN0YW5jZSgpIHtcbiAgICAgICAgdmFyIGNzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBcIndzOi8vbG9jYWxob3N0OjgwOTBcIjtcbiAgICAgICAgdmFyIGNvbm5lY3QgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIHZhciBjb25uZWN0VGltZW91dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogNDAwMDtcblxuICAgICAgICBpZiAoIWluc3QpIHtcbiAgICAgICAgICAgIGluc3QgPSBuZXcgQXBpc0luc3RhbmNlKCk7XG4gICAgICAgICAgICBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayh0aGlzLnN0YXR1c0NiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnN0ICYmIGNvbm5lY3QpIHtcbiAgICAgICAgICAgIGluc3QuY29ubmVjdChjcywgY29ubmVjdFRpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluc3Q7XG4gICAgfSxcbiAgICBjaGFpbklkOiBmdW5jdGlvbiBjaGFpbklkKCkge1xuICAgICAgICByZXR1cm4gQXBpcy5pbnN0YW5jZSgpLmNoYWluX2lkO1xuICAgIH0sXG4gICAgY2xvc2U6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICBpZiAoaW5zdCkge1xuICAgICAgICAgICAgaW5zdC5jbG9zZSgpO1xuICAgICAgICAgICAgaW5zdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gZGI6IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5kYl9hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKSxcbiAgICAvLyBuZXR3b3JrOiAobWV0aG9kLCAuLi5hcmdzKSA9PiBBcGlzLmluc3RhbmNlKCkubmV0d29ya19hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKSxcbiAgICAvLyBoaXN0b3J5OiAobWV0aG9kLCAuLi5hcmdzKSA9PiBBcGlzLmluc3RhbmNlKCkuaGlzdG9yeV9hcGkoKS5leGVjKG1ldGhvZCwgdG9TdHJpbmdzKGFyZ3MpKSxcbiAgICAvLyBjcnlwdG86IChtZXRob2QsIC4uLmFyZ3MpID0+IEFwaXMuaW5zdGFuY2UoKS5jcnlwdG9fYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSlcblxufTtcblxudmFyIEFwaXNJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBcGlzSW5zdGFuY2UoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlzSW5zdGFuY2UpO1xuICAgIH1cblxuICAgIC8qKiBAYXJnIHtzdHJpbmd9IGNvbm5lY3Rpb24gLi4gKi9cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiBjb25uZWN0KGNzLCBjb25uZWN0VGltZW91dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiSU5GT1xcdEFwaUluc3RhbmNlc1xcdGNvbm5lY3RcXHRcIiwgY3MpO1xuXG4gICAgICAgIHZhciBycGNfdXNlciA9IFwiXCIsXG4gICAgICAgICAgICBycGNfcGFzc3dvcmQgPSBcIlwiO1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cubG9jYXRpb24gJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIGNzLmluZGV4T2YoXCJ3c3M6Ly9cIikgPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWN1cmUgZG9tYWlucyByZXF1aXJlIHdzcyBjb25uZWN0aW9uXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy53c19ycGMgPSBuZXcgX0NoYWluV2ViU29ja2V0Mi5kZWZhdWx0KGNzLCB0aGlzLnN0YXR1c0NiLCBjb25uZWN0VGltZW91dCk7XG5cbiAgICAgICAgdGhpcy5pbml0X3Byb21pc2UgPSB0aGlzLndzX3JwYy5sb2dpbihycGNfdXNlciwgcnBjX3Bhc3N3b3JkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkIHRvIEFQSSBub2RlOlwiLCBjcyk7XG4gICAgICAgICAgICBfdGhpcy5fZGIgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgXCJkYXRhYmFzZVwiKTtcbiAgICAgICAgICAgIF90aGlzLl9uZXQgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgXCJuZXR3b3JrX2Jyb2FkY2FzdFwiKTtcbiAgICAgICAgICAgIF90aGlzLl9oaXN0ID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsIFwiaGlzdG9yeVwiKTtcbiAgICAgICAgICAgIF90aGlzLl9jcnlwdCA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCBcImNyeXB0b1wiKTtcbiAgICAgICAgICAgIF90aGlzLl9ib29raWUgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgXCJib29raWVcIik7XG4gICAgICAgICAgICB2YXIgZGJfcHJvbWlzZSA9IF90aGlzLl9kYi5pbml0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy9odHRwczovL2dpdGh1Yi5jb20vY3J5cHRvbm9tZXgvZ3JhcGhlbmUvd2lraS9jaGFpbi1sb2NrZWQtdHhcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuX2RiLmV4ZWMoXCJnZXRfY2hhaW5faWRcIiwgW10pLnRoZW4oZnVuY3Rpb24gKF9jaGFpbl9pZCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jaGFpbl9pZCA9IF9jaGFpbl9pZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9DaGFpbkNvbmZpZzIuZGVmYXVsdC5zZXRDaGFpbklkKF9jaGFpbl9pZCk7XG4gICAgICAgICAgICAgICAgICAgIC8vREVCVUcgY29uc29sZS5sb2coXCJjaGFpbl9pZDFcIix0aGlzLmNoYWluX2lkKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfdGhpcy53c19ycGMub25fcmVjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLndzX3JwYy5sb2dpbihcIlwiLCBcIlwiKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2RiLmluaXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5zdGF0dXNDYikgX3RoaXMuc3RhdHVzQ2IoX0NoYWluV2ViU29ja2V0Mi5kZWZhdWx0LnN0YXR1cy5SRUNPTk5FQ1RFRCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fbmV0LmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2hpc3QuaW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY3J5cHQuaW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fYm9va2llLmluaXQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW2RiX3Byb21pc2UsIF90aGlzLl9uZXQuaW5pdCgpLCBfdGhpcy5faGlzdC5pbml0KCksIF90aGlzLl9jcnlwdC5pbml0KCkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcihcIkFwaUluc3RhbmNlXFx0Q3J5cHRvIEFQSSBFcnJvclwiLCBlKTtcbiAgICAgICAgICAgIH0pLCAvLyBUZW1wb3Jhcnkgc3F1YXNoIGNyeXB0byBBUEkgZXJyb3IgdW50aWwgdGhlIEFQSSBpcyB1cGdyYWRlZCBldmVyeXdoZXJlXG4gICAgICAgICAgICBfdGhpcy5fYm9va2llLmluaXQoKV0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy53c19ycGMpIHRoaXMud3NfcnBjLmNsb3NlKCk7XG4gICAgICAgIHRoaXMud3NfcnBjID0gbnVsbDtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5kYl9hcGkgPSBmdW5jdGlvbiBkYl9hcGkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYjtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5uZXR3b3JrX2FwaSA9IGZ1bmN0aW9uIG5ldHdvcmtfYXBpKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmV0O1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmhpc3RvcnlfYXBpID0gZnVuY3Rpb24gaGlzdG9yeV9hcGkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9oaXN0O1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmNyeXB0b19hcGkgPSBmdW5jdGlvbiBjcnlwdG9fYXBpKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3J5cHQ7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuYm9va2llX2FwaSA9IGZ1bmN0aW9uIGJvb2tpZV9hcGkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib29raWU7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrID0gZnVuY3Rpb24gc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQ2IgPSBjYWxsYmFjaztcbiAgICB9O1xuXG4gICAgcmV0dXJuIEFwaXNJbnN0YW5jZTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbnZhciBfdGhpcyA9IHZvaWQgMDtcblxudmFyIGVjY19jb25maWcgPSB7XG4gICAgYWRkcmVzc19wcmVmaXg6IHByb2Nlc3MuZW52Lm5wbV9jb25maWdfX2dyYXBoZW5lX2VjY19kZWZhdWx0X2FkZHJlc3NfcHJlZml4IHx8IFwiR1BIXCJcbn07XG5cbl90aGlzID0ge1xuICAgIGNvcmVfYXNzZXQ6IFwiQ09SRVwiLFxuICAgIGFkZHJlc3NfcHJlZml4OiBcIkdQSFwiLFxuICAgIGV4cGlyZV9pbl9zZWNzOiAxNSxcbiAgICBleHBpcmVfaW5fc2Vjc19wcm9wb3NhbDogMjQgKiA2MCAqIDYwLFxuICAgIHJldmlld19pbl9zZWNzX2NvbW1pdHRlZTogMjQgKiA2MCAqIDYwLFxuICAgIG5ldHdvcmtzOiB7XG4gICAgICAgIEJpdFNoYXJlczoge1xuICAgICAgICAgICAgY29yZV9hc3NldDogXCJCVFNcIixcbiAgICAgICAgICAgIGFkZHJlc3NfcHJlZml4OiBcIkJUU1wiLFxuICAgICAgICAgICAgY2hhaW5faWQ6IFwiNDAxOGQ3ODQ0Yzc4ZjZhNmM0MWM2YTU1MmI4OTgwMjIzMTBmYzVkZWMwNmRhNDY3ZWU3OTA1YThkYWQ1MTJjOFwiXG4gICAgICAgIH0sXG4gICAgICAgIE11c2U6IHtcbiAgICAgICAgICAgIGNvcmVfYXNzZXQ6IFwiTVVTRVwiLFxuICAgICAgICAgICAgYWRkcmVzc19wcmVmaXg6IFwiTVVTRVwiLFxuICAgICAgICAgICAgY2hhaW5faWQ6IFwiNDVhZDJkM2Y5ZWY5MmE0OWI1NWMyMjI3ZWIwNjEyM2Y2MTNiYjM1ZGQwOGJkODc2ZjJhZWEyMTkyNWE2N2E2N1wiXG4gICAgICAgIH0sXG4gICAgICAgIFRlc3Q6IHtcbiAgICAgICAgICAgIGNvcmVfYXNzZXQ6IFwiVEVTVFwiLFxuICAgICAgICAgICAgYWRkcmVzc19wcmVmaXg6IFwiVEVTVFwiLFxuICAgICAgICAgICAgY2hhaW5faWQ6IFwiMzlmNWUyZWRlMWY4YmMxYTNhNTRhNzkxNDQxNGUzNzc5ZTMzMTkzZjFmNTY5MzUxMGU3M2NiN2E4NzYxNzQ0N1wiXG4gICAgICAgIH0sXG4gICAgICAgIE9iZWxpc2s6IHtcbiAgICAgICAgICAgIGNvcmVfYXNzZXQ6IFwiR09WXCIsXG4gICAgICAgICAgICBhZGRyZXNzX3ByZWZpeDogXCJGRVdcIixcbiAgICAgICAgICAgIGNoYWluX2lkOiBcIjFjZmRlN2MzODhiOWU4YWMwNjQ2MmQ2OGFhZGJkOTY2YjU4Zjg4Nzk3NjM3ZDlhZjgwNWI0NTYwYjBlOTY2MWVcIlxuICAgICAgICB9LFxuICAgICAgICBQZWVycGxheXM6IHtcbiAgICAgICAgICAgIGNvcmVfYXNzZXQ6IFwiUFBZXCIsXG4gICAgICAgICAgICBhZGRyZXNzX3ByZWZpeDogXCJQUFlcIixcbiAgICAgICAgICAgIGNoYWluX2lkOiBcIjU5NGUyODRkM2M3MzNhZmFhYTM0YTVlOTlhMzllZGIzMWU1MTkyZmFiMDIzMTAxZDY5MWQ5NTIwMzQ5MDIyMzdcIlxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKiBTZXQgYSBmZXcgcHJvcGVydGllcyBmb3Iga25vd24gY2hhaW4gSURzLiAqL1xuICAgIHNldENoYWluSWQ6IGZ1bmN0aW9uIHNldENoYWluSWQoY2hhaW5faWQpIHtcblxuICAgICAgICB2YXIgaSA9IHZvaWQgMCxcbiAgICAgICAgICAgIGxlbiA9IHZvaWQgMCxcbiAgICAgICAgICAgIG5ldHdvcmsgPSB2b2lkIDAsXG4gICAgICAgICAgICBuZXR3b3JrX25hbWUgPSB2b2lkIDAsXG4gICAgICAgICAgICByZWYgPSB2b2lkIDA7XG4gICAgICAgIHJlZiA9IE9iamVjdC5rZXlzKF90aGlzLm5ldHdvcmtzKTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblxuICAgICAgICAgICAgbmV0d29ya19uYW1lID0gcmVmW2ldO1xuICAgICAgICAgICAgbmV0d29yayA9IF90aGlzLm5ldHdvcmtzW25ldHdvcmtfbmFtZV07XG5cbiAgICAgICAgICAgIGlmIChuZXR3b3JrLmNoYWluX2lkID09PSBjaGFpbl9pZCkge1xuXG4gICAgICAgICAgICAgICAgX3RoaXMubmV0d29ya19uYW1lID0gbmV0d29ya19uYW1lO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5ldHdvcmsuYWRkcmVzc19wcmVmaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYWRkcmVzc19wcmVmaXggPSBuZXR3b3JrLmFkZHJlc3NfcHJlZml4O1xuICAgICAgICAgICAgICAgICAgICBlY2NfY29uZmlnLmFkZHJlc3NfcHJlZml4ID0gbmV0d29yay5hZGRyZXNzX3ByZWZpeDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIklORk8gICAgQ29uZmlndXJlZCBmb3JcIiwgbmV0d29ya19uYW1lLCBcIjpcIiwgbmV0d29yay5jb3JlX2Fzc2V0LCBcIlxcblwiKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG5ldHdvcmtfbmFtZTogbmV0d29ya19uYW1lLFxuICAgICAgICAgICAgICAgICAgICBuZXR3b3JrOiBuZXR3b3JrXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghX3RoaXMubmV0d29ya19uYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVua25vd24gY2hhaW4gaWQgKHRoaXMgbWF5IGJlIGEgdGVzdG5ldClcIiwgY2hhaW5faWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgX3RoaXMuY29yZV9hc3NldCA9IFwiQ09SRVwiO1xuICAgICAgICBfdGhpcy5hZGRyZXNzX3ByZWZpeCA9IFwiR1BIXCI7XG4gICAgICAgIGVjY19jb25maWcuYWRkcmVzc19wcmVmaXggPSBcIkdQSFwiO1xuICAgICAgICBfdGhpcy5leHBpcmVfaW5fc2VjcyA9IDE1O1xuICAgICAgICBfdGhpcy5leHBpcmVfaW5fc2Vjc19wcm9wb3NhbCA9IDI0ICogNjAgKiA2MDtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkNoYWluIGNvbmZpZyByZXNldFwiKTtcbiAgICB9LFxuXG4gICAgc2V0UHJlZml4OiBmdW5jdGlvbiBzZXRQcmVmaXgoKSB7XG4gICAgICAgIHZhciBwcmVmaXggPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IFwiR1BIXCI7XG5cbiAgICAgICAgX3RoaXMuYWRkcmVzc19wcmVmaXggPSBwcmVmaXg7XG4gICAgICAgIGVjY19jb25maWcuYWRkcmVzc19wcmVmaXggPSBwcmVmaXg7XG4gICAgfVxufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gX3RoaXM7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIFNPQ0tFVF9ERUJVRyA9IGZhbHNlO1xuXG52YXIgU1VCU0NSSUJFX09QRVJBVElPTlMgPSBbJ3NldF9zdWJzY3JpYmVfY2FsbGJhY2snLCAnc3Vic2NyaWJlX3RvX21hcmtldCcsICdicm9hZGNhc3RfdHJhbnNhY3Rpb25fd2l0aF9jYWxsYmFjaycsICdzZXRfcGVuZGluZ190cmFuc2FjdGlvbl9jYWxsYmFjayddO1xuXG52YXIgVU5TVUJTQ1JJQkVfT1BFUkFUSU9OUyA9IFsndW5zdWJzY3JpYmVfZnJvbV9tYXJrZXQnLCAndW5zdWJzY3JpYmVfZnJvbV9hY2NvdW50cyddO1xuXG52YXIgSEVBTFRIX0NIRUNLX0lOVEVSVkFMID0gMTAwMDA7XG5cbnZhciBDaGFpbldlYlNvY2tldCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKlxuICAgICAqQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBDaGFpbldlYlNvY2tldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICBzZXJ2ZXJBZGRyZXNzICAgICAgICAgICBUaGUgYWRkcmVzcyBvZiB0aGUgd2Vic29ja2V0IHRvIGNvbm5lY3QgdG8uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gICAgc3RhdHVzQ2IgICAgICAgICAgICAgICAgQSBjYWxsYmFjayB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHN0YXR1cyBldmVudHMgb2NjdXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgW2Nvbm5lY3RUaW1lb3V0PTEwMDAwXSAgVGhlIGFsbG93ZWQgdGltZSBmb3IgYSBjb25uZWN0aW9uIGF0dGVtcHQgdG8gY29tcGxldGUuXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG4gICAgZnVuY3Rpb24gQ2hhaW5XZWJTb2NrZXQoc2VydmVyQWRkcmVzcywgc3RhdHVzQ2IpIHtcbiAgICAgICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAxMDAwMDtcblxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ2hhaW5XZWJTb2NrZXQpO1xuXG4gICAgICAgIHRoaXMuc3RhdHVzQ2IgPSBzdGF0dXNDYjtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gc2VydmVyQWRkcmVzcztcbiAgICAgICAgdGhpcy50aW1lb3V0SW50ZXJ2YWwgPSBjb25uZWN0VGltZW91dDtcblxuICAgICAgICAvLyBUaGUgY3VycmVuY3QgY29ubmVjdGlvbiBzdGF0ZSBvZiB0aGUgd2Vic29ja2V0LlxuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIENhbGxiYWNrIHRvIGV4ZWN1dGUgd2hlbiB0aGUgd2Vic29ja2V0IGlzIHJlY29ubmVjdGVkLlxuICAgICAgICB0aGlzLm9uX3JlY29ubmVjdCA9IG51bGw7XG5cbiAgICAgICAgLy8gQW4gaW5jcmVtZW50aW5nIElEIGZvciBlYWNoIHJlcXVlc3Qgc28gdGhhdCB3ZSBjYW4gcGFpciBpdCB3aXRoIHRoZSByZXNwb25zZSBmcm9tIHRoZSB3ZWJzb2NrZXQuXG4gICAgICAgIHRoaXMuY2JJZCA9IDA7XG5cbiAgICAgICAgLy8gT2JqZWN0cyB0byBzdG9yZSBrZXkvdmFsdWUgcGFpcnMgZm9yIGNhbGxiYWNrcywgc3Vic2NyaXB0aW9uIGNhbGxiYWNrcyBhbmQgdW5zdWJzY3JpYmUgY2FsbGJhY2tzLlxuICAgICAgICB0aGlzLmNicyA9IHt9O1xuICAgICAgICB0aGlzLnN1YnMgPSB7fTtcbiAgICAgICAgdGhpcy51bnN1YiA9IHt9O1xuXG4gICAgICAgIC8vIEN1cnJlbnQgY29ubmVjdGlvbiBwcm9taXNlcycgcmVqZWN0aW9uXG4gICAgICAgIHRoaXMuY3VycmVudFJlc29sdmUgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZWplY3QgPSBudWxsO1xuXG4gICAgICAgIC8vIEhlYWx0aCBjaGVjayBmb3IgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIC8vIENvcHkgdGhlIGNvbnN0YW50cyB0byB0aGlzIGluc3RhbmNlLlxuICAgICAgICB0aGlzLnN0YXR1cyA9IENoYWluV2ViU29ja2V0LnN0YXR1cztcblxuICAgICAgICAvLyBCaW5kIHRoZSBmdW5jdGlvbnMgdG8gdGhlIGluc3RhbmNlLlxuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbk9wZW4gPSB0aGlzLm9uQ29ubmVjdGlvbk9wZW4uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSA9IHRoaXMub25Db25uZWN0aW9uQ2xvc2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25UZXJtaW5hdGUgPSB0aGlzLm9uQ29ubmVjdGlvblRlcm1pbmF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbkVycm9yID0gdGhpcy5vbkNvbm5lY3Rpb25FcnJvci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQgPSB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uID0gdGhpcy5jcmVhdGVDb25uZWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UgPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyLmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBpbml0aWFsIGNvbm5lY3Rpb24gdGhlIGJsb2NrY2hhaW4uXG4gICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9uID0gZnVuY3Rpb24gY3JlYXRlQ29ubmVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IGNyZWF0ZSBjb25uZWN0aW9uJyk7XG5cbiAgICAgICAgLy8gQ2xlYXIgYW55IHBvc3NpYmxlIHJlY29ubmVjdCB0aW1lcnMuXG4gICAgICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBwcm9taXNlIGZvciB0aGlzIGNvbm5lY3Rpb25cbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RfcHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0X3Byb21pc2UgPSBuZXcgUHJvbWlzZSh0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF0dGVtcHQgdG8gY3JlYXRlIHRoZSB3ZWJzb2NrZXRcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyQWRkcmVzcyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBTZXQgYSB0aW1lb3V0IHRvIHRyeSBhbmQgcmVjb25uZWN0IGhlcmUuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldENvbm5lY3Rpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgICAgICAvLyBIYW5kbGUgdGltZW91dHMgdG8gdGhlIHdlYnNvY2tldCdzIGluaXRpYWwgY29ubmVjdGlvbi5cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5vbkNvbm5lY3Rpb25UaW1lb3V0LCB0aGlzLnRpbWVvdXRJbnRlcnZhbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja0NoYWluLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5yZXNldENvbm5lY3Rpb24gPSBmdW5jdGlvbiByZXNldENvbm5lY3Rpb24oKSB7XG5cbiAgICAgICAgLy8gQ2xlYXIgb3VyIHRpbWVvdXRzIGZvciBjb25uZWN0aW9uIHRpbWVvdXQgYW5kIGhlYWx0aCBjaGVjay5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY29ubmVjdGVkIGZsYWcuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQ2xvc2UgdGhlIFdlYnNvY2tldCBpZiBpdHMgc3RpbGwgJ2hhbGYtb3BlbidcbiAgICAgICAgaWYgKHRoaXMud3MpIHtcbiAgICAgICAgICAgIC8vIENsZWFuIHVwIHRoZSBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGUgcHJldmlvdXMgc29ja2V0LlxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVycygpO1xuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIG9ubHkgZXZlciBoYXZlIG9uZSB0aW1lb3V0IHJ1bm5pbmcgdG8gcmVjb25uZWN0LlxuICAgICAgICBpZiAoIXRoaXMucmVjb25uZWN0VGltZW91dCkge1xuICAgICAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHJlc2V0IGNvbm5lY3Rpb24nLCB0aGlzLnRpbWVvdXRJbnRlcnZhbCk7XG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuY3JlYXRlQ29ubmVjdGlvbiwgdGhpcy50aW1lb3V0SW50ZXJ2YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVqZWN0IHRoZSBjdXJyZW50IHByb21pc2UgaWYgdGhlcmUgaXMgb25lLiBcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlamVjdCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVqZWN0KG5ldyBFcnJvcignQ29ubmVjdGlvbiBhdHRlbXB0IGZhaWxlZDogJyArIHRoaXMuc2VydmVyQWRkcmVzcykpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIFdlYlNvY2tldC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycygpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IGFkZCBldmVudCBsaXN0ZW5lcnMnKTtcbiAgICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgdGhpcy5vbkNvbm5lY3Rpb25PcGVuKTtcbiAgICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIHRoaXMub25Db25uZWN0aW9uQ2xvc2UpO1xuICAgICAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5vbkNvbm5lY3Rpb25FcnJvcik7XG4gICAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubGlzdGVuZXIpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIGV2ZW50IGxpc3RlcnMgZnJvbSB0aGUgV2ViU29ja2V0LiBJdHMgaW1wb3J0YW50IHRvIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVyZXJzIFxuICAgICAqIGZvciBnYXJiYWFnZSBjb2xsZWN0aW9uLiBCZWNhdXNlIHdlIGFyZSBjcmVhdGluZyBhIG5ldyBXZWJTb2NrZXQgb24gZWFjaCBjb25uZWN0aW9uIGF0dGVtcHRcbiAgICAgKiBhbnkgbGlzdGVuZXJzIHRoYXQgYXJlIHN0aWxsIGF0dGFjaGVkIGNvdWxkIHByZXZlbnQgdGhlIG9sZCBzb2NrZXRzIGZyb20gYmVpbmcgZ2FyYmFnZSBjb2xsZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCByZW1vdmUgZXZlbnQgbGlzdGVuZXJzJyk7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3BlbicsIHRoaXMub25Db25uZWN0aW9uT3Blbik7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xvc2UnLCB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMub25Db25uZWN0aW9uRXJyb3IpO1xuICAgICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmxpc3RlbmVyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQSBmdW5jdGlvbiB0aGF0IGlzIHBhc3NlZCB0byBhIG5ldyBwcm9taXNlIHRoYXQgc3RvcmVzIHRoZSByZXNvbHZlIGFuZCByZWplY3QgY2FsbGJhY2tzIGluIHRoZSBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmUgQSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBwcm9taXNlIGlzIHJlc29sdmVkLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlamVjdCBBIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQuXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9uUHJvbWlzZSA9IGZ1bmN0aW9uIGNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgY3JlYXRlUHJvbWlzZScpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVqZWN0ID0gcmVqZWN0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBhIG5ldyBXZWJzb2NrZXQgY29ubmVjdGlvbiBpcyBvcGVuZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvbk9wZW4gPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25PcGVuKCkge1xuXG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDb25uZWN0ZWQgJyk7XG5cbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmNvbm5lY3Rpb25UaW1lb3V0KTtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dCA9IG51bGw7XG5cbiAgICAgICAgLy8gVGhpcyB3aWxsIHRyaWdnZXIgdGhlIGxvZ2luIHByb2Nlc3MgYXMgd2VsbCBhcyBzb21lIGFkZGl0aW9uYWwgc2V0dXAgaW4gQXBpSW5zdGFuY2VzXG4gICAgICAgIGlmICh0aGlzLm9uX3JlY29ubmVjdCkge1xuICAgICAgICAgICAgdGhpcy5vbl9yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZXNvbHZlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdGF0dXNDYikge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDYihDaGFpbldlYlNvY2tldC5zdGF0dXMuT1BFTik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGNvbm5lY3Rpb24gYXR0ZW1wdCB0aW1lcyBvdXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvblRpbWVvdXQgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25UaW1lb3V0KCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgdGltZW91dCcpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKG5ldyBFcnJvcignQ29ubmVjdGlvbiB0aW1lZCBvdXQuJykpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgV2Vic29ja2V0IGlzIG5vdCByZXNwb25kaW5nIHRvIHRoZSBoZWFsdGggY2hlY2tzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25UZXJtaW5hdGUgPSBmdW5jdGlvbiBvbkNvbm5lY3Rpb25UZXJtaW5hdGUoKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCB0ZXJtaW5hdGUnKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZShuZXcgRXJyb3IoJ0Nvbm5lY3Rpb24gd2FzIHRlcm1pbmF0ZWQuJykpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbiBpcyBjbG9zZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGVycm9yXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25DbG9zZSA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvbkNsb3NlKGVycm9yKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDbG9zZSAnLCBlcnJvcik7XG5cbiAgICAgICAgdGhpcy5yZXNldENvbm5lY3Rpb24oKTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0dXNDYikge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNDYihDaGFpbldlYlNvY2tldC5zdGF0dXMuQ0xPU0VEKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgV2Vic29ja2V0IGVuY291bnRlcnMgYW4gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IGVycm9yXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5vbkNvbm5lY3Rpb25FcnJvciA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvbkVycm9yKGVycm9yKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBPbiBDb25uZWN0aW9uIEVycm9yICcsIGVycm9yKTtcblxuICAgICAgICB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0NiKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0NiKENoYWluV2ViU29ja2V0LnN0YXR1cy5FUlJPUik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRW50cnkgcG9pbnQgdG8gbWFrZSBSUEMgY2FsbHMgb24gdGhlIEJsb2NrQ2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBwYXJhbXMgQW4gYXJyYXkgb2YgcGFyYW1zIHRvIGJlIHBhc3NlZCB0byB0aGUgcnBjIGNhbGwuIFttZXRob2QsIC4uLnBhcmFtc11cbiAgICAgKiBAcmV0dXJucyBBIG5ldyBwcm9taXNlIGZvciB0aGlzIHNwZWNpZmljIGNhbGwuXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gY2FsbChwYXJhbXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgQ2FsbCBub3QgY29ubmVjdGVkLiAnKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Rpc2Nvbm5lY3RlZCBmcm9tIHRoZSBCbG9ja0NoYWluLicpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDYWxsIGNvbm5lY3RlZC4gJywgcGFyYW1zKTtcblxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgIG1ldGhvZDogcGFyYW1zWzFdLFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICBpZDogdGhpcy5jYklkICsgMVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY2JJZCA9IHJlcXVlc3QuaWQ7XG5cbiAgICAgICAgaWYgKFNVQlNDUklCRV9PUEVSQVRJT05TLmluY2x1ZGVzKHJlcXVlc3QubWV0aG9kKSkge1xuICAgICAgICAgICAgLy8gU3RvcmUgY2FsbGJhY2sgaW4gc3VicyBtYXBcbiAgICAgICAgICAgIHRoaXMuc3Vic1tyZXF1ZXN0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogcmVxdWVzdC5wYXJhbXNbMl1bMF1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFJlcGxhY2UgY2FsbGJhY2sgd2l0aCB0aGUgY2FsbGJhY2sgaWRcbiAgICAgICAgICAgIHJlcXVlc3QucGFyYW1zWzJdWzBdID0gcmVxdWVzdC5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChVTlNVQlNDUklCRV9PUEVSQVRJT05TLmluY2x1ZGVzKHJlcXVlc3QubWV0aG9kKSkge1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlcXVlc3QucGFyYW1zWzJdWzBdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBwYXJhbWV0ZXIgb2YgdW5zdWIgbXVzdCBiZSB0aGUgb3JpZ2luYWwgY2FsbGJhY2snKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHVuU3ViQ2IgPSByZXF1ZXN0LnBhcmFtc1syXS5zcGxpY2UoMCwgMSlbMF07XG5cbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIGNvcnJlc3BvbmRpbmcgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnN1YnMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdWJzW2lkXS5jYWxsYmFjayA9PT0gdW5TdWJDYikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVuc3ViW3JlcXVlc3QuaWRdID0gaWQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5oZWFsdGhDaGVjaykge1xuICAgICAgICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IHNldFRpbWVvdXQodGhpcy5vbkNvbm5lY3Rpb25UZXJtaW5hdGUuYmluZCh0aGlzKSwgSEVBTFRIX0NIRUNLX0lOVEVSVkFMKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBfdGhpcy5jYnNbcmVxdWVzdC5pZF0gPSB7XG4gICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICByZXNvbHZlOiByZXNvbHZlLFxuICAgICAgICAgICAgICAgIHJlamVjdDogcmVqZWN0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBTZXQgYWxsIHJlcXVlc3RzIHRvIGJlICdjYWxsJyBtZXRob2RzLlxuICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSAnY2FsbCc7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX3RoaXMud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzLmRlYnVnKCdDYXVnaHQgYSBuYXN0eSBlcnJvciA6ICcsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIG1lc3NhZ2VzIGFyZSByZWNlaXZlZCBvbiB0aGUgV2Vic29ja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHsqfSByZXNwb25zZSBUaGUgbWVzc2FnZSByZWNlaXZlZC4gXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5saXN0ZW5lciA9IGZ1bmN0aW9uIGxpc3RlbmVyKHJlc3BvbnNlKSB7XG5cbiAgICAgICAgdmFyIHJlc3BvbnNlSlNPTiA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3BvbnNlSlNPTiA9IEpTT04ucGFyc2UocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXNwb25zZUpTT04uZXJyb3IgPSAnRXJyb3IgcGFyc2luZyByZXNwb25zZTogJyArIGVycm9yLnN0YWNrO1xuICAgICAgICAgICAgdGhpcy5kZWJ1ZygnRXJyb3IgcGFyc2luZyByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGhlYWx0aCBjaGVjayB0aW1lb3V0LCB3ZSd2ZSBqdXN0IHJlY2VpdmVkIGEgaGVhbHRoeSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgIGlmICh0aGlzLmhlYWx0aENoZWNrKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgICAgICB0aGlzLmhlYWx0aENoZWNrID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWIgPSBmYWxzZSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbnVsbDtcblxuICAgICAgICBpZiAocmVzcG9uc2VKU09OLm1ldGhvZCA9PT0gJ25vdGljZScpIHtcbiAgICAgICAgICAgIHN1YiA9IHRydWU7XG4gICAgICAgICAgICByZXNwb25zZUpTT04uaWQgPSByZXNwb25zZUpTT04ucGFyYW1zWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdWIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jYnNbcmVzcG9uc2VKU09OLmlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5zdWJzW3Jlc3BvbnNlSlNPTi5pZF0uY2FsbGJhY2s7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FsbGJhY2sgJiYgIXN1Yikge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSlNPTi5lcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcoJy0tLS0+IHJlc3BvbnNlSlNPTiA6ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sucmVqZWN0KHJlc3BvbnNlSlNPTi5lcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLnJlc29sdmUocmVzcG9uc2VKU09OLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jYnNbcmVzcG9uc2VKU09OLmlkXTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN1YnNbdGhpcy51bnN1YltyZXNwb25zZUpTT04uaWRdXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy51bnN1YltyZXNwb25zZUpTT04uaWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrICYmIHN1Yikge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2VKU09OLnBhcmFtc1sxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnKCdXYXJuaW5nOiB1bmtub3duIHdlYnNvY2tldCByZXNwb25zZUpTT046ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTG9naW4gdG8gdGhlIEJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciBVc2VybmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCBQYXNzd29yZFxuICAgICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCBhZnRlciBsb2dpbi5cbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlciwgcGFzc3dvcmQpIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IGxvZ2luLicsIHVzZXIsIHBhc3N3b3JkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdF9wcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5jYWxsKFsxLCAnbG9naW4nLCBbdXNlciwgcGFzc3dvcmRdXSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcblxuICAgICAgICBjb25zb2xlLmxvZygnQ0xPU0UgSVMgRklSRUQhJyk7XG5cbiAgICAgICAgaWYgKHRoaXMud3MpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgICAgICAgICAgLy8gVHJ5IGFuZCBmaXJlIGNsb3NlIG9uIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuXG4gICAgICAgICAgICAvLyBDbGVhciBvdXIgcmVmZXJlbmNlcyBzbyB0aGF0IGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgb3VyIHRpbWVvdXRzIGZvciBjb25uZWN0aW9uIHRpbWVvdXQgYW5kIGhlYWx0aCBjaGVjay5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlY29ubmVjdFRpbWVvdXQpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY29ubmVjdGVkIGZsYWcuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgfTtcblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgICAgICBpZiAoU09DS0VUX0RFQlVHKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDaGFpbldlYlNvY2tldDtcbn0oKTtcblxuLy8gQ29uc3RhbnRzIGZvciBTVEFURVxuXG5cbkNoYWluV2ViU29ja2V0LnN0YXR1cyA9IHtcbiAgICBSRUNPTk5FQ1RFRDogJ3JlY29ubmVjdGVkJyxcbiAgICBPUEVOOiAnb3BlbicsXG4gICAgQ0xPU0VEOiAnY2xvc2VkJyxcbiAgICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhaW5XZWJTb2NrZXQ7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEdyYXBoZW5lQXBpID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyYXBoZW5lQXBpKHdzX3JwYywgYXBpX25hbWUpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEdyYXBoZW5lQXBpKTtcblxuICAgICAgICB0aGlzLndzX3JwYyA9IHdzX3JwYztcbiAgICAgICAgdGhpcy5hcGlfbmFtZSA9IGFwaV9uYW1lO1xuICAgIH1cblxuICAgIEdyYXBoZW5lQXBpLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICByZXR1cm4gdGhpcy53c19ycGMuY2FsbChbMSwgdGhpcy5hcGlfbmFtZSwgW11dKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgX3RoaXMuYXBpX2lkID0gcmVzcG9uc2U7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBHcmFwaGVuZUFwaS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3NfcnBjLmNhbGwoW3RoaXMuYXBpX2lkLCBtZXRob2QsIHBhcmFtc10pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCIhISEgR3JhcGhlbmVBcGkgZXJyb3I6IFwiLCBtZXRob2QsIHBhcmFtcywgZXJyb3IsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBHcmFwaGVuZUFwaTtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gR3JhcGhlbmVBcGk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
