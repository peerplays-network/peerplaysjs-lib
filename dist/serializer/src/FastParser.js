"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _PublicKey = _interopRequireDefault(require("../../ecc/src/PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var FastParser = /*#__PURE__*/function () {
  function FastParser() {}

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
    var buffer;

    if (!b) {
      return;
    }

    if (_public_key) {
      buffer = _public_key.toBuffer();
      b.append(buffer.toString('binary'), 'binary');
    } else {
      buffer = FastParser.fixed_data(b, 33);
      return _PublicKey["default"].fromBuffer(buffer);
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

var _default = FastParser;
exports["default"] = _default;
module.exports = exports.default;