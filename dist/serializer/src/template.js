"use strict";

exports.__esModule = true;
exports["default"] = template;

/** Console print any transaction object with zero default values. */
function template(op) {
  var object = op.toObject(undefined, {
    use_default: true,
    annotate: true
  }); // visual (with descriptions)

  console.error(JSON.stringify(object, null, 4)); // usable in a copy-paste

  object = op.toObject(undefined, {
    use_default: true,
    annotate: false
  }); // copy-paste one-lineer

  console.error(JSON.stringify(object));
}