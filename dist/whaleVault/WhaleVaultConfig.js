"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaults = {
  whaleVault: null
};

var WhaleVaultConfig = function () {
  function WhaleVaultConfig() {
    _classCallCheck(this, WhaleVaultConfig);

    this.reset();
  }

  WhaleVaultConfig.prototype.reset = function reset() {
    Object.assign(this, defaults);
  };

  WhaleVaultConfig.prototype.setWhaleVault = function setWhaleVault() {
    var whaleVault = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    this.whaleVault = whaleVault;
  };

  WhaleVaultConfig.prototype.getWhaleVault = function getWhaleVault() {
    return this.whaleVault;
  };

  return WhaleVaultConfig;
}();

exports.default = new WhaleVaultConfig();
module.exports = exports.default;