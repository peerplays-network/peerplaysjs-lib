"use strict";

exports.__esModule = true;
exports["default"] = void 0;
var defaults = {
  whaleVault: null
};

var WhaleVaultConfig = /*#__PURE__*/function () {
  function WhaleVaultConfig() {
    this.reset();
  }

  var _proto = WhaleVaultConfig.prototype;

  _proto.reset = function reset() {
    Object.assign(this, defaults);
  };

  _proto.setWhaleVault = function setWhaleVault(whaleVault) {
    if (whaleVault === void 0) {
      whaleVault = null;
    }

    this.whaleVault = whaleVault;
  };

  _proto.getWhaleVault = function getWhaleVault() {
    return this.whaleVault;
  };

  return WhaleVaultConfig;
}();

var _default = new WhaleVaultConfig();

exports["default"] = _default;