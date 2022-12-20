const defaults = {
  whaleVault: null
};

class WhaleVaultConfig {
  constructor() {
    this.reset();
  }

  reset() {
    Object.assign(this, defaults);
  }

  setWhaleVault(whaleVault = null) {
    this.whaleVault = whaleVault;
  }

  getWhaleVault() {
    return this.whaleVault;
  }
}
export default new WhaleVaultConfig();
