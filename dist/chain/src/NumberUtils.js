"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

/**
    Convert 12.34 with a precision of 3 into 12340

    @arg {number|string} number - Use strings for large numbers.
    @arg {number} precision - number of implied decimal places (usually causes right zero padding)
    @return {string} -
*/
var NumberUtils = {
  toImpliedDecimal: function toImpliedDecimal(number, precision) {
    if (typeof number === 'number') {
      (0, _assert["default"])(number <= 9007199254740991, 'overflow');
      number = "".concat(number);
    } else if (number.toString) {
      number = number.toString();
    }

    (0, _assert["default"])(typeof number === 'string', "number should be an actual number or string: ".concat(_typeof(number)));
    number = number.trim();
    (0, _assert["default"])(/^[0-9]*\.?[0-9]*$/.test(number), "Invalid decimal number ".concat(number));

    var _number$split = number.split('.'),
        _number$split2 = _slicedToArray(_number$split, 2),
        _number$split2$ = _number$split2[0],
        whole = _number$split2$ === void 0 ? '' : _number$split2$,
        _number$split2$2 = _number$split2[1],
        decimal = _number$split2$2 === void 0 ? '' : _number$split2$2;

    var padding = precision - decimal.length;
    (0, _assert["default"])(padding >= 0, "Too many decimal digits in ".concat(number, " to create an implied decimal of ").concat(precision));

    for (var i = 0; i < padding; i++) {
      decimal += '0';
    }

    while (whole.charAt(0) === '0') {
      whole = whole.substring(1);
    }

    return whole + decimal;
  }
};
var _default = NumberUtils;
exports["default"] = _default;
module.exports = exports.default;