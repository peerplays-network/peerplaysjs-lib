"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _bytebuffer = require("bytebuffer");

var _SerializerValidation = _interopRequireDefault(require("../../serializer/src/SerializerValidation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var DB_MAX_INSTANCE_ID = _bytebuffer.Long.fromNumber(Math.pow(2, 48) - 1);

var ObjectId = /*#__PURE__*/function () {
  function ObjectId(space, type, instance) {
    this.space = space;
    this.type = type;
    this.instance = instance;
    var instance_string = this.instance.toString();
    var id = this.space + "." + this.type + "." + instance_string;

    if (!_SerializerValidation["default"].is_digits(instance_string)) {
      throw new ("Invalid object id " + id)();
    }
  }

  ObjectId.fromString = function fromString(value) {
    if (value.space !== undefined && value.type !== undefined && value.instance !== undefined) {
      return value;
    }

    var params = _SerializerValidation["default"].require_match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/, _SerializerValidation["default"].required(value, 'ObjectId'), 'ObjectId');

    return new ObjectId(parseInt(params[1], 10), parseInt(params[2], 10), _bytebuffer.Long.fromString(params[3]));
  };

  ObjectId.fromLong = function fromLong(_long) {
    var space = _long.shiftRight(56).toInt();

    var type = _long.shiftRight(48).toInt() & 0x00ff; // eslint-disable-line

    var instance = _long.and(DB_MAX_INSTANCE_ID);

    return new ObjectId(space, type, instance);
  };

  ObjectId.fromByteBuffer = function fromByteBuffer(b) {
    return ObjectId.fromLong(b.readUint64());
  };

  var _proto = ObjectId.prototype;

  _proto.toLong = function toLong() {
    return _bytebuffer.Long.fromNumber(this.space).shiftLeft(56).or(_bytebuffer.Long.fromNumber(this.type).shiftLeft(48).or(this.instance));
  };

  _proto.appendByteBuffer = function appendByteBuffer(b) {
    return b.writeUint64(this.toLong());
  };

  _proto.toString = function toString() {
    return this.space + "." + this.type + "." + this.instance.toString();
  };

  return ObjectId;
}();

var _default = ObjectId;
exports["default"] = _default;
module.exports = exports.default;