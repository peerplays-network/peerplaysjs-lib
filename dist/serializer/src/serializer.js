'use strict';

exports.__esModule = true;

var _bytebuffer = require('bytebuffer');

var _bytebuffer2 = _interopRequireDefault(_bytebuffer);

var _error_with_cause = require('./error_with_cause');

var _error_with_cause2 = _interopRequireDefault(_error_with_cause);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HEX_DUMP = process.env.npm_config__graphene_serializer_hex_dump;

var Serializer = function () {
  function Serializer(operation_name, types) {
    _classCallCheck(this, Serializer);

    this.operation_name = operation_name;
    this.types = types;

    if (this.types) {
      this.keys = Object.keys(this.types);
    }

    Serializer.printDebug = true;
  }

  Serializer.prototype.fromByteBuffer = function fromByteBuffer(b) {
    var object = {};
    var field = null;

    try {
      var iterable = this.keys;

      for (var i = 0; i < iterable.length; i++) {
        field = iterable[i];
        var type = this.types[field];

        try {
          if (HEX_DUMP) {
            if (type.operation_name) {
              console.error(type.operation_name);
            } else {
              var o1 = b.offset;
              type.fromByteBuffer(b);
              var o2 = b.offset;
              b.offset = o1;
              // b.reset()
              var _b = b.copy(o1, o2);
              console.error(this.operation_name + '.' + field + '\t', _b.toHex());
            }
          }

          object[field] = type.fromByteBuffer(b);
        } catch (e) {
          if (Serializer.printDebug) {
            console.error('Error reading ' + this.operation_name + '.' + field + ' in data:');
            b.printDebug();
          }

          throw e;
        }
      }
    } catch (error) {
      _error_with_cause2.default.throw(this.operation_name + '.' + field, error);
    }

    return object;
  };

  Serializer.prototype.appendByteBuffer = function appendByteBuffer(b, object) {
    var field = null;

    try {
      var iterable = this.keys;

      for (var i = 0; i < iterable.length; i++) {
        field = iterable[i];
        var type = this.types[field];
        type.appendByteBuffer(b, object[field]);
      }
    } catch (error) {
      try {
        _error_with_cause2.default.throw(this.operation_name + '.' + field + ' = ' + JSON.stringify(object[field]), error);
      } catch (e) {
        // circular ref
        _error_with_cause2.default.throw(this.operation_name + '.' + field + ' = ' + object[field], error);
      }
    }
  };

  Serializer.prototype.fromObject = function fromObject(serialized_object) {
    var result = {};
    var field = null;

    try {
      var iterable = this.keys;

      for (var i = 0; i < iterable.length; i++) {
        field = iterable[i];
        var type = this.types[field];
        var value = serialized_object[field];
        // DEBUG value = value.resolve if value.resolve
        // DEBUG console.log('... value',field,value)
        var object = type.fromObject(value);
        result[field] = object;
      }
    } catch (error) {
      _error_with_cause2.default.throw(this.operation_name + '.' + field, error);
    }

    return result;
  };

  /**
        @arg {boolean} [debug.use_default = false] - more template friendly
        @arg {boolean} [debug.annotate = false] - add user-friendly information
    */


  Serializer.prototype.toObject = function toObject() {
    var serialized_object = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { use_default: false, annotate: false };

    var result = {};
    var field = null;

    try {
      if (!this.types) {
        return result;
      }

      var iterable = this.keys;

      for (var i = 0; i < iterable.length; i++) {
        field = iterable[i];
        var type = this.types[field];
        var object = type.toObject(typeof serialized_object !== 'undefined' && serialized_object !== null ? serialized_object[field] : undefined, debug);
        result[field] = object;

        if (HEX_DUMP) {
          var b = new _bytebuffer2.default(_bytebuffer2.default.DEFAULT_CAPACITY, _bytebuffer2.default.LITTLE_ENDIAN);
          type.appendByteBuffer(b, typeof serialized_object !== 'undefined' && serialized_object !== null ? serialized_object[field] : undefined);
          b = b.copy(0, b.offset);
          console.error(this.operation_name + '.' + field, b.toHex());
        }
      }
    } catch (error) {
      _error_with_cause2.default.throw(this.operation_name + '.' + field, error);
    }

    return result;
  };

  /** Sort by the first element in a operation */


  Serializer.prototype.compare = function compare(a, b) {
    var first_key = this.keys[0];
    var first_type = this.types[first_key];

    var valA = a[first_key];
    var valB = b[first_key];

    if (first_type.compare) {
      return first_type.compare(valA, valB);
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }

    var encoding = void 0;

    if (Buffer.isBuffer(valA) && Buffer.isBuffer(valB)) {
      // A binary string compare does not work.  If localeCompare is well supported that could
      // replace HEX.  Performanance is very good so comparing HEX works.
      encoding = 'hex';
    }

    var strA = valA.toString(encoding);
    var strB = valB.toString(encoding);

    var result = 0;

    if (strA > strB) {
      result = 1;
    }

    if (strA < strB) {
      result = -1;
    }

    return result;
  };

  // <helper_functions>

  Serializer.prototype.fromHex = function fromHex(hex) {
    var b = _bytebuffer2.default.fromHex(hex, _bytebuffer2.default.LITTLE_ENDIAN);
    return this.fromByteBuffer(b);
  };

  Serializer.prototype.fromBuffer = function fromBuffer(buffer) {
    var b = _bytebuffer2.default.fromBinary(buffer.toString('binary'), _bytebuffer2.default.LITTLE_ENDIAN);
    return this.fromByteBuffer(b);
  };

  Serializer.prototype.toHex = function toHex(object) {
    // return this.toBuffer(object).toString("hex")
    var b = this.toByteBuffer(object);
    return b.toHex();
  };

  Serializer.prototype.toByteBuffer = function toByteBuffer(object) {
    var b = new _bytebuffer2.default(_bytebuffer2.default.DEFAULT_CAPACITY, _bytebuffer2.default.LITTLE_ENDIAN);
    this.appendByteBuffer(b, object);
    return b.copy(0, b.offset);
  };

  Serializer.prototype.toBuffer = function toBuffer(object) {
    return Buffer.from(this.toByteBuffer(object).toBinary(), 'binary');
  };

  return Serializer;
}();

exports.default = Serializer;
module.exports = exports.default;