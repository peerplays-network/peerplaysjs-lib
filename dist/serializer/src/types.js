"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _ws = require("../../ws");

var _SerializerValidation = _interopRequireDefault(require("./SerializerValidation"));

var _FastParser = _interopRequireDefault(require("./FastParser"));

var _ChainTypes = _interopRequireDefault(require("../../chain/src/ChainTypes"));

var _ObjectId = _interopRequireDefault(require("../../chain/src/ObjectId"));

var _ecc = require("../../ecc");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var MIN_SIGNED_32 = -1 * Math.pow(2, 31);
var MAX_SIGNED_32 = Math.pow(2, 31) - 1;
var HEX_DUMP = process.env.npm_config__graphene_serializer_hex_dump;

var strCmp = function strCmp(a, b) {
  var result = 0;

  if (a > b) {
    result = 1;
  }

  if (a < b) {
    result = -1;
  }

  return result;
};

var firstEl = function firstEl(el) {
  return Array.isArray(el) ? el[0] : el;
};

var sortOperation = function sortOperation(array, st_operation) {
  if (!st_operation.nosort) {
    // If the operation has its own compare function.
    if (st_operation.compare) {
      return array.sort(function (a, b) {
        return st_operation.compare(firstEl(a), firstEl(b));
      });
    }

    return array.sort(function (a, b) {
      var aFirst = firstEl(a);
      var bFirst = firstEl(b); // If both of the first elements are numbers.

      if (typeof aFirst === 'number' && typeof bFirst === 'number') {
        return aFirst - bFirst;
      } // If they are both buffers.


      if (Buffer.isBuffer(aFirst) && Buffer.isBuffer(bFirst)) {
        return strCmp(aFirst.toString('hex'), bFirst.toString('hex'));
      } // Otherwise


      return strCmp(aFirst.toString(), bFirst.toString());
    });
  }

  return array;
};

var Types = {};
Types.uint8 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint8();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].require_range(0, 0xff, object, "uint8 ".concat(object));

    b.writeUint8(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].require_range(0, 0xff, object, "uint8 ".concat(object));

    return object;
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return 0;
    }

    _SerializerValidation["default"].require_range(0, 0xff, object, "uint8 ".concat(object));

    return parseInt(object, 10);
  }
};
Types.uint16 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint16();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].require_range(0, 0xffff, object, "uint16 ".concat(object));

    b.writeUint16(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].require_range(0, 0xffff, object, "uint16 ".concat(object));

    return object;
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return 0;
    }

    _SerializerValidation["default"].require_range(0, 0xffff, object, "uint16 ".concat(object));

    return parseInt(object, 10);
  }
};
Types.uint32 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint32();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].require_range(0, 0xffffffff, object, "uint32 ".concat(object));

    b.writeUint32(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].require_range(0, 0xffffffff, object, "uint32 ".concat(object));

    return object;
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return 0;
    }

    _SerializerValidation["default"].require_range(0, 0xffffffff, object, "uint32 ".concat(object));

    return parseInt(object, 10);
  }
};
Types.varint32 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readVarint32();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].require_range(MIN_SIGNED_32, MAX_SIGNED_32, object, "uint32 ".concat(object));

    b.writeVarint32(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].require_range(MIN_SIGNED_32, MAX_SIGNED_32, object, "uint32 ".concat(object));

    return object;
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return 0;
    }

    _SerializerValidation["default"].require_range(MIN_SIGNED_32, MAX_SIGNED_32, object, "uint32 ".concat(object));

    return parseInt(object, 10);
  }
};
Types.int64 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readInt64();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    b.writeInt64(_SerializerValidation["default"].to_long(object));
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object);

    return _SerializerValidation["default"].to_long(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '0';
    }

    _SerializerValidation["default"].required(object);

    return _SerializerValidation["default"].to_long(object).toString();
  }
};
Types.uint64 = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint64();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    b.writeUint64(_SerializerValidation["default"].to_ulong(_SerializerValidation["default"].unsigned(object)));
  },
  fromObject: function fromObject(object) {
    return _SerializerValidation["default"].to_ulong(_SerializerValidation["default"].unsigned(object));
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '0';
    }

    return _SerializerValidation["default"].to_ulong(object).toString();
  }
};
Types.string = {
  fromByteBuffer: function fromByteBuffer(b) {
    var b_copy;
    var len = b.readVarint32();
    b_copy = b.copy(b.offset, b.offset + len);
    b.skip(len);
    return Buffer.from(b_copy.toBinary(), 'binary');
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    b.writeVarint32(object.length);
    b.append(object.toString('binary'), 'binary');
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object);

    return Buffer.from(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '';
    }

    return object.toString();
  }
};

