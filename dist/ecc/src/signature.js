"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _ecurve = require("ecurve");

var _assert = _interopRequireDefault(require("assert"));

var _bigi = _interopRequireDefault(require("bigi"));

var _hash2 = require("./hash");

var _ecdsa = require("./ecdsa");

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* global ByteBuffer */
var secp256k1 = (0, _ecurve.getCurveByName)('secp256k1');

var Signature = /*#__PURE__*/function () {
  function Signature(r1, s1, i1) {
    this.r = r1;
    this.s = s1;
    this.i = i1;

    _assert["default"].equal(this.r != null, true, 'Missing parameter');

    _assert["default"].equal(this.s != null, true, 'Missing parameter');

    _assert["default"].equal(this.i != null, true, 'Missing parameter');
  }

  Signature.fromBuffer = function fromBuffer(buf) {
    var i;
    var r;
    var s;

    _assert["default"].equal(buf.length, 65, 'Invalid signature length');

    i = buf.readUInt8(0);

    _assert["default"].equal(i - 27, i - 27 & 7, 'Invalid signature parameter'); // eslint-disable-line


    r = _bigi["default"].fromBuffer(buf.slice(1, 33));
    s = _bigi["default"].fromBuffer(buf.slice(33));
    return new Signature(r, s, i);
  };

  var _proto = Signature.prototype;

  _proto.toBuffer = function toBuffer() {
    var buf;
    buf = Buffer.alloc(65);
    buf.writeUInt8(this.i, 0);
    this.r.toBuffer(32).copy(buf, 1);
    this.s.toBuffer(32).copy(buf, 33);
    return buf;
  };

  _proto.recoverPublicKeyFromBuffer = function recoverPublicKeyFromBuffer(buffer) {
    return this.recoverPublicKey((0, _hash2.sha256)(buffer));
  }
  /**
        @return {PublicKey}
    */
  ;

  _proto.recoverPublicKey = function recoverPublicKey(sha256_buffer) {
    var Q;
    var e;
    var i;
    e = _bigi["default"].fromBuffer(sha256_buffer);
    i = this.i;
    i -= 27;
    i &= 3; // eslint-disable-line

    Q = (0, _ecdsa.recoverPubKey)(secp256k1, e, this, i);
    return _PublicKey["default"].fromPoint(Q);
  }
  /**
        @param {Buffer} buf
        @param {PrivateKey} private_key
        @return {Signature}
    */
  ;

  Signature.signBuffer = function signBuffer(buf, private_key) {
    var _hash = (0, _hash2.sha256)(buf);

    return Signature.signBufferSha256(_hash, private_key);
  }
  /** Sign a buffer of exactally 32 bytes in size (sha256(text))
        @param {Buffer} buf - 32 bytes binary
        @param {PrivateKey} private_key
        @return {Signature}
    */
  ;

  Signature.signBufferSha256 = function signBufferSha256(buf_sha256, private_key) {
    if (buf_sha256.length !== 32 || !Buffer.isBuffer(buf_sha256)) {
      throw new Error('buf_sha256: 32 byte buffer requred');
    }

    var der;
    var e;
    var ecsignature;
    var i;
    var lenR;
    var lenS;
    var nonce;
    i = null;
    nonce = 0;
    e = _bigi["default"].fromBuffer(buf_sha256);
    var loop = true;

    while (loop) {
      ecsignature = (0, _ecdsa.sign)(secp256k1, buf_sha256, private_key.d, nonce++);
      der = ecsignature.toDER();
      lenR = der[3];
      lenS = der[5 + lenR];

      if (lenR === 32 && lenS === 32) {
        i = (0, _ecdsa.calcPubKeyRecoveryParam)(secp256k1, e, ecsignature, private_key.toPublicKey().Q);
        i += 4; // compressed

        i += 27; // compact  //  24 or 27 :( forcing odd-y 2nd key candidate)

        loop = false;
        break;
      }

      if (nonce % 10 === 0) {
        console.log("WARN: " + nonce + " attempts to find canonical signature");
      }
    }

    return new Signature(ecsignature.r, ecsignature.s, i);
  };

  Signature.sign = function sign(string, private_key) {
    return Signature.signBuffer(Buffer.from(string), private_key);
  }
  /**
        @param {Buffer} un-hashed
        @param {./PublicKey}
        @return {boolean}
    */
  ;

  _proto.verifyBuffer = function verifyBuffer(buf, public_key) {
    var _hash = (0, _hash2.sha256)(buf);

    return this.verifyHash(_hash, public_key);
  };

  _proto.verifyHash = function verifyHash(hash, public_key) {
    _assert["default"].equal(hash.length, 32, "A SHA 256 should be 32 bytes long, instead got " + hash.length);

    return (0, _ecdsa.verify)(secp256k1, hash, {
      r: this.r,
      s: this.s
    }, public_key.Q);
  }
  /* <HEX> */
  ;

  _proto.toByteBuffer = function toByteBuffer() {
    var b;
    b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    this.appendByteBuffer(b);
    return b.copy(0, b.offset);
  };

  Signature.fromHex = function fromHex(hex) {
    return Signature.fromBuffer(Buffer.from(hex, 'hex'));
  };

  _proto.toHex = function toHex() {
    return this.toBuffer().toString('hex');
  };

  Signature.signHex = function signHex(hex, private_key) {
    var buf;
    buf = Buffer.from(hex, 'hex');
    return Signature.signBuffer(buf, private_key);
  };

  _proto.verifyHex = function verifyHex(hex, public_key) {
    var buf;
    buf = Buffer.from(hex, 'hex');
    return this.verifyBuffer(buf, public_key);
  };

  return Signature;
}();

var _default = Signature;
exports["default"] = _default;
module.exports = exports.default;