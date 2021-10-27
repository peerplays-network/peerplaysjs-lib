'use strict';

exports.__esModule = true;
exports.verifyRaw = exports.verify = exports.sign = exports.recoverPubKey = exports.deterministicGenerateK = exports.calcPubKeyRecoveryParam = undefined;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bigi = require('bigi');

var _bigi2 = _interopRequireDefault(_bigi);

var _hash = require('./hash');

var _enforce_types = require('./enforce_types');

var _enforce_types2 = _interopRequireDefault(_enforce_types);

var _ecsignature = require('./ecsignature');

var _ecsignature2 = _interopRequireDefault(_ecsignature);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// https://tools.ietf.org/html/rfc6979#section-3.2

// from github.com/bitcoinjs/bitcoinjs-lib from github.com/cryptocoinjs/ecdsa
function deterministicGenerateK(curve, hash, d, checkSig, nonce) {
  (0, _enforce_types2.default)('Buffer', hash);
  (0, _enforce_types2.default)(_bigi2.default, d);

  if (nonce) {
    hash = (0, _hash.sha256)(Buffer.concat([hash, Buffer.alloc(nonce)]));
  }

  // sanity check
  _assert2.default.equal(hash.length, 32, 'Hash must be 256 bit');

  var x = d.toBuffer(32);
  var k = Buffer.alloc(32);
  var v = Buffer.alloc(32);

  // Step B
  v.fill(1);

  // Step C
  k.fill(0);

  // Step D
  k = (0, _hash.HmacSHA256)(Buffer.concat([v, Buffer.from([0]), x, hash]), k);

  // Step E
  v = (0, _hash.HmacSHA256)(v, k);

  // Step F
  k = (0, _hash.HmacSHA256)(Buffer.concat([v, Buffer.from([1]), x, hash]), k);

  // Step G
  v = (0, _hash.HmacSHA256)(v, k);

  // Step H1/H2a, ignored as tlen === qlen (256 bit)
  // Step H2b
  v = (0, _hash.HmacSHA256)(v, k);

  var T = _bigi2.default.fromBuffer(v);

  // Step H3, repeat until T is within the interval [1, n - 1]
  while (T.signum() <= 0 || T.compareTo(curve.n) >= 0 || !checkSig(T)) {
    k = (0, _hash.HmacSHA256)(Buffer.concat([v, Buffer.from([0])]), k);
    v = (0, _hash.HmacSHA256)(v, k);

    // Step H1/H2a, again, ignored as tlen === qlen (256 bit)
    // Step H2b again
    v = (0, _hash.HmacSHA256)(v, k);

    T = _bigi2.default.fromBuffer(v);
  }

  return T;
}

function sign(curve, hash, d, nonce) {
  var e = _bigi2.default.fromBuffer(hash);
  var n = curve.n;
  var G = curve.G;

  var r = void 0;
  var s = void 0;

  deterministicGenerateK(curve, hash, d, function (key) {
    // find canonically valid signature
    var Q = G.multiply(key);

    if (curve.isInfinity(Q)) {
      return false;
    }

    r = Q.affineX.mod(n);

    if (r.signum() === 0) {
      return false;
    }

    s = key.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

    if (s.signum() === 0) {
      return false;
    }

    return true;
  }, nonce);

  var N_OVER_TWO = n.shiftRight(1);

  // enforce low S values, see bip62: 'low s values in signatures'
  if (s.compareTo(N_OVER_TWO) > 0) {
    s = n.subtract(s);
  }

  return new _ecsignature2.default(r, s);
}

function verifyRaw(curve, e, signature, Q) {
  var n = curve.n;
  var G = curve.G;

  var r = signature.r;
  var s = signature.s;

  // 1.4.1 Enforce r and s are both integers in the interval [1, n − 1]
  if (r.signum() <= 0 || r.compareTo(n) >= 0) {
    return false;
  }

  if (s.signum() <= 0 || s.compareTo(n) >= 0) {
    return false;
  }

  // c = s^-1 mod n
  var c = s.modInverse(n);

  // 1.4.4 Compute u1 = es^−1 mod n
  //               u2 = rs^−1 mod n
  var u1 = e.multiply(c).mod(n);
  var u2 = r.multiply(c).mod(n);

  // 1.4.5 Compute R = (xR, yR) = u1G + u2Q
  var R = G.multiplyTwo(u1, Q, u2);

  // 1.4.5 (cont.) Enforce R is not at infinity
  if (curve.isInfinity(R)) {
    return false;
  }

  // 1.4.6 Convert the field element R.x to an integer
  var xR = R.affineX;

  // 1.4.7 Set v = xR mod n
  var v = xR.mod(n);

  // 1.4.8 If v = r, output "valid", and if v != r, output "invalid"
  return v.equals(r);
}

function verify(curve, hash, signature, Q) {
  // 1.4.2 H = Hash(M), already done by the user
  // 1.4.3 e = H
  var e = _bigi2.default.fromBuffer(hash);
  return verifyRaw(curve, e, signature, Q);
}

/**
 * Recover a public key from a signature.
 *
 * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
 * Key Recovery Operation".
 *
 * http://www.secg.org/download/aid-780/sec1-v2.pdf
 */
function recoverPubKey(curve, e, signature, i) {
  _assert2.default.strictEqual(i & 3, i, 'Recovery param is more than two bits'); // eslint-disable-line

  var n = curve.n;
  var G = curve.G;

  var r = signature.r;
  var s = signature.s;

  (0, _assert2.default)(r.signum() > 0 && r.compareTo(n) < 0, 'Invalid r value');
  (0, _assert2.default)(s.signum() > 0 && s.compareTo(n) < 0, 'Invalid s value');

  // A set LSB signifies that the y-coordinate is odd
  var isYOdd = i & 1; // eslint-disable-line

  // The more significant bit specifies whether we should use the
  // first or second candidate key.
  var isSecondKey = i >> 1; // eslint-disable-line

  // 1.1 Let x = r + jn
  var x = isSecondKey ? r.add(n) : r;
  var R = curve.pointFromX(isYOdd, x);

  // 1.4 Check that nR is at infinity
  var nR = R.multiply(n);
  (0, _assert2.default)(curve.isInfinity(nR), 'nR is not a valid curve point');

  // Compute -e from e
  var eNeg = e.negate().mod(n);

  // 1.6.1 Compute Q = r^-1 (sR -  eG)
  //               Q = r^-1 (sR + -eG)
  var rInv = r.modInverse(n);

  var Q = R.multiplyTwo(s, G, eNeg).multiply(rInv);
  curve.validate(Q);

  return Q;
}

/**
 * Calculate pubkey extraction parameter.
 *
 * When extracting a pubkey from a signature, we have to
 * distinguish four different cases. Rather than putting this
 * burden on the verifier, Bitcoin includes a 2-bit value with the
 * signature.
 *
 * This function simply tries all four cases and returns the value
 * that resulted in a successful pubkey recovery.
 */
function calcPubKeyRecoveryParam(curve, e, signature, Q) {
  for (var i = 0; i < 4; i++) {
    var Qprime = recoverPubKey(curve, e, signature, i);

    // 1.6.2 Verify Q
    if (Qprime.equals(Q)) {
      return i;
    }
  }

  throw new Error('Unable to find valid recovery factor');
}

exports.calcPubKeyRecoveryParam = calcPubKeyRecoveryParam;
exports.deterministicGenerateK = deterministicGenerateK;
exports.recoverPubKey = recoverPubKey;
exports.sign = sign;
exports.verify = verify;
exports.verifyRaw = verifyRaw;