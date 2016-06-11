# GrapheneJS WebSocket interface (graphenejs-ws)

Pure JavaScript Bitshares/Graphene websocket library for node.js and browsers. be use to easily connect to and obtain data from a Graphene based blockchain via public apis.

Credit for the original implementation goes to [jcalfeee](https://github.com/jcalfee).

[![npm version](https://img.shields.io/npm/v/graphenejs-ws.svg?style=flat-square)](https://www.npmjs.com/package/graphenejs-ws)
[![npm downloads](https://img.shields.io/npm/dm/graphenejs-ws.svg?style=flat-square)](https://www.npmjs.com/package/graphenejs-ws)


## Setup

This library can be obtained through npm:
```
npm install graphenejs-ws
```

## Usage

Browser bundles are provided in /build/, for testing purposes you can access this from rawgit:

```
<script type="text/javascript" src="https://cdn.rawgit.com/svk31/graphenejs-ws/build/graphenejs-ws.js" />
```

A variable grapheneWS will be available in window.

For use in a webpack/browserify context, see the example below for how to open a websocket connection to the Openledger API and subscribe to any object updates:

```
var {Apis} = require("graphenejs-ws");
Apis.instance("wss://bitshares.openledger.info/ws").init_promise.then((res) => {
    console.log("connected to:", res[0].network);
    Apis.instance().db_api().exec( "set_subscribe_callback", [ updateListener, true ] )
});

function updateListener(object) {
    console.log("set_subscribe_callback:\n", object);
}
```
The `set_subscribe_callback` callback (updateListener) will be called whenever an object on the blockchain changes. This is very powerful and can be used to listen to updates for specific accounts, assets or most anything else, as all state changes happens through object updates.

## Tests

The tests show several use cases, to run, simply type `npm run test`. The tests require a local witness node to be running, as well as an active internet connection.
