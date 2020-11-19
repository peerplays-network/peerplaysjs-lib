"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _bytebuffer = require("bytebuffer");

var _ChainTypes = _interopRequireDefault(require("../../chain/src/ChainTypes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var MAX_SAFE_INT = 9007199254740991;
var MIN_SAFE_INT = -9007199254740991;
/**
    Most validations are skipped and the value returned unchanged when an empty string,
    null, or undefined is encountered (except "required").
    Validations support a string format for dealing with large numbers.
*/

var _my = {
  is_empty: function is_empty(value) {
    return value === null || value === undefined;
  },
  required: function required(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      throw new Error("value required " + field_name + " | " + value);
    }

    return value;
  },
  require_long: function require_long(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (!_bytebuffer.Long.isLong(value)) {
      throw new Error("Long value required " + field_name + " | " + value);
    }

    return value;
  },
  string: function string(value) {
    if (this.is_empty(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      throw new Error("string required: " + value);
    }

    return value;
  },
  number: function number(value) {
    if (this.is_empty(value)) {
      return value;
    }

    if (typeof value !== 'number') {
      throw new Error("number required: " + value);
    }

    return value;
  },
  whole_number: function whole_number(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (/\./.test(value)) {
      throw new Error("whole number required " + field_name + " " + value);
    }

    return value;
  },
  unsigned: function unsigned(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (/-/.test(value)) {
      throw new Error("unsigned required " + field_name + " " + value);
    }

    return value;
  },
  is_digits: function is_digits(value) {
    if (typeof value === 'number') {
      return true;
    }

    return /^[0-9]+$/.test(value);
  },
  to_number: function to_number(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    this.no_overflow53(value, field_name);

    var int_value = function () {
      if (typeof value === 'number') {
        return value;
      }

      return parseInt(value, 10);
    }();

    return int_value;
  },
  to_long: function to_long(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (_bytebuffer.Long.isLong(value)) {
      return value;
    }

    this.no_overflow64(value, field_name);

    if (typeof value === 'number') {
      value = "" + value;
    }

    return _bytebuffer.Long.fromString(value);
  },
  to_ulong: function to_ulong(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (_bytebuffer.Long.isLong(value)) {
      return value;
    }

    this.no_overflow64(value, field_name, true);

    if (typeof value === 'number') {
      value = "" + value;
    }

    return _bytebuffer.Long.fromString(value, true);
  },
  to_string: function to_string(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      this.no_overflow53(value, field_name);
      return "" + value;
    }

    if (_bytebuffer.Long.isLong(value)) {
      return value.toString();
    }

    throw new Error("unsupported type " + field_name + ": (" + typeof value + ") " + value);
  },
  require_test: function require_test(regex, value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    if (!regex.test(value)) {
      throw new Error("unmatched " + regex + " " + field_name + " " + value);
    }

    return value;
  },
  require_match: function require_match(regex, value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    var match = value.match(regex);

    if (match === null) {
      throw new Error("unmatched " + regex + " " + field_name + " " + value);
    }

    return match;
  },
  require_object_id: function require_object_id(value, field_name) {
    return this.require_match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/, value, field_name);
  },
  // Does not support over 53 bits
  require_range: function require_range(min, max, value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    var num = this.to_number(value);

    if (num < min || num > max) {
      throw new Error("out of range " + value + " " + field_name + " " + value);
    }

    return value;
  },
  require_object_type: function require_object_type(reserved_spaces, type, value, field_name) {
    if (reserved_spaces === void 0) {
      reserved_spaces = 1;
    }

    if (field_name === void 0) {
      field_name = '';
    }

    if (this.is_empty(value)) {
      return value;
    }

    var object_type = _ChainTypes["default"].object_type[type];

    if (!object_type) {
      throw new Error("Unknown object type " + type + " " + field_name + " " + value);
    }

    var re = new RegExp(reserved_spaces + "." + object_type + ".[0-9]+$");

    if (!re.test(value)) {
      throw new Error("Expecting " + type + " in format " + (reserved_spaces + "." + object_type + ".[0-9]+ ") + ("instead of " + value + " " + field_name + " " + value));
    }

    return value;
  },
  get_instance: function get_instance(reserve_spaces, type, value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    this.require_object_type(reserve_spaces, type, value, field_name);
    return this.to_number(value.split('.')[2]);
  },
  require_relative_type: function require_relative_type(type, value, field_name) {
    this.require_object_type(0, type, value, field_name);
    return value;
  },
  get_relative_instance: function get_relative_instance(type, value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    this.require_object_type(0, type, value, field_name);
    return this.to_number(value.split('.')[2]);
  },
  require_protocol_type: function require_protocol_type(type, value, field_name) {
    this.require_object_type(1, type, value, field_name);
    return value;
  },
  get_protocol_instance: function get_protocol_instance(type, value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    this.require_object_type(1, type, value, field_name);
    return this.to_number(value.split('.')[2]);
  },
  get_protocol_type: function get_protocol_type(value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    this.require_object_id(value, field_name);
    var values = value.split('.');
    return this.to_number(values[1]);
  },
  get_protocol_type_name: function get_protocol_type_name(value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    var type_id = this.get_protocol_type(value, field_name);
    return Object.keys(_ChainTypes["default"].object_type)[type_id];
  },
  require_implementation_type: function require_implementation_type(type, value, field_name) {
    this.require_object_type(2, type, value, field_name);
    return value;
  },
  get_implementation_instance: function get_implementation_instance(type, value, field_name) {
    if (this.is_empty(value)) {
      return value;
    }

    this.require_object_type(2, type, value, field_name);
    return this.to_number(value.split('.')[2]);
  },
  // signed / unsigned decimal
  no_overflow53: function no_overflow53(value, field_name) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (typeof value === 'number') {
      if (value > MAX_SAFE_INT || value < MIN_SAFE_INT) {
        throw new Error("overflow " + field_name + " " + value);
      }

      return;
    }

    if (typeof value === 'string') {
      var _int = parseInt(value, 10);

      if (_int > MAX_SAFE_INT || _int < MIN_SAFE_INT) {
        throw new Error("overflow " + field_name + " " + _int);
      }

      return;
    }

    if (_bytebuffer.Long.isLong(value)) {
      // typeof value.toInt() is 'number'
      this.no_overflow53(value.toInt(), field_name);
      return;
    }

    throw new Error("unsupported type " + field_name + ": (" + typeof value + ") " + value);
  },
  // signed / unsigned whole numbers only
  no_overflow64: function no_overflow64(value, field_name, unsigned) {
    if (field_name === void 0) {
      field_name = '';
    }

    if (unsigned === void 0) {
      unsigned = false;
    }

    // https://github.com/dcodeIO/Long.js/issues/20
    if (_bytebuffer.Long.isLong(value)) {
      return;
    } // BigInteger#isBigInteger https://github.com/cryptocoinjs/bigi/issues/20


    if (value.t !== undefined && value.s !== undefined) {
      this.no_overflow64(value.toString(), field_name, unsigned);
      return;
    }

    if (typeof value === 'string') {
      // remove leading zeros, will cause a false positive
      value = value.replace(/^0+/, ''); // remove trailing zeros

      while (/0$/.test(value)) {
        value = value.substring(0, value.length - 1);
      }

      if (/\.$/.test(value)) {
        // remove trailing dot
        value = value.substring(0, value.length - 1);
      }

      if (value === '') {
        value = '0';
      }

      var long_string = _bytebuffer.Long.fromString(value, unsigned).toString();

      if (long_string !== value.trim()) {
        throw new Error("overflow " + field_name + " " + value);
      }

      return;
    }

    if (typeof value === 'number') {
      if (value > MAX_SAFE_INT || value < MIN_SAFE_INT) {
        throw new Error("overflow " + field_name + " " + value);
      }

      return;
    }

    throw new Error("unsupported type " + field_name + ": (" + typeof value + ") " + value);
  }
};
var _default = _my;
exports["default"] = _default;
module.exports = exports.default;