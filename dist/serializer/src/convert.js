"use strict";

exports.__esModule = true;
exports["default"] = _default;

var _bytebuffer = _interopRequireDefault(require("bytebuffer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function toByteBuffer(type, object) {
  var b = new _bytebuffer["default"](_bytebuffer["default"].DEFAULT_CAPACITY, _bytebuffer["default"].LITTLE_ENDIAN);
  type.appendByteBuffer(b, object);
  return b.copy(0, b.offset);
}

function _default(type) {
  return {
    fromHex: function fromHex(hex) {
      var b = _bytebuffer["default"].fromHex(hex, _bytebuffer["default"].LITTLE_ENDIAN);

      return type.fromByteBuffer(b);
    },
    toHex: function toHex(object) {
      var b = toByteBuffer(type, object);
      return b.toHex();
    },
    fromBuffer: function fromBuffer(buffer) {
      var b = _bytebuffer["default"].fromBinary(buffer.toString(), _bytebuffer["default"].LITTLE_ENDIAN);

      return type.fromByteBuffer(b);
    },
    toBuffer: function toBuffer(object) {
      return Buffer.from(toByteBuffer(type, object).toBinary(), 'binary');
    },
    fromBinary: function fromBinary(string) {
      var b = _bytebuffer["default"].fromBinary(string, _bytebuffer["default"].LITTLE_ENDIAN);

      return type.fromByteBuffer(b);
    },
    toBinary: function toBinary(object) {
      return toByteBuffer(type, object).toBinary();
    }
  };
}