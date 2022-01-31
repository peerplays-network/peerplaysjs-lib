'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
    Convert 12.34 with a precision of 3 into 12340

    @arg {number|string} number - Use strings for large numbers.
    @arg {number} precision - number of implied decimal places (usually causes right zero padding)
    @return {string} -
*/

var NumberUtils = {
  toImpliedDecimal: function toImpliedDecimal(number, precision) {
    if (typeof number === 'number') {
      (0, _assert2.default)(number <= 9007199254740991, 'overflow');
      number = '' + number;
    } else if (number.toString) {
      number = number.toString();
    }

    (0, _assert2.default)(typeof number === 'string', 'number should be an actual number or string: ' + (typeof number === 'undefined' ? 'undefined' : _typeof(number)));
    number = number.trim();
    (0, _assert2.default)(/^[0-9]*\.?[0-9]*$/.test(number), 'Invalid decimal number ' + number);

    var _number$split = number.split('.'),
        _number$split$ = _number$split[0],
        whole = _number$split$ === undefined ? '' : _number$split$,
        _number$split$2 = _number$split[1],
        decimal = _number$split$2 === undefined ? '' : _number$split$2;

    var padding = precision - decimal.length;
    (0, _assert2.default)(padding >= 0, 'Too many decimal digits in ' + number + ' to create an implied decimal of ' + precision);

    for (var i = 0; i < padding; i++) {
      decimal += '0';
    }

    while (whole.charAt(0) === '0') {
      whole = whole.substring(1);
    }

    return whole + decimal;
  }
};

exports.default = NumberUtils;
module.exports = exports.default;