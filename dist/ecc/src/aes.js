'use strict';

exports.__esModule = true;

var _aes = require('crypto-js/aes');

var _aes2 = _interopRequireDefault(_aes);

var _encHex = require('crypto-js/enc-hex');

var _encHex2 = _interopRequireDefault(_encHex);

var _encBase = require('crypto-js/enc-base64');

var _encBase2 = _interopRequireDefault(_encBase);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _hash2 = require('./hash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // https://code.google.com/p/crypto-js


/** Provides symetric encrypt and decrypt via AES. */
var Aes = function () {
  /** @private */
  function Aes(iv, key) {
    _classCallCheck(this, Aes);

    this.iv = iv;
    this.key = key;
  }

  /** This is an excellent way to ensure that all references to Aes can not operate anymore
   * (example: a wallet becomes locked).  An application should ensure there is only one
   * Aes object instance for a given secret `seed`. */


  Aes.prototype.clear = function clear() {
    this.iv = undefined;
    this.key = undefined;
    return undefined;
  };

  /** @arg {string} seed - secret seed may be used to encrypt or decrypt. */


  Aes.fromSeed = function fromSeed(seed) {
    if (seed === undefined) {
      throw new Error('seed is required');
    }

    var _hash = (0, _hash2.sha512)(seed);
    _hash = _hash.toString('hex');
    // DEBUG console.log('... fromSeed _hash',_hash)
    return Aes.fromSha512(_hash);
  };

  /** @arg {string} hash - A 128 byte hex string, typically one
   * would call {@link fromSeed} instead. */


  Aes.fromSha512 = function fromSha512(hash) {
    _assert2.default.equal(hash.length, 128, 'A Sha512 in HEX should be 128 characters long, instead got ' + hash.length);
    var iv = _encHex2.default.parse(hash.substring(64, 96));
    var key = _encHex2.default.parse(hash.substring(0, 64));
    return new Aes(iv, key);
  };

  Aes.fromBuffer = function fromBuffer(buf) {
    (0, _assert2.default)(Buffer.isBuffer(buf), 'Expecting Buffer');
    _assert2.default.equal(buf.length, 64, 'A Sha512 Buffer should be 64 characters long, instead got ' + buf.length);
    return Aes.fromSha512(buf.toString('hex'));
  };

  /**
        @throws {Error} - "Invalid Key, ..."
        @arg {PrivateKey} private_key - required and used for decryption
        @arg {PublicKey} public_key - required and used to calcualte the shared secret
        @arg {string} [nonce = ""] optional but should always be provided and be unique
        when re-using the same private/public keys more than once.  This nonce is not a secret.
        @arg {string|Buffer} message - Encrypted message containing a checksum
        @return {Buffer}
    */


  Aes.decrypt_with_checksum = function decrypt_with_checksum(private_key, public_key, nonce, message) {
    var legacy = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    // Warning: Do not put `nonce = ""` in the arguments, in es6 this will
    // not convert "null" into an emtpy string
    if (nonce == null) {
      nonce = '';
    }

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message, 'hex');
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
    Buffer.from('' + nonce), Buffer.from(S.toString('hex'))]));

    var planebuffer = aes.decrypt(message);

    if (!(planebuffer.length >= 4)) {
      throw new Error('Invalid key, could not decrypt message(1)');
    }

    // DEBUG console.log('... planebuffer',planebuffer)
    var checksum = planebuffer.slice(0, 4);
    var plaintext = planebuffer.slice(4);

    // console.log('... checksum',checksum.toString('hex'))
    // console.log('... plaintext',plaintext.toString())

    var new_checksum = (0, _hash2.sha256)(plaintext);
    new_checksum = new_checksum.slice(0, 4);
    new_checksum = new_checksum.toString('hex');

    if (!(checksum.toString('hex') === new_checksum)) {
      throw new Error('Invalid key, could not decrypt message(2)');
    }

    return plaintext;
  };

  /** Identical to {@link decrypt_with_checksum} but used to encrypt.  Should not throw an error.
        @return {Buffer} message - Encrypted message which includes a checksum
    */


  Aes.encrypt_with_checksum = function encrypt_with_checksum(private_key, public_key, nonce, message) {
    // Warning: Do not put `nonce = ""` in the arguments, in es6 this will
    // not convert "null" into an emtpy string

    if (nonce == null) {
      nonce = '';
    }

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message, 'binary');
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
    Buffer.from('' + nonce), Buffer.from(S.toString('hex'))]));
    // DEBUG console.log('... S',S.toString('hex'))
    var checksum = (0, _hash2.sha256)(message).slice(0, 4);
    var payload = Buffer.concat([checksum, message]);
    // DEBUG console.log('... payload',payload.toString())
    return aes.encrypt(payload);
  };

  /** @private */


  Aes.prototype._decrypt_word_array = function _decrypt_word_array(cipher) {
    // https://code.google.com/p/crypto-js/#Custom_Key_and_IV
    // see wallet_records.cpp master_key::decrypt_key
    return _aes2.default.decrypt({ ciphertext: cipher, salt: null }, this.key, { iv: this.iv });
  };

  /** @private */


  Aes.prototype._encrypt_word_array = function _encrypt_word_array(plaintext) {
    // https://code.google.com/p/crypto-js/issues/detail?id=85
    var cipher = _aes2.default.encrypt(plaintext, this.key, { iv: this.iv });
    return _encBase2.default.parse(cipher.toString());
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} ciphertext
        @return {Buffer} binary
    */


  Aes.prototype.decrypt = function decrypt(ciphertext) {
    if (typeof ciphertext === 'string') {
      ciphertext = Buffer.from(ciphertext, 'binary');
    }

    if (!Buffer.isBuffer(ciphertext)) {
      throw new Error('buffer required');
    }

    (0, _assert2.default)(ciphertext, 'Missing cipher text');
    // hex is the only common format
    var hex = this.decryptHex(ciphertext.toString('hex'));
    return Buffer.from(hex, 'hex');
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} plaintext
        @return {Buffer} binary
    */


  Aes.prototype.encrypt = function encrypt(plaintext) {
    if (typeof plaintext === 'string') {
      plaintext = Buffer.from(plaintext, 'binary');
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new Error('buffer required');
    }

    // assert plaintext, "Missing plain text"
    // hex is the only common format
    var hex = this.encryptHex(plaintext.toString('hex'));
    return Buffer.from(hex, 'hex');
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string|Buffer} plaintext
        @return {string} hex
    */


  Aes.prototype.encryptToHex = function encryptToHex(plaintext) {
    if (typeof plaintext === 'string') {
      plaintext = Buffer.from(plaintext, 'binary');
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new Error('buffer required');
    }

    // assert plaintext, "Missing plain text"
    // hex is the only common format
    return this.encryptHex(plaintext.toString('hex'));
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @return {string} binary (could easily be readable text)
    */


  Aes.prototype.decryptHex = function decryptHex(cipher) {
    (0, _assert2.default)(cipher, 'Missing cipher text');
    // Convert data into word arrays (used by Crypto)
    var cipher_array = _encHex2.default.parse(cipher);
    var plainwords = this._decrypt_word_array(cipher_array);
    return _encHex2.default.stringify(plainwords);
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @return {Buffer} encoded as specified by the parameter
    */


  Aes.prototype.decryptHexToBuffer = function decryptHexToBuffer(cipher) {
    (0, _assert2.default)(cipher, 'Missing cipher text');
    // Convert data into word arrays (used by Crypto)
    var cipher_array = _encHex2.default.parse(cipher);
    var plainwords = this._decrypt_word_array(cipher_array);
    var plainhex = _encHex2.default.stringify(plainwords);
    return Buffer.from(plainhex, 'hex');
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} cipher - hex
        @arg {string} [encoding = 'binary'] - a valid Buffer encoding
        @return {String} encoded as specified by the parameter
    */


  Aes.prototype.decryptHexToText = function decryptHexToText(cipher) {
    var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'binary';

    return this.decryptHexToBuffer(cipher).toString(encoding);
  };

  /** This method does not use a checksum, the returned data must be validated some other way.
        @arg {string} plainhex - hex format
        @return {String} hex
    */


  Aes.prototype.encryptHex = function encryptHex(plainhex) {
    var plain_array = _encHex2.default.parse(plainhex);
    var cipher_array = this._encrypt_word_array(plain_array);
    return _encHex2.default.stringify(cipher_array);
  };

  return Aes;
}();

exports.default = Aes;
module.exports = exports.default;