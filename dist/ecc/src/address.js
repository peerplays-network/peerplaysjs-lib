"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _bs = require("bs58");

var _deepEqual = _interopRequireDefault(require("deep-equal"));

var _ws = require("../../ws");

var _hash2 = require("./hash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/** Addresses are shortened non-reversable hashes of a public key.  The full PublicKey is preferred.
    @deprecated
*/
var Address = /*#__PURE__*/function () {
  function Address(addy) {
    this.addy = addy;
  }

  Address.fromBuffer = function fromBuffer(buffer) {
    var _hash = (0, _hash2.sha512)(buffer);

    var addy = (0, _hash2.ripemd160)(_hash);
    return new Address(addy);
  };

  Address.fromString = function fromString(string, address_prefix) {
    if (address_prefix === void 0) {
      address_prefix = _ws.ChainConfig.address_prefix;
    }

    var prefix = string.slice(0, address_prefix.length);

    _assert["default"].equal(address_prefix, prefix, "Expecting key to begin with " + address_prefix + ", instead got " + prefix);

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
  ;

  Address.fromPublic = function fromPublic(public_key, compressed, version) {
    if (compressed === void 0) {
      compressed = true;
    }

    if (version === void 0) {
      version = 56;
    }

    var sha2 = (0, _hash2.sha256)(public_key.toBuffer(compressed));
    var rep = (0, _hash2.ripemd160)(sha2);
    var versionBuffer = Buffer.alloc(1);
    versionBuffer.writeUInt8(0xff & version, 0); // eslint-disable-line

    var addr = Buffer.concat([versionBuffer, rep]);
    var check = (0, _hash2.sha256)(addr);
    check = (0, _hash2.sha256)(check);
    var buffer = Buffer.concat([addr, check.slice(0, 4)]);
    return new Address((0, _hash2.ripemd160)(buffer));
  };

  var _proto = Address.prototype;

  _proto.toBuffer = function toBuffer() {
    return this.addy;
  };

  _proto.toString = function toString(address_prefix) {
    if (address_prefix === void 0) {
      address_prefix = _ws.ChainConfig.address_prefix;
    }

    var checksum = (0, _hash2.ripemd160)(this.addy);
    var addy = Buffer.concat([this.addy, checksum.slice(0, 4)]);
    return address_prefix + (0, _bs.encode)(addy);
  };

  return Address;
}();

var _default = Address;
exports["default"] = _default;
module.exports = exports.default;