Types.bytes = function (size) {
  var bytes = {
    fromByteBuffer: function fromByteBuffer(b) {
      if (size === undefined) {
        var _b_copy;

        var len = b.readVarint32();
        _b_copy = b.copy(b.offset, b.offset + len);
        b.skip(len);
        return Buffer.from(_b_copy.toBinary(), 'binary');
      }

      var b_copy = b.copy(b.offset, b.offset + size);
      b.skip(size);
      return Buffer.from(b_copy.toBinary(), 'binary');
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      _SerializerValidation["default"].required(object);

      if (typeof object === 'string') {
        object = Buffer.from(object, 'hex');
      }

      if (size === undefined) {
        b.writeVarint32(object.length);
      }

      b.append(object.toString('binary'), 'binary');
    },
    fromObject: function fromObject(object) {
      _SerializerValidation["default"].required(object);

      if (Buffer.isBuffer(object)) {
        return object;
      }

      return Buffer.from(object, 'hex');
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (debug.use_default && object === undefined) {
        return new Array(size).join('00');
      }

      _SerializerValidation["default"].required(object);

      return object.toString('hex');
    }
  };
  return bytes;
};

Types.bool = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint8() === 1;
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    // supports boolean or integer
    b.writeUint8(JSON.parse(object) ? 1 : 0);
  },
  fromObject: function fromObject(object) {
    return !!JSON.parse(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return false;
    }

    return !!JSON.parse(object);
  }
};
Types["void"] = {
  fromByteBuffer: function fromByteBuffer() {
    throw new Error('(void) undefined type');
  },
  appendByteBuffer: function appendByteBuffer() {
    throw new Error('(void) undefined type');
  },
  fromObject: function fromObject() {
    throw new Error('(void) undefined type');
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return undefined;
    }

    throw new Error('(void) undefined type');
  }
};

Types.array = function (st_operation) {
  var array = {
    fromByteBuffer: function fromByteBuffer(b) {
      var size = b.readVarint32();

      if (HEX_DUMP) {
        console.log("varint32 size = ".concat(size.toString(16)));
      }

      var result = [];

      for (var i = 0; size > 0 ? i < size : i > size; size > 0 ? i++ : i++) {
        result.push(st_operation.fromByteBuffer(b));
      }

      return sortOperation(result, st_operation);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      _SerializerValidation["default"].required(object);

      object = sortOperation(object, st_operation);
      b.writeVarint32(object.length);

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        st_operation.appendByteBuffer(b, o);
      }
    },
    fromObject: function fromObject(object) {
      _SerializerValidation["default"].required(object);

      object = sortOperation(object, st_operation);
      var result = [];

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        result.push(st_operation.fromObject(o));
      }

      return result;
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (debug.use_default && object === undefined) {
        return [st_operation.toObject(object, debug)];
      }

      _SerializerValidation["default"].required(object);

      object = sortOperation(object, st_operation);
      var result = [];

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        result.push(st_operation.toObject(o, debug));
      }

      return result;
    }
  };
  return array;
};

Types.nosort_array = function (st_operation) {
  st_operation.nosort = true;
  return Types.array(st_operation);
};

Types.time_point_sec = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readUint32();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    if (typeof object !== 'number') {
      object = Types.time_point_sec.fromObject(object);
    }

    b.writeUint32(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object);

    if (typeof object === 'number') {
      return object;
    }

    if (object.getTime) {
      return Math.floor(object.getTime() / 1000);
    }

    if (typeof object !== 'string') {
      throw new Error("Unknown date type: ".concat(object));
    } // if(typeof object === "string" && !/Z$/.test(object))
    //     object = object + "Z"


    return Math.floor(new Date(object).getTime() / 1000);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return new Date(0).toISOString().split('.')[0];
    }

    _SerializerValidation["default"].required(object);

    if (typeof object === 'string') {
      return object;
    }

    if (object.getTime) {
      return object.toISOString().split('.')[0];
    }

    var _int = parseInt(object, 10);

    _SerializerValidation["default"].require_range(0, 0xffffffff, _int, "uint32 ".concat(object));

    return new Date(_int * 1000).toISOString().split('.')[0];
  }
};

