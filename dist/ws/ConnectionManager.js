"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ApiInstances = _interopRequireDefault(require("./ApiInstances"));

var _ChainWebSocket = _interopRequireDefault(require("./ChainWebSocket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var ConnectionManager = /*#__PURE__*/function () {
  function ConnectionManager(_ref) {
    var url = _ref.url,
        urls = _ref.urls;

    _classCallCheck(this, ConnectionManager);

    this.url = url;
    this.urls = urls.filter(function (a) {
      return a !== url;
    });
  }

  _createClass(ConnectionManager, [{
    key: "logFailure",
    value: function logFailure(url) {
      console.error('Unable to connect to', "".concat(url, ", skipping to next full node API server"));
    }
  }, {
    key: "isURL",
    value: function isURL(str) {
      /* eslint-disable-next-line */
      var endpointPattern = new RegExp('((^(?:ws(s)?:\\/\\/)|(?:http(s)?:\\/\\/))+((?:[^\\/\\/\\.])+\\??(?:[-\\+=&;%@.\\w_]*)((#?(?:[\\w])*)(:?[0-9]*))))');
      return endpointPattern.test(str);
    }
  }, {
    key: "connect",
    value: function connect() {
      var _connect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.url;
      return new Promise(function (resolve, reject) {
        _ApiInstances["default"].instance(url, _connect).init_promise.then(resolve)["catch"](function (error) {
          _ApiInstances["default"].instance().close();

          reject(error);
        });
      });
    }
  }, {
    key: "connectWithFallback",
    value: function connectWithFallback() {
      var _this = this;

      var connect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.url;
      var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var resolve = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      var reject = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

      if (reject && index > this.urls.length - 1) {
        return reject(new Error("Tried ".concat(index + 1, " connections, none of which worked: ").concat(JSON.stringify(this.urls.concat(this.url)))));
      }

      var fallback = function fallback(resolve, reject) {
        _this.logFailure(url);

        return _this.connectWithFallback(connect, _this.urls[index], index + 1, resolve, reject);
      };

      if (resolve && reject) {
        return this.connect(connect, url).then(resolve)["catch"](function () {
          fallback(resolve, reject);
        });
      }

      return new Promise(function (resolve, reject) {
        _this.connect(connect).then(resolve)["catch"](function () {
          fallback(resolve, reject);
        });
      });
    }
  }, {
    key: "ping",
    value: function ping(conn, resolve, reject) {
      var connectionStartTimes = {};
      var url = conn.serverAddress;

      if (!this.isURL(url)) {
        throw Error('URL NOT VALID', url);
      }

      connectionStartTimes[url] = new Date().getTime();

      var doPing = function doPing(resolve, reject) {
        // Pass in blank rpc_user and rpc_password.
        conn.login('', '').then(function (result) {
          // Make sure connection is closed as it is simply a health check
          if (result) {
            conn.close();
          }

          var urlLatency = _defineProperty({}, url, new Date().getTime() - connectionStartTimes[url]);

          resolve(urlLatency);
        })["catch"](function (err) {
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

  }, {
    key: "sortNodesByLatency",
    value: function sortNodesByLatency(resolve, reject) {
      var latencyList = this.checkConnections(); // Sort list by latency

      var checkFunction = function checkFunction(resolve, reject) {
        latencyList.then(function (response) {
          var sortedList = Object.keys(response).sort(function (a, b) {
            return response[a] - response[b];
          });
          resolve(sortedList);
        })["catch"](function (err) {
          reject(err);
        });
      };

      if (resolve && reject) {
        checkFunction(resolve, reject);
      } else {
        return new Promise(checkFunction);
      }
    }
  }, {
    key: "checkConnections",
    value: function checkConnections(resolve, reject) {
      var _this2 = this;

      var checkFunction = function checkFunction(resolve, reject) {
        var fullList = _this2.urls;
        var connectionPromises = [];
        fullList.forEach(function (url) {
          var conn = new _ChainWebSocket["default"](url, function () {});
          connectionPromises.push(function () {
            return _this2.ping(conn).then(function (urlLatency) {
              return urlLatency;
            })["catch"](function () {
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
        })["catch"](function () {
          return _this2.checkConnections(resolve, reject);
        });
      };

      if (resolve && reject) {
        checkFunction(resolve, reject);
      } else {
        return new Promise(checkFunction);
      }
    }
  }]);

  return ConnectionManager;
}();

var _default = ConnectionManager;
exports["default"] = _default;
module.exports = exports.default;