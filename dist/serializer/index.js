"use strict";

exports.__esModule = true;
exports.ops = void 0;

var _serializer = _interopRequireDefault(require("./src/serializer"));

exports.Serializer = _serializer["default"];

var _FastParser = _interopRequireDefault(require("./src/FastParser"));

exports.fp = _FastParser["default"];

var _types = _interopRequireDefault(require("./src/types"));

exports.types = _types["default"];

var ops = _interopRequireWildcard(require("./src/operations"));

exports.ops = ops;

var _template = _interopRequireDefault(require("./src/template"));

exports.template = _template["default"];

var _SerializerValidation = _interopRequireDefault(require("./src/SerializerValidation"));

exports.SerializerValidation = _SerializerValidation["default"];

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }