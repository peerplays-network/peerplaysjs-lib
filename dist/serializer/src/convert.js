'use strict';

exports.__esModule = true;

exports.default = function (type) {
  return {
    fromHex: function fromHex(hex) {
      var b = _bytebuffer2.default.fromHex(hex, _bytebuffer2.default.LITTLE_ENDIAN);
      return type.fromByteBuffer(b);
    },
    toHex: function toHex(object) {
      var b = toByteBuffer(type, object);
      return b.toHex();
    },
    fromBuffer: function fromBuffer(buffer) {
      var b = _bytebuffer2.default.fromBinary(buffer.toString(), _bytebuffer2.default.LITTLE_ENDIAN);
      return type.fromByteBuffer(b);
    },
    toBuffer: function toBuffer(object) {
      return Buffer.from(toByteBuffer(type, object).toBinary(), 'binary');
    },
    fromBinary: function fromBinary(string) {
      var b = _bytebuffer2.default.fromBinary(string, _bytebuffer2.default.LITTLE_ENDIAN);
      return type.fromByteBuffer(b);
    },
    toBinary: function toBinary(object) {
      return toByteBuffer(type, object).toBinary();
    }
  };
};

var _bytebuffer = require('bytebuffer');

var _bytebuffer2 = _interopRequireDefault(_bytebuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toByteBuffer(type, object) {
  var b = new _bytebuffer2.default(_bytebuffer2.default.DEFAULT_CAPACITY, _bytebuffer2.default.LITTLE_ENDIAN);
  type.appendByteBuffer(b, object);
  return b.copy(0, b.offset);
}

module.exports = exports.default;