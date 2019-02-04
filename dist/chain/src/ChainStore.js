"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Immutable = require("immutable");

var _require = require("peerplaysjs-ws"),
    Apis = _require.Apis;

var _require2 = require("./ChainTypes"),
    object_type = _require2.object_type,
    impl_object_type = _require2.impl_object_type;

var ChainValidation = require("./ChainValidation");
var BigInteger = require("bigi");
var ee = require("./EmitterInstance");

var emitter = ee.emitter();

var op_history = parseInt(object_type.operation_history, 10);
var limit_order = parseInt(object_type.limit_order, 10);
var call_order = parseInt(object_type.call_order, 10);
var proposal = parseInt(object_type.proposal, 10);
var balance_type = parseInt(object_type.balance, 10);
var vesting_balance_type = parseInt(object_type.vesting_balance, 10);
var witness_object_type = parseInt(object_type.witness, 10);
var worker_object_type = parseInt(object_type.worker, 10);
var committee_member_object_type = parseInt(object_type.committee_member, 10);
var account_object_type = parseInt(object_type.account, 10);
var asset_object_type = parseInt(object_type.asset, 10);
var tournament_object_type = parseInt(object_type.tournament, 10);
var tournament_details_object_type = parseInt(object_type.tournament_details, 10);

var order_prefix = "1." + limit_order + ".";
var call_order_prefix = "1." + call_order + ".";
var proposal_prefix = "1." + proposal + ".";
var balance_prefix = "2." + parseInt(impl_object_type.account_balance, 10) + ".";
var account_stats_prefix = "2." + parseInt(impl_object_type.account_statistics, 10) + ".";
var asset_dynamic_data_prefix = "2." + parseInt(impl_object_type.asset_dynamic_data, 10) + ".";
var bitasset_data_prefix = "2." + parseInt(impl_object_type.asset_bitasset_data, 10) + ".";
var vesting_balance_prefix = "1." + vesting_balance_type + ".";
var witness_prefix = "1." + witness_object_type + ".";
var worker_prefix = "1." + worker_object_type + ".";
var committee_prefix = "1." + committee_member_object_type + ".";
var asset_prefix = "1." + asset_object_type + ".";
var account_prefix = "1." + account_object_type + ".";
var tournament_prefix = "1." + tournament_object_type + ".";
var tournament_details_prefix = "1." + tournament_details_object_type + ".";

// count last operations should be stored in memory
var operations_stack_size = 100;
// count last blocks should be stored in memory
var block_stack_size = 20;

var DEBUG = JSON.parse(process.env.npm_config__graphene_chain_chain_debug || false);

/**
 *  @brief maintains a local cache of blockchain state
 *
 *  The ChainStore maintains a local cache of blockchain state and exposes
 *  an API that makes it easy to query objects and receive updates when
 *  objects are available.
 */

