"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

/** Exception nesting.  */
var ErrorWithCause = /*#__PURE__*/function () {
  function ErrorWithCause(message, cause) {
    _classCallCheck(this, ErrorWithCause);

    this.message = message;

    if (typeof cause !== 'undefined' && cause !== null ? cause.message : undefined) {
      this.message = "cause\t".concat(cause.message, "\t").concat(this.message);
    }

    var stack = ''; // (new Error).stack

    if (typeof cause !== 'undefined' && cause !== null ? cause.stack : undefined) {
      stack = "caused by\n\t".concat(cause.stack, "\t").concat(stack);
    }

    this.stack = "".concat(this.message, "\n").concat(stack);
  }

  _createClass(ErrorWithCause, null, [{
    key: "throw",
    value: function _throw(message, cause) {
      var msg = message;

      if (typeof cause !== 'undefined' && cause !== null ? cause.message : undefined) {
        msg += "\t cause: ".concat(cause.message, " ");
      }

      if (typeof cause !== 'undefined' && cause !== null ? cause.stack : undefined) {
        msg += "\n stack: ".concat(cause.stack, " ");
      }

      throw new Error(msg);
    }
  }]);

  return ErrorWithCause;
}();

var _default = ErrorWithCause;
exports["default"] = _default;
module.exports = exports.default;