// Node.js example
/* running 'npm run build' is necessary before launching the examples */
let {Apis} = require('../lib');

// let wsString = 'wss://bitshares.openledger.info/ws';
let wsString = 'ws://127.0.0.1:8090';

function updateListener(object) {
  console.log('subscribe_to_market update:\n', object);
}

Apis.instance(wsString, true).init_promise.then((res) => {
  console.log('connected to:', res[0].network);

  Apis.instance()
    .db_api()
    .exec('subscribe_to_market', [updateListener, '1.3.0', '1.3.19']);

  setTimeout(() => {
    Apis.instance()
      .db_api()
      .exec('unsubscribe_from_market', [updateListener, '1.3.0', '1.3.19'])
      .then((unsub) => {
        console.log('unsub result:', unsub);
      }).catch((error) => {
        console.error(error);
      });
  }, 1500);
}).catch((error) => {
  console.error(error);
});
