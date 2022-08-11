'use strict';

exports.__esModule = true;
exports['default'] = void 0;

var _ApiInstances = _interopRequireDefault(require('./ApiInstances'));

var _ChainWebSocket = _interopRequireDefault(require('./ChainWebSocket'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj}; 
}

var ConnectionManager = /*#__PURE__*/function () {
  function ConnectionManager(_ref) {
    var url = _ref.url,
      urls = _ref.urls;
    this.url = url;
    this.urls = urls.filter(function (a) {
      return a !== url;
    });
  }

  var _proto = ConnectionManager.prototype;

  _proto.logFailure = function logFailure(url) {
    console.error('Unable to connect to', url + ', skipping to next full node API server');
  };

  _proto.isURL = function isURL(str) {
    /* eslint-disable-next-line */
    var endpointPattern = new RegExp('((^(?:ws(s)?:\\/\\/)|(?:http(s)?:\\/\\/))+((?:[^\\/\\/\\.])+\\??(?:[-\\+=&;%@.\\w_]*)((#?(?:[\\w])*)(:?[0-9]*))))');
    return endpointPattern.test(str);
  };

  _proto.connect = function connect(_connect, url) {
    if (_connect === void 0) {
      _connect = true;
    }

    if (url === void 0) {
      url = this.url;
    }

    return new Promise(function (resolve, reject) {
      _ApiInstances['default'].instance(url, _connect).init_promise.then(resolve)['catch'](function (error) {
        _ApiInstances['default'].instance().close();

        reject(error);
      });
    });
  };

  _proto.connectWithFallback = function connectWithFallback(connect, url, index, resolve, reject) {
    var _this = this;

    if (connect === void 0) {
      connect = true;
    }

    if (url === void 0) {
      url = this.url;
    }

    if (index === void 0) {
      index = 0;
    }

    if (resolve === void 0) {
      resolve = null;
    }

    if (reject === void 0) {
      reject = null;
    }

    if (reject && index > this.urls.length - 1) {
      return reject(new Error('Tried ' + (index + 1) + ' connections, none of which worked: ' + JSON.stringify(this.urls.concat(this.url))));
    }

    var fallback = function fallback(resolve, reject) {
      _this.logFailure(url);

      return _this.connectWithFallback(connect, _this.urls[index], index + 1, resolve, reject);
    };

    if (resolve && reject) {
      return this.connect(connect, url).then(resolve)['catch'](function () {
        fallback(resolve, reject);
      });
    }

    return new Promise(function (resolve, reject) {
      _this.connect(connect).then(resolve)['catch'](function () {
        fallback(resolve, reject);
      });
    });
  };

  _proto.ping = function ping(conn, resolve, reject) {
    var connectionStartTimes = {};
    var url = conn.serverAddress;

    if (!this.isURL(url)) {
      throw Error('URL NOT VALID', url);
    }

    connectionStartTimes[url] = new Date().getTime();

    var doPing = function doPing(resolve, reject) {
      // Pass in blank rpc_user and rpc_password.
      conn.login('', '').then(function (result) {
        var _urlLatency;

        // Make sure connection is closed as it is simply a health check
        if (result) {
          conn.close();
        }

        var urlLatency = (_urlLatency = {}, _urlLatency[url] = new Date().getTime() - connectionStartTimes[url], _urlLatency);
        resolve(urlLatency);
      })['catch'](function (err) {
        console.warn('PING ERROR: ', err);
        reject(err);
      });
    };

    if (resolve && reject) {
      doPing(resolve, reject);
    } else {
      return new Promise(doPing);
    }
  }
  /**
  * sorts the nodes into a list based on latency
  * @memberof ConnectionManager
  */
  ;

  _proto.sortNodesByLatency = function sortNodesByLatency(resolve, reject) {
    var latencyList = this.checkConnections(); // Sort list by latency

    var checkFunction = function checkFunction(resolve, reject) {
      latencyList.then(function (response) {
        var sortedList = Object.keys(response).sort(function (a, b) {
          return response[a] - response[b];
        });
        resolve(sortedList);
      })['catch'](function (err) {
        reject(err);
      });
    };

    if (resolve && reject) {
      checkFunction(resolve, reject);
    } else {
      return new Promise(checkFunction);
    }
  };

  _proto.checkConnections = function checkConnections(resolve, reject) {
    var _this2 = this;

    var checkFunction = function checkFunction(resolve, reject) {
      var fullList = _this2.urls;
      var connectionPromises = [];
      fullList.forEach(function (url) {
        var conn = new _ChainWebSocket['default'](url, function () {});
        connectionPromises.push(function () {
          return _this2.ping(conn).then(function (urlLatency) {
            return urlLatency;
          })['catch'](function () {
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
      })['catch'](function () {
        return _this2.checkConnections(resolve, reject);
      });
    };

    if (resolve && reject) {
      checkFunction(resolve, reject);
    } else {
      return new Promise(checkFunction);
    }
  };

  return ConnectionManager;
}();

var _default = ConnectionManager;
exports['default'] = _default;