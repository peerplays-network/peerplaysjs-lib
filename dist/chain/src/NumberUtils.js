"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var assert = require("assert");

/**
    Convert 12.34 with a precision of 3 into 12340
    
    @arg {number|string} number - Use strings for large numbers.  This may contain one decimal but no sign
    @arg {number} precision - number of implied decimal places (usually causes right zero padding)
    @return {string} -
*/
module.exports = {
    toImpliedDecimal: function toImpliedDecimal(number, precision) {

        if (typeof number === "number") {
            assert(number <= 9007199254740991, "overflow");
            number = "" + number;
        } else if (number.toString) number = number.toString();

        assert(typeof number === "string", "number should be an actual number or string: " + (typeof number === "undefined" ? "undefined" : _typeof(number)));
        number = number.trim();
        assert(/^[0-9]*\.?[0-9]*$/.test(number), "Invalid decimal number " + number);

        var _number$split = number.split("."),
            _number$split2 = _slicedToArray(_number$split, 2),
            _number$split2$ = _number$split2[0],
            whole = _number$split2$ === undefined ? "" : _number$split2$,
            _number$split2$2 = _number$split2[1],
            decimal = _number$split2$2 === undefined ? "" : _number$split2$2;

        var padding = precision - decimal.length;
        assert(padding >= 0, "Too many decimal digits in " + number + " to create an implied decimal of " + precision);

        for (var i = 0; i < padding; i++) {
            decimal += "0";
        }while (whole.charAt(0) === "0") {
            whole = whole.substring(1);
        }return whole + decimal;
    }
};