"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _bs = require("bs58");

var _deepEqual = _interopRequireDefault(require("deep-equal"));

var _ws = require("../../ws");

var _hash2 = require("./hash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

/** Addresses are shortened non-reversable hashes of a public key.  The full PublicKey is preferred.
    @deprecated
*/
var Address = /*#__PURE__*/function () {
  function Address(addy) {
    _classCallCheck(this, Address);

    this.addy = addy;
  }

  _createClass(Address, [{
    key: "toBuffer",
    value: function toBuffer() {
      return this.addy;
    }
  }, {
    key: "toString",
    value: function toString() {
      var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _ws.ChainConfig.address_prefix;
      var checksum = (0, _hash2.ripemd160)(this.addy);
      var addy = Buffer.concat([this.addy, checksum.slice(0, 4)]);
      return address_prefix + (0, _bs.encode)(addy);
    }
  }], [{
    key: "fromBuffer",
    value: function fromBuffer(buffer) {
      var _hash = (0, _hash2.sha512)(buffer);

      var addy = (0, _hash2.ripemd160)(_hash);
      return new Address(addy);
    }
  }, {
    key: "fromString",
    value: function fromString(string) {
      var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ws.ChainConfig.address_prefix;
      var prefix = string.slice(0, address_prefix.length);

      _assert["default"].equal(address_prefix, prefix, "Expecting key to begin with ".concat(address_prefix, ", instead got ").concat(prefix));

      var addy = string.slice(address_prefix.length);
      addy = Buffer.from((0, _bs.decode)(addy), 'binary');
      var checksum = addy.slice(-4);
      addy = addy.slice(0, -4);
      var new_checksum = (0, _hash2.ripemd160)(addy);
      new_checksum = new_checksum.slice(0, 4);
      var isEqual = (0, _deepEqual["default"])(checksum, new_checksum); // , 'Invalid checksum'

      if (!isEqual) {
        throw new Error('Checksum did not match');
      }

      return new Address(addy);
    }
    /** @return Address - Compressed PTS format (by default) */

  }, {
    key: "fromPublic",
    value: function fromPublic(public_key) {
      var compressed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var version = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 56;
      var sha2 = (0, _hash2.sha256)(public_key.toBuffer(compressed));
      var rep = (0, _hash2.ripemd160)(sha2);
      var versionBuffer = Buffer.alloc(1);
      versionBuffer.writeUInt8(0xff & version, 0); // eslint-disable-line

      var addr = Buffer.concat([versionBuffer, rep]);
      var check = (0, _hash2.sha256)(addr);
      check = (0, _hash2.sha256)(check);
      var buffer = Buffer.concat([addr, check.slice(0, 4)]);
      return new Address((0, _hash2.ripemd160)(buffer));
    }
  }]);

  return Address;
}();

var _default = Address;
exports["default"] = _default;
module.exports = exports.default;