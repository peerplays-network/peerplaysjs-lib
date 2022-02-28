"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ecurve = require("ecurve");

var _bigi = _interopRequireDefault(require("bigi"));

var _bs = require("bs58");

var _deepEqual = _interopRequireDefault(require("deep-equal"));

var _assert = _interopRequireDefault(require("assert"));

var _hash = require("./hash");

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var secp256k1 = (0, _ecurve.getCurveByName)('secp256k1');
var n = secp256k1.n;

function toPublic(data) {
  if (!data || data.Q) {
    return data;
  }

  return _PublicKey["default"].fromStringOrThrow(data);
}

var PrivateKey = /*#__PURE__*/function () {
  /**
        @private see static functions
        @param {BigInteger}
    */
  function PrivateKey(d) {
    _classCallCheck(this, PrivateKey);

    this.d = d;
  }

  _createClass(PrivateKey, [{
    key: "toWif",
    value: function toWif() {
      var private_key = this.toBuffer(); // checksum includes the version

      private_key = Buffer.concat([Buffer.from([0x80]), private_key]);
      var checksum = (0, _hash.sha256)(private_key);
      checksum = (0, _hash.sha256)(checksum);
      checksum = checksum.slice(0, 4);
      var private_wif = Buffer.concat([private_key, checksum]);
      return (0, _bs.encode)(private_wif);
    }
    /**
          @return {Point}
      */

  }, {
    key: "toPublicKeyPoint",
    value: function toPublicKeyPoint() {
      var Q = secp256k1.G.multiply(this.d);
      return Q;
    }
  }, {
    key: "toPublicKey",
    value: function toPublicKey() {
      if (this.public_key) {
        return this.public_key;
      }

      this.public_key = _PublicKey["default"].fromPoint(this.toPublicKeyPoint());
      return this.public_key;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this.d.toBuffer(32);
    }
    /** ECIES */

  }, {
    key: "get_shared_secret",
    value: function get_shared_secret(public_key) {
      var legacy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      public_key = toPublic(public_key);
      var KB = public_key.toUncompressed().toBuffer();

      var KBP = _ecurve.Point.fromAffine(secp256k1, _bigi["default"].fromBuffer(KB.slice(1, 33)), // x
      _bigi["default"].fromBuffer(KB.slice(33, 65)) // y
      );

      var r = this.toBuffer();
      var P = KBP.multiply(_bigi["default"].fromBuffer(r));
      var S = P.affineX.toBuffer({
        size: 32
      });
      /*
          the input to sha512 must be exactly 32-bytes, to match the c++ implementation
          of get_shared_secret.  Right now S will be shorter if the most significant
          byte(s) is zero.  Pad it back to the full 32-bytes
          */

      if (!legacy && S.length < 32) {
        var pad = Buffer.alloc(32 - S.length, 0);
        S = Buffer.concat([pad, S]);
      } // SHA512 used in ECIES


      return (0, _hash.sha512)(S);
    } // /** ECIES (does not always match the Point.fromAffine version above) */
    // get_shared_secret(public_key){
    //     public_key = toPublic(public_key)
    //     var P = public_key.Q.multiply( this.d );
    //     var S = P.affineX.toBuffer({size: 32});
    //     // ECIES, adds an extra sha512
    //     return sha512(S);
    // }

    /** @throws {Error} - overflow of the key could not be derived */

  }, {
    key: "child",
    value: function child(offset) {
      offset = Buffer.concat([this.toPublicKey().toBuffer(), offset]);
      offset = (0, _hash.sha256)(offset);

      var c = _bigi["default"].fromBuffer(offset);

      if (c.compareTo(n) >= 0) {
        throw new Error('Child offset went out of bounds, try again');
      }

      var derived = this.d.add(c); // .mod(n)

      if (derived.signum() === 0) {
        throw new Error('Child offset derived to an invalid key, try again');
      }

      return new PrivateKey(derived);
    }
    /* <helper_functions> */

  }, {
    key: "toByteBuffer",
    value: function toByteBuffer() {
      var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
      this.appendByteBuffer(b);
      return b.copy(0, b.offset);
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return this.toBuffer().toString('hex');
    }
    /* </helper_functions> */

  }], [{
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('Expecting paramter to be a Buffer type');
      }

      if (buf.length !== 32) {
        console.log("WARN: Expecting 32 bytes, instead got ".concat(buf.length, ", stack trace:"), new Error().stack);
      }

      if (buf.length === 0) {
        throw new Error('Empty buffer');
      }

      return new PrivateKey(_bigi["default"].fromBuffer(buf));
    }
    /** @arg {string} seed - any length string.  This is private,
     * the same seed produces the same private key every time.  */

  }, {
    key: "fromSeed",
    value: function fromSeed(seed) {
      // generate_private_key
      if (!(typeof seed === 'string')) {
        throw new Error('seed must be of type string');
      }

      return PrivateKey.fromBuffer((0, _hash.sha256)(seed));
    }
    /** @return {string} Wallet Import Format (still a secret, Not encrypted) */

  }, {
    key: "fromWif",
    value: function fromWif(_private_wif) {
      var private_wif = Buffer.from((0, _bs.decode)(_private_wif));
      var version = private_wif.readUInt8(0);

      _assert["default"].equal(0x80, version, "Expected version ".concat(0x80, ", instead got ", version)); // checksum includes the version


      var private_key = private_wif.slice(0, -4);
      var checksum = private_wif.slice(-4);
      var new_checksum = (0, _hash.sha256)(private_key);
      new_checksum = (0, _hash.sha256)(new_checksum);
      new_checksum = new_checksum.slice(0, 4);
      var isEqual = (0, _deepEqual["default"])(checksum, new_checksum); // , 'Invalid checksum'

      if (!isEqual) {
        throw new Error('Checksum did not match');
      }

      private_key = private_key.slice(1);
      private_key = private_key.slice(0, 32);
      return PrivateKey.fromBuffer(private_key);
    }
  }, {
    key: "fromHex",
    value: function fromHex(hex) {
      return PrivateKey.fromBuffer(Buffer.from(hex, 'hex'));
    }
  }]);

  return PrivateKey;
}();

var _default = PrivateKey;
exports["default"] = _default;
module.exports = exports.default;