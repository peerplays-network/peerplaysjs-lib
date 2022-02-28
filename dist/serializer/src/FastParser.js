"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _PublicKey = _interopRequireDefault(require("../../ecc/src/PublicKey"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var FastParser = /*#__PURE__*/function () {
  function FastParser() {
    _classCallCheck(this, FastParser);
  }

  _createClass(FastParser, null, [{
    key: "fixed_data",
    value: function fixed_data(b, len, buffer) {
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
    }
  }, {
    key: "public_key",
    value: function public_key(b, _public_key) {
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
    }
  }, {
    key: "ripemd160",
    value: function ripemd160(b, _ripemd) {
      if (!b) {
        return;
      }

      if (_ripemd) {
        FastParser.fixed_data(b, 20, _ripemd);
      } else {
        return FastParser.fixed_data(b, 20);
      }
    }
  }, {
    key: "sha256",
    value: function sha256(b, _sha) {
      if (!b) {
        return;
      }

      if (_sha) {
        FastParser.fixed_data(b, 32, _sha);
      } else {
        return FastParser.fixed_data(b, 32);
      }
    }
  }, {
    key: "time_point_sec",
    value: function time_point_sec(b, epoch) {
      if (epoch) {
        epoch = Math.ceil(epoch / 1000);
        b.writeInt32(epoch);
      } else {
        epoch = b.readInt32(); // fc::time_point_sec

        return new Date(epoch * 1000);
      }
    }
  }]);

  return FastParser;
}();

var _default = FastParser;
exports["default"] = _default;
module.exports = exports.default;