Types.set = function (st_operation) {
  var set_object = {
    validate: function validate(array) {
      var dup_map = {};

      for (var i = 0, len = array.length; i < len; i++) {
        var o = array[i];

        var ref = _typeof(o);

        if (['string', 'number'].indexOf(ref) >= 0) {
          if (dup_map[o] !== undefined) {
            throw new Error('duplicate (set)');
          }

          dup_map[o] = true;
        }
      }

      return sortOperation(array, st_operation);
    },
    fromByteBuffer: function fromByteBuffer(b) {
      var size = b.readVarint32();

      if (HEX_DUMP) {
        console.log("varint32 size = ".concat(size.toString(16)));
      }

      return this.validate(function () {
        var result = [];

        for (var i = 0; size > 0 ? i < size : i > size; size > 0 ? i++ : i++) {
          result.push(st_operation.fromByteBuffer(b));
        }

        return result;
      }());
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      if (!object) {
        object = [];
      }

      b.writeVarint32(object.length);
      var iterable = this.validate(object);

      for (var i = 0, len = iterable.length; i < len; i++) {
        var o = iterable[i];
        st_operation.appendByteBuffer(b, o);
      }
    },
    fromObject: function fromObject(object) {
      if (!object) {
        object = [];
      }

      return this.validate(function () {
        var result = [];

        for (var i = 0, len = object.length; i < len; i++) {
          var o = object[i];
          result.push(st_operation.fromObject(o));
        }

        return result;
      }());
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (debug.use_default && object === undefined) {
        return [st_operation.toObject(object, debug)];
      }

      if (!object) {
        object = [];
      }

      var result = [];

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        result.push(st_operation.toObject(o, debug));
      }

      return this.validate(result);
    }
  };
  return set_object;
};

Types.fixed_array = function (count, st_operation) {
  var fixed_array = {
    fromByteBuffer: function fromByteBuffer(b) {
      var results = [];

      for (var i = 0, ref = count; i < ref; i++) {
        results.push(st_operation.fromByteBuffer(b));
      }

      return sortOperation(results, st_operation);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      if (count !== 0) {
        _SerializerValidation["default"].required(object);

        object = sortOperation(object, st_operation);
      }

      for (var i = 0, ref = count; i < ref; i++) {
        st_operation.appendByteBuffer(b, object[i]);
      }
    },
    fromObject: function fromObject(object) {
      if (count !== 0) {
        _SerializerValidation["default"].required(object);
      }

      var results = [];

      for (var i = 0, ref = count; i < ref; i++) {
        results.push(st_operation.fromObject(object[i]));
      }

      return results;
    },
    toObject: function toObject(object, debug) {
      if (debug == null) {
        debug = {};
      }

      var results;

      if (debug.use_default && object === undefined) {
        results = [];

        for (var i = 0, ref = count; i < ref; i++) {
          results.push(st_operation.toObject(undefined, debug));
        }

        return results;
      }

      if (count !== 0) {
        _SerializerValidation["default"].required(object);
      }

      results = [];

      for (var _i = 0, _ref = count; _i < _ref; _i++) {
        results.push(st_operation.toObject(object[_i], debug));
      }

      return results;
    }
  };
  return fixed_array;
};
/* Supports instance numbers (11) or object types (1.2.11).  Object type
Validation is enforced when an object type is used. */


Types.id_type = function (reserved_spaces, object_type) {
  _SerializerValidation["default"].required(reserved_spaces, 'reserved_spaces');

  _SerializerValidation["default"].required(object_type, 'object_type');

  var id_type_object = {
    fromByteBuffer: function fromByteBuffer(b) {
      return b.readVarint32();
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      _SerializerValidation["default"].required(object);

      if (object.resolve !== undefined) {
        object = object.resolve;
      } // convert 1.2.n into just n


      if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(object)) {
        object = _SerializerValidation["default"].get_instance(reserved_spaces, object_type, object);
      }

      b.writeVarint32(_SerializerValidation["default"].to_number(object));
    },
    fromObject: function fromObject(object) {
      _SerializerValidation["default"].required(object);

      if (object.resolve !== undefined) {
        object = object.resolve;
      }

      if (_SerializerValidation["default"].is_digits(object)) {
        return _SerializerValidation["default"].to_number(object);
      }

      return _SerializerValidation["default"].get_instance(reserved_spaces, object_type, object);
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var object_type_id = _ChainTypes["default"].object_type[object_type];

      if (debug.use_default && object === undefined) {
        return "".concat(reserved_spaces, ".").concat(object_type_id, ".0");
      }

      _SerializerValidation["default"].required(object);

      if (object.resolve !== undefined) {
        object = object.resolve;
      }

      if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(object)) {
        object = _SerializerValidation["default"].get_instance(reserved_spaces, object_type, object);
      }

      return "".concat(reserved_spaces, ".").concat(object_type_id, ".").concat(object);
    }
  };
  return id_type_object;
};

Types.protocol_id_type = function (name) {
  _SerializerValidation["default"].required(name, 'name');

  return Types.id_type(_ChainTypes["default"].reserved_spaces.protocol_ids, name);
};

Types.implementation_id_type = function (name) {
  var result = Types.id_type(_ChainTypes["default"].reserved_spaces.implementation_ids, name);
  return result;
};

Types.object_id_type = {
  fromByteBuffer: function fromByteBuffer(b) {
    return _ObjectId["default"].fromByteBuffer(b);
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    if (object.resolve !== undefined) {
      object = object.resolve;
    }

    object = _ObjectId["default"].fromString(object);
    object.appendByteBuffer(b);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object);

    if (object.resolve !== undefined) {
      object = object.resolve;
    }

    return _ObjectId["default"].fromString(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '0.0.0';
    }

    _SerializerValidation["default"].required(object);

    if (object.resolve !== undefined) {
      object = object.resolve;
    }

    object = _ObjectId["default"].fromString(object);
    return object.toString();
  }
};
Types.vote_id = {
  TYPE: 0x000000ff,
  ID: 0xffffff00,
  fromByteBuffer: function fromByteBuffer(b) {
    var value = b.readUint32();
    return {
      type: value & this.TYPE,
      // eslint-disable-line
      id: value & this.ID // eslint-disable-line

    };
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    if (object === 'string') {
      object = Types.vote_id.fromObject(object);
    }

    var value = object.id << 8 | object.type; // eslint-disable-line

    b.writeUint32(value);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object, '(type vote_id)');

    if (_typeof(object) === 'object') {
      _SerializerValidation["default"].required(object.type, 'type');

      _SerializerValidation["default"].required(object.id, 'id');

      return object;
    }

    _SerializerValidation["default"].require_test(/^[0-9]+:[0-9]+$/, object, "vote_id format ".concat(object));

    var _object$split = object.split(':'),
        _object$split2 = _slicedToArray(_object$split, 2),
        type = _object$split2[0],
        id = _object$split2[1];

    _SerializerValidation["default"].require_range(0, 0xff, type, "vote type ".concat(object));

    _SerializerValidation["default"].require_range(0, 0xffffff, id, "vote id ".concat(object));

    return {
      type: type,
      id: id
    };
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '0:0';
    }

    _SerializerValidation["default"].required(object);

    if (typeof object === 'string') {
      object = Types.vote_id.fromObject(object);
    }

    return "".concat(object.type, ":").concat(object.id);
  },
  compare: function compare(a, b) {
    if (_typeof(a) !== 'object') {
      a = Types.vote_id.fromObject(a);
    }

    if (_typeof(b) !== 'object') {
      b = Types.vote_id.fromObject(b);
    }

    return parseInt(a.id, 10) - parseInt(b.id, 10);
  }
};

Types.optional = function (st_operation) {
  _SerializerValidation["default"].required(st_operation, 'st_operation');

  return {
    fromByteBuffer: function fromByteBuffer(b) {
      if (!(b.readUint8() === 1)) {
        return undefined;
      }

      return st_operation.fromByteBuffer(b);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      if (object !== null && object !== undefined) {
        b.writeUint8(1);
        st_operation.appendByteBuffer(b, object);
      } else {
        b.writeUint8(0);
      }
    },
    fromObject: function fromObject(object) {
      if (object === undefined) {
        return undefined;
      }

      return st_operation.fromObject(object);
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      // toObject is only null save if use_default is true
      var result_object = function () {
        if (!debug.use_default && object === undefined) {
          return undefined;
        }

        return st_operation.toObject(object, debug);
      }();

      if (debug.annotate) {
        if (_typeof(result_object) === 'object') {
          result_object.__optional = 'parent is optional';
        } else {
          result_object = {
            __optional: result_object
          };
        }
      }

      return result_object;
    }
  };
};

Types.static_variant = function (_st_operations) {
  var static_variant = {
    nosort: true,
    st_operations: _st_operations,
    fromByteBuffer: function fromByteBuffer(b) {
      var type_id = b.readVarint32();
      var st_operation = this.st_operations[type_id];

      if (HEX_DUMP) {
        console.error("static_variant id 0x".concat(type_id.toString(16), " (").concat(type_id, ")"));
      }

      _SerializerValidation["default"].required(st_operation, "operation ".concat(type_id));

      return [type_id, st_operation.fromByteBuffer(b)];
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      _SerializerValidation["default"].required(object);

      var type_id = object[0];
      var st_operation = this.st_operations[type_id];

      _SerializerValidation["default"].required(st_operation, "operation ".concat(type_id));

      b.writeVarint32(type_id);
      st_operation.appendByteBuffer(b, object[1]);
    },
    fromObject: function fromObject(object) {
      _SerializerValidation["default"].required(object);

      var type_id = object[0];
      var st_operation = this.st_operations[type_id];

      _SerializerValidation["default"].required(st_operation, "operation ".concat(type_id));

      return [type_id, st_operation.fromObject(object[1])];
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (debug.use_default && object === undefined) {
        return [0, this.st_operations[0].toObject(undefined, debug)];
      }

      _SerializerValidation["default"].required(object);

      var type_id = object[0];
      var st_operation = this.st_operations[type_id];

      _SerializerValidation["default"].required(st_operation, "operation ".concat(type_id));

      return [type_id, st_operation.toObject(object[1], debug)];
    }
  };
  return static_variant;
};

Types.map = function (key_st_operation, value_st_operation) {
  var map_object = {
    validate: function validate(array) {
      if (!Array.isArray(array)) {
        throw new Error('expecting array');
      }

      var dup_map = {};

      for (var i = 0, len = array.length; i < len; i++) {
        var o = array[i];
        var ref = void 0;

        if (!(o.length === 2)) {
          throw new Error('expecting two elements');
        }

        ref = _typeof(o[0]);

        if (ref && ['number', 'string'].indexOf(ref) >= 0) {
          if (dup_map[o[0]] !== undefined) {
            throw new Error('duplicate (map)');
          }

          dup_map[o[0]] = true;
        }
      }

      return sortOperation(array, key_st_operation);
    },
    fromByteBuffer: function fromByteBuffer(b) {
      var result = [];
      var end = b.readVarint32();

      for (var i = 0; end > 0 ? i < end : i > end; end > 0 ? i++ : i++) {
        result.push([key_st_operation.fromByteBuffer(b), value_st_operation.fromByteBuffer(b)]);
      }

      return this.validate(result);
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      this.validate(object);
      b.writeVarint32(object.length);

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        key_st_operation.appendByteBuffer(b, o[0]);
        value_st_operation.appendByteBuffer(b, o[1]);
      }
    },
    fromObject: function fromObject(object) {
      _SerializerValidation["default"].required(object);

      var result = [];

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        result.push([key_st_operation.fromObject(o[0]), value_st_operation.fromObject(o[1])]);
      }

      return this.validate(result);
    },
    toObject: function toObject(object) {
      var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (debug.use_default && object === undefined) {
        return [[key_st_operation.toObject(undefined, debug), value_st_operation.toObject(undefined, debug)]];
      }

      _SerializerValidation["default"].required(object);

      object = this.validate(object);
      var result = [];

      for (var i = 0, len = object.length; i < len; i++) {
        var o = object[i];
        result.push([key_st_operation.toObject(o[0], debug), value_st_operation.toObject(o[1], debug)]);
      }

      return result;
    }
  };
  return map_object;
};

Types.public_key = {
  toPublic: function toPublic(object) {
    if (object.resolve !== undefined) {
      object = object.resolve;
    }

    if (object instanceof _ecc.PublicKey) {
      return object;
    }

    var result = object;

    if (!object) {
      return null;
    }

    if (!object.Q) {
      result = _ecc.PublicKey.fromStringOrThrow(object);
    }

    return result;
  },
  fromByteBuffer: function fromByteBuffer(b) {
    return _FastParser["default"].public_key(b);
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    _FastParser["default"].public_key(b, Types.public_key.toPublic(object));
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].required(object);

    if (object.Q) {
      return object;
    }

    return Types.public_key.toPublic(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return "".concat(_ws.ChainConfig.address_prefix, "859gxfnXyUriMgUeThh1fWv3oqcpLFyHa3TfFYC4PK2HqhToVM");
    }

    _SerializerValidation["default"].required(object);

    return object.toString();
  },
  compare: function compare(a, b) {
    return strCmp(a.toAddressString(), b.toAddressString());
  }
};
Types.address = {
  _to_address: function _to_address(object) {
    _SerializerValidation["default"].required(object);

    if (object.addy) {
      return object;
    }

    return _ecc.Address.fromString(object);
  },
  fromByteBuffer: function fromByteBuffer(b) {
    return new _ecc.Address(_FastParser["default"].ripemd160(b));
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _FastParser["default"].ripemd160(b, Types.address._to_address(object).toBuffer());
  },
  fromObject: function fromObject(object) {
    return Types.address._to_address(object);
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return "".concat(_ws.ChainConfig.address_prefix, "664KmHxSuQyDsfwo4WEJvWpzg1QKdg67S");
    }

    return Types.address._to_address(object).toString();
  },
  compare: function compare(a, b) {
    return strCmp(a.toString(), b.toString());
  }
};
Types.variant = {
  fromByteBuffer: function fromByteBuffer(b) {
    var type = b.readUint8();

    switch (type) {
      case 0:
        return null;

      case 1:
        return Types.int64.fromByteBuffer(b);

      case 2:
        return Types.uint64.fromByteBuffer(b);

      case 3:
        return b.readDouble();

      case 4:
        return Types.bool.fromByteBuffer(b);

      case 5:
        return Types.string.fromByteBuffer(b);

      case 6:
        return Types.array(Types.variant).fromByteBuffer(b);

      case 7:
      default:
        return Types.variant_object.fromByteBuffer(b);
    }
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    if (typeof object === 'number') {
      if (Number.isInteger(object)) {
        if (object >= 0) {
          b.writeUint8(2);
          Types.uint64.appendByteBuffer(b, object);
        } else {
          b.writeUint8(1);
          Types.int64.appendByteBuffer(b, object);
        }
      } else {
        b.writeUint8(3);
        b.writeDouble(Number.parseFloat(object));
      }
    } else if (typeof object === 'boolean') {
      b.writeUint8(4);
      Types.bool.appendByteBuffer(b, object);
    } else if (typeof object === 'string') {
      b.writeUint8(5);
      Types.string.appendByteBuffer(b, object);
    } else if (Array.isArray(object)) {
      b.writeUint8(6);
      Types.array(Types.variant).appendByteBuffer(b, object);
    } else {
      b.writeUint8(7);
      Types.variant_object.appendByteBuffer(b, object);
    }
  },
  fromObject: function fromObject(object) {
    return JSON.parse(object);
  },
  toObject: function toObject(object) {
    return JSON.parse(object);
  }
};
Types.variant_object = {
  fromByteBuffer: function fromByteBuffer(b) {
    var count = b.readVarint32();
    var result = {};

    for (var i = 0; i < count; ++i) {
      var key = Types.string.fromByteBuffer(b);
      result[key] = Types.variant.fromByteBuffer(b);
    }

    return result;
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    var keys = Object.keys(object);
    b.writeVarint32(keys.length); // number of key/value pairs

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      Types.string.appendByteBuffer(b, key);
      Types.variant.appendByteBuffer(b, object[key]);
    }
  },
  fromObject: function fromObject(object) {
    var newObject = {};
    var keys = Object.keys(object);

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      newObject[key] = object[key];
    }

    return newObject;
  },
  toObject: function toObject(object) {
    var newObject = {};
    var keys = Object.keys(object);

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      newObject[key] = object[key];
    }

    return newObject;
  }
};

Types.enumeration = function (values) {
  var enumeration = {
    fromByteBuffer: function fromByteBuffer(b) {
      return values[b.readVarint32ZigZag()];
    },
    appendByteBuffer: function appendByteBuffer(b, object) {
      b.writeVarint32ZigZag(values.indexOf(object));
    },
    fromObject: function fromObject(object) {
      return object;
    },
    toObject: function toObject(object) {
      return object;
    }
  };
  return enumeration;
};

Types["double"] = {
  fromByteBuffer: function fromByteBuffer(b) {
    return b.readDouble();
  },
  appendByteBuffer: function appendByteBuffer(b, object) {
    _SerializerValidation["default"].required(object);

    _SerializerValidation["default"].number(object);

    b.writeDouble(object);
  },
  fromObject: function fromObject(object) {
    _SerializerValidation["default"].number(object);

    return object;
  },
  toObject: function toObject(object) {
    var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (debug.use_default && object === undefined) {
      return '0';
    }

    _SerializerValidation["default"].required(object);

    return parseFloat(object);
  }
};
Types.sha256 = Types.bytes(32);
var _default = Types;
exports["default"] = _default;
module.exports = exports.default;