var ChainStore = function () {
	function ChainStore() {
		_classCallCheck(this, ChainStore);

		/** tracks everyone who wants to receive updates when the cache changes */
		this.subscribers = new Set();
		this.subscribed = false;
		this.clearCache();
		this.progress = 0;
		// this.chain_time_offset is used to estimate the blockchain time
		this.chain_time_offset = [];
		this.dispatchFrequency = 40;
	}

	/**
  * Clears all cached state.  This should be called any time the network connection is
  * reset.
  */


	_createClass(ChainStore, [{
		key: "clearCache",
		value: function clearCache() {
			this.objects_by_id = Immutable.Map();
			this.accounts_by_name = Immutable.Map();
			this.assets_by_symbol = Immutable.Map();
			this.account_ids_by_key = Immutable.Map();
			this.balance_objects_by_address = Immutable.Map();
			this.get_account_refs_of_keys_calls = Immutable.Set();
			this.account_history_requests = new Map(); ///< tracks pending history requests
			this.witness_by_account_id = new Map();
			this.witnesses = Immutable.Set();
			this.account_by_witness_id = new Map();
			this.committee_by_account_id = new Map();
			this.objects_by_vote_id = new Map();
			this.fetching_get_full_accounts = new Map();
			this.recent_operations = Immutable.List();
			this.recent_blocks = Immutable.List();
			this.recent_blocks_by_id = Immutable.Map();
			this.last_processed_block = null;
			this.simple_objects_by_id = Immutable.Map();

			// tournament_ids_by_state is a
			//   Map(account => Map(state_string => Set of tournament ids))
			// it maintains a map of tournaments a given account is allowed to participate
			// in (open-registration tournaments or tournaments they are whitelisted for).
			// the null account maps to all tournaments
			// accounts and states will not be tracked until their first access
			this.tournament_ids_by_state = Immutable.Map().set(null, new Immutable.Map());

			// registered_tournaments_details_by_player is a map of
			//   Map(registered_account_id => Set of tournament details objects)
			// it only tracks tournaments which the account has registered to play in
			this.registered_tournament_ids_by_player = Immutable.Map();

			this.last_tournament_id = undefined;

			this.store_initialized = false;
		}
	}, {
		key: "resetCache",
		value: function resetCache() {
			this.subscribed = false;
			this.clearCache();
			this.head_block_time_string = null;
			this.init().then(function (result) {
				console.log("resetCache init success");
			}).catch(function (err) {
				console.log("resetCache init error:", err);
			});
		}
	}, {
		key: "setDispatchFrequency",
		value: function setDispatchFrequency(freq) {
			this.dispatchFrequency = freq;
		}
	}, {
		key: "init",
		value: function init() {
			var _this = this;

			var reconnectCounter = 0;
			var _init = function _init(resolve, reject) {
				var db_api = Apis.instance().db_api();
				if (!db_api) {
					return reject(new Error("Api not found, please initialize the api instance before calling the ChainStore"));
				}
				return db_api.exec("get_objects", [["2.1.0"]]).then(function (optional_objects) {
					//if(DEBUG) console.log('... optional_objects',optional_objects ? optional_objects[0].id : null)
					for (var i = 0; i < optional_objects.length; i++) {
						var optional_object = optional_objects[i];
						if (optional_object) {

							_this._updateObject(optional_object, true);

							var head_time = new Date(optional_object.time + "+00:00").getTime();
							_this.head_block_time_string = optional_object.time;
							_this.chain_time_offset.push(new Date().getTime() - _this.timeStringToDate(optional_object.time).getTime());
							var now = new Date().getTime();
							var delta = (now - head_time) / 1000;
							var start = Date.parse('Sep 1, 2015');
							var progress_delta = head_time - start;
							_this.progress = progress_delta / (now - start);

							if (delta < 60) {
								Apis.instance().db_api().exec("set_subscribe_callback", [_this.onUpdate.bind(_this), true]).then(function (v) {
									console.log("synced and subscribed, chainstore ready");
									_this.subscribed = true;
									_this.fetchRecentOperations();
									resolve();
								}).catch(function (error) {
									reject(error);
									console.log("Error: ", error);
								});
							} else {
								console.log("not yet synced, retrying in 1s");
								reconnectCounter++;
								if (reconnectCounter > 10) {
									throw new Error("ChainStore sync error, please check your system clock");
								}
								setTimeout(_init.bind(_this, resolve, reject), 1000);
							}
						} else {
							setTimeout(_init.bind(_this, resolve, reject), 1000);
						}
					}
				}).catch(function (error) {
					// in the event of an error clear the pending state for id
					console.log('!!! Chain API error', error);
					_this.objects_by_id = _this.objects_by_id.delete("2.1.0");
					reject(error);
				});
			};

			return new Promise(function (resolve, reject) {
				return _init(resolve, reject);
			});
		}
	}, {
		key: "onUpdate",
		value: function onUpdate(updated_objects) /// map from account id to objects
		{
			emitter.emit('heartbeat');
			// updated_objects is the parameter list, it should always be exactly
			// one element long.
			// The single parameter to this callback function is a vector of variants, where
			// each entry indicates one changed object.
			// If the entry is an object id, it means the object has been removed.  If it
			// is an full object, then the object is either newly-created or changed.
			for (var a = 0; a < updated_objects.length; ++a) {
				for (var i = 0; i < updated_objects[a].length; ++i) {
					var obj = updated_objects[a][i];

					if (ChainValidation.is_object_id(obj)) {
						/// the object was removed
						// Cancelled limit order, emit event for MarketStore to update it's state
						if (obj.search(order_prefix) == 0) {
							var old_obj = this.objects_by_id.get(obj);
							if (!old_obj) {
								return;
							}
							emitter.emit('cancel-order', old_obj.get("id"));
							var account = this.objects_by_id.get(old_obj.get("seller"));
							if (account && account.has("orders")) {
								var limit_orders = account.get("orders");
								if (account.get("orders").has(obj)) {
									account = account.set("orders", limit_orders.delete(obj));
									this.objects_by_id = this.objects_by_id.set(account.get("id"), account);
								}
							}
						}

						// Update nested call_order inside account object
						if (obj.search(call_order_prefix) == 0) {

							var _old_obj = this.objects_by_id.get(obj);
							if (!_old_obj) {
								return;
							}
							emitter.emit('close-call', _old_obj.get("id"));
							var _account = this.objects_by_id.get(_old_obj.get("borrower"));
							if (_account && _account.has("call_orders")) {
								var call_orders = _account.get("call_orders");
								if (_account.get("call_orders").has(obj)) {
									_account = _account.set("call_orders", call_orders.delete(obj));
									this.objects_by_id = this.objects_by_id.set(_account.get("id"), _account);
								}
							}
						}

						// Remove the object
						this.objects_by_id = this.objects_by_id.set(obj, null);
					} else this._updateObject(obj, false);
				}
			}
			this.notifySubscribers();
		}
	}, {
		key: "notifySubscribers",
		value: function notifySubscribers() {
			var _this2 = this;

			// Dispatch at most only once every x milliseconds
			if (!this.dispatched) {
				this.dispatched = true;
				setTimeout(function () {
					_this2.dispatched = false;
					_this2.subscribers.forEach(function (callback) {
						callback();
					});
				}, this.dispatchFrequency);
			}
		}

		/**
   *  Add a callback that will be called anytime any object in the cache is updated
   */

	}, {
		key: "subscribe",
		value: function subscribe(callback) {
			if (this.subscribers.has(callback)) console.error("Subscribe callback already exists", callback);
			this.subscribers.add(callback);
		}

		/**
   *  Remove a callback that was previously added via subscribe
   */

	}, {
		key: "unsubscribe",
		value: function unsubscribe(callback) {
			if (!this.subscribers.has(callback)) console.error("Unsubscribe callback does not exists", callback);
			this.subscribers.delete(callback);
		}

		/** Clear an object from the cache to force it to be fetched again. This may
   * be useful if a query failed the first time and the wallet has reason to believe
   * it may succeede the second time.
   */

	}, {
		key: "clearObjectCache",
		value: function clearObjectCache(id) {
			this.objects_by_id = this.objects_by_id.delete(id);
		}

		/**
   * There are three states an object id could be in:
   *
   * 1. undefined       - returned if a query is pending
   * 3. defined         - return an object
   * 4. null            - query return null
   *
   */

	}, {
		key: "getObject",
		value: function getObject(id) {
			var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			if (!ChainValidation.is_object_id(id)) throw Error("argument is not an object id: " + JSON.stringify(id));

			var result = this.objects_by_id.get(id);
			if (result === undefined || force) return this.fetchObject(id, force);
			if (result === true) return undefined;

			return result;
		}
	}, {
		key: "getSimpleObjectById",
		value: function getSimpleObjectById(id) {
			var _this3 = this;

			return new Promise(function (success, fail) {
				if (!ChainValidation.is_object_id(id)) fail("argument is not an object id: " + JSON.stringify(id));

				var result = _this3.simple_objects_by_id.get(id);

				if (result) {
					return success(result);
				}
				Apis.instance().db_api().exec("get_objects", [[id]]).then(function (objects) {
					var object = objects[0];
					if (!object) return success(null);
					_this3.simple_objects_by_id = _this3.simple_objects_by_id.set(id, object);
					success(object);
				});
			});
		}

		/**
   *  @return undefined if a query is pending
   *  @return null if id_or_symbol has been queired and does not exist
   *  @return object if the id_or_symbol exists
   */

	}, {
		key: "getAsset",
		value: function getAsset(id_or_symbol) {
			var _this4 = this;

			if (!id_or_symbol) return null;

			if (ChainValidation.is_object_id(id_or_symbol)) {
				var asset = this.getObject(id_or_symbol);

				if (asset && asset.get("bitasset") && !asset.getIn(["bitasset", "current_feed"])) {
					return undefined;
				}
				return asset;
			}

			/// TODO: verify id_or_symbol is a valid symbol name

			var asset_id = this.assets_by_symbol.get(id_or_symbol);

			if (ChainValidation.is_object_id(asset_id)) {
				var _asset = this.getObject(asset_id);

				if (_asset && _asset.get("bitasset") && !_asset.getIn(["bitasset", "current_feed"])) {
					return undefined;
				}
				return _asset;
			}

			if (asset_id === null) return null;

			if (asset_id === true) return undefined;

			Apis.instance().db_api().exec("lookup_asset_symbols", [[id_or_symbol]]).then(function (asset_objects) {
				// console.log( "lookup symbol ", id_or_symbol )
				if (asset_objects.length && asset_objects[0]) _this4._updateObject(asset_objects[0], true);else {
					_this4.assets_by_symbol = _this4.assets_by_symbol.set(id_or_symbol, null);
					_this4.notifySubscribers();
				}
			}).catch(function (error) {
				console.log("Error: ", error);
				_this4.assets_by_symbol = _this4.assets_by_symbol.delete(id_or_symbol);
			});

			return undefined;
		}

		/**
   *  @param the public key to find accounts that reference it
   *
   *  @return Set of account ids that reference the given key
   *  @return a empty Set if no items are found
   *  @return undefined if the result is unknown
   *
   *  If this method returns undefined, then it will send a request to
   *  the server for the current set of accounts after which the
   *  server will notify us of any accounts that reference these keys
   */

	}, {
		key: "getAccountRefsOfKey",
		value: function getAccountRefsOfKey(key) {
			var _this5 = this;

			if (this.get_account_refs_of_keys_calls.has(key)) return this.account_ids_by_key.get(key);else {
				this.get_account_refs_of_keys_calls = this.get_account_refs_of_keys_calls.add(key);
				Apis.instance().db_api().exec("get_key_references", [[key]]).then(function (vec_account_id) {
					var refs = Immutable.Set();
					vec_account_id = vec_account_id[0];
					refs = refs.withMutations(function (r) {
						for (var i = 0; i < vec_account_id.length; ++i) {
							r.add(vec_account_id[i]);
						}
					});
					_this5.account_ids_by_key = _this5.account_ids_by_key.set(key, refs);
					_this5.notifySubscribers();
				}, function (error) {
					_this5.account_ids_by_key = _this5.account_ids_by_key.delete(key);
					_this5.get_account_refs_of_keys_calls = _this5.get_account_refs_of_keys_calls.delete(key);
				});
				return undefined;
			}
			return undefined;
		}

		/**
   * @return a Set of balance ids that are claimable with the given address
   * @return undefined if a query is pending and the set is not known at this time
   * @return a empty Set if no items are found
   *
   * If this method returns undefined, then it will send a request to the server for
   * the current state after which it will be subscribed to changes to this set.
   */

	}, {
		key: "getBalanceObjects",
		value: function getBalanceObjects(address) {
			var _this6 = this;

			var current = this.balance_objects_by_address.get(address);
			if (current === undefined) {
				/** because balance objects are simply part of the genesis state, there is no need to worry about
     * having to update them / merge them or index them in updateObject.
     */
				this.balance_objects_by_address = this.balance_objects_by_address.set(address, Immutable.Set());
				Apis.instance().db_api().exec("get_balance_objects", [[address]]).then(function (balance_objects) {
					var set = new Set();
					for (var i = 0; i < balance_objects.length; ++i) {
						_this6._updateObject(balance_objects[i]);
						set.add(balance_objects[i].id);
					}
					_this6.balance_objects_by_address = _this6.balance_objects_by_address.set(address, Immutable.Set(set));
					_this6.notifySubscribers();
				}, function (error) {
					_this6.balance_objects_by_address = _this6.balance_objects_by_address.delete(address);
				});
			}
			return this.balance_objects_by_address.get(address);
		}

		/**
   * @return a list of tournament ids for upcoming tournaments
   * @return an empty list if a query is pending and the set is not known at this time
   *         or if there are no upcoming touraments
   *
   * If we have not yet requested tournaments for this account, it will send a request to the server for
   * the current list, after which it will be subscribed to changes to this set.
   */

	}, {
		key: "getTournamentIdsInState",
		value: function getTournamentIdsInState(accountId, stateString) {
			var _this7 = this;

			var tournamentIdsForThisAccountAndState = undefined;
			var tournamentIdsForThisAccount = this.tournament_ids_by_state.get(accountId);
			if (tournamentIdsForThisAccount === undefined) {
				tournamentIdsForThisAccountAndState = new Immutable.Set();
				tournamentIdsForThisAccount = new Immutable.Map().set(stateString, tournamentIdsForThisAccountAndState);
				this.tournament_ids_by_state = this.tournament_ids_by_state.set(accountId, tournamentIdsForThisAccount);
			} else {
				tournamentIdsForThisAccountAndState = tournamentIdsForThisAccount.get(stateString);
				if (tournamentIdsForThisAccountAndState !== undefined) return tournamentIdsForThisAccountAndState;

				tournamentIdsForThisAccountAndState = new Immutable.Set();
				tournamentIdsForThisAccount = tournamentIdsForThisAccount.set(stateString, tournamentIdsForThisAccountAndState);
				this.tournament_ids_by_state = this.tournament_ids_by_state.set(accountId, tournamentIdsForThisAccount);
			}

			Apis.instance().db_api().exec("get_tournaments_in_state", [stateString, 100]).then(function (tournaments) {
				var originalTournamentIdsInState = _this7.tournament_ids_by_state.getIn([accountId, stateString]);
				// call updateObject on each tournament, which will classify it
				tournaments.forEach(function (tournament) {
					/**
      * Fix bug: we cant update tournament_ids_by_state if objects_by_id has a tournament
      */
					if (!originalTournamentIdsInState.get(tournament.id)) {
						_this7.clearObjectCache(tournament.id);
					}

					_this7._updateObject(tournament, false); // false = don't notify on change
				});
				if (_this7.tournament_ids_by_state.getIn([accountId, stateString]) != originalTournamentIdsInState) _this7.notifySubscribers();
			});
			return tournamentIdsForThisAccountAndState;
		}
	}, {
		key: "getRegisteredTournamentIds",
		value: function getRegisteredTournamentIds(accountId) {
			var _this8 = this;

			var tournamentIds = this.registered_tournament_ids_by_player.get(accountId);
			if (tournamentIds !== undefined) return tournamentIds;
			tournamentIds = new Immutable.Set();
			this.registered_tournament_ids_by_player = this.registered_tournament_ids_by_player.set(accountId, tournamentIds);

			Apis.instance().db_api().exec("get_registered_tournaments", [accountId, 100]).then(function (tournamentIds) {
				var originalTournamentIds = _this8.registered_tournament_ids_by_player.get(accountId);
				var newTournamentIds = new Immutable.Set(tournamentIds);
				if (!originalTournamentIds.equals(newTournamentIds)) {
					_this8.registered_tournament_ids_by_player = _this8.registered_tournament_ids_by_player.set(accountId, newTournamentIds);
					_this8.notifySubscribers();
				}
			});

			return tournamentIds;
		}

		/**
   *  If there is not already a pending request to fetch this object, a new
   *  request will be made.
   *
   *  @return null if the object does not exist,
   *  @return undefined if the object might exist but is not in cache
   *  @return the object if it does exist and is in our cache
   */

	}, {
		key: "fetchObject",
		value: function fetchObject(id) {
			var _this9 = this;

			var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			if (typeof id !== 'string') {
				var _result = [];
				for (var i = 0; i < id.length; ++i) {
					_result.push(this.fetchObject(id[i]));
				}return _result;
			}

			if (DEBUG) console.log("!!! fetchObject: ", id, this.subscribed, !this.subscribed && !force);
			if (!this.subscribed && !force) return undefined;

			if (DEBUG) console.log("maybe fetch object: ", id);
			if (!ChainValidation.is_object_id(id)) throw Error("argument is not an object id: " + id);

			if (id.substring(0, 4) == "1.2.") return this.fetchFullAccount(id);

			var result = this.objects_by_id.get(id);
			if (result === undefined) {
				// the fetch
				if (DEBUG) console.log("fetching object: ", id);
				this.objects_by_id = this.objects_by_id.set(id, true);
				Apis.instance().db_api().exec("get_objects", [[id]]).then(function (optional_objects) {
					if (DEBUG) console.log('... optional_objects', optional_objects ? optional_objects[0].id : null);
					for (var _i = 0; _i < optional_objects.length; _i++) {
						var optional_object = optional_objects[_i];
						if (optional_object) {
							_this9._updateObject(optional_object, true);
							_this9.simple_objects_by_id = _this9.simple_objects_by_id.set(id, optional_object);
						} else {
							_this9.objects_by_id = _this9.objects_by_id.set(id, null);
							_this9.notifySubscribers();
						}
					}
				}).catch(function (error) {
					// in the event of an error clear the pending state for id
					console.log('!!! Chain API error', error);
					_this9.objects_by_id = _this9.objects_by_id.delete(id);
				});
			} else if (result === true) // then we are waiting a response
				return undefined;
			return result; // we have a response, return it
		}

		/**
   *  @return null if no such account exists
   *  @return undefined if such an account may exist, and fetch the the full account if not already pending
   *  @return the account object if it does exist
   */

	}, {
		key: "getAccount",
		value: function getAccount(name_or_id) {

			if (!name_or_id) return null;

			if ((typeof name_or_id === "undefined" ? "undefined" : _typeof(name_or_id)) === 'object') {
				if (name_or_id.id) return this.getAccount(name_or_id.id);else if (name_or_id.get) return this.getAccount(name_or_id.get('id'));else return undefined;
			}

			if (ChainValidation.is_object_id(name_or_id)) {
				var account = this.getObject(name_or_id);
				if (account === null) {
					return null;
				}
				if (account === undefined || account.get('name') === undefined) {
					return this.fetchFullAccount(name_or_id);
				}
				return account;
			} else if (ChainValidation.is_account_name(name_or_id, true)) {
				var account_id = this.accounts_by_name.get(name_or_id);
				if (account_id === null) return null; // already fetched and it wasn't found
				if (account_id === undefined) // then no query, fetch it
					return this.fetchFullAccount(name_or_id);
				return this.getObject(account_id); // return it
			}
			//throw Error( `Argument is not an account name or id: ${name_or_id}` )
		}

		/**
   * This method will attempt to lookup witness by account_id.
   * If witness doesn't exist it will return null, if witness is found it will return witness object,
   * if it's not fetched yet it will return undefined.
   * @param account_id - account id
   */

	}, {
		key: "getWitnessById",
		value: function getWitnessById(account_id) {
			var witness_id = this.witness_by_account_id.get(account_id);
			if (witness_id === undefined) {
				this.fetchWitnessByAccount(account_id);
				return undefined;
			}
			return witness_id ? this.getObject(witness_id) : null;
		}

		/**
   * This method will attempt to lookup witness by account_id.
   * If witness doesn't exist it will return null, if witness is found it will return witness object,
   * if it's not fetched yet it will return undefined.
   * @param witness_id - witness id
   */

	}, {
		key: "getWitnessAccount",
		value: function getWitnessAccount(witness_id) {
			var _this10 = this;

			return new Promise(function (success, fail) {
				var account = _this10.account_by_witness_id.get(witness_id);

				if (account) return success(account);

				_this10.getSimpleObjectById(witness_id).then(function (witness) {
					_this10.getSimpleObjectById(witness.witness_account).then(function (account) {
						_this10.account_by_witness_id = _this10.account_by_witness_id.set(witness_id, account);
						success(account);
					});
				});
			});
		}

		/**
   * This method will attempt to lookup committee member by account_id.
   * If committee member doesn't exist it will return null, if committee member is found it will return committee member object,
   * if it's not fetched yet it will return undefined.
   * @param account_id - account id
   */

	}, {
		key: "getCommitteeMemberById",
		value: function getCommitteeMemberById(account_id) {
			var cm_id = this.committee_by_account_id.get(account_id);
			if (cm_id === undefined) {
				this.fetchCommitteeMemberByAccount(account_id);
				return undefined;
			}
			return cm_id ? this.getObject(cm_id) : null;
		}

		/**
   * Obsolete! Please use getWitnessById
   * This method will attempt to lookup the account, and then query to see whether or not there is
   * a witness for this account.  If the answer is known, it will return the witness_object, otherwise
   * it will attempt to look it up and return null.   Once the lookup has completed on_update will
   * be called.
   *
   * @param id_or_account may either be an account_id, a witness_id, or an account_name
   */

	}, {
		key: "getWitness",
		value: function getWitness(id_or_account) {
			var _this11 = this;

			var account = this.getAccount(id_or_account);
			if (!account) return null;
			var account_id = account.get('id');

			var witness_id = this.witness_by_account_id.get(account_id);
			if (witness_id === undefined) this.fetchWitnessByAccount(account_id);
			return this.getObject(witness_id);

			if (ChainValidation.is_account_name(id_or_account, true) || id_or_account.substring(0, 4) == "1.2.") {
				var _account2 = this.getAccount(id_or_account);
				if (!_account2) {
					this.lookupAccountByName(id_or_account).then(function (account) {
						if (!account) return null;

						var account_id = account.get('id');
						var witness_id = _this11.witness_by_account_id.get(account_id);
						if (ChainValidation.is_object_id(witness_id)) return _this11.getObject(witness_id, on_update);

						if (witness_id == undefined) _this11.fetchWitnessByAccount(account_id).then(function (witness) {
							_this11.witness_by_account_id.set(account_id, witness ? witness.get('id') : null);
							if (witness && on_update) on_update();
						});
					}, function (error) {
						var witness_id = _this11.witness_by_account_id.set(id_or_account, null);
					});
				} else {
					var _account_id = _account2.get('id');
					var _witness_id = this.witness_by_account_id.get(_account_id);
					if (ChainValidation.is_object_id(_witness_id)) return this.getObject(_witness_id, on_update);

					if (_witness_id == undefined) this.fetchWitnessByAccount(_account_id).then(function (witness) {
						_this11.witness_by_account_id.set(_account_id, witness ? witness.get('id') : null);
						if (witness && on_update) on_update();
					});
				}
				return null;
			}
			return null;
		}

		// Obsolete! Please use getCommitteeMemberById

	}, {
		key: "getCommitteeMember",
		value: function getCommitteeMember(id_or_account) {
			var _this12 = this;

			var on_update = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			if (ChainValidation.is_account_name(id_or_account, true) || id_or_account.substring(0, 4) == "1.2.") {
				var account = this.getAccount(id_or_account);

				if (!account) {
					this.lookupAccountByName(id_or_account).then(function (account) {
						var account_id = account.get('id');
						var committee_id = _this12.committee_by_account_id.get(account_id);
						if (ChainValidation.is_object_id(committee_id)) return _this12.getObject(committee_id, on_update);

						if (committee_id == undefined) {
							_this12.fetchCommitteeMemberByAccount(account_id).then(function (committee) {
								_this12.committee_by_account_id.set(account_id, committee ? committee.get('id') : null);
								if (on_update && committee) on_update();
							});
						}
					}, function (error) {
						var witness_id = _this12.committee_by_account_id.set(id_or_account, null);
					});
				} else {
					var account_id = account.get('id');
					var committee_id = this.committee_by_account_id.get(account_id);
					if (ChainValidation.is_object_id(committee_id)) return this.getObject(committee_id, on_update);

					if (committee_id == undefined) {
						this.fetchCommitteeMemberByAccount(account_id).then(function (committee) {
							_this12.committee_by_account_id.set(account_id, committee ? committee.get('id') : null);
							if (on_update && committee) on_update();
						});
					}
				}
			}
			return null;
		}

		/**
    *
   * @returns a promise with a list of all witness ids. Regardless of if they have been voted in or not.
   * @memberof ChainStore
   */

	}, {
		key: "fetchWitnessAccounts",
		value: function fetchWitnessAccounts() {
			var _this13 = this;

			return new Promise(function (resolve, reject) {
				Apis.instance().db_api().exec("lookup_witness_accounts", [0, 1000]).then(function (w) {
					if (w) {
						var witnessArr = [];

						for (var i = 0, length = w.length; i < length; i++) {
							witnessArr.push(w[i][1]); // ids only
						}

						_this13.witnesses = _this13.witnesses.merge(witnessArr);
						_this13._updateObject(witnessArr, true);
						resolve(_this13.witnesses);
					} else {
						resolve(null);
					}
				});
			});
		}

		/**
   *
   * @return a promise with the witness object
   */

	}, {
		key: "fetchWitnessByAccount",
		value: function fetchWitnessByAccount(account_id) {
			var _this14 = this;

			return new Promise(function (resolve, reject) {
				Apis.instance().db_api().exec("get_witness_by_account", [account_id]).then(function (optional_witness_object) {
					if (optional_witness_object) {
						_this14.witness_by_account_id = _this14.witness_by_account_id.set(optional_witness_object.witness_account, optional_witness_object.id);
						var witness_object = _this14._updateObject(optional_witness_object, true);
						resolve(witness_object);
					} else {
						_this14.witness_by_account_id = _this14.witness_by_account_id.set(account_id, null);
						_this14.notifySubscribers();
						resolve(null);
					}
				}, reject);
			});
		}

		/**
   *
   * @return a promise with the witness object
   */

	}, {
		key: "fetchCommitteeMemberByAccount",
		value: function fetchCommitteeMemberByAccount(account_id) {
			var _this15 = this;

			return new Promise(function (resolve, reject) {
				Apis.instance().db_api().exec("get_committee_member_by_account", [account_id]).then(function (optional_committee_object) {
					if (optional_committee_object) {
						_this15.committee_by_account_id = _this15.committee_by_account_id.set(optional_committee_object.committee_member_account, optional_committee_object.id);
						var committee_object = _this15._updateObject(optional_committee_object, true);
						resolve(committee_object);
					} else {
						_this15.committee_by_account_id = _this15.committee_by_account_id.set(account_id, null);
						_this15.notifySubscribers();
						resolve(null);
					}
				}, reject);
			});
		}

		/**
   *  Fetches an account and all of its associated data in a single query
   *
   *  @param an account name or account id
   *
   *  @return undefined if the account in question is in the process of being fetched
   *  @return the object if it has already been fetched
   *  @return null if the object has been queried and was not found
   */

	}, {
		key: "fetchFullAccount",
		value: function fetchFullAccount(name_or_id) {
			var _this16 = this;

			if (DEBUG) console.log("Fetch full account: ", name_or_id);

			var fetch_account = false;
			if (ChainValidation.is_object_id(name_or_id)) {
				var current = this.objects_by_id.get(name_or_id);
				fetch_account = current === undefined;
				if (!fetch_account && fetch_account.get('name')) return current;
			} else {
				if (!ChainValidation.is_account_name(name_or_id, true)) throw Error("argument is not an account name: " + name_or_id);

				var account_id = this.accounts_by_name.get(name_or_id);
				if (ChainValidation.is_object_id(account_id)) return this.getAccount(account_id);
			}

			/// only fetch once every 5 seconds if it wasn't found
			if (!this.fetching_get_full_accounts.has(name_or_id) || Date.now() - this.fetching_get_full_accounts.get(name_or_id) > 5000) {
				this.fetching_get_full_accounts.set(name_or_id, Date.now());
				//console.log( "FETCHING FULL ACCOUNT: ", name_or_id )
				Apis.instance().db_api().exec("get_full_accounts", [[name_or_id], true]).then(function (results) {
					if (results.length === 0) {
						if (ChainValidation.is_object_id(name_or_id)) {
							_this16.objects_by_id = _this16.objects_by_id.set(name_or_id, null);
							_this16.notifySubscribers();
						}
						return;
					}
					var full_account = results[0][1];
					if (DEBUG) console.log("full_account: ", full_account);

					var account = full_account.account,
					    vesting_balances = full_account.vesting_balances,
					    pending_dividend_payments = full_account.pending_dividend_payments,
					    statistics = full_account.statistics,
					    call_orders = full_account.call_orders,
					    limit_orders = full_account.limit_orders,
					    referrer_name = full_account.referrer_name,
					    registrar_name = full_account.registrar_name,
					    lifetime_referrer_name = full_account.lifetime_referrer_name,
					    votes = full_account.votes,
					    proposals = full_account.proposals;


					_this16.accounts_by_name = _this16.accounts_by_name.set(account.name, account.id);
					account.referrer_name = referrer_name;
					account.lifetime_referrer_name = lifetime_referrer_name;
					account.registrar_name = registrar_name;
					account.balances = {};
					account.orders = new Immutable.Set();
					account.vesting_balances = new Immutable.Set();
					account.pending_dividend_payments = new Immutable.Set();
					account.balances = new Immutable.Map();
					account.call_orders = new Immutable.Set();
					account.proposals = new Immutable.Set();
					account.vesting_balances = account.vesting_balances.withMutations(function (set) {
						vesting_balances.forEach(function (vb) {
							_this16._updateObject(vb, false);
							set.add(vb.id);
						});
					});

					votes.forEach(function (v) {
						return _this16._updateObject(v, false);
					});

					account.balances = account.balances.withMutations(function (map) {
						full_account.balances.forEach(function (b) {
							_this16._updateObject(b, false);
							map.set(b.asset_type, b.id);
						});
					});

					account.orders = account.orders.withMutations(function (set) {
						limit_orders.forEach(function (order) {
							_this16._updateObject(order, false);
							set.add(order.id);
						});
					});

					account.pending_dividend_payments = account.pending_dividend_payments.withMutations(function (set) {
						pending_dividend_payments.forEach(function (payments) {
							_this16._updateObject(payments, false);
							set.add(payments);
						});
					});

					account.call_orders = account.call_orders.withMutations(function (set) {
						call_orders.forEach(function (co) {
							_this16._updateObject(co, false);
							set.add(co.id);
						});
					});

					account.proposals = account.proposals.withMutations(function (set) {
						proposals.forEach(function (p) {
							_this16._updateObject(p, false);
							set.add(p.id);
						});
					});

					_this16._updateObject(statistics, false);
					var updated_account = _this16._updateObject(account, false);
					_this16.fetchRecentHistory(updated_account);
					_this16.notifySubscribers();
				}, function (error) {
					console.log("Error: ", error);
					if (ChainValidation.is_object_id(name_or_id)) _this16.objects_by_id = _this16.objects_by_id.delete(name_or_id);else _this16.accounts_by_name = _this16.accounts_by_name.delete(name_or_id);
				});
			}
			return undefined;
		}
	}, {
		key: "getAccountMemberStatus",
		value: function getAccountMemberStatus(account) {
			if (account === undefined) return undefined;
			if (account === null) return "unknown";
			if (account.get('lifetime_referrer') == account.get('id')) return "lifetime";
			var exp = new Date(account.get('membership_expiration_date')).getTime();
			var now = new Date().getTime();
			if (exp < now) return "basic";
			return "annual";
		}
	}, {
		key: "getAccountBalance",
		value: function getAccountBalance(account, asset_type) {
			var balances = account.get('balances');
			if (!balances) return 0;

			var balance_obj_id = balances.get(asset_type);
			if (balance_obj_id) {
				var bal_obj = this.objects_by_id.get(balance_obj_id);
				if (bal_obj) return bal_obj.get('balance');
			}
			return 0;
		}

		/**
   * There are two ways to extend the account history, add new more
   * recent history, and extend historic hstory. This method will fetch
   * the most recent account history and prepend it to the list of
   * historic operations.
   *
   *  @param account immutable account object
   *  @return a promise with the account history
   */

	}, {
		key: "fetchRecentHistory",
		value: function fetchRecentHistory(account) {
			var _this17 = this;

			var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

			// console.log( "get account history: ", account )
			/// TODO: make sure we do not submit a query if there is already one
			/// in flight...
			var account_id = account;
			if (!ChainValidation.is_object_id(account_id) && account.toJS) account_id = account.get('id');

			if (!ChainValidation.is_object_id(account_id)) return;

			account = this.objects_by_id.get(account_id);
			if (!account) return;

			var pending_request = this.account_history_requests.get(account_id);
			if (pending_request) {
				pending_request.requests++;
				return pending_request.promise;
			} else pending_request = { requests: 0 };

			var most_recent = "1." + op_history + ".0";
			var history = account.get('history');

			if (history && history.size) most_recent = history.first().get('id');

			/// starting at 0 means start at NOW, set this to something other than 0
			/// to skip recent transactions and fetch the tail
			var start = "1." + op_history + ".0";

			pending_request.promise = new Promise(function (resolve, reject) {
				Apis.instance().history_api().exec("get_account_history", [account_id, most_recent, limit, start]).then(function (operations) {
					var current_account = _this17.objects_by_id.get(account_id);
					var current_history = current_account.get('history');
					if (!current_history) current_history = Immutable.List();
					var updated_history = Immutable.fromJS(operations);
					updated_history = updated_history.withMutations(function (list) {
						for (var i = 0; i < current_history.size; ++i) {
							list.push(current_history.get(i));
						}
					});
					var updated_account = current_account.set('history', updated_history);
					_this17.objects_by_id = _this17.objects_by_id.set(account_id, updated_account);

					//if( current_history != updated_history )
					//   this._notifyAccountSubscribers( account_id )

					var pending_request = _this17.account_history_requests.get(account_id);
					_this17.account_history_requests.delete(account_id);
					if (pending_request.requests > 0) {
						// it looks like some more history may have come in while we were
						// waiting on the result, lets fetch anything new before we resolve
						// this query.
						_this17.fetchRecentHistory(updated_account, limit).then(resolve, reject);
					} else resolve(updated_account);
				}); // end then
			});

			this.account_history_requests.set(account_id, pending_request);
			return pending_request.promise;
		}

		//_notifyAccountSubscribers( account_id )
		//{
		//   let sub = this.subscriptions_by_account.get( account_id )
		//   let acnt = this.objects_by_id.get(account_id)
		//   if( !sub ) return
		//   for( let item of sub.subscriptions )
		//      item( acnt )
		//}

		/**
   *  Callback that receives notification of objects that have been
   *  added, remove, or changed and are relevant to account_id
   *
   *  This method updates or removes objects from the main index and
   *  then updates the account object with relevant meta-info depending
   *  upon the type of account
   */
		// _updateAccount( account_id, payload )
		// {
		//    let updates = payload[0]

		//    for( let i = 0; i < updates.length; ++i )
		//    {
		//       let update = updates[i]
		//       if( typeof update  == 'string' )
		//       {
		//          let old_obj = this._removeObject( update )

		//          if( update.search( order_prefix ) == 0 )
		//          {
		//                acnt = acnt.setIn( ['orders'], set => set.delete(update) )
		//          }
		//          else if( update.search( vesting_balance_prefix ) == 0 )
		//          {
		//                acnt = acnt.setIn( ['vesting_balances'], set => set.delete(update) )
		//          }
		//       }
		//       else
		//       {
		//          let updated_obj = this._updateObject( update )
		//          if( update.id.search( balance_prefix ) == 0 )
		//          {
		//             if( update.owner == account_id )
		//                acnt = acnt.setIn( ['balances'], map => map.set(update.asset_type,update.id) )
		//          }
		//          else if( update.id.search( order_prefix ) == 0 )
		//          {
		//             if( update.owner == account_id )
		//                acnt = acnt.setIn( ['orders'], set => set.add(update.id) )
		//          }
		//          else if( update.id.search( vesting_balance_prefix ) == 0 )
		//          {
		//             if( update.owner == account_id )
		//                acnt = acnt.setIn( ['vesting_balances'], set => set.add(update.id) )
		//          }

		//          this.objects_by_id = this.objects_by_id.set( acnt.id, acnt )
		//       }
		//    }
		//    this.fetchRecentHistory( acnt )
		// }

		/**
   *  Updates the object in place by only merging the set
   *  properties of object.
   *
   *  This method will create an immutable object with the given ID if
   *  it does not already exist.
   *
   *  This is a "private" method called when data is received from the
   *  server and should not be used by others.
   *
   *  @pre object.id must be a valid object ID
   *  @return an Immutable constructed from object and deep merged with the current state
   */

	}, {
		key: "_updateObject",
		value: function _updateObject(object, notify_subscribers) {
			var emit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;


			if (!("id" in object)) {
				console.log("object with no id:", object);
				if ("balance" in object && "owner" in object && "settlement_date" in object) {
					// Settle order object
					emitter.emit("settle-order-update", object);
				}
				return;
			}
			// if (!(object.id.split(".")[0] == 2) && !(object.id.split(".")[1] == 6)) {
			//   console.log( "update: ", object )
			// }

			// DYNAMIC GLOBAL OBJECT
			if (object.id == "2.1.0") {
				object.participation = 100 * (BigInteger(object.recent_slots_filled).bitCount() / 128.0);
				this.head_block_time_string = object.time;
				this.chain_time_offset.push(Date.now() - this.timeStringToDate(object.time).getTime());
				if (this.chain_time_offset.length > 10) this.chain_time_offset.shift(); // remove first
				this.fetchRecentOperations(object.head_block_number);
			}

			var current = this.objects_by_id.get(object.id, undefined);
			if (current === undefined || current === true) current = Immutable.Map();
			var prior = current;
			if (current === undefined || current === true) this.objects_by_id = this.objects_by_id.set(object.id, current = Immutable.fromJS(object));else this.objects_by_id = this.objects_by_id.set(object.id, current = current.mergeDeep(Immutable.fromJS(object)));

			// BALANCE OBJECT
			if (object.id.substring(0, balance_prefix.length) == balance_prefix) {
				var owner = this.objects_by_id.get(object.owner);
				if (owner === undefined || owner === null) {
					return;
					/*  This prevents the full account from being looked up later
      owner = {id:object.owner, balances:{ } }
      owner.balances[object.asset_type] = object.id
      owner = Immutable.fromJS( owner )
      */
				} else {
					var balances = owner.get("balances");
					if (!balances) owner = owner.set("balances", Immutable.Map());
					owner = owner.setIn(['balances', object.asset_type], object.id);
				}
				this.objects_by_id = this.objects_by_id.set(object.owner, owner);
			}
			// ACCOUNT STATS OBJECT
			else if (object.id.substring(0, account_stats_prefix.length) == account_stats_prefix) {
					// console.log( "HISTORY CHANGED" )
					var prior_most_recent_op = prior ? prior.get('most_recent_op') : "2.9.0";

					if (prior_most_recent_op != object.most_recent_op) {
						this.fetchRecentHistory(object.owner);
					}
				}
				// WITNESS OBJECT
				else if (object.id.substring(0, witness_prefix.length) == witness_prefix) {
						this.witness_by_account_id.set(object.witness_account, object.id);
						this.objects_by_vote_id.set(object.vote_id, object.id);
					}
					// COMMITTEE MEMBER OBJECT
					else if (object.id.substring(0, committee_prefix.length) == committee_prefix) {
							this.committee_by_account_id.set(object.committee_member_account, object.id);
							this.objects_by_vote_id.set(object.vote_id, object.id);
						}
						// ACCOUNT OBJECT
						else if (object.id.substring(0, account_prefix.length) == account_prefix) {
								current = current.set('active', Immutable.fromJS(object.active));
								current = current.set('owner', Immutable.fromJS(object.owner));
								current = current.set('options', Immutable.fromJS(object.options));
								current = current.set('pending_dividend_payments', Immutable.fromJS(object.pending_dividend_payments));
								current = current.set('whitelisting_accounts', Immutable.fromJS(object.whitelisting_accounts));
								current = current.set('blacklisting_accounts', Immutable.fromJS(object.blacklisting_accounts));
								current = current.set('whitelisted_accounts', Immutable.fromJS(object.whitelisted_accounts));
								current = current.set('blacklisted_accounts', Immutable.fromJS(object.blacklisted_accounts));
								this.objects_by_id = this.objects_by_id.set(object.id, current);
								this.accounts_by_name = this.accounts_by_name.set(object.name, object.id);
							}
							// ASSET OBJECT
							else if (object.id.substring(0, asset_prefix.length) == asset_prefix) {
									this.assets_by_symbol = this.assets_by_symbol.set(object.symbol, object.id);
									var dynamic = current.get('dynamic');
									if (!dynamic) {
										var dad = this.getObject(object.dynamic_asset_data_id, true);
										if (!dad) dad = Immutable.Map();
										if (!dad.get('asset_id')) {
											dad = dad.set('asset_id', object.id);
										}
										this.objects_by_id = this.objects_by_id.set(object.dynamic_asset_data_id, dad);

										current = current.set('dynamic', dad);
										this.objects_by_id = this.objects_by_id.set(object.id, current);
									}

									var bitasset = current.get('bitasset');
									if (!bitasset && object.bitasset_data_id) {
										var bad = this.getObject(object.bitasset_data_id, true);
										if (!bad) bad = Immutable.Map();

										if (!bad.get('asset_id')) {
											bad = bad.set('asset_id', object.id);
										}
										this.objects_by_id = this.objects_by_id.set(object.bitasset_data_id, bad);

										current = current.set('bitasset', bad);
										this.objects_by_id = this.objects_by_id.set(object.id, current);
									}
								}
								// ASSET DYNAMIC DATA OBJECT
								else if (object.id.substring(0, asset_dynamic_data_prefix.length) == asset_dynamic_data_prefix) {
										// let asset_id = asset_prefix + object.id.substring( asset_dynamic_data_prefix.length )
										var asset_id = current.get("asset_id");
										if (asset_id) {
											var asset_obj = this.getObject(asset_id);
											if (asset_obj && asset_obj.set) {
												asset_obj = asset_obj.set('dynamic', current);
												this.objects_by_id = this.objects_by_id.set(asset_id, asset_obj);
											}
										}
									}
									// WORKER OBJECT
									else if (object.id.substring(0, worker_prefix.length) == worker_prefix) {
											this.objects_by_vote_id.set(object.vote_for, object.id);
											this.objects_by_vote_id.set(object.vote_against, object.id);
										}
										// BITASSET DATA OBJECT
										else if (object.id.substring(0, bitasset_data_prefix.length) == bitasset_data_prefix) {
												var _asset_id = current.get("asset_id");
												if (_asset_id) {
													var asset = this.getObject(_asset_id);
													if (asset) {
														asset = asset.set("bitasset", current);
														emitter.emit('bitasset-update', asset);
														this.objects_by_id = this.objects_by_id.set(_asset_id, asset);
													}
												}
											}
											// CALL ORDER OBJECT
											else if (object.id.substring(0, call_order_prefix.length) == call_order_prefix) {
													// Update nested call_orders inside account object
													if (emit) {
														emitter.emit("call-order-update", object);
													}

													var account = this.objects_by_id.get(object.borrower);
													if (account && account.has("call_orders")) {
														var call_orders = account.get("call_orders");
														if (!call_orders.has(object.id)) {
															account = account.set("call_orders", call_orders.add(object.id));
															this.objects_by_id = this.objects_by_id.set(account.get("id"), account);
														}
													}
												}
												// LIMIT ORDER OBJECT
												else if (object.id.substring(0, order_prefix.length) == order_prefix) {
														var _account3 = this.objects_by_id.get(object.seller);
														if (_account3 && _account3.has("orders")) {
															var limit_orders = _account3.get("orders");
															if (!limit_orders.has(object.id)) {
																_account3 = _account3.set("orders", limit_orders.add(object.id));
																this.objects_by_id = this.objects_by_id.set(_account3.get("id"), _account3);
															}
														}
													}
													// PROPOSAL OBJECT
													else if (object.id.substring(0, proposal_prefix.length) == proposal_prefix) {
															this.addProposalData(object.required_active_approvals, object.id);
															this.addProposalData(object.required_owner_approvals, object.id);
														}
														// TOURNAMENT OBJECT
														else if (object.id.substring(0, tournament_prefix.length) == tournament_prefix) {
																var priorState = prior.get("state");
																var newState = current.get("state");

																if (priorState !== newState) {
																	this.tournament_ids_by_state = this.tournament_ids_by_state.map(function (stateMap, accountId) {
																		return stateMap.map(function (tournamentIdSet, stateString) {
																			if (stateString === priorState) return tournamentIdSet.remove(object.id);else if (stateString === newState && (accountId === null || current.getIn(["options", "whitelist"]).isEmpty() || current.getIn(["options", "whitelist"]).includes(accountId))) return tournamentIdSet.add(object.id);else return tournamentIdSet;
																		});
																	});
																}

																if (this.last_tournament_id !== undefined) {
																	this.setLastTournamentId(current.get('id'));
																}
															} else if (object.id.substring(0, tournament_details_prefix.length) == tournament_details_prefix) {
																var priorRegisteredPlayers = prior.get("registered_players");
																var newRegisteredPlayers = current.get("registered_players");
																if (priorRegisteredPlayers != newRegisteredPlayers) this.registered_tournament_ids_by_player = this.registered_tournament_ids_by_player.map(function (tournamentIdsSet, accountId) {
																	if (newRegisteredPlayers.includes(accountId)) return tournamentIdsSet.add(current.get("tournament_id"));else return tournamentIdsSet;
																	// currently, you can't un-register for a tournament, so we don't have
																	// to deal with removing from a list
																});
															}

			if (notify_subscribers) this.notifySubscribers();

			return current;
		}
	}, {
		key: "setLastTournamentId",
		value: function setLastTournamentId(current_tournament_id) {
			if (current_tournament_id === null) {
				if (!this.last_tournament_id) {
					this.last_tournament_id = current_tournament_id;
				}
			} else {
				var current_tournament_id_short = parseFloat(current_tournament_id.substring(tournament_prefix.length)),
				    last_tournament_id_short = this.last_tournament_id ? parseFloat(this.last_tournament_id.substring(tournament_prefix.length)) : -1;

				if (current_tournament_id_short > last_tournament_id_short) {
					this.last_tournament_id = current_tournament_id;
				}
			}
		}
	}, {
		key: "getTournaments",
		value: function getTournaments(last_tournament_id) {
			var _this18 = this;

			var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
			var start_tournament_id = arguments[2];


			return Apis.instance().db_api().exec("get_tournaments", [last_tournament_id, limit, start_tournament_id]).then(function (tournaments) {
				var list = Immutable.List();

				_this18.setLastTournamentId(null);

				if (tournaments && tournaments.length) {
					list = list.withMutations(function (l) {
						tournaments.forEach(function (tournament) {

							if (!_this18.objects_by_id.has(tournament.id)) {
								_this18._updateObject(tournament, false);
							}

							l.unshift(_this18.objects_by_id.get(tournament.id));
						});
					});
				}

				return list;
			});
		}
	}, {
		key: "getLastTournamentId",
		value: function getLastTournamentId() {
			var _this19 = this;

			return new Promise(function (resolve, reject) {
				if (_this19.last_tournament_id === undefined) {

					Apis.instance().db_api().exec("get_tournaments", [tournament_prefix + '0', 1, tournament_prefix + '0']).then(function (tournaments) {

						_this19.setLastTournamentId(null);

						if (tournaments && tournaments.length) {

							tournaments.forEach(function (tournament) {
								_this19._updateObject(tournament, false);
							});
						}

						resolve(_this19.last_tournament_id);
					});
				} else {

					resolve(_this19.last_tournament_id);
				}
			});
		}
	}, {
		key: "getObjectsByVoteIds",
		value: function getObjectsByVoteIds(vote_ids) {
			var _this20 = this;

			var result = [];
			var missing = [];
			for (var i = 0; i < vote_ids.length; ++i) {
				var obj = this.objects_by_vote_id.get(vote_ids[i]);
				if (obj) result.push(this.getObject(obj));else {
					result.push(null);
					missing.push(vote_ids[i]);
				}
			}

			if (missing.length) {
				// we may need to fetch some objects
				Apis.instance().db_api().exec("lookup_vote_ids", [missing]).then(function (vote_obj_array) {
					console.log("missing ===========> ", missing);
					console.log("vote objects ===========> ", vote_obj_array);
					for (var _i2 = 0; _i2 < vote_obj_array.length; ++_i2) {
						if (vote_obj_array[_i2]) {
							_this20._updateObject(vote_obj_array[_i2]);
						}
					}
				}, function (error) {
					return console.log("Error looking up vote ids: ", error);
				});
			}
			return result;
		}
	}, {
		key: "getObjectByVoteID",
		value: function getObjectByVoteID(vote_id) {
			var obj_id = this.objects_by_vote_id.get(vote_id);
			if (obj_id) return this.getObject(obj_id);
			return undefined;
		}
	}, {
		key: "getHeadBlockDate",
		value: function getHeadBlockDate() {
			return this.timeStringToDate(this.head_block_time_string);
		}
	}, {
		key: "getEstimatedChainTimeOffset",
		value: function getEstimatedChainTimeOffset() {
			if (this.chain_time_offset.length === 0) return 0;
			// Immutable is fast, sorts numbers correctly, and leaves the original unmodified
			// This will fix itself if the user changes their clock
			var median_offset = Immutable.List(this.chain_time_offset).sort().get(Math.floor((this.chain_time_offset.length - 1) / 2));
			// console.log("median_offset", median_offset)
			return median_offset;
		}
	}, {
		key: "addProposalData",
		value: function addProposalData(approvals, objectId) {
			var _this21 = this;

			approvals.forEach(function (id) {
				var impactedAccount = _this21.objects_by_id.get(id);
				if (impactedAccount) {
					var proposals = impactedAccount.get("proposals");

					if (!proposals.includes(objectId)) {
						proposals = proposals.add(objectId);
						impactedAccount = impactedAccount.set("proposals", proposals);
						_this21._updateObject(impactedAccount.toJS(), false);
					}
				}
			});
		}
	}, {
		key: "timeStringToDate",
		value: function timeStringToDate(time_string) {
			if (!time_string) return new Date("1970-01-01T00:00:00.000Z");
			if (!/Z$/.test(time_string)) //does not end in Z
				// https://github.com/cryptonomex/graphene/issues/368
				time_string = time_string + "Z";
			return new Date(time_string);
		}
	}, {
		key: "__getBlocksForScan",
		value: function __getBlocksForScan(lastBlock) {
			var _this22 = this;

			var db_api = Apis.instance().db_api();
			return new Promise(function (success, fail) {

				var scanToBlock = _this22.last_processed_block;
				if (lastBlock) return success({ lastBlock: lastBlock, scanToBlock: scanToBlock });

				db_api.exec("get_dynamic_global_properties", []).then(function (globalProperties) {
					lastBlock = _this22.last_processed_block = globalProperties['head_block_number'];
					scanToBlock = globalProperties['head_block_number'] - 2000;
					scanToBlock = scanToBlock < 0 ? 1 : scanToBlock;
					return success({ lastBlock: lastBlock, scanToBlock: scanToBlock });
				});
			});
		}
	}, {
		key: "__bindBlock",
		value: function __bindBlock(lastBlock, scanToBlock, isInit) {
			var _this23 = this;

			var db_api = Apis.instance().db_api();
			return new Promise(function (success, fail) {
				db_api.exec("get_block", [lastBlock]).then(function (block) {
					block.id = lastBlock;
					if (typeof block.timestamp === "string") block.timestamp += "+00:00";
					block.timestamp = new Date(block.timestamp);
					_this23.getWitnessAccount(block.witness).then(function (witness) {
						block.witness_account_name = witness.name;

						if (!_this23.recent_blocks_by_id.get(lastBlock)) {

							_this23.recent_blocks_by_id = _this23.recent_blocks_by_id.set(lastBlock, block);

							if (_this23.last_processed_block < lastBlock) _this23.last_processed_block = lastBlock;

							if (!isInit) {
								_this23.recent_blocks = _this23.recent_blocks.unshift(block);
								if (_this23.recent_blocks.size > block_stack_size) {
									_this23.recent_blocks = _this23.recent_blocks.pop();
								}
							} else if (_this23.recent_blocks.size < block_stack_size) {
								_this23.recent_blocks = _this23.recent_blocks.push(block);
							}

							block.transactions.forEach(function (tx) {
								return tx.operations.forEach(function (op) {
									op[1].block_id = lastBlock;
									op[1].created_at = block.timestamp;
									if (!isInit) {
										_this23.recent_operations = _this23.recent_operations.unshift(op);
									} else {
										if (_this23.recent_operations.size < operations_stack_size) {
											_this23.recent_operations = _this23.recent_operations.push(op);
										}
										if (_this23.recent_operations.size >= operations_stack_size && _this23.recent_blocks.size >= block_stack_size) {
											scanToBlock = lastBlock;
										}
									}
									if (_this23.recent_operations.size > operations_stack_size) {
										_this23.recent_operations = _this23.recent_operations.pop();
									}
								});
							});
						}
						lastBlock--;
						if (lastBlock <= scanToBlock) {
							return success();
						}
						_this23.__bindBlock(lastBlock, scanToBlock, isInit).then(function () {
							return success();
						});
					});
				});
			});
		}
	}, {
		key: "fetchRecentOperations",
		value: function fetchRecentOperations() {
			var _this24 = this;

			var lastBlock = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

			if (lastBlock && !this.last_processed_block) return;
			var isInit = !lastBlock;

			this.__getBlocksForScan(lastBlock).then(function (_ref) {
				var lastBlock = _ref.lastBlock,
				    scanToBlock = _ref.scanToBlock;

				_this24.__bindBlock(lastBlock, scanToBlock, isInit).then(function () {
					if (isInit) {
						_this24.store_initialized = true;
					}
				});
			});
		}
	}, {
		key: "getRecentBlocks",
		value: function getRecentBlocks() {
			return this.recent_blocks;
		}
	}, {
		key: "getRecentOperations",
		value: function getRecentOperations() {
			if (!this.store_initialized) return Immutable.List();
			return this.recent_operations;
		}
	}]);

	return ChainStore;
}();

