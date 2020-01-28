import PrivateKey from '../../ecc/src/PrivateKey';
import key from '../../ecc/src/KeyUtils';

import {get, set} from './state';

let _keyCachePriv = {};
let _keyCachePub = {};

class AccountLogin {
  constructor() {
    let state = {loggedIn: false, roles: ['owner', 'active', 'memo']};
    this.get = get(state);
    this.set = set(state);

    this.subs = {};
  }

  /**
   * Subscribe to provided item.
   *
   * @param {*} cb
   * @memberof AccountLogin
   */
  addSubscription(cb) {
    this.subs[cb] = cb;
  }

  /**
   * Set the roles. Used for key generation.
   *
   * @param {Array} roles - ['owner', 'active', 'memo']
   * @memberof AccountLogin
   */
  setRoles(roles) {
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
  generateKeys(accountName, password, roles, prefix) {
    if (!accountName || !password) {
      throw new Error('Account name or password required');
    }

    if (password.length < 12) {
      throw new Error('Password must have at least 12 characters');
    }

    let privKeys = {};
    let pubKeys = {};

    (roles || this.get('roles')).forEach((role) => {
      let seed = password + accountName + role;
      let pkey = _keyCachePriv[seed]
        ? _keyCachePriv[seed]
        : PrivateKey.fromSeed(key.normalize_brainKey(seed));
      _keyCachePriv[seed] = pkey;

      privKeys[role] = pkey;
      pubKeys[role] = _keyCachePub[seed]
        ? _keyCachePub[seed]
        : pkey.toPublicKey().toString(prefix);

      _keyCachePub[seed] = pubKeys[role];
    });

    return {privKeys, pubKeys};
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
  checkKeys({accountName, password, auths}, prefix = 'PPY') {
    if (!accountName || !password || !auths) {
      throw new Error('checkKeys: Missing inputs');
    }

    let hasKey = false;
    let roles = Object.keys(auths);

    for (let i = 0, len = roles.length; i < len; i++) {
      let role = roles[i];
      let {privKeys, pubKeys} = this.generateKeys(accountName, password, [
        role
      ], prefix);
      auths[role].forEach((roleKey) => {
        // Check if the active key matches
        if (roleKey[0] === pubKeys[role]) {
          hasKey = true;
          this.set(role, {priv: privKeys[role], pub: pubKeys[role]});
        }
      });
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
  signTransaction(tr) {
    let hasKey = false;

    this.get('roles').forEach((role) => {
      let myKey = this.get(role);

      if (myKey) {
        hasKey = true;
        console.log('adding signer:', myKey.pub);
        tr.add_signer(myKey.priv, myKey.pub);
      }
    });

    if (!hasKey) {
      throw new Error(
        'You do not have any private keys to sign this transaction'
      );
    }
  }
}

export default new AccountLogin();
