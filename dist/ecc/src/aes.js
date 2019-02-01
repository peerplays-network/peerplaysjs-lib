"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// https://code.google.com/p/crypto-js
var AES = require("crypto-js/aes");
var encHex = require("crypto-js/enc-hex");
var encBase64 = require("crypto-js/enc-base64");
var assert = require("assert");

var _require = require("bytebuffer"),
    Long = _require.Long;

var hash = require('./hash');

/** Provides symetric encrypt and decrypt via AES. */

var Aes = function () {

    /** @private */
    function Aes(iv, key) {
        _classCallCheck(this, Aes);

        this.iv = iv, this.key = key;
    }

    /** This is an excellent way to ensure that all references to Aes can not operate anymore (example: a wallet becomes locked).  An application should ensure there is only one Aes object instance for a given secret `seed`. */


    _createClass(Aes, [{
        key: "clear",
        value: function clear() {
            return this.iv = this.key = undefined;
        }

        /** @arg {string} seed - secret seed may be used to encrypt or decrypt. */

    }, {
        key: "_decrypt_word_array",


        /** @private */
        value: function _decrypt_word_array(cipher) {
            // https://code.google.com/p/crypto-js/#Custom_Key_and_IV
            // see wallet_records.cpp master_key::decrypt_key
            return AES.decrypt({ ciphertext: cipher, salt: null }, this.key, { iv: this.iv });
        }

        /** @private */

    }, {
        key: "_encrypt_word_array",
        value: function _encrypt_word_array(plaintext) {
            //https://code.google.com/p/crypto-js/issues/detail?id=85
            var cipher = AES.encrypt(plaintext, this.key, { iv: this.iv });
            return encBase64.parse(cipher.toString());
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} ciphertext
            @return {Buffer} binary
        */

    }, {
        key: "decrypt",
        value: function decrypt(ciphertext) {
            if (typeof ciphertext === "string") {
                ciphertext = new Buffer(ciphertext, 'binary');
            }
            if (!Buffer.isBuffer(ciphertext)) {
                throw new Error("buffer required");
            }
            assert(ciphertext, "Missing cipher text");
            // hex is the only common format
            var hex = this.decryptHex(ciphertext.toString('hex'));
            return new Buffer(hex, 'hex');
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} plaintext
            @return {Buffer} binary
        */

    }, {
        key: "encrypt",
        value: function encrypt(plaintext) {
            if (typeof plaintext === "string") {
                plaintext = new Buffer(plaintext, 'binary');
            }
            if (!Buffer.isBuffer(plaintext)) {
                throw new Error("buffer required");
            }
            //assert plaintext, "Missing plain text"
            // hex is the only common format
            var hex = this.encryptHex(plaintext.toString('hex'));
            return new Buffer(hex, 'hex');
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string|Buffer} plaintext
            @return {string} hex
        */

    }, {
        key: "encryptToHex",
        value: function encryptToHex(plaintext) {
            if (typeof plaintext === "string") {
                plaintext = new Buffer(plaintext, 'binary');
            }
            if (!Buffer.isBuffer(plaintext)) {
                throw new Error("buffer required");
            }
            //assert plaintext, "Missing plain text"
            // hex is the only common format
            return this.encryptHex(plaintext.toString('hex'));
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} cipher - hex
            @return {string} binary (could easily be readable text)
        */

    }, {
        key: "decryptHex",
        value: function decryptHex(cipher) {
            assert(cipher, "Missing cipher text");
            // Convert data into word arrays (used by Crypto)
            var cipher_array = encHex.parse(cipher);
            var plainwords = this._decrypt_word_array(cipher_array);
            return encHex.stringify(plainwords);
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} cipher - hex
            @return {Buffer} encoded as specified by the parameter
        */

    }, {
        key: "decryptHexToBuffer",
        value: function decryptHexToBuffer(cipher) {
            assert(cipher, "Missing cipher text");
            // Convert data into word arrays (used by Crypto)
            var cipher_array = encHex.parse(cipher);
            var plainwords = this._decrypt_word_array(cipher_array);
            var plainhex = encHex.stringify(plainwords);
            return new Buffer(plainhex, 'hex');
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} cipher - hex
            @arg {string} [encoding = 'binary'] - a valid Buffer encoding
            @return {String} encoded as specified by the parameter
        */

    }, {
        key: "decryptHexToText",
        value: function decryptHexToText(cipher) {
            var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'binary';

            return this.decryptHexToBuffer(cipher).toString(encoding);
        }

        /** This method does not use a checksum, the returned data must be validated some other way.
            @arg {string} plainhex - hex format
            @return {String} hex
        */

    }, {
        key: "encryptHex",
        value: function encryptHex(plainhex) {
            var plain_array = encHex.parse(plainhex);
            var cipher_array = this._encrypt_word_array(plain_array);
            return encHex.stringify(cipher_array);
        }
    }], [{
        key: "fromSeed",
        value: function fromSeed(seed) {
            if (seed === undefined) {
                throw new Error("seed is required");
            }
            var _hash = hash.sha512(seed);
            _hash = _hash.toString('hex');
            // DEBUG console.log('... fromSeed _hash',_hash)
            return Aes.fromSha512(_hash);
        }
    }, {
        key: "fromSha512",


        /** @arg {string} hash - A 128 byte hex string, typically one would call {@link fromSeed} instead. */
        value: function fromSha512(hash) {
            assert.equal(hash.length, 128, "A Sha512 in HEX should be 128 characters long, instead got " + hash.length);
            var iv = encHex.parse(hash.substring(64, 96));
            var key = encHex.parse(hash.substring(0, 64));
            return new Aes(iv, key);
        }
    }, {
        key: "fromBuffer",
        value: function fromBuffer(buf) {
            assert(Buffer.isBuffer(buf), "Expecting Buffer");
            assert.equal(buf.length, 64, "A Sha512 Buffer should be 64 characters long, instead got " + buf.length);
            return Aes.fromSha512(buf.toString("hex"));
        }
        /**
            @throws {Error} - "Invalid Key, ..."
            @arg {PrivateKey} private_key - required and used for decryption
            @arg {PublicKey} public_key - required and used to calcualte the shared secret
            @arg {string} [nonce = ""] optional but should always be provided and be unique when re-using the same private/public keys more than once.  This nonce is not a secret.
            @arg {string|Buffer} message - Encrypted message containing a checksum
            @return {Buffer}
        */

    }, {
        key: "decrypt_with_checksum",
        value: function decrypt_with_checksum(private_key, public_key, nonce, message) {
            var legacy = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;


            // Warning: Do not put `nonce = ""` in the arguments, in es6 this will not convert "null" into an emtpy string
            if (nonce == null) // null or undefined
                nonce = "";

            if (!Buffer.isBuffer(message)) {
                message = new Buffer(message, 'hex');
            }

            var S = private_key.get_shared_secret(public_key, legacy);
            // D E B U G
            // console.log('decrypt_with_checksum', {
            //     priv_to_pub: private_key.toPublicKey().toString(),
            //     pub: public_key.toPublicKeyString(),
            //     nonce: nonce,
            //     message: message.length,
            //     S: S.toString('hex')
            // })

            var aes = Aes.fromSeed(Buffer.concat([
            // A null or empty string nonce will not effect the hash
            new Buffer("" + nonce), new Buffer(S.toString('hex'))]));

            var planebuffer = aes.decrypt(message);
            if (!(planebuffer.length >= 4)) {
                throw new Error("Invalid key, could not decrypt message(1)");
            }

            // DEBUG console.log('... planebuffer',planebuffer)
            var checksum = planebuffer.slice(0, 4);
            var plaintext = planebuffer.slice(4);

            // console.log('... checksum',checksum.toString('hex'))
            // console.log('... plaintext',plaintext.toString())

            var new_checksum = hash.sha256(plaintext);
            new_checksum = new_checksum.slice(0, 4);
            new_checksum = new_checksum.toString('hex');

            if (!(checksum.toString('hex') === new_checksum)) {
                throw new Error("Invalid key, could not decrypt message(2)");
            }

            return plaintext;
        }
    }, {
        key: "encrypt_with_checksum",


        /** Identical to {@link decrypt_with_checksum} but used to encrypt.  Should not throw an error.
            @return {Buffer} message - Encrypted message which includes a checksum
        */
        value: function encrypt_with_checksum(private_key, public_key, nonce, message) {

            // Warning: Do not put `nonce = ""` in the arguments, in es6 this will not convert "null" into an emtpy string

            if (nonce == null) // null or undefined
                nonce = "";

            if (!Buffer.isBuffer(message)) {
                message = new Buffer(message, 'binary');
            }

            var S = private_key.get_shared_secret(public_key);

            // D E B U G
            // console.log('encrypt_with_checksum', {
            //     priv_to_pub: private_key.toPublicKey().toString()
            //     pub: public_key.toPublicKeyString()
            //     nonce: nonce
            //     message: message.length
            //     S: S.toString('hex')
            // })

            var aes = Aes.fromSeed(Buffer.concat([
            // A null or empty string nonce will not effect the hash
            new Buffer("" + nonce), new Buffer(S.toString('hex'))]));
            // DEBUG console.log('... S',S.toString('hex'))
            var checksum = hash.sha256(message).slice(0, 4);
            var payload = Buffer.concat([checksum, message]);
            // DEBUG console.log('... payload',payload.toString())
            return aes.encrypt(payload);
        }
    }]);

    return Aes;
}();

module.exports = Aes;