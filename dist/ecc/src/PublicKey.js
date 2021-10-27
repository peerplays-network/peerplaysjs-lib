'use strict';

exports.__esModule = true;

var _bigi = require('bigi');

var _bigi2 = _interopRequireDefault(_bigi);

var _ecurve = require('ecurve');

var _bs = require('bs58');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _ws = require('../../ws');

var _hash = require('./hash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /* global ByteBuffer */


var secp256k1 = (0, _ecurve.getCurveByName)('secp256k1');

var G = secp256k1.G,
    n = secp256k1.n;

var PublicKey = function () {
  /** @param {Point} public key */
  function PublicKey(Q) {
    _classCallCheck(this, PublicKey);

    this.Q = Q;
  }

  PublicKey.fromBinary = function fromBinary(bin) {
    return PublicKey.fromBuffer(Buffer.from(bin, 'binary'));
  };

  PublicKey.fromBuffer = function fromBuffer(buffer) {
    if (buffer.toString('hex') === '000000000000000000000000000000000000000000000000000000000000000000') {
      return new PublicKey(null);
    }

    return new PublicKey(_ecurve.Point.decodeFrom(secp256k1, buffer));
  };

  PublicKey.prototype.toBuffer = function toBuffer() {
    var compressed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.Q ? this.Q.compressed : null;

    if (this.Q === null) {
      return Buffer.from('000000000000000000000000000000000000000000000000000000000000000000', 'hex');
    }

    return this.Q.getEncoded(compressed);
  };

  PublicKey.fromPoint = function fromPoint(point) {
    return new PublicKey(point);
  };

  PublicKey.prototype.toUncompressed = function toUncompressed() {
    var buf = this.Q.getEncoded(false);
    var point = _ecurve.Point.decodeFrom(secp256k1, buf);
    return PublicKey.fromPoint(point);
  };

  /** bts::blockchain::address (unique but not a full public key) */


  PublicKey.prototype.toBlockchainAddress = function toBlockchainAddress() {
    var pub_buf = this.toBuffer();
    var pub_sha = (0, _hash.sha512)(pub_buf);
    return (0, _hash.ripemd160)(pub_sha);
  };

  /** Alias for {@link toPublicKeyString} */


  PublicKey.prototype.toString = function toString() {
    var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _ws.ChainConfig.address_prefix;

    return this.toPublicKeyString(address_prefix);
  };

  /**
        Full public key
        {return} string
    */


  PublicKey.prototype.toPublicKeyString = function toPublicKeyString() {
    var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _ws.ChainConfig.address_prefix;

    var pub_buf = this.toBuffer();
    var checksum = (0, _hash.ripemd160)(pub_buf);
    // Slice from the buffer directly, slicing from the checksum
    // Uint8array will return the entire array each time.
    var sliced = new Uint8Array(checksum.buffer.slice(0, 4));

    // concat only accepts buffers so initialize the sliced Uint8array as a Buffer.
    var addy = Buffer.concat([pub_buf, Buffer.from(sliced)]);
    return address_prefix + (0, _bs.encode)(addy);
  };

  /**
        @arg {string} public_key - like GPHXyz...
        @arg {string} address_prefix - like GPH
        @return PublicKey or `null` (if the public_key string is invalid)
    */


  PublicKey.fromPublicKeyString = function fromPublicKeyString(public_key) {
    var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ws.ChainConfig.address_prefix;

    try {
      return PublicKey.fromStringOrThrow(public_key, address_prefix);
    } catch (e) {
      return null;
    }
  };

  /**
        @arg {string} public_key - like PPYXyz...
        @arg {string} address_prefix - like PPY
        @throws {Error} if public key is invalid
        @return PublicKey
    */


  PublicKey.fromStringOrThrow = function fromStringOrThrow(public_key) {
    var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ws.ChainConfig.address_prefix;

    var prefix = public_key.slice(0, address_prefix.length);
    _assert2.default.equal(address_prefix, prefix, 'Expecting key to begin with ' + address_prefix + ', instead got ' + prefix);
    public_key = public_key.slice(address_prefix.length);

    public_key = Buffer.from((0, _bs.decode)(public_key), 'binary');
    var checksum = public_key.slice(-4);
    public_key = public_key.slice(0, -4);
    var new_checksum = (0, _hash.ripemd160)(public_key);
    new_checksum = new_checksum.slice(0, 4);
    var isEqual = (0, _deepEqual2.default)(checksum, new_checksum); // , 'Invalid checksum'

    if (!isEqual) {
      throw new Error('Checksum did not match');
    }

    return PublicKey.fromBuffer(public_key);
  };

  PublicKey.prototype.toAddressString = function toAddressString() {
    var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _ws.ChainConfig.address_prefix;

    var pub_buf = this.toBuffer();
    var pub_sha = (0, _hash.sha512)(pub_buf);
    var addy = (0, _hash.ripemd160)(pub_sha);
    var checksum = (0, _hash.ripemd160)(addy);
    addy = Buffer.concat([addy, checksum.slice(0, 4)]);
    return address_prefix + (0, _bs.encode)(addy);
  };

  PublicKey.prototype.toPtsAddy = function toPtsAddy() {
    var pub_buf = this.toBuffer();
    var pub_sha = (0, _hash.sha256)(pub_buf);
    var addy = (0, _hash.ripemd160)(pub_sha);
    addy = Buffer.concat([Buffer.from([0x38]), addy]); // version 56(decimal)

    var checksum = (0, _hash.sha256)(addy);
    checksum = (0, _hash.sha256)(checksum);

    addy = Buffer.concat([addy, checksum.slice(0, 4)]);
    return (0, _bs.encode)(addy);
  };

  PublicKey.prototype.child = function child(offset) {
    (0, _assert2.default)(Buffer.isBuffer(offset), 'Buffer required: offset');
    _assert2.default.equal(offset.length, 32, 'offset length');

    offset = Buffer.concat([this.toBuffer(), offset]);
    offset = (0, _hash.sha256)(offset);

    var c = _bigi2.default.fromBuffer(offset);

    if (c.compareTo(n) >= 0) {
      throw new Error('Child offset went out of bounds, try again');
    }

    var cG = G.multiply(c);
    var Qprime = this.Q.add(cG);

    if (secp256k1.isInfinity(Qprime)) {
      throw new Error('Child offset derived to an invalid key, try again');
    }

    return PublicKey.fromPoint(Qprime);
  };

  /* <HEX> */

  PublicKey.prototype.toByteBuffer = function toByteBuffer() {
    var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    this.appendByteBuffer(b);
    return b.copy(0, b.offset);
  };

  PublicKey.fromHex = function fromHex(hex) {
    return PublicKey.fromBuffer(Buffer.from(hex, 'hex'));
  };

  PublicKey.prototype.toHex = function toHex() {
    return this.toBuffer().toString('hex');
  };

  PublicKey.fromPublicKeyStringHex = function fromPublicKeyStringHex(hex) {
    return PublicKey.fromPublicKeyString(Buffer.from(hex, 'hex'));
  };

  /* </HEX> */


  return PublicKey;
}();

exports.default = PublicKey;
module.exports = exports.default;