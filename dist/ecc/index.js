"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Address", {
  enumerable: true,
  get: function get() {
    return _address["default"];
  }
});
Object.defineProperty(exports, "Aes", {
  enumerable: true,
  get: function get() {
    return _aes["default"];
  }
});
Object.defineProperty(exports, "PrivateKey", {
  enumerable: true,
  get: function get() {
    return _PrivateKey["default"];
  }
});
Object.defineProperty(exports, "PublicKey", {
  enumerable: true,
  get: function get() {
    return _PublicKey["default"];
  }
});
Object.defineProperty(exports, "Signature", {
  enumerable: true,
  get: function get() {
    return _signature["default"];
  }
});
Object.defineProperty(exports, "brainKey", {
  enumerable: true,
  get: function get() {
    return _BrainKey["default"];
  }
});
exports.hash = void 0;
Object.defineProperty(exports, "key", {
  enumerable: true,
  get: function get() {
    return _KeyUtils["default"];
  }
});

var _address = _interopRequireDefault(require("./src/address"));

var _aes = _interopRequireDefault(require("./src/aes"));

var _PrivateKey = _interopRequireDefault(require("./src/PrivateKey"));

var _PublicKey = _interopRequireDefault(require("./src/PublicKey"));

var _signature = _interopRequireDefault(require("./src/signature"));

var _BrainKey = _interopRequireDefault(require("./src/BrainKey"));

var hash = _interopRequireWildcard(require("./src/hash"));

exports.hash = hash;

var _KeyUtils = _interopRequireDefault(require("./src/KeyUtils"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }