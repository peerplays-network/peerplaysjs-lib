"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _aes = _interopRequireDefault(require("crypto-js/aes"));

var _encHex = _interopRequireDefault(require("crypto-js/enc-hex"));

var _encBase = _interopRequireDefault(require("crypto-js/enc-base64"));

var _assert = _interopRequireDefault(require("assert"));

var _hash2 = require("./hash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// https://code.google.com/p/crypto-js

/** Provides symetric encrypt and decrypt via AES. */
var Aes = /*#__PURE__*/function () {
  /** @private */
  function Aes(iv, key) {
    this.iv = iv;
    this.key = key;
  }
  /** This is an excellent way to ensure that all references to Aes can not operate anymore
   * (example: a wallet becomes locked).  An application should ensure there is only one
   * Aes object instance for a given secret `seed`. */


  var _proto = Aes.prototype;

  _proto.clear = function clear() {
    this.iv = undefined;
    this.key = undefined;
    return undefined;
  }
  /** @arg {string} seed - secret seed may be used to encrypt or decrypt. */
  ;

  Aes.fromSeed = function fromSeed(seed) {
    if (seed === undefined) {
      throw new Error('seed is required');
    }

    var _hash = (0, _hash2.sha512)(seed);

    _hash = _hash.toString('hex'); // DEBUG console.log('... fromSeed _hash',_hash)

    return Aes.fromSha512(_hash);
  }
  /** @arg {string} hash - A 128 byte hex string, typically one
   * would call {@link fromSeed} instead. */
  ;

  Aes.fromSha512 = function fromSha512(hash) {
    _assert["default"].equal(hash.length, 128, "A Sha512 in HEX should be 128 characters long, instead got " + hash.length);

    var iv = _encHex["default"].parse(hash.substring(64, 96));

    var key = _encHex["default"].parse(hash.substring(0, 64));

    return new Aes(iv, key);
  };

  Aes.fromBuffer = function fromBuffer(buf) {
    (0, _assert["default"])(Buffer.isBuffer(buf), 'Expecting Buffer');

    _assert["default"].equal(buf.length, 64, "A Sha512 Buffer should be 64 characters long, instead got " + buf.length);

    return Aes.fromSha512(buf.toString('hex'));
  }
  /**
        @throws {Error} - "Invalid Key, ..."
        @arg {PrivateKey} private_key - required and used for decryption
        @arg {PublicKey} public_key - required and used to calcualte the shared secret
        @arg {string} [nonce = ""] optional but should always be provided and be unique
        when re-using the same private/public keys more than once.  This nonce is not a secret.
        @arg {string|Buffer} message - Encrypted message containing a checksum
        @return {Buffer}
    */
  ;

  Aes.decrypt_with_checksum = function decrypt_with_checksum(private_key, public_key, nonce, message, legacy) {
    if (legacy === void 0) {
      legacy = false;
    }

    // Warning: Do not put `nonce = ""` in the arguments, in es6 this will
    // not convert "null" into an emtpy string
    if (nonce == null) {
      nonce = '';
    }

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message, 'hex');
    }

    var S = private_key.get_shared_secret(public_key, legacy); // D E B U G
    // console.log('decrypt_with_checksum', {
    //     priv_to_pub: private_key.toPublicKey().toString(),
    //     pub: public_key.toPublicKeyString(),
    //     nonce: nonce,
    //     message: message.length,
    //     S: S.toString('hex')
    // })

    var aes = Aes.fromSeed(Buffer.concat([// A null or empty string nonce will not effect the hash
    Buffer.from("" + nonce), Buffer.from(S.toString('hex'))]));
    var planebuffer = aes.decrypt(message);

    if (!(planebuffer.length >= 4)) {
      throw new Error('Invalid key, could not decrypt message(1)');
    } // DEBUG console.log('... planebuffer',planebuffer)


    var checksum = planebuffer.slice(0, 4);
    var plaintext = planebuffer.slice(4); // console.log('... checksum',checksum.toString('hex'))
    // console.log('... plaintext',plaintext.toString())

    var new_checksum = (0, _hash2.sha256)(plaintext);
    new_checksum = new_checksum.slice(0, 4);
    new_checksum = new_checksum.toString('hex');

    if (!(checksum.toString('hex') === new_checksum)) {
      throw new Error('Invalid key, could not decrypt message(2)');
    }

    return plaintext;
  }
  /** Identical to {@link decrypt_with_checksum} but used to encrypt.  Should not throw an error.
        @return {Buffer} message - Encrypted message which includes a checksum
    */
  ;

  Aes.encrypt_with_checksum = function encrypt_with_checksum(private_key, public_key, nonce, message) {
    // Warning: Do not put `nonce = ""` in the arguments, in es6 this will
    // not convert "null" into an emtpy string
    if (nonce == null) {
      nonce = '';
    }

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message, 'binary');
    }

    var S = private_key.get_shared_secret(public_key); // D E B U G
    // console.log('encrypt_with_checksum', {
    //     priv_to_pub: private_key.toPublicKey().toString()
    //     pub: public_key.toPublicKeyString()
    //     nonce: nonce
    //     message: message.length
    //     S: S.toString('hex')
    // })

    var aes = Aes.fromSeed(Buffer.concat([// A null or empty string nonce will not effect the hash
    Buffer.from("" + nonce), Buffer.from(S.toString('hex'))])); // DEBUG console.log('... S',S.toString('hex'))

    var checksum = (0, _hash2.sha256)(message).slice(0, 4);
    var payload = Buffer.concat([checksum, message]); // DEBUG console.log('... payload',payload.toString())

    return aes.encrypt(payload);
  }
  /** @private */
  ;

  _proto._decrypt_word_array = function _decrypt_word_array(cipher) {
    // https://code.google.com/p/crypto-js/#Custom_Key_and_IV
    // see wallet_records.cpp master_key::decrypt_key
    return _aes["default"].decrypt({
      ciphertext: cipher,
      salt: null
    }, this.key, {
      iv: this.iv
    });
  }
  /** @private */
  ;

  _proto._encrypt_word_array = function _encrypt_word_array(plaintext) {
    // https://code.google.com/p/crypto-js/issues/detail?id=85
    var cipher = _aes["default"].encrypt(plaintext, this.key, {
      iv: this.iv
    });

    return _encBase["default"].parse(cipher.toString());
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} ciphertext
        @return {Buffer} binary
    */
  ;

  _proto.decrypt = function decrypt(ciphertext) {
    if (typeof ciphertext === 'string') {
      ciphertext = Buffer.from(ciphertext, 'binary');
    }

    if (!Buffer.isBuffer(ciphertext)) {
      throw new Error('buffer required');
    }

    (0, _assert["default"])(ciphertext, 'Missing cipher text'); // hex is the only common format

    var hex = this.decryptHex(ciphertext.toString('hex'));
    return Buffer.from(hex, 'hex');
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} plaintext
        @return {Buffer} binary
    */
  ;

  _proto.encrypt = function encrypt(plaintext) {
    if (typeof plaintext === 'string') {
      plaintext = Buffer.from(plaintext, 'binary');
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new Error('buffer required');
    } // assert plaintext, "Missing plain text"
    // hex is the only common format


    var hex = this.encryptHex(plaintext.toString('hex'));
    return Buffer.from(hex, 'hex');
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string|Buffer} plaintext
        @return {string} hex
    */
  ;

  _proto.encryptToHex = function encryptToHex(plaintext) {
    if (typeof plaintext === 'string') {
      plaintext = Buffer.from(plaintext, 'binary');
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new Error('buffer required');
    } // assert plaintext, "Missing plain text"
    // hex is the only common format


    return this.encryptHex(plaintext.toString('hex'));
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @return {string} binary (could easily be readable text)
    */
  ;

  _proto.decryptHex = function decryptHex(cipher) {
    (0, _assert["default"])(cipher, 'Missing cipher text'); // Convert data into word arrays (used by Crypto)

    var cipher_array = _encHex["default"].parse(cipher);

    var plainwords = this._decrypt_word_array(cipher_array);

    return _encHex["default"].stringify(plainwords);
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @return {Buffer} encoded as specified by the parameter
    */
  ;

  _proto.decryptHexToBuffer = function decryptHexToBuffer(cipher) {
    (0, _assert["default"])(cipher, 'Missing cipher text'); // Convert data into word arrays (used by Crypto)

    var cipher_array = _encHex["default"].parse(cipher);

    var plainwords = this._decrypt_word_array(cipher_array);

    var plainhex = _encHex["default"].stringify(plainwords);

    return Buffer.from(plainhex, 'hex');
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @arg {string} [encoding = 'binary'] - a valid Buffer encoding
        @return {String} encoded as specified by the parameter
    */
  ;

  _proto.decryptHexToText = function decryptHexToText(cipher, encoding) {
    if (encoding === void 0) {
      encoding = 'binary';
    }

    return this.decryptHexToBuffer(cipher).toString(encoding);
  }
  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} plainhex - hex format
        @return {String} hex
    */
  ;

  _proto.encryptHex = function encryptHex(plainhex) {
    var plain_array = _encHex["default"].parse(plainhex);

    var cipher_array = this._encrypt_word_array(plain_array);

    return _encHex["default"].stringify(cipher_array);
  };

  return Aes;
}();

var _default = Aes;
exports["default"] = _default;
module.exports = exports.default;