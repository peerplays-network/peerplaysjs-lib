"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _ws = require("../../ws");

var _ecc = require("../../ecc");

var _serializer = require("../../serializer");

var _ChainTypes = _interopRequireDefault(require("./ChainTypes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var TransactionBuilder = /*#__PURE__*/function () {
  function TransactionBuilder() {
    this.ref_block_num = 0;
    this.ref_block_prefix = 0;
    this.expiration = 0;
    this.operations = [];
    this.signatures = [];
    this.signer_private_keys = [];
    this.head_block_time_string = null;
    this.committee_min_review = null; // semi-private method bindings

    this._broadcast = this._broadcast.bind(this);
  }
  /**
        @arg {string} name - like "transfer"
        @arg {object} operation - JSON matchching the operation's format
    */


  var _proto = TransactionBuilder.prototype;

  _proto.add_type_operation = function add_type_operation(name, operation) {
    this.add_operation(this.get_type_operation(name, operation));
  }
  /**
        This does it all: set fees, finalize, sign, and broadcast (if wanted).
         @arg {ConfidentialWallet} cwallet - must be unlocked, used to gather signing keys
         @arg {array<string>} [signer_pubkeys = null] - Optional ["GPHAbc9Def0...", ...].  These are
        additional signing keys.  Some balance claims require propritary address formats, the
        witness node can't tell us which ones are needed so they must be passed in.  If the
        witness node can figure out a signing key (mostly all other transactions), it should
        not be passed in here.
         @arg {boolean} [broadcast = false]
    */
  ;

  _proto.process_transaction = function process_transaction(cwallet, signer_pubkeys, broadcast) {
    var _this = this;

    if (signer_pubkeys === void 0) {
      signer_pubkeys = null;
    }

    if (broadcast === void 0) {
      broadcast = false;
    }

    var wallet_object = cwallet.wallet.wallet_object;

    if (_ws.Apis.instance().chain_id !== wallet_object.get('chain_id')) {
      var wallet_chain_id = wallet_object.get('chain_id');

      var api_chain_id = _ws.Apis.instance().chain_id;

      var error = new Error("Mismatched chain_id; expecting " + wallet_chain_id + ", but got " + api_chain_id);
      return Promise.reject(error);
    }

    return this.set_required_fees().then(function () {
      var signer_pubkeys_added = {};

      if (signer_pubkeys) {
        // Balance claims are by address, only the private
        // key holder can know about these additional
        // potential keys.
        var pubkeys = cwallet.getPubkeys_having_PrivateKey(signer_pubkeys);

        if (!pubkeys.length) {
          throw new Error('Missing signing key');
        }

        var keys = Object.keys(pubkeys);

        for (var i = 0, len = keys.length; i < len; i++) {
          var pubkey_string = pubkeys[i];

          var _private_key = cwallet.getPrivateKey(pubkey_string);

          _this.add_signer(_private_key, pubkey_string);

          signer_pubkeys_added[pubkey_string] = true;
        }
      }

      return _this.get_potential_signatures().then(function (_ref) {
        var pubkeys = _ref.pubkeys,
            addys = _ref.addys;
        var my_pubkeys = cwallet.getPubkeys_having_PrivateKey(pubkeys, addys);
        return _this.get_required_signatures(my_pubkeys).then(function (required_pubkeys) {
          var keys = Object.keys(required_pubkeys);

          for (var _i = 0, _len = keys.length; _i < _len; _i++) {
            var _pubkey_string = keys[_i];

            if (!signer_pubkeys_added[_pubkey_string]) {
              var _private_key2 = cwallet.getPrivateKey(_pubkey_string); // This should not happen, get_required_signatures will only
              // returned keys from my_pubkeys


              if (!_private_key2) {
                throw new Error("Missing signing key for " + _pubkey_string);
              }

              _this.add_signer(_private_key2, _pubkey_string);
            }
          }
        });
      }).then(function () {
        return broadcast ? _this.broadcast() : _this.serialize();
      });
    });
  }
  /** Typically this is called automatically just prior to signing.
   * Once finalized this transaction can not be changed. */
  ;

  _proto.finalize = function finalize() {
    var _this2 = this;

    return new Promise(function (resolve) {
      if (_this2.tr_buffer) {
        throw new Error('already finalized');
      }

      resolve(_ws.Apis.instance().db_api().exec('get_objects', [['2.1.0']]).then(function (r) {
        _this2.head_block_time_string = r[0].time;

        if (_this2.expiration === 0) {
          _this2.expiration = _this2.base_expiration_sec() + _ws.ChainConfig.expire_in_secs;
        }

        _this2.ref_block_num = r[0].head_block_number & 0xffff; // eslint-disable-line

        _this2.ref_block_prefix = Buffer.from(r[0].head_block_id, 'hex').readUInt32LE(4); // DEBUG console.log("ref_block",@ref_block_num,@ref_block_prefix,r)

        var iterable = _this2.operations;

        for (var i = 0, len = iterable.length; i < len; i++) {
          var op = iterable[i];

          if (op[1].finalize) {
            op[1].finalize();
          }

          var _type = _serializer.ops.operation.st_operations[op[0]];

          var hexBuffer = _type.toBuffer(op[1]).toString('hex');

          console.log('Operation %s: %O => %s (%d bytes)', _type.operation_name, op[1], hexBuffer, hexBuffer.length / 2);
        }

        _this2.tr_buffer = _serializer.ops.transaction.toBuffer(_this2);
      }));
    });
  }
  /** @return {string} hex transaction ID */
  ;

  _proto.id = function id() {
    if (!this.tr_buffer) {
      throw new Error('not finalized');
    }

    return _ecc.hash.sha256(this.tr_buffer).toString('hex').substring(0, 40);
  }
  /**
        Typically one will use {@link this.add_type_operation} instead.
        @arg {array} operation - [operation_id, operation]
    */
  ;

  _proto.add_operation = function add_operation(operation) {
    if (this.tr_buffer) {
      throw new Error('already finalized');
    }

    (0, _assert["default"])(operation, 'operation');

    if (!Array.isArray(operation)) {
      throw new Error('Expecting array [operation_id, operation]');
    }

    this.operations.push(operation);
  };

  _proto.get_type_operation = function get_type_operation(name, operation) {
    if (this.tr_buffer) {
      throw new Error('already finalized');
    }

    (0, _assert["default"])(name, 'name');
    (0, _assert["default"])(operation, 'operation');
    var _type = _serializer.ops[name];
    (0, _assert["default"])(_type, "Unknown operation " + name);
    var operation_id = _ChainTypes["default"].operations[_type.operation_name];

    if (operation_id === undefined) {
      throw new Error("unknown operation: " + _type.operation_name);
    }

    if (!operation.fee) {
      operation.fee = {
        amount: 0,
        asset_id: 0
      };
    }

    if (name === 'proposal_create') {
      /*
            * Proposals involving the committee account require a review
            * period to be set, look for them here
            */
      var requiresReview = false;
      var extraReview = 0;
      operation.proposed_ops.forEach(function (op) {
        var COMMITTE_ACCOUNT = 0;
        var key;

        switch (op.op[0]) {
          case 0:
            // transfer
            key = 'from';
            break;

          case 6: // account_update

          case 17:
            // asset_settle
            key = 'account';
            break;

          case 10: // asset_create

          case 11: // asset_update

          case 12: // asset_update_bitasset

          case 13: // asset_update_feed_producers

          case 14: // asset_issue

          case 18: // asset_global_settle

          case 43:
            // asset_claim_fees
            key = 'issuer';
            break;

          case 15:
            // asset_reserve
            key = 'payer';
            break;

          case 16:
            // asset_fund_fee_pool
            key = 'from_account';
            break;

          case 22: // proposal_create

          case 23: // proposal_update

          case 24:
            // proposal_delete
            key = 'fee_paying_account';
            break;

          case 31:
            // committee_member_update_global_parameters
            requiresReview = true;
            extraReview = 60 * 60 * 24 * 13; // Make the review period 2 weeks total

            break;

          default:
            break;
        }

        if (key in op.op[1] && op.op[1][key] === COMMITTE_ACCOUNT) {
          requiresReview = true;
        }
      });

      if (!operation.expiration_time) {
        var experationTime = this.base_expiration_sec();
        operation.expiration_time = experationTime + _ws.ChainConfig.expire_in_secs_proposal;
      }

      if (requiresReview) {
        var one_day = 24 * 60 * 60; // One day in seconds

        var max = Math.max(this.commitee_min_review, one_day, _ws.ChainConfig.review_in_secs_committee);
        operation.review_period_seconds = extraReview + max;
        /*
                * Expiration time must be at least equal to
                * now + review_period_seconds, so we add one hour to make sure
                */

        operation.expiration_time += 60 * 60 + extraReview;
      }
    }

    var operation_instance = _type.fromObject(operation);

    return [operation_id, operation_instance];
  }
  /* optional: fetch the current head block */
  ;

  _proto.update_head_block = function update_head_block() {
    var _this3 = this;

    return _ws.Apis.instance().db_api().exec('get_objects', [['2.0.0', '2.1.0']]).then(function (res) {
      var g = res[0],
          r = res[1];
      _this3.head_block_time_string = r[0].time;
      _this3.committee_min_review = g[0].parameters.committee_proposal_review_period;
    });
  }
  /** optional: there is a deafult expiration */
  ;

  _proto.set_expire_seconds = function set_expire_seconds(sec) {
    if (this.tr_buffer) {
      throw new Error('already finalized');
    }

    this.expiration = this.base_expiration_sec() + sec;
    return this.expiration;
  }
  /* Wraps this transaction in a proposal_create transaction */
  ;

  _proto.propose = function propose(proposal_create_options) {
    if (this.tr_buffer) {
      throw new Error('already finalized');
    }

    if (!this.operations.length) {
      throw new Error('add operation first');
    }

    (0, _assert["default"])(proposal_create_options, 'proposal_create_options');
    (0, _assert["default"])(proposal_create_options.fee_paying_account, 'proposal_create_options.fee_paying_account');
    var proposed_ops = this.operations.map(function (op) {
      return {
        op: op
      };
    });
    this.operations = [];
    this.signatures = [];
    this.signer_private_keys = [];
    proposal_create_options.proposed_ops = proposed_ops;
    this.add_type_operation('proposal_create', proposal_create_options);
    return this;
  };

  _proto.has_proposed_operation = function has_proposed_operation() {
    var hasProposed = false;

    for (var i = 0; i < this.operations.length; i++) {
      if ('proposed_ops' in this.operations[i][1]) {
        hasProposed = true;
        break;
      }
    }

    return hasProposed;
  }
  /** optional: the fees can be obtained from the witness node */
  ;

  _proto.set_required_fees = function set_required_fees(asset_id) {
    var _this4 = this;

    var fee_pool;

    if (this.tr_buffer) {
      throw new Error('already finalized');
    }

    if (!this.operations.length) {
      throw new Error('add operations first');
    }

    var operations = [];

    for (var i = 0, len = this.operations.length; i < len; i++) {
      var op = this.operations[i];
      operations.push(_serializer.ops.operation.toObject(op));
    }

    if (!asset_id) {
      var op1_fee = operations[0][1].fee;

      if (op1_fee && op1_fee.asset_id !== null) {
        asset_id = op1_fee.asset_id;
      } else {
        asset_id = '1.3.0';
      }
    }

    var promises = [_ws.Apis.instance().db_api().exec('get_required_fees', [operations, asset_id])];

    if (asset_id !== '1.3.0') {
      // This handles the fallback to paying fees in BTS if the fee pool is empty.
      promises.push(_ws.Apis.instance().db_api().exec('get_required_fees', [operations, '1.3.0']));
      promises.push(_ws.Apis.instance().db_api().exec('get_objects', [[asset_id]]));
    }

    return Promise.all(promises).then(function (results) {
      var fees = results[0],
          coreFees = results[1],
          asset = results[2];
      asset = asset ? asset[0] : null;
      var dynamicPromise = asset_id !== '1.3.0' && asset ? _ws.Apis.instance().db_api().exec('get_objects', [[asset.dynamic_asset_data_id]]) : new Promise(function (resolve) {
        resolve();
      });
      return dynamicPromise.then(function (dynamicObject) {
        if (asset_id !== '1.3.0') {
          fee_pool = dynamicObject ? dynamicObject[0].fee_pool : 0;
          var totalFees = 0;

          for (var j = 0, fee; j < coreFees.length; j++) {
            fee = coreFees[j];
            totalFees += fee.amount;
          }

          if (totalFees > parseInt(fee_pool, 10)) {
            fees = coreFees;
            asset_id = '1.3.0';
          }
        } // Proposed transactions need to be flattened


        var flat_assets = [];

        var flatten = function flatten(obj) {
          if (Array.isArray(obj)) {
            for (var k = 0, _len2 = obj.length; k < _len2; k++) {
              var item = obj[k];
              flatten(item);
            }
          } else {
            flat_assets.push(obj);
          }
        };

        flatten(fees);
        var asset_index = 0;

        var set_fee = function set_fee(operation) {
          if (!operation.fee || operation.fee.amount === 0 || operation.fee.amount.toString && operation.fee.amount.toString() === '0' // Long
          ) {
              operation.fee = flat_assets[asset_index]; // console.log("new operation.fee", operation.fee)
            } else {// console.log("old operation.fee", operation.fee)
            }

          asset_index++;

          if (operation.proposed_ops) {
            var result = [];

            for (var y = 0; y < operation.proposed_ops.length; y++) {
              result.push(set_fee(operation.proposed_ops[y].op[1]));
            }

            return result;
          }
        };

        for (var _i2 = 0; _i2 < _this4.operations.length; _i2++) {
          set_fee(_this4.operations[_i2][1]);
        }
      }); // DEBUG console.log('... get_required_fees',operations,asset_id,flat_assets)
    });
  };

  _proto.get_potential_signatures = function get_potential_signatures() {
    var tr_object = _serializer.ops.signed_transaction.toObject(this);

    return Promise.all([_ws.Apis.instance().db_api().exec('get_potential_signatures', [tr_object]), _ws.Apis.instance().db_api().exec('get_potential_address_signatures', [tr_object])]).then(function (results) {
      return {
        pubkeys: results[0],
        addys: results[1]
      };
    });
  };

  _proto.get_required_signatures = function get_required_signatures(available_keys) {
    if (!available_keys.length) {
      return Promise.resolve([]);
    }

    var tr_object = _serializer.ops.signed_transaction.toObject(this); // DEBUG console.log('... tr_object',tr_object)


    return _ws.Apis.instance().db_api().exec('get_required_signatures', [tr_object, available_keys]).then(function (required_public_keys) {
      return required_public_keys;
    });
  };

  _proto.add_signer = function add_signer(private_key, public_key) {
    if (public_key === void 0) {
      public_key = private_key.toPublicKey();
    }

    (0, _assert["default"])(private_key.d, 'required PrivateKey object');

    if (this.signed) {
      throw new Error('already signed');
    }

    if (!public_key.Q) {
      public_key = _ecc.PublicKey.fromPublicKeyString(public_key);
    } // prevent duplicates


    var spHex = private_key.toHex();
    var keys = Object.keys(this.signer_private_keys);

    for (var i = 0, len = keys.length; i < len; i++) {
      var sp = this.signer_private_keys[keys[i]];

      if (sp[0].toHex() === spHex) {
        return;
      }
    }

    this.signer_private_keys.push([private_key, public_key]);
  };

  _proto.sign = function sign(chain_id) {
    if (chain_id === void 0) {
      chain_id = _ws.Apis.instance().chain_id;
    }

    if (!this.tr_buffer) {
      throw new Error('not finalized');
    }

    if (this.signed) {
      throw new Error('already signed');
    }

    if (!this.signer_private_keys.length) {
      throw new Error('Transaction was not signed. Do you have a private key? [no_signers]');
    }

    var end = this.signer_private_keys.length;

    for (var i = 0; end > 0 ? i < end : i > end; end > 0 ? i++ : i++) {
      var _this$signer_private_ = this.signer_private_keys[i],
          _private_key3 = _this$signer_private_[0],
          public_key = _this$signer_private_[1];

      var sig = _ecc.Signature.signBuffer(Buffer.concat([Buffer.from(chain_id, 'hex'), this.tr_buffer]), _private_key3, public_key);

      this.signatures.push(sig.toBuffer());
    }

    this.signer_private_keys = [];
    this.signed = true;
  };

  _proto.serialize = function serialize() {
    return _serializer.ops.signed_transaction.toObject(this);
  };

  _proto.toObject = function toObject() {
    return _serializer.ops.signed_transaction.toObject(this);
  };

  _proto.broadcast = function broadcast(was_broadcast_callback) {
    var _this5 = this;

    if (this.tr_buffer) {
      return this._broadcast(was_broadcast_callback);
    }

    return this.finalize().then(function () {
      return _this5._broadcast(was_broadcast_callback);
    });
  };

  _proto._broadcast = function _broadcast(was_broadcast_callback) {
    var _this6 = this;

    return new Promise(function (resolve, reject) {
      if (!_this6.signed) {
        _this6.sign();
      }

      if (!_this6.tr_buffer) {
        throw new Error('not finalized');
      }

      if (!_this6.signatures.length) {
        throw new Error('not signed');
      }

      if (!_this6.operations.length) {
        throw new Error('no operations');
      }

      var tr_object = _serializer.ops.signed_transaction.toObject(_this6); // console.log('... broadcast_transaction_with_callback !!!')


      _ws.Apis.instance().network_api().exec('broadcast_transaction_with_callback', [function (res) {
        return resolve(res);
      }, tr_object]).then(function () {
        // console.log('... broadcast success, waiting for callback')
        if (was_broadcast_callback) {
          was_broadcast_callback();
        }
      })["catch"](function (error) {
        // console.log may be redundant for network errors, other errors could occur
        console.log(error);
        var message = error.message;

        if (!message) {
          message = '';
        }

        reject(new Error(message + "\n" + 'peerplays-crypto ' + (" digest " + _ecc.hash.sha256(_this6.tr_buffer).toString('hex') + " transaction " + _this6.tr_buffer.toString('hex') + " " + JSON.stringify(tr_object))));
      });
    });
  };

  TransactionBuilder.timeStringToDate = function timeStringToDate(time_string) {
    if (!time_string) {
      time_string = '1970-01-01T00:00:00.000Z';
    }

    if (!/Z$/.test(time_string)) {
      // does not end in Z
      // https://github.com/cryptonomex/graphene/issues/368
      time_string += 'Z';
    }

    return new Date(time_string);
  };

  _proto.getHeadBlockDate = function getHeadBlockDate() {
    return TransactionBuilder.timeStringToDate(this.head_block_time_string);
  };

  _proto.base_expiration_sec = function base_expiration_sec() {
    var head_block_sec = Math.ceil(this.getHeadBlockDate().getTime() / 1000);
    var now_sec = Math.ceil(Date.now() / 1000); // The head block time should be updated every 3 seconds.  If it isn't
    // then help the transaction to expire (use head_block_sec)

    if (now_sec - head_block_sec > 30) {
      return head_block_sec;
    } // If the user's clock is very far behind, use the head block time.


    return Math.max(now_sec, head_block_sec);
  };

  return TransactionBuilder;
}();

var _default = TransactionBuilder;
exports["default"] = _default;
module.exports = exports.default;