var chain_store = new ChainStore();

function FetchChainObjects(method, object_ids, timeout) {
	var get_object = method.bind(chain_store);

	return new Promise(function (resolve, reject) {
		var timeout_handle = null;

		function onUpdate() {
			var not_subscribed_yet = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

			var res = object_ids.map(function (id) {
				return get_object(id);
			});
			if (res.findIndex(function (o) {
				return o === undefined;
			}) === -1) {
				if (timeout_handle) clearTimeout(timeout_handle);
				if (!not_subscribed_yet) chain_store.unsubscribe(onUpdate);
				resolve(res);
				return true;
			}
			return false;
		}

		var resolved = onUpdate(true);
		if (!resolved) chain_store.subscribe(onUpdate);

		if (timeout && !resolved) timeout_handle = setTimeout(function () {
			chain_store.unsubscribe(onUpdate);
			reject("timeout");
		}, timeout);
	});
}

chain_store.FetchChainObjects = FetchChainObjects;

function FetchChain(methodName, objectIds) {
	var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1900;


	var method = chain_store[methodName];
	if (!method) throw new Error("ChainStore does not have method " + methodName);

	var arrayIn = Array.isArray(objectIds);
	if (!arrayIn) objectIds = [objectIds];

	return chain_store.FetchChainObjects(method, Immutable.List(objectIds), timeout).then(function (res) {
		return arrayIn ? res : res.get(0);
	});
}

chain_store.FetchChain = FetchChain;

module.exports = chain_store;