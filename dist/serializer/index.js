"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Serializer", {
  enumerable: true,
  get: function get() {
    return _serializer["default"];
  }
});
Object.defineProperty(exports, "SerializerValidation", {
  enumerable: true,
  get: function get() {
    return _SerializerValidation["default"];
  }
});
Object.defineProperty(exports, "fp", {
  enumerable: true,
  get: function get() {
    return _FastParser["default"];
  }
});
exports.ops = void 0;
Object.defineProperty(exports, "template", {
  enumerable: true,
  get: function get() {
    return _template["default"];
  }
});
Object.defineProperty(exports, "types", {
  enumerable: true,
  get: function get() {
    return _types["default"];
  }
});

var _serializer = _interopRequireDefault(require("./src/serializer"));

var _FastParser = _interopRequireDefault(require("./src/FastParser"));

var _types = _interopRequireDefault(require("./src/types"));

var ops = _interopRequireWildcard(require("./src/operations"));

exports.ops = ops;

var _template = _interopRequireDefault(require("./src/template"));

var _SerializerValidation = _interopRequireDefault(require("./src/SerializerValidation"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }