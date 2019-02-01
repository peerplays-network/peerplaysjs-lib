'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BigInteger = require('bigi');

var _require = require('ecurve'),
    Point = _require.Point,
    getCurveByName = _require.getCurveByName;

var secp256k1 = getCurveByName('secp256k1');

var _require2 = require('bs58'),
    encode = _require2.encode,
    decode = _require2.decode;

var hash = require('./hash');

var _require3 = require('peerplaysjs-ws'),
    ChainConfig = _require3.ChainConfig;

var assert = require('assert');
var deepEqual = require("deep-equal");

var G = secp256k1.G,
    n = secp256k1.n;

var PublicKey = function () {

    /** @param {Point} public key */
    function PublicKey(Q) {
        _classCallCheck(this, PublicKey);

        this.Q = Q;
    }

    _createClass(PublicKey, [{
        key: 'toBuffer',
        value: function toBuffer() {
            var compressed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.Q ? this.Q.compressed : null;

            if (this.Q === null) return new Buffer('000000000000000000000000000000000000000000000000000000000000000000', 'hex');
            return this.Q.getEncoded(compressed);
        }
    }, {
        key: 'toUncompressed',
        value: function toUncompressed() {
            var buf = this.Q.getEncoded(false);
            var point = Point.decodeFrom(secp256k1, buf);
            return PublicKey.fromPoint(point);
        }

        /** bts::blockchain::address (unique but not a full public key) */

    }, {
        key: 'toBlockchainAddress',
        value: function toBlockchainAddress() {
            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha512(pub_buf);
            return hash.ripemd160(pub_sha);
        }

        /** Alias for {@link toPublicKeyString} */

    }, {
        key: 'toString',
        value: function toString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ChainConfig.address_prefix;

            return this.toPublicKeyString(address_prefix);
        }

        /**
            Full public key
            {return} string
        */

    }, {
        key: 'toPublicKeyString',
        value: function toPublicKeyString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ChainConfig.address_prefix;

            var pub_buf = this.toBuffer();
            var checksum = hash.ripemd160(pub_buf);
            // Slice from the buffer directly, slicing from the checksum Uint8array will return the entire array each time.
            var sliced = new Uint8Array(checksum.buffer.slice(0, 4));

            // concat only accepts buffers so initialize the sliced Uint8array as a Buffer.
            var addy = Buffer.concat([pub_buf, Buffer.from(sliced)]);
            return address_prefix + encode(addy);
        }

        /**
            @arg {string} public_key - like GPHXyz...
            @arg {string} address_prefix - like GPH
            @return PublicKey or `null` (if the public_key string is invalid)
        */

    }, {
        key: 'toAddressString',
        value: function toAddressString() {
            var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ChainConfig.address_prefix;

            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha512(pub_buf);
            var addy = hash.ripemd160(pub_sha);
            var checksum = hash.ripemd160(addy);
            addy = Buffer.concat([addy, checksum.slice(0, 4)]);
            return address_prefix + encode(addy);
        }
    }, {
        key: 'toPtsAddy',
        value: function toPtsAddy() {
            var pub_buf = this.toBuffer();
            var pub_sha = hash.sha256(pub_buf);
            var addy = hash.ripemd160(pub_sha);
            addy = Buffer.concat([new Buffer([0x38]), addy]); //version 56(decimal)

            var checksum = hash.sha256(addy);
            checksum = hash.sha256(checksum);

            addy = Buffer.concat([addy, checksum.slice(0, 4)]);
            return encode(addy);
        }
    }, {
        key: 'child',
        value: function child(offset) {

            assert(Buffer.isBuffer(offset), "Buffer required: offset");
            assert.equal(offset.length, 32, "offset length");

            offset = Buffer.concat([this.toBuffer(), offset]);
            offset = hash.sha256(offset);

            var c = BigInteger.fromBuffer(offset);

            if (c.compareTo(n) >= 0) throw new Error("Child offset went out of bounds, try again");

            var cG = G.multiply(c);
            var Qprime = this.Q.add(cG);

            if (secp256k1.isInfinity(Qprime)) throw new Error("Child offset derived to an invalid key, try again");

            return PublicKey.fromPoint(Qprime);
        }

        /* <HEX> */

    }, {
        key: 'toByteBuffer',
        value: function toByteBuffer() {
            var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
            this.appendByteBuffer(b);
            return b.copy(0, b.offset);
        }
    }, {
        key: 'toHex',
        value: function toHex() {
            return this.toBuffer().toString('hex');
        }
    }], [{
        key: 'fromBinary',
        value: function fromBinary(bin) {
            return PublicKey.fromBuffer(new Buffer(bin, 'binary'));
        }
    }, {
        key: 'fromBuffer',
        value: function fromBuffer(buffer) {
            if (buffer.toString('hex') === '000000000000000000000000000000000000000000000000000000000000000000') return new PublicKey(null);
            return new PublicKey(Point.decodeFrom(secp256k1, buffer));
        }
    }, {
        key: 'fromPoint',
        value: function fromPoint(point) {
            return new PublicKey(point);
        }
    }, {
        key: 'fromPublicKeyString',
        value: function fromPublicKeyString(public_key) {
            var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ChainConfig.address_prefix;

            try {
                return PublicKey.fromStringOrThrow(public_key, address_prefix);
            } catch (e) {
                return null;
            }
        }

        /**
            @arg {string} public_key - like GPHXyz...
            @arg {string} address_prefix - like GPH
            @throws {Error} if public key is invalid
            @return PublicKey
        */

    }, {
        key: 'fromStringOrThrow',
        value: function fromStringOrThrow(public_key) {
            var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ChainConfig.address_prefix;

            var prefix = public_key.slice(0, address_prefix.length);
            assert.equal(address_prefix, prefix, 'Expecting key to begin with ' + address_prefix + ', instead got ' + prefix);
            public_key = public_key.slice(address_prefix.length);

            public_key = new Buffer(decode(public_key), 'binary');
            var checksum = public_key.slice(-4);
            public_key = public_key.slice(0, -4);
            var new_checksum = hash.ripemd160(public_key);
            new_checksum = new_checksum.slice(0, 4);
            var isEqual = deepEqual(checksum, new_checksum); //, 'Invalid checksum'
            if (!isEqual) {
                throw new Error("Checksum did not match");
            }
            return PublicKey.fromBuffer(public_key);
        }
    }, {
        key: 'fromHex',
        value: function fromHex(hex) {
            return PublicKey.fromBuffer(new Buffer(hex, 'hex'));
        }
    }, {
        key: 'fromPublicKeyStringHex',
        value: function fromPublicKeyStringHex(hex) {
            return PublicKey.fromPublicKeyString(new Buffer(hex, 'hex'));
        }

        /* </HEX> */

    }]);

    return PublicKey;
}();

module.exports = PublicKey;