"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var GrapheneApi = /*#__PURE__*/function () {
  function GrapheneApi(ws_rpc, api_name) {
    _classCallCheck(this, GrapheneApi);

    this.ws_rpc = ws_rpc;
    this.api_name = api_name;
  }

  _createClass(GrapheneApi, [{
    key: "init",
    value: function init() {
      var _this = this;

      return this.ws_rpc.call([1, this.api_name, []]).then(function (response) {
        _this.api_id = response;
        return _this;
      });
    }
  }, {
    key: "exec",
    value: function exec(method, params) {
      return this.ws_rpc.call([this.api_id, method, params])["catch"](function (error) {
        console.log('!!! GrapheneApi error: ', method, params, error, JSON.stringify(error));
        throw error;
      });
    }
  }]);

  return GrapheneApi;
}();

var _default = GrapheneApi;
exports["default"] = _default;
module.exports = exports.default;