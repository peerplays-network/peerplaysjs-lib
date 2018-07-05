// let WebSocketClient;
// // if (typeof WebSocket === 'undefined' && !process.env.browser) {
// //     WebSocketClient = require('ws');
// // } else if (typeof(WebSocket) !== 'undefined' && typeof document !== 'undefined') {
// //     console.log('Using reconnecting WebSocket');
// //     WebSocketClient = require('ReconnectingWebSocket');
// // } else {
//     WebSocketClient = WebSocket;
// //}

var SOCKET_DEBUG = false;

const SUBSCRIBE_OPERATIONS = [
    'set_subscribe_callback',
    'subscribe_to_market',
    'broadcast_transaction_with_callback',
    'set_pending_transaction_callback'
];

const UNSUBSCRIBE_OPERATIONS = [
    'unsubscribe_from_market',
    'unsubscribe_from_accounts'
];

const HEALTH_CHECK_INTERVAL = 10000;

class ChainWebSocket {

    constructor (serverAddress, statusCb, connectTimeout = 10000) {
        
        this.statusCb = statusCb;
        this.serverAddress = serverAddress;
        //this.timeoutInterval = connectTimeout;
        this.timeoutInterval = 5000;

        // The currenct connection state of the websocket.
        this.connected = false;
        this.reconnectTimeout = null;

        // Callback to execute when the websocket is reconnected.
        this.on_reconnect = null;
        
        // An incrementing ID for each request so that we can pair it with the response from the websocket.
        this.cbId = 0;

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

    createConnection () {
        console.log('!!! ChainWebSocket create connection');
        
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
    }

    resetConnection () {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;

        clearTimeout(this.healthCheck);
        this.healthCheck = null;

        this.connected = false;

        // Close the Websocket if its still 'half-open'
        if (this.ws) {
            // Clean up the event listeners from the previous socket.
            this.removeEventListeners();
            this.ws.close();
        }

        // Reject the current promise if there is one. 
        if (this.currentReject) {
            this.currentReject(new Error('Connection attempt failed: ' + this.serverAddress));
        }

        // Make sure we only ever have one timeout running to reconnect.
        if (!this.reconnectTimeout) {
            console.log('!!! ChainWebSocket reset connection', this.timeoutInterval);
            this.reconnectTimeout = setTimeout(this.createConnection, this.timeoutInterval);
        }
    }

    addEventListeners () {
        console.log('!!! ChainWebSocket add event listeners');
        this.ws.addEventListener('open', this.onConnectionOpen);
        this.ws.addEventListener('close', this.onConnectionClose);
        this.ws.addEventListener('error', this.onConnectionError);
        this.ws.addEventListener('message', this.listener);
    }

    removeEventListeners () {
        console.log('!!! ChainWebSocket remove event listeners');
        this.ws.removeEventListener('open', this.onConnectionOpen);
        this.ws.removeEventListener('close', this.onConnectionClose);
        this.ws.removeEventListener('error', this.onConnectionError);
        this.ws.removeEventListener('message', this.listener);
    }

    createConnectionPromise (resolve, reject) {
        console.log('!!! ChainWebSocket createPromise');
        this.currentResolve = resolve;
        this.currentReject = reject;
    }

    onConnectionOpen () {
        
        console.log('!!! ChainWebSocket Connected ')
        
        this.connected = true;

        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;

        if (this.statusCb) {
            this.statusCb(ChainWebSocket.status.OPEN);
        }
        
        // This will trigger the login process as well as some additional setup in ApiInstances
        if (this.on_reconnect) {
            this.on_reconnect();
        }
        
        if (this.currentResolve) {
            this.currentResolve();
        }
    }

    onConnectionTimeout () {
        console.log('!!! ChainWebSocket timeout');
        this.onConnectionClose(new Error('Connection timed out.'));
    }

    onConnectionTerminate () {
        console.log('!!! ChainWebSocket terminate');
        this.onConnectionClose(new Error('Connection was terminated.'));
    }

    onConnectionClose (error) {
        console.log('!!! ChainWebSocket Close ', error);

        if (this.statusCb) {
            this.statusCb(ChainWebSocket.status.CLOSED);
        }

        this.resetConnection();
    }

    onConnectionError (error) {
        console.log('!!! ChainWebSocket On Connection Error ', error);
        
        if (this.statusCb) {
            this.statusCb(ChainWebSocket.status.ERROR);
        }

        this.resetConnection();
    }

    call(params) {

        if (!this.connected) {
            console.log('!!! ChainWebSocket Call not connected. ');
            return Promise.reject(new Error('Disconnected from the BlockChain.'));
        }

        console.log('!!! ChainWebSocket Call connected. ', params);

        let request = {
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

            let unSubCb = request.params[2].splice(0, 1)[0];

            // Find the corresponding subscription
            for (let id in this.subs) {
                if (this.subs[id].callback === unSubCb) {
                    this.unsub[request.id] = id;
                    break;
                }
            }
        }

        if (!this.healthCheck) {
            this.healthCheck = setTimeout(this.onConnectionTerminate.bind(this), HEALTH_CHECK_INTERVAL);
        }

        return new Promise((resolve, reject) => {
            this.cbs[request.id] = {
                time: new Date(),
                resolve: resolve,
                reject: reject
            };
            
            // Overwrite the websockets error handler just for this case. There needs to be a better way.
            this.ws.onerror = (error) => {
                
                // TODO: Can we determine through the error message, the id of the callback that should have been fired?
                // FIXME: What type of errors can happen here? Should the health check be cleared?
                //this.onError(error);
                reject(error);
            };

            // Set all requests to be 'call' methods.
            request.method = 'call';

            try {
                this.ws.send(JSON.stringify(request));
            } catch (error) {
                console.log('Caught a nasty error : ', error);
            }
        });

    }

    listener (response) {

        let responseJSON = null;

        try {
            responseJSON = JSON.parse(response.data);
        } catch (error) {   
            // TODO: Handle errors parsing response as JSON.
            console.log('Error parsing response: ', response)
        }

        // Clear the health check timeout, we've just received a healthy response from the server.
        if (this.healthCheck) {
            clearTimeout(this.healthCheck);
            this.healthCheck = null;
        }

        let sub = false,
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
                console.log('----> responseJSON : ', responseJSON);
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
            console.log('Warning: unknown websocket responseJSON: ', responseJSON);
        }
    }

    login (user, password) {
        console.log('!!! ChainWebSocket login.', user, password);
        return this.connect_promise.then(() => {
            return this.call([1, 'login', [user, password]]);
        });
    }

    close () {
        if (this.ws) {
            // Try and fire close on the connection.
            this.ws.close();
            // Clear our references so that it can be garbage collected.
            this.ws = null;
        }
    }
}

// Constants for STATE
ChainWebSocket.status = {
    RECONNECTED: 'reconnected',
    OPEN: 'open',
    CLOSED: 'closed',
    ERROR: 'error'
};

export default ChainWebSocket;
