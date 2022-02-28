"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _secureRandom = _interopRequireDefault(require("secure-random"));

var _ws = require("../../ws");

var _PrivateKey = _interopRequireDefault(require("./PrivateKey"));

var _PublicKey = _interopRequireDefault(require("./PublicKey"));

var _address = _interopRequireDefault(require("./address"));

var _aes = _interopRequireDefault(require("./aes"));

var _hash = require("./hash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// import dictionary from './dictionary_en';
// hash for .25 second
var HASH_POWER_MILLS = 250;
var key = {
  /** Uses 1 second of hashing power to create a key/password checksum.  An
    implementation can re-call this method with the same password to re-match
    the strength of the CPU (either after moving from a desktop to a mobile,
    mobile to desktop, or N years from now when CPUs are presumably stronger).
     A salt is used for all the normal reasons...
     @return object {
        aes_private: Aes,
        checksum: "{hash_iteration_count},{salt},{checksum}"
    }
    */
  aes_checksum: function aes_checksum(password) {
    if (!(typeof password === 'string')) {
      throw new 'password string required'();
    }

    var salt = _secureRandom["default"].randomBuffer(4).toString('hex');

    var iterations = 0;
    var secret = salt + password; // hash for .1 second

    var start_t = Date.now();

    while (Date.now() - start_t < HASH_POWER_MILLS) {
      secret = (0, _hash.sha256)(secret);
      iterations += 1;
    }

    var checksum = (0, _hash.sha256)(secret);
    var checksum_string = [iterations, salt.toString('hex'), checksum.slice(0, 4).toString('hex')].join(',');
    return {
      aes_private: _aes["default"].fromSeed(secret),
      checksum: checksum_string
    };
  },

  /** Provide a matching password and key_checksum.  A "wrong password"
    error is thrown if the password does not match.  If this method takes
    much more or less than 1 second to return, one should consider updating
    all encyrpted fields using a new key.key_checksum.
    */
  aes_private: function aes_private(password, key_checksum) {
    var _key_checksum$split = key_checksum.split(','),
        _key_checksum$split2 = _slicedToArray(_key_checksum$split, 3),
        iterations = _key_checksum$split2[0],
        salt = _key_checksum$split2[1],
        checksum = _key_checksum$split2[2];

    var secret = salt + password;

    for (var i = 0; iterations > 0 ? i < iterations : i > iterations; iterations > 0 ? i++ : i++) {
      secret = (0, _hash.sha256)(secret);
    }

    var new_checksum = (0, _hash.sha256)(secret);

    if (!(new_checksum.slice(0, 4).toString('hex') === checksum)) {
      throw new Error('wrong password');
    }

    return _aes["default"].fromSeed(secret);
  },

  /**
        A week random number generator can run out of entropy.
        This should ensure even the worst random number implementation will be reasonably safe.
         @param1 string entropy of at least 32 bytes
    */
  random32ByteBuffer: function random32ByteBuffer() {
    var entropy = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.browserEntropy();

    if (!(typeof entropy === 'string')) {
      throw new Error('string required for entropy');
    }

    if (entropy.length < 32) {
      throw new Error('expecting at least 32 bytes of entropy');
    }

    var start_t = Date.now();

    while (Date.now() - start_t < HASH_POWER_MILLS) {
      entropy = (0, _hash.sha256)(entropy);
    }

    var hash_array = [];
    hash_array.push(entropy); // Hashing for 1 second may helps the computer is not low on entropy
    // (this method may be called back-to-back).

    hash_array.push(_secureRandom["default"].randomBuffer(32));
    return (0, _hash.sha256)(Buffer.concat(hash_array));
  },
  suggest_brain_key: function suggest_brain_key() {
    var dictionary = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ',';
    var entropy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.browserEntropy();
    var randomBuffer = this.random32ByteBuffer(entropy);
    var word_count = 16;
    var dictionary_lines = dictionary.split(',');

    if (!(dictionary_lines.length === 49744)) {
      throw new Error("expecting ".concat(49744, " but got ", dictionary_lines.length, " dictionary words"));
    }

    var brainkey = [];
    var end = word_count * 2;

    for (var i = 0; i < end; i += 2) {
      // randomBuffer has 256 bits / 16 bits per word == 16 words
      var num = (randomBuffer[i] << 8) + randomBuffer[i + 1]; // eslint-disable-line
      // convert into a number between 0 and 1 (inclusive)

      var rndMultiplier = num / Math.pow(2, 16);
      var wordIndex = Math.round(dictionary_lines.length * rndMultiplier);
      brainkey.push(dictionary_lines[wordIndex]);
    }

    return this.normalize_brainKey(brainkey.join(' '));
  },
  get_random_key: function get_random_key(entropy) {
    return _PrivateKey["default"].fromBuffer(this.random32ByteBuffer(entropy));
  },
  get_brainPrivateKey: function get_brainPrivateKey(brainKey) {
    var sequence = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    if (sequence < 0) {
      throw new Error('invalid sequence');
    }

    brainKey = key.normalize_brainKey(brainKey);
    return _PrivateKey["default"].fromBuffer((0, _hash.sha256)((0, _hash.sha512)("".concat(brainKey, " ").concat(sequence))));
  },
  // Turn invisible space like characters into a single space
  normalize_brainKey: function normalize_brainKey(brainKey) {
    if (!(typeof brainKey === 'string')) {
      throw new Error('string required for brainKey');
    }

    brainKey = brainKey.trim();
    return brainKey.split(/[\t\n\v\f\r ]+/).join(' ');
  },
  browserEntropy: function browserEntropy() {
    var entropyStr = '';

    try {
      entropyStr = "".concat(new Date().toString(), " ").concat(window.screen.height, " ").concat(window.screen.width);
      entropyStr = "".concat(entropyStr, " ").concat(window.screen.colorDepth, " ").concat(window.screen.availHeight);
      entropyStr = "".concat(entropyStr, " ").concat(window.screen.availWidth, " ").concat(window.screen.pixelDepth);
      entropyStr = "".concat(entropyStr, " ").concat(navigator.language, " ").concat(window.location);
      entropyStr = "".concat(entropyStr, " ").concat(window.history.length);

      for (var i = 0, len = navigator.mimeTypes.length; i < len; i++) {
        var mimeType = navigator.mimeTypes[i];
        entropyStr += "".concat(mimeType.description, " ").concat(mimeType.type, " ").concat(mimeType.suffixes, " ");
      }

      console.log('INFO\tbrowserEntropy gathered');
    } catch (error) {
      // nodejs:ReferenceError: window is not defined
      entropyStr = (0, _hash.sha256)(new Date().toString());
    }

    var b = Buffer.from(entropyStr);
    entropyStr += "".concat(b.toString('binary'), " ").concat(new Date().toString());
    return entropyStr;
  },
  // @return array of 5 legacy addresses for a pubkey string parameter.
  addresses: function addresses(pubkey) {
    var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ws.ChainConfig.address_prefix;

    var public_key = _PublicKey["default"].fromPublicKeyString(pubkey, address_prefix); // S L O W


    var address_string = [_address["default"].fromPublic(public_key, false, 0).toString(address_prefix), // btc_uncompressed
    _address["default"].fromPublic(public_key, true, 0).toString(address_prefix), // btc_compressed
    _address["default"].fromPublic(public_key, false, 56).toString(address_prefix), // pts_uncompressed
    _address["default"].fromPublic(public_key, true, 56).toString(address_prefix), // pts_compressed
    public_key.toAddressString(address_prefix) // bts_short, most recent format
    ];
    return address_string;
  }
};
var _default = key;
exports["default"] = _default;
module.exports = exports.default;