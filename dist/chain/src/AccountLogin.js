"use strict";

exports.__esModule = true;
exports["default"] = void 0;

var _PrivateKey = _interopRequireDefault(require("../../ecc/src/PrivateKey"));

var _KeyUtils = _interopRequireDefault(require("../../ecc/src/KeyUtils"));

var _state = require("./state");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _keyCachePriv = {};
var _keyCachePub = {};

var AccountLogin = /*#__PURE__*/function () {
  function AccountLogin() {
    var state = {
      loggedIn: false,
      roles: ['owner', 'active', 'memo']
    };
    this.get = (0, _state.get)(state);
    this.set = (0, _state.set)(state);
    this.subs = {};
  }
  /**
   * Subscribe to provided item.
   *
   * @param {*} cb
   * @memberof AccountLogin
   */


  var _proto = AccountLogin.prototype;

  _proto.addSubscription = function addSubscription(cb) {
    this.subs[cb] = cb;
  }
  /**
   * Set the roles. Used for key generation.
   *
   * @param {Array} roles - ['owner', 'active', 'memo']
   * @memberof AccountLogin
   */
  ;

  _proto.setRoles = function setRoles(roles) {
    this.set('roles', roles);
  }
  /**
   * Call this function to generate Peerplays user account keys.
   *
   * @param {String} accountName - The users' account name (username).
   * @param {String} password - The users' password.
   * @param {Array} roles - ['owner', 'active', 'memo']
   * @param {String} prefix - Optional. The core token symbol (1.3.0 = 'PPY')
   * @returns {Object} - Keys object: `{privKeys, pubKeys}`
   * @memberof AccountLogin
   */
  ;

  _proto.generateKeys = function generateKeys(accountName, password, roles, prefix) {
    if (!accountName || !password) {
      throw new Error('Account name or password required');
    }

    if (password.length < 12) {
      throw new Error('Password must have at least 12 characters');
    }

    var privKeys = {};
    var pubKeys = {};
    (roles || this.get('roles')).forEach(function (role) {
      var seed = password + accountName + role;
      var pkey = _keyCachePriv[seed] ? _keyCachePriv[seed] : _PrivateKey["default"].fromSeed(_KeyUtils["default"].normalize_brainKey(seed));
      _keyCachePriv[seed] = pkey;
      privKeys[role] = pkey;
      pubKeys[role] = _keyCachePub[seed] ? _keyCachePub[seed] : pkey.toPublicKey().toString(prefix);
      _keyCachePub[seed] = pubKeys[role];
    });
    return {
      privKeys: privKeys,
      pubKeys: pubKeys
    };
  }
  /**
   * Accepts an account name {string}, password {string}, and an auths object. We loop over the
   * provided auths whichcontains the keys associated with the account we are working with.
   *
   * We verify that the keys provided (which are pulled from the blockchain prior) match up with
   * keys we generate with the provided account name and password.
   *
   * This function is dependant upon the roles array being specified in the correct order:
   * 1. owner
   * 2. active
   * 3. memo
   *
   * @param {Object} {accountName, password, auths} - string, string, array
   * @param {String} prefix - Optional. The core token symbol (1.3.0 = 'PPY')
   * @returns {Boolean}
   * @memberof AccountLogin
   */
  ;

  _proto.checkKeys = function checkKeys(_ref, prefix) {
    var _this = this;

    var accountName = _ref.accountName,
        password = _ref.password,
        auths = _ref.auths;

    if (prefix === void 0) {
      prefix = 'PPY';
    }

    if (!accountName || !password || !auths) {
      throw new Error('checkKeys: Missing inputs');
    }

    var hasKey = false;
    var roles = Object.keys(auths);

    var _loop = function _loop(i, len) {
      var role = roles[i];

      var _this$generateKeys = _this.generateKeys(accountName, password, [role], prefix),
          privKeys = _this$generateKeys.privKeys,
          pubKeys = _this$generateKeys.pubKeys;

      auths[role].forEach(function (roleKey) {
        // Check if the active key matches
        if (roleKey[0] === pubKeys[role]) {
          hasKey = true;

          _this.set(role, {
            priv: privKeys[role],
            pub: pubKeys[role]
          });
        }
      });
    };

    for (var i = 0, len = roles.length; i < len; i++) {
      _loop(i, len);
    }

    if (hasKey) {
      this.set('name', accountName);
    }

    this.set('loggedIn', hasKey);
    return hasKey;
  }
  /**
   * Call this function and provide a valid transaction object to sign it with
   * the users' Active key.
   * Pre-requisite is that AccountLogin.js (`Login`) has had its roles set and
   * the users' keys were generated with AccountLogin.js (`Login`)
   *
   * @param {Object} tr - Transaction object built via TransactionBuilder.js
   * @returns {Object} tr - Transaction object that was passed in but signed.
   * @memberof AccountLogin
   */
  ;

  _proto.signTransaction = function signTransaction(tr) {
    var _this2 = this;

    var hasKey = false;
    this.get('roles').forEach(function (role) {
      var myKey = _this2.get(role);

      if (myKey) {
        hasKey = true;
        console.log('adding signer:', myKey.pub);
        tr.add_signer(myKey.priv, myKey.pub);
      }
    });

    if (!hasKey) {
      throw new Error('You do not have any private keys to sign this transaction');
    }
  };

  return AccountLogin;
}();

var _default = new AccountLogin();

exports["default"] = _default;
module.exports = exports.default;