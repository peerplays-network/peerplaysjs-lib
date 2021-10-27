'use strict';

exports.__esModule = true;

var _PublicKey = require('../../ecc/src/PublicKey');

var _PublicKey2 = _interopRequireDefault(_PublicKey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FastParser = function () {
  function FastParser() {
    _classCallCheck(this, FastParser);
  }

  FastParser.fixed_data = function fixed_data(b, len, buffer) {
    if (!b) {
      return;
    }
    if (buffer) {
      var data = buffer.slice(0, len).toString('binary');
      b.append(data, 'binary');
      while (len-- > data.length) {
        b.writeUint8(0);
      }
    } else {
      var b_copy = b.copy(b.offset, b.offset + len);
      b.skip(len);
      return Buffer.from(b_copy.toBinary(), 'binary');
    }
  };

  FastParser.public_key = function public_key(b, _public_key) {
    var buffer = void 0;
    if (!b) {
      return;
    }
    if (_public_key) {
      buffer = _public_key.toBuffer();
      b.append(buffer.toString('binary'), 'binary');
    } else {
      buffer = FastParser.fixed_data(b, 33);
      return _PublicKey2.default.fromBuffer(buffer);
    }
  };

  FastParser.ripemd160 = function ripemd160(b, _ripemd) {
    if (!b) {
      return;
    }
    if (_ripemd) {
      FastParser.fixed_data(b, 20, _ripemd);
    } else {
      return FastParser.fixed_data(b, 20);
    }
  };

  FastParser.sha256 = function sha256(b, _sha) {
    if (!b) {
      return;
    }
    if (_sha) {
      FastParser.fixed_data(b, 32, _sha);
    } else {
      return FastParser.fixed_data(b, 32);
    }
  };

  FastParser.time_point_sec = function time_point_sec(b, epoch) {
    if (epoch) {
      epoch = Math.ceil(epoch / 1000);
      b.writeInt32(epoch);
    } else {
      epoch = b.readInt32(); // fc::time_point_sec
      return new Date(epoch * 1000);
    }
  };

  return FastParser;
}();

exports.default = FastParser;
module.exports = exports.default;