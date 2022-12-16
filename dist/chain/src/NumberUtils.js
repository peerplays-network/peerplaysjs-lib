"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
      number = "" + number;
    } else if (number.toString) {
      number = number.toString();
    }

    (0, _assert["default"])(typeof number === 'string', "number should be an actual number or string: " + typeof number);
    number = number.trim();
    (0, _assert["default"])(/^[0-9]*\.?[0-9]*$/.test(number), "Invalid decimal number " + number);

    var _number$split = number.split('.'),
        _number$split$ = _number$split[0],
        whole = _number$split$ === void 0 ? '' : _number$split$,
        _number$split$2 = _number$split[1],
        decimal = _number$split$2 === void 0 ? '' : _number$split$2;

    var padding = precision - decimal.length;
    (0, _assert["default"])(padding >= 0, "Too many decimal digits in " + number + " to create an implied decimal of " + precision);

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