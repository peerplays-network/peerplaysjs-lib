'use strict';

exports.__esModule = true;
exports.ripemd160 = exports.HmacSHA256 = exports.sha512 = exports.sha256 = exports.sha1 = undefined;

var _createHash = require('create-hash');

var _createHash2 = _interopRequireDefault(_createHash);

var _createHmac = require('create-hmac');

var _createHmac2 = _interopRequireDefault(_createHmac);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
function sha1(data, encoding) {
  return (0, _createHash2.default)('sha1').update(data).digest(encoding);
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
function sha256(data, encoding) {
  return (0, _createHash2.default)('sha256').update(data).digest(encoding);
}

/** @arg {string|Buffer} data
    @arg {string} [digest = null] - 'hex', 'binary' or 'base64'
    @return {string|Buffer} - Buffer when digest is null, or string
*/
function sha512(data, encoding) {
  return (0, _createHash2.default)('sha512').update(data).digest(encoding);
}

function HmacSHA256(buffer, secret) {
  return (0, _createHmac2.default)('sha256', secret).update(buffer).digest();
}

function ripemd160(data) {
  return (0, _createHash2.default)('rmd160').update(data).digest();
}

// function hash160(buffer) {
//   return ripemd160(sha256(buffer))
// }
//
// function hash256(buffer) {
//   return sha256(sha256(buffer))
// }

//
// function HmacSHA512(buffer, secret) {
//   return crypto.createHmac('sha512', secret).update(buffer).digest()
// }

exports.sha1 = sha1;
exports.sha256 = sha256;
exports.sha512 = sha512;
exports.HmacSHA256 = HmacSHA256;
exports.ripemd160 = ripemd160;