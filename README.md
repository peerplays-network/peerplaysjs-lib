# PeerplaysJS (peerplaysjs-lib)

Pure JavaScript Peerplays/Graphene library for node.js and browsers. Can be used to construct, sign and broadcast transactions in JavaScript, and to easily obtain data from the blockchain via public apis.

Most of this code was written by [jcalfee](https://github.com/jcalfee).

[![npm version](https://img.shields.io/npm/v/peerplaysjs-lib.svg?style=flat-square)](https://www.npmjs.com/package/peerplaysjs-lib)
[![npm version](https://img.shields.io/node/v/peerplaysjs-lib.svg?style=flat-square)](https://www.npmjs.com/package/peerplaysjs-lib)
[![npm downloads](https://img.shields.io/npm/dm/peerplaysjs-lib.svg?style=flat-square)](https://www.npmjs.com/package/peerplaysjs-lib)


<hr/>

[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib)

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=alert_status)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=security_rating)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=bugs)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=ncloc)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=peerplays-network_peerplaysjs-lib&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=peerplays-network_peerplaysjs-lib)

<hr/>

## Setup

This library can be obtained through npm:

```bash
npm install peerplaysjs-lib
```

## Getting Started

It is recommended to use Node v16+.

On Ubuntu and OSX, the easiest way to install Node is to use the [Node Version Manager](https://github.com/creationix/nvm).
For Windows users there is [NVM-Windows](https://github.com/coreybutler/nvm-windows).

To install NVM for Linux/OSX, simply copy paste the following in a terminal:

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v16+
nvm use v16+
```

Once you have Node installed, you can clone the repo:

```bash
git clone https://gitlab.com/PBSA/tools-libs/peerplaysjs-lib.git
cd peerplaysjs-lib
```

## Development

Initialize the application by running `npm run init`.

### Commits

> Please run `npx husky add .husky/commit-msg ".git/hooks/commit-msg \$1"` before commiting  
> Run `git commit -a -m "<commit-mesasge>"` for commiting 

This repository uses the git-commit-msg-linter package to aid in consistent commit messages. The reason we do this is so we can have dynamic changelog creation and smart semantic versioning based on commits (with the ability to override).

## Usage

Four sub-libraries are included: `ECC`, `Chain`, `WS` and `Serializer`. Generally only the `ECC` and `Chain` libraries need to be used directly. The `WS` library handles all the websocket connections.

### WS

<details>

<summary>peerplaysjs-ws is deprecated</summary>

Peerplaysjs-lib includes the now deprecated peerplaysjs-ws library within itself. Updating your code to reflect this is simple, here is an example:

```javascript
// current code
import {Apis} from 'peerplaysjs-ws';

// refactored
import {Apis} from 'peerplaysjs-lib';
```

Once you have all of your peerplaysjs-ws imports updated, you can uninstall the peerplaysjs-ws package.
</details>


```html
<script type="text/javascript" src="https://cdn.rawgit.com/pbsa/peerplaysjs-ws/build/peerplaysjs-ws.js" />
```

A variable peerplays_ws will be available in window.

For use in a webpack/browserify context, see the example below for how to open a websocket connection to the Openledger API and subscribe to any object updates:

```javascript
var {Apis} = require("peerplaysjs-lib");
Apis.instance("wss://bitshares.openledger.info/ws").init_promise.then((res) => {
    console.log("connected to:", res[0].network);
    Apis.instance().db_api().exec( "set_subscribe_callback", [ updateListener, true ] )
});

function updateListener(object) {
    console.log("set_subscribe_callback:\n", object);
}
```

The `set_subscribe_callback` callback (updateListener) will be called whenever an object on the blockchain changes or is removed. This is very powerful and can be used to listen to updates for specific accounts, assets or most anything else, as all state changes happen through object updates. Be aware though that you will receive quite a lot of data this way.

### Chain

This library provides utility functions to handle blockchain state as well as a login class that can be used for simple login functionality using a specific key seed.

#### Login

The login class uses the following format for keys:

```bash
keySeed = accountName + role + password
```

Using this seed, private keys are generated for either the default roles `active, owner, memo`, or as specified. A minimum password length of 12 characters is enforced, but an even longer password is recommended. Three methods are provided:

```js
generateKeys(account, password, [roles])
checkKeys(account, password, auths)
signTransaction(tr)
```

The auths object should contain the auth arrays from the account object. An example is this:

```json
{
    active: [
        ["PPY∂5Abm5dCdy3hJ1C5ckXkqUH2Me7dXqi9Y7yjn9ACaiSJ9h8r8mL", 1]
    ]
}
```

If checkKeys is successful, you can use signTransaction to sign a TransactionBuilder transaction using the private keys for that account.

#### State container

The Chain library contains a complete state container called the ChainStore. The ChainStore will automatically configure the `set_subscribe_callback` and handle any incoming state changes appropriately. It uses Immutable.js for storing the state, so all objects are return as immutable objects. It has its own `subscribe` method that can be used to register a callback that will be called whenever a state change happens.

The ChainStore has several useful methods to retrieve, among other things, objects, assets and accounts using either object ids or asset/account names. These methods are synchronous and will return `undefined` to indicate fetching in progress, and `null` to indicate that the object does not exist.

```js
import {Apis} from "peerplaysjs-ws";
import {ChainStore} from "peerplaysjs-lib";

Apis.instance("wss://bitshares.openledger.info/ws", true).init_promise.then((res) => {
    console.log("connected to:", res[0].network);
    ChainStore.init().then(() => {
        ChainStore.subscribe(updateState);
    });
});

let dynamicGlobal = null;
function updateState(object) {
    dynamicGlobal = ChainStore.getObject("2.1.0");
    console.log("ChainStore object update\n", dynamicGlobal ? dynamicGlobal.toJS() : dynamicGlobal);
}

```

### ECC

The ECC library contains all the crypto functions for private and public keys as well as transaction creation/signing.

#### Private keys

As a quick example, here's how to generate a new private key from a seed (a brainkey for example):

```js
import {PrivateKey, key} from "peerplaysjs-lib";

let seed = "THIS IS A TERRIBLE BRAINKEY SEED WORD SEQUENCE";
let pkey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );

console.log("\nPrivate key:", pkey.toWif());
console.log("Public key :", pkey.toPublicKey().toString(), "\n");
```

#### Transactions

TODO transaction signing example



