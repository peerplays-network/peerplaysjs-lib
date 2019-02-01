"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var assert = require("assert");

var _require = require("../../ecc"),
    Signature = _require.Signature,
    PublicKey = _require.PublicKey,
    hash = _require.hash;

var _require2 = require("../../serializer"),
    Serializer = _require2.Serializer,
    types = _require2.types;

var _require3 = require('peerplaysjs-ws'),
    Apis = _require3.Apis,
    ChainConfig = _require3.ChainConfig;

var ChainTypes = require('./ChainTypes');
var head_block_time_string = void 0;
var ByteBuffer = require('bytebuffer');
var secureRandom = require("secure-random");

var uint8 = types.uint8,
    uint16 = types.uint16,
    uint32 = types.uint32,
    int64 = types.int64,
    uint64 = types.uint64,
    string = types.string,
    bytes = types.bytes,
    bool = types.bool,
    array = types.array,
    fixed_array = types.fixed_array,
    protocol_id_type = types.protocol_id_type,
    object_id_type = types.object_id_type,
    vote_id = types.vote_id,
    future_extensions = types.future_extensions,
    static_variant = types.static_variant,
    map = types.map,
    set = types.set,
    public_key = types.public_key,
    address = types.address,
    time_point_sec = types.time_point_sec,
    optional = types.optional,
    variant = types.variant,
    variant_object = types.variant_object,
    enumeration = types.enumeration,
    sha256 = types.sha256;


var rock_paper_scissors_gesture = enumeration(["rock", "paper", "scissors", "spock", "lizard"]);

var rock_paper_scissors_throw = new Serializer("rock_paper_scissors_throw", { nonce1: uint64,
    nonce2: uint64,
    gesture: rock_paper_scissors_gesture });

var rock_paper_scissors_throw_commit = new Serializer("rock_paper_scissors_throw_commit", { nonce1: uint64,
    throw_hash: sha256 });

var rock_paper_scissors_throw_reveal = new Serializer("rock_paper_scissors_throw_reveal", { nonce2: uint64,
    gesture: rock_paper_scissors_gesture });

var GameMoves = function () {
    function GameMoves() {
        _classCallCheck(this, GameMoves);
    }

    _createClass(GameMoves, [{
        key: "createCommitAndRevealMoveOperations",
        value: function createCommitAndRevealMoveOperations(move_type) {
            var nonce1 = ByteBuffer.wrap(secureRandom.randomArray(8)).readUint64();
            var nonce2 = ByteBuffer.wrap(secureRandom.randomArray(8)).readUint64();

            var throw_object = rock_paper_scissors_throw.fromObject({
                nonce1: nonce1,
                nonce2: nonce2,
                gesture: move_type
            });
            var throw_object_reconstructed = rock_paper_scissors_throw.toObject(throw_object);
            //console.log("Nonce1: %o, Nonce2: %o", nonce1, nonce2);
            //console.log("As object: %O, as JS: %O", throw_object, throw_object_reconstructed);
            var throw_buffer = rock_paper_scissors_throw.toBuffer(throw_object);
            //console.log("As hex: %O", rock_paper_scissors_throw.toHex(throw_object));
            var throw_hash = hash.sha256(throw_buffer);
            //console.log("Hash is : %O", throw_hash);

            var commit_move_operation_object = rock_paper_scissors_throw_commit.fromObject({
                nonce1: nonce1,
                throw_hash: throw_hash
            });
            var reveal_move_operation_object = rock_paper_scissors_throw_reveal.fromObject({
                nonce2: nonce2,
                gesture: move_type
            });

            //console.log("Commit hex is %O, reveal hex is %O", rock_paper_scissors_throw_commit.toHex(commit_move_operation_object), rock_paper_scissors_throw_reveal.toHex(reveal_move_operation_object));

            var commit_move_operation = rock_paper_scissors_throw_commit.toObject(commit_move_operation_object);
            var reveal_move_operation = rock_paper_scissors_throw_reveal.toObject(reveal_move_operation_object);
            //console.log("As JS, they are %O, %O", commit_move_operation, reveal_move_operation);


            return [commit_move_operation, reveal_move_operation];
        }
    }]);

    return GameMoves;
}();

module.exports = GameMoves;