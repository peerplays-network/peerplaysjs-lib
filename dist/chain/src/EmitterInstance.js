"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _eventEmitter = _interopRequireDefault(require("event-emitter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _emitter;

var _default = {
  emitter: function emitter() {
    if (!_emitter) {
      _emitter = (0, _eventEmitter["default"])({});
    }

    return _emitter;
  }
};
exports["default"] = _default;
module.exports = exports.default;