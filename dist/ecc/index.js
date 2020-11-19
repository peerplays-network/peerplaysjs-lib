"use strict";

exports.__esModule = true;
exports.hash = void 0;

var _address = _interopRequireDefault(require("./src/address"));

exports.Address = _address["default"];

var _aes = _interopRequireDefault(require("./src/aes"));

exports.Aes = _aes["default"];

var _PrivateKey = _interopRequireDefault(require("./src/PrivateKey"));

exports.PrivateKey = _PrivateKey["default"];

var _PublicKey = _interopRequireDefault(require("./src/PublicKey"));

exports.PublicKey = _PublicKey["default"];

var _signature = _interopRequireDefault(require("./src/signature"));

exports.Signature = _signature["default"];

var _BrainKey = _interopRequireDefault(require("./src/BrainKey"));

exports.brainKey = _BrainKey["default"];

var hash = _interopRequireWildcard(require("./src/hash"));

exports.hash = hash;

var _KeyUtils = _interopRequireDefault(require("./src/KeyUtils"));

exports.key = _KeyUtils["default"];

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }