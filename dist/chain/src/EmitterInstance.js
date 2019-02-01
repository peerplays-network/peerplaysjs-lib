"use strict";

var ee = require("event-emitter");

var _emitter;

module.exports = {
    emitter: function emitter() {
        if (!_emitter) {
            _emitter = ee({});
        }
        return _emitter;
    }
};