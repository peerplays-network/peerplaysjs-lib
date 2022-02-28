"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _bytebuffer = require("bytebuffer");

var _SerializerValidation = _interopRequireDefault(require("../../serializer/src/SerializerValidation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var DB_MAX_INSTANCE_ID = _bytebuffer.Long.fromNumber(Math.pow(2, 48) - 1);

var ObjectId = /*#__PURE__*/function () {
  function ObjectId(space, type, instance) {
    _classCallCheck(this, ObjectId);

    this.space = space;
    this.type = type;
    this.instance = instance;
    var instance_string = this.instance.toString();
    var id = "".concat(this.space, ".").concat(this.type, ".").concat(instance_string);

    if (!_SerializerValidation["default"].is_digits(instance_string)) {
      throw new ("Invalid object id ".concat(id))();
    }
  }

  _createClass(ObjectId, [{
    key: "toLong",
    value: function toLong() {
      return _bytebuffer.Long.fromNumber(this.space).shiftLeft(56).or(_bytebuffer.Long.fromNumber(this.type).shiftLeft(48).or(this.instance));
    }
  }, {
    key: "appendByteBuffer",
    value: function appendByteBuffer(b) {
      return b.writeUint64(this.toLong());
    }
  }, {
    key: "toString",
    value: function toString() {
      return "".concat(this.space, ".").concat(this.type, ".").concat(this.instance.toString());
    }
  }], [{
    key: "fromString",
    value: function fromString(value) {
      if (value.space !== undefined && value.type !== undefined && value.instance !== undefined) {
        return value;
      }

      var params = _SerializerValidation["default"].require_match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/, _SerializerValidation["default"].required(value, 'ObjectId'), 'ObjectId');

      return new ObjectId(parseInt(params[1], 10), parseInt(params[2], 10), _bytebuffer.Long.fromString(params[3]));
    }
  }, {
    key: "fromLong",
    value: function fromLong(_long) {
      var space = _long.shiftRight(56).toInt();

      var type = _long.shiftRight(48).toInt() & 0x00ff; // eslint-disable-line

      var instance = _long.and(DB_MAX_INSTANCE_ID);

      return new ObjectId(space, type, instance);
    }
  }, {
    key: "fromByteBuffer",
    value: function fromByteBuffer(b) {
      return ObjectId.fromLong(b.readUint64());
    }
  }]);

  return ObjectId;
}();

var _default = ObjectId;
exports["default"] = _default;
module.exports = exports.default;