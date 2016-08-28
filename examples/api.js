// Node.js example

var {Apis} = require("../lib");
let wsString = "wss://bitshares.openledger.info/ws";
let wsStringLocal = "ws://127.0.0.1:8090";

Apis.instance(wsString, true).init_promise.then((res) => {
    console.log("connected to:", res[0].network);

    Apis.instance().db_api().exec( "set_subscribe_callback", [ updateListener, true ] )


    setTimeout(() => {Apis.instance().db_api().exec("unsubscribe_from_market", [
        quote, base
    ])}, 1500);
});

function updateListener(object) {
    // console.log("set_subscribe_callback update:\n", object);
}
