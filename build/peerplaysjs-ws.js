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

var SOCKET_DEBUG = true;

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

        // TODO: Do we want to move the PING logic into here?

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
            // TODO: Handle errors parsing response as JSON.
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjanMvc3JjL0FwaUluc3RhbmNlcy5qcyIsImNqcy9zcmMvQ2hhaW5Db25maWcuanMiLCJjanMvc3JjL0NoYWluV2ViU29ja2V0LmpzIiwiY2pzL3NyYy9HcmFwaGVuZUFwaS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX0NoYWluV2ViU29ja2V0ID0gcmVxdWlyZShcIi4vQ2hhaW5XZWJTb2NrZXRcIik7XG5cbnZhciBfQ2hhaW5XZWJTb2NrZXQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ2hhaW5XZWJTb2NrZXQpO1xuXG52YXIgX0dyYXBoZW5lQXBpID0gcmVxdWlyZShcIi4vR3JhcGhlbmVBcGlcIik7XG5cbnZhciBfR3JhcGhlbmVBcGkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfR3JhcGhlbmVBcGkpO1xuXG52YXIgX0NoYWluQ29uZmlnID0gcmVxdWlyZShcIi4vQ2hhaW5Db25maWdcIik7XG5cbnZhciBfQ2hhaW5Db25maWcyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ2hhaW5Db25maWcpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfSAvLyB2YXIgeyBMaXN0IH0gPSByZXF1aXJlKFwiaW1tdXRhYmxlXCIpO1xuXG5cbnZhciBpbnN0ID0gdm9pZCAwO1xuXG4vKipcbiAgICBDb25maWd1cmU6IGNvbmZpZ3VyZSBhcyBmb2xsb3dzIGBBcGlzLmluc3RhbmNlKFwid3M6Ly9sb2NhbGhvc3Q6ODA5MFwiKS5pbml0X3Byb21pc2VgLiAgVGhpcyByZXR1cm5zIGEgcHJvbWlzZSwgb25jZSByZXNvbHZlZCB0aGUgY29ubmVjdGlvbiBpcyByZWFkeS5cblxuICAgIEltcG9ydDogaW1wb3J0IHsgQXBpcyB9IGZyb20gXCJAZ3JhcGhlbmUvY2hhaW5cIlxuXG4gICAgU2hvcnQtaGFuZDogQXBpcy5kYihcIm1ldGhvZFwiLCBcInBhcm0xXCIsIDIsIDMsIC4uLikuICBSZXR1cm5zIGEgcHJvbWlzZSB3aXRoIHJlc3VsdHMuXG5cbiAgICBBZGRpdGlvbmFsIHVzYWdlOiBBcGlzLmluc3RhbmNlKCkuZGJfYXBpKCkuZXhlYyhcIm1ldGhvZFwiLCBbXCJtZXRob2RcIiwgXCJwYXJtMVwiLCAyLCAzLCAuLi5dKS4gIFJldHVybnMgYSBwcm9taXNlIHdpdGggcmVzdWx0cy5cbiovXG5cbmV4cG9ydHMuZGVmYXVsdCA9IHtcbiAgICBzZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2s6IGZ1bmN0aW9uIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnN0YXR1c0NiID0gY2FsbGJhY2s7XG4gICAgICAgIGlmIChpbnN0KSBpbnN0LnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAgICBAYXJnIHtzdHJpbmd9IGNzIGlzIG9ubHkgcHJvdmlkZWQgaW4gdGhlIGZpcnN0IGNhbGxcbiAgICAgICAgQHJldHVybiB7QXBpc30gc2luZ2xldG9uIC4uIENoZWNrIEFwaXMuaW5zdGFuY2UoKS5pbml0X3Byb21pc2UgdG8ga25vdyB3aGVuIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkXG4gICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIHZhciBjcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogXCJ3czovL2xvY2FsaG9zdDo4MDkwXCI7XG4gICAgICAgIHZhciBjb25uZWN0ID0gYXJndW1lbnRzWzFdO1xuICAgICAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDQwMDA7XG5cbiAgICAgICAgaWYgKGluc3QpIHtcbiAgICAgICAgICAgIGluc3QuY2xvc2UoKTtcbiAgICAgICAgICAgIGluc3QgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGluc3QgPSBuZXcgQXBpc0luc3RhbmNlKCk7XG4gICAgICAgIGluc3Quc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKHRoaXMuc3RhdHVzQ2IpO1xuXG4gICAgICAgIGlmIChpbnN0ICYmIGNvbm5lY3QpIHtcbiAgICAgICAgICAgIGluc3QuY29ubmVjdChjcywgY29ubmVjdFRpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluc3Q7XG4gICAgfSxcbiAgICBpbnN0YW5jZTogZnVuY3Rpb24gaW5zdGFuY2UoKSB7XG4gICAgICAgIHZhciBjcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogXCJ3czovL2xvY2FsaG9zdDo4MDkwXCI7XG4gICAgICAgIHZhciBjb25uZWN0ID0gYXJndW1lbnRzWzFdO1xuICAgICAgICB2YXIgY29ubmVjdFRpbWVvdXQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IDQwMDA7XG5cbiAgICAgICAgaWYgKCFpbnN0KSB7XG4gICAgICAgICAgICBpbnN0ID0gbmV3IEFwaXNJbnN0YW5jZSgpO1xuICAgICAgICAgICAgaW5zdC5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2sodGhpcy5zdGF0dXNDYik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5zdCAmJiBjb25uZWN0KSB7XG4gICAgICAgICAgICBpbnN0LmNvbm5lY3QoY3MsIGNvbm5lY3RUaW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnN0O1xuICAgIH0sXG4gICAgY2hhaW5JZDogZnVuY3Rpb24gY2hhaW5JZCgpIHtcbiAgICAgICAgcmV0dXJuIEFwaXMuaW5zdGFuY2UoKS5jaGFpbl9pZDtcbiAgICB9LFxuICAgIGNsb3NlOiBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAgICAgaWYgKGluc3QpIHtcbiAgICAgICAgICAgIGluc3QuY2xvc2UoKTtcbiAgICAgICAgICAgIGluc3QgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGRiOiAobWV0aG9kLCAuLi5hcmdzKSA9PiBBcGlzLmluc3RhbmNlKCkuZGJfYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSksXG4gICAgLy8gbmV0d29yazogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLm5ldHdvcmtfYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSksXG4gICAgLy8gaGlzdG9yeTogKG1ldGhvZCwgLi4uYXJncykgPT4gQXBpcy5pbnN0YW5jZSgpLmhpc3RvcnlfYXBpKCkuZXhlYyhtZXRob2QsIHRvU3RyaW5ncyhhcmdzKSksXG4gICAgLy8gY3J5cHRvOiAobWV0aG9kLCAuLi5hcmdzKSA9PiBBcGlzLmluc3RhbmNlKCkuY3J5cHRvX2FwaSgpLmV4ZWMobWV0aG9kLCB0b1N0cmluZ3MoYXJncykpXG5cbn07XG5cbnZhciBBcGlzSW5zdGFuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXBpc0luc3RhbmNlKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQXBpc0luc3RhbmNlKTtcbiAgICB9XG5cbiAgICAvKiogQGFyZyB7c3RyaW5nfSBjb25uZWN0aW9uIC4uICovXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gY29ubmVjdChjcywgY29ubmVjdFRpbWVvdXQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIklORk9cXHRBcGlJbnN0YW5jZXNcXHRjb25uZWN0XFx0XCIsIGNzKTtcblxuICAgICAgICB2YXIgcnBjX3VzZXIgPSBcIlwiLFxuICAgICAgICAgICAgcnBjX3Bhc3N3b3JkID0gXCJcIjtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmxvY2F0aW9uICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiBjcy5pbmRleE9mKFwid3NzOi8vXCIpIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VjdXJlIGRvbWFpbnMgcmVxdWlyZSB3c3MgY29ubmVjdGlvblwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMud3NfcnBjID0gbmV3IF9DaGFpbldlYlNvY2tldDIuZGVmYXVsdChjcywgdGhpcy5zdGF0dXNDYiwgY29ubmVjdFRpbWVvdXQpO1xuXG4gICAgICAgIHRoaXMuaW5pdF9wcm9taXNlID0gdGhpcy53c19ycGMubG9naW4ocnBjX3VzZXIsIHJwY19wYXNzd29yZCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZCB0byBBUEkgbm9kZTpcIiwgY3MpO1xuICAgICAgICAgICAgX3RoaXMuX2RiID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsIFwiZGF0YWJhc2VcIik7XG4gICAgICAgICAgICBfdGhpcy5fbmV0ID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsIFwibmV0d29ya19icm9hZGNhc3RcIik7XG4gICAgICAgICAgICBfdGhpcy5faGlzdCA9IG5ldyBfR3JhcGhlbmVBcGkyLmRlZmF1bHQoX3RoaXMud3NfcnBjLCBcImhpc3RvcnlcIik7XG4gICAgICAgICAgICBfdGhpcy5fY3J5cHQgPSBuZXcgX0dyYXBoZW5lQXBpMi5kZWZhdWx0KF90aGlzLndzX3JwYywgXCJjcnlwdG9cIik7XG4gICAgICAgICAgICBfdGhpcy5fYm9va2llID0gbmV3IF9HcmFwaGVuZUFwaTIuZGVmYXVsdChfdGhpcy53c19ycGMsIFwiYm9va2llXCIpO1xuICAgICAgICAgICAgdmFyIGRiX3Byb21pc2UgPSBfdGhpcy5fZGIuaW5pdCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL2NyeXB0b25vbWV4L2dyYXBoZW5lL3dpa2kvY2hhaW4tbG9ja2VkLXR4XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLl9kYi5leGVjKFwiZ2V0X2NoYWluX2lkXCIsIFtdKS50aGVuKGZ1bmN0aW9uIChfY2hhaW5faWQpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2hhaW5faWQgPSBfY2hhaW5faWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfQ2hhaW5Db25maWcyLmRlZmF1bHQuc2V0Q2hhaW5JZChfY2hhaW5faWQpO1xuICAgICAgICAgICAgICAgICAgICAvL0RFQlVHIGNvbnNvbGUubG9nKFwiY2hhaW5faWQxXCIsdGhpcy5jaGFpbl9pZClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3RoaXMud3NfcnBjLm9uX3JlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy53c19ycGMubG9naW4oXCJcIiwgXCJcIikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9kYi5pbml0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuc3RhdHVzQ2IpIF90aGlzLnN0YXR1c0NiKF9DaGFpbldlYlNvY2tldDIuZGVmYXVsdC5zdGF0dXMuUkVDT05ORUNURUQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX25ldC5pbml0KCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9oaXN0LmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2NyeXB0LmluaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2Jvb2tpZS5pbml0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtkYl9wcm9taXNlLCBfdGhpcy5fbmV0LmluaXQoKSwgX3RoaXMuX2hpc3QuaW5pdCgpLCBfdGhpcy5fY3J5cHQuaW5pdCgpLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXCJBcGlJbnN0YW5jZVxcdENyeXB0byBBUEkgRXJyb3JcIiwgZSk7XG4gICAgICAgICAgICB9KSwgLy8gVGVtcG9yYXJ5IHNxdWFzaCBjcnlwdG8gQVBJIGVycm9yIHVudGlsIHRoZSBBUEkgaXMgdXBncmFkZWQgZXZlcnl3aGVyZVxuICAgICAgICAgICAgX3RoaXMuX2Jvb2tpZS5pbml0KCldKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMud3NfcnBjKSB0aGlzLndzX3JwYy5jbG9zZSgpO1xuICAgICAgICB0aGlzLndzX3JwYyA9IG51bGw7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUuZGJfYXBpID0gZnVuY3Rpb24gZGJfYXBpKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGI7XG4gICAgfTtcblxuICAgIEFwaXNJbnN0YW5jZS5wcm90b3R5cGUubmV0d29ya19hcGkgPSBmdW5jdGlvbiBuZXR3b3JrX2FwaSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25ldDtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5oaXN0b3J5X2FwaSA9IGZ1bmN0aW9uIGhpc3RvcnlfYXBpKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faGlzdDtcbiAgICB9O1xuXG4gICAgQXBpc0luc3RhbmNlLnByb3RvdHlwZS5jcnlwdG9fYXBpID0gZnVuY3Rpb24gY3J5cHRvX2FwaSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyeXB0O1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLmJvb2tpZV9hcGkgPSBmdW5jdGlvbiBib29raWVfYXBpKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm9va2llO1xuICAgIH07XG5cbiAgICBBcGlzSW5zdGFuY2UucHJvdG90eXBlLnNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayA9IGZ1bmN0aW9uIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnN0YXR1c0NiID0gY2FsbGJhY2s7XG4gICAgfTtcblxuICAgIHJldHVybiBBcGlzSW5zdGFuY2U7XG59KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG52YXIgX3RoaXMgPSB2b2lkIDA7XG5cbnZhciBlY2NfY29uZmlnID0ge1xuICAgIGFkZHJlc3NfcHJlZml4OiBwcm9jZXNzLmVudi5ucG1fY29uZmlnX19ncmFwaGVuZV9lY2NfZGVmYXVsdF9hZGRyZXNzX3ByZWZpeCB8fCBcIkdQSFwiXG59O1xuXG5fdGhpcyA9IHtcbiAgICBjb3JlX2Fzc2V0OiBcIkNPUkVcIixcbiAgICBhZGRyZXNzX3ByZWZpeDogXCJHUEhcIixcbiAgICBleHBpcmVfaW5fc2VjczogMTUsXG4gICAgZXhwaXJlX2luX3NlY3NfcHJvcG9zYWw6IDI0ICogNjAgKiA2MCxcbiAgICByZXZpZXdfaW5fc2Vjc19jb21taXR0ZWU6IDI0ICogNjAgKiA2MCxcbiAgICBuZXR3b3Jrczoge1xuICAgICAgICBCaXRTaGFyZXM6IHtcbiAgICAgICAgICAgIGNvcmVfYXNzZXQ6IFwiQlRTXCIsXG4gICAgICAgICAgICBhZGRyZXNzX3ByZWZpeDogXCJCVFNcIixcbiAgICAgICAgICAgIGNoYWluX2lkOiBcIjQwMThkNzg0NGM3OGY2YTZjNDFjNmE1NTJiODk4MDIyMzEwZmM1ZGVjMDZkYTQ2N2VlNzkwNWE4ZGFkNTEyYzhcIlxuICAgICAgICB9LFxuICAgICAgICBNdXNlOiB7XG4gICAgICAgICAgICBjb3JlX2Fzc2V0OiBcIk1VU0VcIixcbiAgICAgICAgICAgIGFkZHJlc3NfcHJlZml4OiBcIk1VU0VcIixcbiAgICAgICAgICAgIGNoYWluX2lkOiBcIjQ1YWQyZDNmOWVmOTJhNDliNTVjMjIyN2ViMDYxMjNmNjEzYmIzNWRkMDhiZDg3NmYyYWVhMjE5MjVhNjdhNjdcIlxuICAgICAgICB9LFxuICAgICAgICBUZXN0OiB7XG4gICAgICAgICAgICBjb3JlX2Fzc2V0OiBcIlRFU1RcIixcbiAgICAgICAgICAgIGFkZHJlc3NfcHJlZml4OiBcIlRFU1RcIixcbiAgICAgICAgICAgIGNoYWluX2lkOiBcIjM5ZjVlMmVkZTFmOGJjMWEzYTU0YTc5MTQ0MTRlMzc3OWUzMzE5M2YxZjU2OTM1MTBlNzNjYjdhODc2MTc0NDdcIlxuICAgICAgICB9LFxuICAgICAgICBPYmVsaXNrOiB7XG4gICAgICAgICAgICBjb3JlX2Fzc2V0OiBcIkdPVlwiLFxuICAgICAgICAgICAgYWRkcmVzc19wcmVmaXg6IFwiRkVXXCIsXG4gICAgICAgICAgICBjaGFpbl9pZDogXCIxY2ZkZTdjMzg4YjllOGFjMDY0NjJkNjhhYWRiZDk2NmI1OGY4ODc5NzYzN2Q5YWY4MDViNDU2MGIwZTk2NjFlXCJcbiAgICAgICAgfSxcbiAgICAgICAgUGVlcnBsYXlzOiB7XG4gICAgICAgICAgICBjb3JlX2Fzc2V0OiBcIlBQWVwiLFxuICAgICAgICAgICAgYWRkcmVzc19wcmVmaXg6IFwiUFBZXCIsXG4gICAgICAgICAgICBjaGFpbl9pZDogXCI1OTRlMjg0ZDNjNzMzYWZhYWEzNGE1ZTk5YTM5ZWRiMzFlNTE5MmZhYjAyMzEwMWQ2OTFkOTUyMDM0OTAyMjM3XCJcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKiogU2V0IGEgZmV3IHByb3BlcnRpZXMgZm9yIGtub3duIGNoYWluIElEcy4gKi9cbiAgICBzZXRDaGFpbklkOiBmdW5jdGlvbiBzZXRDaGFpbklkKGNoYWluX2lkKSB7XG5cbiAgICAgICAgdmFyIGkgPSB2b2lkIDAsXG4gICAgICAgICAgICBsZW4gPSB2b2lkIDAsXG4gICAgICAgICAgICBuZXR3b3JrID0gdm9pZCAwLFxuICAgICAgICAgICAgbmV0d29ya19uYW1lID0gdm9pZCAwLFxuICAgICAgICAgICAgcmVmID0gdm9pZCAwO1xuICAgICAgICByZWYgPSBPYmplY3Qua2V5cyhfdGhpcy5uZXR3b3Jrcyk7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cbiAgICAgICAgICAgIG5ldHdvcmtfbmFtZSA9IHJlZltpXTtcbiAgICAgICAgICAgIG5ldHdvcmsgPSBfdGhpcy5uZXR3b3Jrc1tuZXR3b3JrX25hbWVdO1xuXG4gICAgICAgICAgICBpZiAobmV0d29yay5jaGFpbl9pZCA9PT0gY2hhaW5faWQpIHtcblxuICAgICAgICAgICAgICAgIF90aGlzLm5ldHdvcmtfbmFtZSA9IG5ldHdvcmtfbmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChuZXR3b3JrLmFkZHJlc3NfcHJlZml4KSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFkZHJlc3NfcHJlZml4ID0gbmV0d29yay5hZGRyZXNzX3ByZWZpeDtcbiAgICAgICAgICAgICAgICAgICAgZWNjX2NvbmZpZy5hZGRyZXNzX3ByZWZpeCA9IG5ldHdvcmsuYWRkcmVzc19wcmVmaXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJJTkZPICAgIENvbmZpZ3VyZWQgZm9yXCIsIG5ldHdvcmtfbmFtZSwgXCI6XCIsIG5ldHdvcmsuY29yZV9hc3NldCwgXCJcXG5cIik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBuZXR3b3JrX25hbWU6IG5ldHdvcmtfbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbmV0d29yazogbmV0d29ya1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIV90aGlzLm5ldHdvcmtfbmFtZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbmtub3duIGNoYWluIGlkICh0aGlzIG1heSBiZSBhIHRlc3RuZXQpXCIsIGNoYWluX2lkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIF90aGlzLmNvcmVfYXNzZXQgPSBcIkNPUkVcIjtcbiAgICAgICAgX3RoaXMuYWRkcmVzc19wcmVmaXggPSBcIkdQSFwiO1xuICAgICAgICBlY2NfY29uZmlnLmFkZHJlc3NfcHJlZml4ID0gXCJHUEhcIjtcbiAgICAgICAgX3RoaXMuZXhwaXJlX2luX3NlY3MgPSAxNTtcbiAgICAgICAgX3RoaXMuZXhwaXJlX2luX3NlY3NfcHJvcG9zYWwgPSAyNCAqIDYwICogNjA7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJDaGFpbiBjb25maWcgcmVzZXRcIik7XG4gICAgfSxcblxuICAgIHNldFByZWZpeDogZnVuY3Rpb24gc2V0UHJlZml4KCkge1xuICAgICAgICB2YXIgcHJlZml4ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBcIkdQSFwiO1xuXG4gICAgICAgIF90aGlzLmFkZHJlc3NfcHJlZml4ID0gcHJlZml4O1xuICAgICAgICBlY2NfY29uZmlnLmFkZHJlc3NfcHJlZml4ID0gcHJlZml4O1xuICAgIH1cbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IF90aGlzO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBTT0NLRVRfREVCVUcgPSB0cnVlO1xuXG52YXIgU1VCU0NSSUJFX09QRVJBVElPTlMgPSBbJ3NldF9zdWJzY3JpYmVfY2FsbGJhY2snLCAnc3Vic2NyaWJlX3RvX21hcmtldCcsICdicm9hZGNhc3RfdHJhbnNhY3Rpb25fd2l0aF9jYWxsYmFjaycsICdzZXRfcGVuZGluZ190cmFuc2FjdGlvbl9jYWxsYmFjayddO1xuXG52YXIgVU5TVUJTQ1JJQkVfT1BFUkFUSU9OUyA9IFsndW5zdWJzY3JpYmVfZnJvbV9tYXJrZXQnLCAndW5zdWJzY3JpYmVfZnJvbV9hY2NvdW50cyddO1xuXG52YXIgSEVBTFRIX0NIRUNLX0lOVEVSVkFMID0gMTAwMDA7XG5cbnZhciBDaGFpbldlYlNvY2tldCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKlxuICAgICAqQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBDaGFpbldlYlNvY2tldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gICAgICBzZXJ2ZXJBZGRyZXNzICAgICAgICAgICBUaGUgYWRkcmVzcyBvZiB0aGUgd2Vic29ja2V0IHRvIGNvbm5lY3QgdG8uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gICAgc3RhdHVzQ2IgICAgICAgICAgICAgICAgQSBjYWxsYmFjayB3aGljaCB3aWxsIGJlIGNhbGxlZCB3aGVuIHN0YXR1cyBldmVudHMgb2NjdXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9ICAgICAgW2Nvbm5lY3RUaW1lb3V0PTEwMDAwXSAgVGhlIGFsbG93ZWQgdGltZSBmb3IgYSBjb25uZWN0aW9uIGF0dGVtcHQgdG8gY29tcGxldGUuXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG4gICAgZnVuY3Rpb24gQ2hhaW5XZWJTb2NrZXQoc2VydmVyQWRkcmVzcywgc3RhdHVzQ2IpIHtcbiAgICAgICAgdmFyIGNvbm5lY3RUaW1lb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAxMDAwMDtcblxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ2hhaW5XZWJTb2NrZXQpO1xuXG4gICAgICAgIHRoaXMuc3RhdHVzQ2IgPSBzdGF0dXNDYjtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gc2VydmVyQWRkcmVzcztcbiAgICAgICAgdGhpcy50aW1lb3V0SW50ZXJ2YWwgPSBjb25uZWN0VGltZW91dDtcblxuICAgICAgICAvLyBUaGUgY3VycmVuY3QgY29ubmVjdGlvbiBzdGF0ZSBvZiB0aGUgd2Vic29ja2V0LlxuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIENhbGxiYWNrIHRvIGV4ZWN1dGUgd2hlbiB0aGUgd2Vic29ja2V0IGlzIHJlY29ubmVjdGVkLlxuICAgICAgICB0aGlzLm9uX3JlY29ubmVjdCA9IG51bGw7XG5cbiAgICAgICAgLy8gQW4gaW5jcmVtZW50aW5nIElEIGZvciBlYWNoIHJlcXVlc3Qgc28gdGhhdCB3ZSBjYW4gcGFpciBpdCB3aXRoIHRoZSByZXNwb25zZSBmcm9tIHRoZSB3ZWJzb2NrZXQuXG4gICAgICAgIHRoaXMuY2JJZCA9IDA7XG5cbiAgICAgICAgLy8gT2JqZWN0cyB0byBzdG9yZSBrZXkvdmFsdWUgcGFpcnMgZm9yIGNhbGxiYWNrcywgc3Vic2NyaXB0aW9uIGNhbGxiYWNrcyBhbmQgdW5zdWJzY3JpYmUgY2FsbGJhY2tzLlxuICAgICAgICB0aGlzLmNicyA9IHt9O1xuICAgICAgICB0aGlzLnN1YnMgPSB7fTtcbiAgICAgICAgdGhpcy51bnN1YiA9IHt9O1xuXG4gICAgICAgIC8vIEN1cnJlbnQgY29ubmVjdGlvbiBwcm9taXNlcycgcmVqZWN0aW9uXG4gICAgICAgIHRoaXMuY3VycmVudFJlc29sdmUgPSBudWxsO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZWplY3QgPSBudWxsO1xuXG4gICAgICAgIC8vIEhlYWx0aCBjaGVjayBmb3IgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIC8vIENvcHkgdGhlIGNvbnN0YW50cyB0byB0aGlzIGluc3RhbmNlLlxuICAgICAgICB0aGlzLnN0YXR1cyA9IENoYWluV2ViU29ja2V0LnN0YXR1cztcblxuICAgICAgICAvLyBCaW5kIHRoZSBmdW5jdGlvbnMgdG8gdGhlIGluc3RhbmNlLlxuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbk9wZW4gPSB0aGlzLm9uQ29ubmVjdGlvbk9wZW4uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSA9IHRoaXMub25Db25uZWN0aW9uQ2xvc2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vbkNvbm5lY3Rpb25UZXJtaW5hdGUgPSB0aGlzLm9uQ29ubmVjdGlvblRlcm1pbmF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbkVycm9yID0gdGhpcy5vbkNvbm5lY3Rpb25FcnJvci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQgPSB0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uID0gdGhpcy5jcmVhdGVDb25uZWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UgPSB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyLmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gVE9ETzogRG8gd2Ugd2FudCB0byBtb3ZlIHRoZSBQSU5HIGxvZ2ljIGludG8gaGVyZT9cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGluaXRpYWwgY29ubmVjdGlvbiB0aGUgYmxvY2tjaGFpbi5cbiAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja2NoYWluLlxuICAgICAqXG4gICAgICogQHJldHVybnNcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uKCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgY3JlYXRlIGNvbm5lY3Rpb24nKTtcblxuICAgICAgICAvLyBDbGVhciBhbnkgcG9zc2libGUgcmVjb25uZWN0IHRpbWVycy5cbiAgICAgICAgdGhpcy5yZWNvbm5lY3RUaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHByb21pc2UgZm9yIHRoaXMgY29ubmVjdGlvblxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdF9wcm9taXNlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3RfcHJvbWlzZSA9IG5ldyBQcm9taXNlKHRoaXMuY3JlYXRlQ29ubmVjdGlvblByb21pc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXR0ZW1wdCB0byBjcmVhdGUgdGhlIHdlYnNvY2tldFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJBZGRyZXNzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNldCBhIHRpbWVvdXQgdG8gdHJ5IGFuZCByZWNvbm5lY3QgaGVyZS5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuXG4gICAgICAgIC8vIEhhbmRsZSB0aW1lb3V0cyB0byB0aGUgd2Vic29ja2V0J3MgaW5pdGlhbCBjb25uZWN0aW9uLlxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm9uQ29ubmVjdGlvblRpbWVvdXQsIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGNvbm5lY3Rpb24gdG8gdGhlIEJsb2NrQ2hhaW4uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLnJlc2V0Q29ubmVjdGlvbiA9IGZ1bmN0aW9uIHJlc2V0Q29ubmVjdGlvbigpIHtcblxuICAgICAgICAvLyBDbGVhciBvdXIgdGltZW91dHMgZm9yIGNvbm5lY3Rpb24gdGltZW91dCBhbmQgaGVhbHRoIGNoZWNrLlxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5jb25uZWN0aW9uVGltZW91dCk7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmhlYWx0aENoZWNrKTtcbiAgICAgICAgdGhpcy5oZWFsdGhDaGVjayA9IG51bGw7XG5cbiAgICAgICAgLy8gVG9nZ2xlIHRoZSBjb25uZWN0ZWQgZmxhZy5cbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICAvLyBDbG9zZSB0aGUgV2Vic29ja2V0IGlmIGl0cyBzdGlsbCAnaGFsZi1vcGVuJ1xuICAgICAgICBpZiAodGhpcy53cykge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoZSBwcmV2aW91cyBzb2NrZXQuXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgICAgICAgICB0aGlzLndzLmNsb3NlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHN1cmUgd2Ugb25seSBldmVyIGhhdmUgb25lIHRpbWVvdXQgcnVubmluZyB0byByZWNvbm5lY3QuXG4gICAgICAgIGlmICghdGhpcy5yZWNvbm5lY3RUaW1lb3V0KSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgcmVzZXQgY29ubmVjdGlvbicsIHRoaXMudGltZW91dEludGVydmFsKTtcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0VGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5jcmVhdGVDb25uZWN0aW9uLCB0aGlzLnRpbWVvdXRJbnRlcnZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWplY3QgdGhlIGN1cnJlbnQgcHJvbWlzZSBpZiB0aGVyZSBpcyBvbmUuIFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVqZWN0KSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZWplY3QobmV3IEVycm9yKCdDb25uZWN0aW9uIGF0dGVtcHQgZmFpbGVkOiAnICsgdGhpcy5zZXJ2ZXJBZGRyZXNzKSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWRkIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgV2ViU29ja2V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENoYWluV2ViU29ja2V0XG4gICAgICovXG5cblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmRlYnVnKCchISEgQ2hhaW5XZWJTb2NrZXQgYWRkIGV2ZW50IGxpc3RlbmVycycpO1xuICAgICAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ29wZW4nLCB0aGlzLm9uQ29ubmVjdGlvbk9wZW4pO1xuICAgICAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgdGhpcy5vbkNvbm5lY3Rpb25DbG9zZSk7XG4gICAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLm9uQ29ubmVjdGlvbkVycm9yKTtcbiAgICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB0aGUgZXZlbnQgbGlzdGVycyBmcm9tIHRoZSBXZWJTb2NrZXQuIEl0cyBpbXBvcnRhbnQgdG8gcmVtb3ZlIHRoZSBldmVudCBsaXN0ZXJlcnMgXG4gICAgICogZm9yIGdhcmJhYWdlIGNvbGxlY3Rpb24uIEJlY2F1c2Ugd2UgYXJlIGNyZWF0aW5nIGEgbmV3IFdlYlNvY2tldCBvbiBlYWNoIGNvbm5lY3Rpb24gYXR0ZW1wdFxuICAgICAqIGFueSBsaXN0ZW5lcnMgdGhhdCBhcmUgc3RpbGwgYXR0YWNoZWQgY291bGQgcHJldmVudCB0aGUgb2xkIHNvY2tldHMgZnJvbSBiZWluZyBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycygpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHJlbW92ZSBldmVudCBsaXN0ZW5lcnMnKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcGVuJywgdGhpcy5vbkNvbm5lY3Rpb25PcGVuKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbG9zZScsIHRoaXMub25Db25uZWN0aW9uQ2xvc2UpO1xuICAgICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5vbkNvbm5lY3Rpb25FcnJvcik7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMubGlzdGVuZXIpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgaXMgcGFzc2VkIHRvIGEgbmV3IHByb21pc2UgdGhhdCBzdG9yZXMgdGhlIHJlc29sdmUgYW5kIHJlamVjdCBjYWxsYmFja3MgaW4gdGhlIHN0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBBIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHByb21pc2UgaXMgcmVzb2x2ZWQuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVqZWN0IEEgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgd2hlbiB0aGUgcHJvbWlzZSBpcyByZWplY3RlZC5cbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlID0gZnVuY3Rpb24gY3JlYXRlQ29ubmVjdGlvblByb21pc2UocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBjcmVhdGVQcm9taXNlJyk7XG4gICAgICAgIHRoaXMuY3VycmVudFJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZWplY3QgPSByZWplY3Q7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGEgbmV3IFdlYnNvY2tldCBjb25uZWN0aW9uIGlzIG9wZW5lZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uT3BlbiA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvbk9wZW4oKSB7XG5cbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENvbm5lY3RlZCAnKTtcblxuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAvLyBUaGlzIHdpbGwgdHJpZ2dlciB0aGUgbG9naW4gcHJvY2VzcyBhcyB3ZWxsIGFzIHNvbWUgYWRkaXRpb25hbCBzZXR1cCBpbiBBcGlJbnN0YW5jZXNcbiAgICAgICAgaWYgKHRoaXMub25fcmVjb25uZWN0KSB7XG4gICAgICAgICAgICB0aGlzLm9uX3JlY29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlc29sdmUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlc29sdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0NiKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0NiKENoYWluV2ViU29ja2V0LnN0YXR1cy5PUEVOKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBhdHRlbXB0IHRpbWVzIG91dC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUub25Db25uZWN0aW9uVGltZW91dCA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvblRpbWVvdXQoKSB7XG4gICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCB0aW1lb3V0Jyk7XG4gICAgICAgIHRoaXMub25Db25uZWN0aW9uQ2xvc2UobmV3IEVycm9yKCdDb25uZWN0aW9uIHRpbWVkIG91dC4nKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBXZWJzb2NrZXQgaXMgbm90IHJlc3BvbmRpbmcgdG8gdGhlIGhlYWx0aCBjaGVja3MuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvblRlcm1pbmF0ZSA9IGZ1bmN0aW9uIG9uQ29ubmVjdGlvblRlcm1pbmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IHRlcm1pbmF0ZScpO1xuICAgICAgICB0aGlzLm9uQ29ubmVjdGlvbkNsb3NlKG5ldyBFcnJvcignQ29ubmVjdGlvbiB3YXMgdGVybWluYXRlZC4nKSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBjb25uZWN0aW9uIHRvIHRoZSBCbG9ja2NoYWluIGlzIGNsb3NlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gZXJyb3JcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvbkNsb3NlID0gZnVuY3Rpb24gb25Db25uZWN0aW9uQ2xvc2UoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENsb3NlICcsIGVycm9yKTtcblxuICAgICAgICB0aGlzLnJlc2V0Q29ubmVjdGlvbigpO1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0NiKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0NiKENoYWluV2ViU29ja2V0LnN0YXR1cy5DTE9TRUQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBXZWJzb2NrZXQgZW5jb3VudGVycyBhbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Kn0gZXJyb3JcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLm9uQ29ubmVjdGlvbkVycm9yID0gZnVuY3Rpb24gb25Db25uZWN0aW9uRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IE9uIENvbm5lY3Rpb24gRXJyb3IgJywgZXJyb3IpO1xuXG4gICAgICAgIHRoaXMucmVzZXRDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQ2IpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2IoQ2hhaW5XZWJTb2NrZXQuc3RhdHVzLkVSUk9SKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFbnRyeSBwb2ludCB0byBtYWtlIFJQQyBjYWxscyBvbiB0aGUgQmxvY2tDaGFpbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YXJyYXl9IHBhcmFtcyBBbiBhcnJheSBvZiBwYXJhbXMgdG8gYmUgcGFzc2VkIHRvIHRoZSBycGMgY2FsbC4gW21ldGhvZCwgLi4ucGFyYW1zXVxuICAgICAqIEByZXR1cm5zIEEgbmV3IHByb21pc2UgZm9yIHRoaXMgc3BlY2lmaWMgY2FsbC5cbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiBjYWxsKHBhcmFtcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWcoJyEhISBDaGFpbldlYlNvY2tldCBDYWxsIG5vdCBjb25uZWN0ZWQuICcpO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignRGlzY29ubmVjdGVkIGZyb20gdGhlIEJsb2NrQ2hhaW4uJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IENhbGwgY29ubmVjdGVkLiAnLCBwYXJhbXMpO1xuXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgbWV0aG9kOiBwYXJhbXNbMV0sXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIGlkOiB0aGlzLmNiSWQgKyAxXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5jYklkID0gcmVxdWVzdC5pZDtcblxuICAgICAgICBpZiAoU1VCU0NSSUJFX09QRVJBVElPTlMuaW5jbHVkZXMocmVxdWVzdC5tZXRob2QpKSB7XG4gICAgICAgICAgICAvLyBTdG9yZSBjYWxsYmFjayBpbiBzdWJzIG1hcFxuICAgICAgICAgICAgdGhpcy5zdWJzW3JlcXVlc3QuaWRdID0ge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiByZXF1ZXN0LnBhcmFtc1syXVswXVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gUmVwbGFjZSBjYWxsYmFjayB3aXRoIHRoZSBjYWxsYmFjayBpZFxuICAgICAgICAgICAgcmVxdWVzdC5wYXJhbXNbMl1bMF0gPSByZXF1ZXN0LmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFVOU1VCU0NSSUJFX09QRVJBVElPTlMuaW5jbHVkZXMocmVxdWVzdC5tZXRob2QpKSB7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVxdWVzdC5wYXJhbXNbMl1bMF0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IHBhcmFtZXRlciBvZiB1bnN1YiBtdXN0IGJlIHRoZSBvcmlnaW5hbCBjYWxsYmFjaycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdW5TdWJDYiA9IHJlcXVlc3QucGFyYW1zWzJdLnNwbGljZSgwLCAxKVswXTtcblxuICAgICAgICAgICAgLy8gRmluZCB0aGUgY29ycmVzcG9uZGluZyBzdWJzY3JpcHRpb25cbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuc3Vicykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN1YnNbaWRdLmNhbGxiYWNrID09PSB1blN1YkNiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW5zdWJbcmVxdWVzdC5pZF0gPSBpZDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmhlYWx0aENoZWNrKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWx0aENoZWNrID0gc2V0VGltZW91dCh0aGlzLm9uQ29ubmVjdGlvblRlcm1pbmF0ZS5iaW5kKHRoaXMpLCBIRUFMVEhfQ0hFQ0tfSU5URVJWQUwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIF90aGlzLmNic1tyZXF1ZXN0LmlkXSA9IHtcbiAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHJlc29sdmU6IHJlc29sdmUsXG4gICAgICAgICAgICAgICAgcmVqZWN0OiByZWplY3RcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFNldCBhbGwgcmVxdWVzdHMgdG8gYmUgJ2NhbGwnIG1ldGhvZHMuXG4gICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9ICdjYWxsJztcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBfdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KHJlcXVlc3QpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZGVidWcoJ0NhdWdodCBhIG5hc3R5IGVycm9yIDogJywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gbWVzc2FnZXMgYXJlIHJlY2VpdmVkIG9uIHRoZSBXZWJzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0geyp9IHJlc3BvbnNlIFRoZSBtZXNzYWdlIHJlY2VpdmVkLiBcbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmxpc3RlbmVyID0gZnVuY3Rpb24gbGlzdGVuZXIocmVzcG9uc2UpIHtcblxuICAgICAgICB2YXIgcmVzcG9uc2VKU09OID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzcG9uc2VKU09OID0gSlNPTi5wYXJzZShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEhhbmRsZSBlcnJvcnMgcGFyc2luZyByZXNwb25zZSBhcyBKU09OLlxuICAgICAgICAgICAgdGhpcy5kZWJ1ZygnRXJyb3IgcGFyc2luZyByZXNwb25zZTogJywgcmVzcG9uc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGhlYWx0aCBjaGVjayB0aW1lb3V0LCB3ZSd2ZSBqdXN0IHJlY2VpdmVkIGEgaGVhbHRoeSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgIGlmICh0aGlzLmhlYWx0aENoZWNrKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgICAgICB0aGlzLmhlYWx0aENoZWNrID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWIgPSBmYWxzZSxcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbnVsbDtcblxuICAgICAgICBpZiAocmVzcG9uc2VKU09OLm1ldGhvZCA9PT0gJ25vdGljZScpIHtcbiAgICAgICAgICAgIHN1YiA9IHRydWU7XG4gICAgICAgICAgICByZXNwb25zZUpTT04uaWQgPSByZXNwb25zZUpTT04ucGFyYW1zWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdWIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jYnNbcmVzcG9uc2VKU09OLmlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5zdWJzW3Jlc3BvbnNlSlNPTi5pZF0uY2FsbGJhY2s7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FsbGJhY2sgJiYgIXN1Yikge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSlNPTi5lcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcoJy0tLS0+IHJlc3BvbnNlSlNPTiA6ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sucmVqZWN0KHJlc3BvbnNlSlNPTi5lcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLnJlc29sdmUocmVzcG9uc2VKU09OLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jYnNbcmVzcG9uc2VKU09OLmlkXTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudW5zdWJbcmVzcG9uc2VKU09OLmlkXSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnN1YnNbdGhpcy51bnN1YltyZXNwb25zZUpTT04uaWRdXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy51bnN1YltyZXNwb25zZUpTT04uaWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGNhbGxiYWNrICYmIHN1Yikge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2VKU09OLnBhcmFtc1sxXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnKCdXYXJuaW5nOiB1bmtub3duIHdlYnNvY2tldCByZXNwb25zZUpTT046ICcsIHJlc3BvbnNlSlNPTik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTG9naW4gdG8gdGhlIEJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlciBVc2VybmFtZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCBQYXNzd29yZFxuICAgICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCBhZnRlciBsb2dpbi5cbiAgICAgKiBAbWVtYmVyb2YgQ2hhaW5XZWJTb2NrZXRcbiAgICAgKi9cblxuXG4gICAgQ2hhaW5XZWJTb2NrZXQucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlciwgcGFzc3dvcmQpIHtcbiAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5kZWJ1ZygnISEhIENoYWluV2ViU29ja2V0IGxvZ2luLicsIHVzZXIsIHBhc3N3b3JkKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdF9wcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzMi5jYWxsKFsxLCAnbG9naW4nLCBbdXNlciwgcGFzc3dvcmRdXSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgY29ubmVjdGlvbiB0byB0aGUgQmxvY2tjaGFpbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDaGFpbldlYlNvY2tldFxuICAgICAqL1xuXG5cbiAgICBDaGFpbldlYlNvY2tldC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiBjbG9zZSgpIHtcblxuICAgICAgICBjb25zb2xlLmxvZygnQ0xPU0UgSVMgRklSRUQhJyk7XG5cbiAgICAgICAgaWYgKHRoaXMud3MpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoKTtcblxuICAgICAgICAgICAgLy8gVHJ5IGFuZCBmaXJlIGNsb3NlIG9uIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuXG4gICAgICAgICAgICAvLyBDbGVhciBvdXIgcmVmZXJlbmNlcyBzbyB0aGF0IGl0IGNhbiBiZSBnYXJiYWdlIGNvbGxlY3RlZC5cbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xlYXIgb3VyIHRpbWVvdXRzIGZvciBjb25uZWN0aW9uIHRpbWVvdXQgYW5kIGhlYWx0aCBjaGVjay5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuY29ubmVjdGlvblRpbWVvdXQpO1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5oZWFsdGhDaGVjayk7XG4gICAgICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBudWxsO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlY29ubmVjdFRpbWVvdXQpO1xuICAgICAgICB0aGlzLnJlY29ubmVjdFRpbWVvdXQgPSBudWxsO1xuXG4gICAgICAgIC8vIFRvZ2dsZSB0aGUgY29ubmVjdGVkIGZsYWcuXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgfTtcblxuICAgIENoYWluV2ViU29ja2V0LnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgICAgICBpZiAoU09DS0VUX0RFQlVHKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBDaGFpbldlYlNvY2tldDtcbn0oKTtcblxuLy8gQ29uc3RhbnRzIGZvciBTVEFURVxuXG5cbkNoYWluV2ViU29ja2V0LnN0YXR1cyA9IHtcbiAgICBSRUNPTk5FQ1RFRDogJ3JlY29ubmVjdGVkJyxcbiAgICBPUEVOOiAnb3BlbicsXG4gICAgQ0xPU0VEOiAnY2xvc2VkJyxcbiAgICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhaW5XZWJTb2NrZXQ7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEdyYXBoZW5lQXBpID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdyYXBoZW5lQXBpKHdzX3JwYywgYXBpX25hbWUpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEdyYXBoZW5lQXBpKTtcblxuICAgICAgICB0aGlzLndzX3JwYyA9IHdzX3JwYztcbiAgICAgICAgdGhpcy5hcGlfbmFtZSA9IGFwaV9uYW1lO1xuICAgIH1cblxuICAgIEdyYXBoZW5lQXBpLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICByZXR1cm4gdGhpcy53c19ycGMuY2FsbChbMSwgdGhpcy5hcGlfbmFtZSwgW11dKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgX3RoaXMuYXBpX2lkID0gcmVzcG9uc2U7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBHcmFwaGVuZUFwaS5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3NfcnBjLmNhbGwoW3RoaXMuYXBpX2lkLCBtZXRob2QsIHBhcmFtc10pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCIhISEgR3JhcGhlbmVBcGkgZXJyb3I6IFwiLCBtZXRob2QsIHBhcmFtcywgZXJyb3IsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBHcmFwaGVuZUFwaTtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gR3JhcGhlbmVBcGk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
