"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var GrapheneApi = /*#__PURE__*/function () {
  function GrapheneApi(ws_rpc, api_name) {
    this.ws_rpc = ws_rpc;
    this.api_name = api_name;
  }

  var _proto = GrapheneApi.prototype;

  _proto.init = function init() {
    var _this = this;

    return this.ws_rpc.call([1, this.api_name, []]).then(function (response) {
      _this.api_id = response;
      return _this;
    });
  };

  _proto.exec = function exec(method, params) {
    return this.ws_rpc.call([this.api_id, method, params])["catch"](function (error) {
      console.log('!!! GrapheneApi error: ', method, params, error, JSON.stringify(error));
      throw error;
    });
  };

  return GrapheneApi;
}();

var _default = GrapheneApi;
exports["default"] = _default;