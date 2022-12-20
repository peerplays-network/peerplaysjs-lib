/* global ByteBuffer */
import BigInteger from 'bigi';
import {Point, getCurveByName} from 'ecurve';
import {encode, decode} from 'bs58';
import assert from 'assert';
import deepEqual from 'deep-equal';
import {ChainConfig} from '../../ws';
import {sha256, sha512, ripemd160} from './hash';

const secp256k1 = getCurveByName('secp256k1');

const {G, n} = secp256k1;

class PublicKey {
  /** @param {Point} public key */
  constructor(Q) {
    this.Q = Q;
  }

  static fromBinary(bin) {
    return PublicKey.fromBuffer(Buffer.from(bin, 'binary'));
  }

  static fromBuffer(buffer) {
    if (
      buffer.toString('hex')
      === '000000000000000000000000000000000000000000000000000000000000000000'
    ) {
      return new PublicKey(null);
    }

    return new PublicKey(Point.decodeFrom(secp256k1, buffer));
  }

  toBuffer(compressed = this.Q ? this.Q.compressed : null) {
    if (this.Q === null) {
      return Buffer.from(
        '000000000000000000000000000000000000000000000000000000000000000000',
        'hex'
      );
    }

    return this.Q.getEncoded(compressed);
  }

  static fromPoint(point) {
    return new PublicKey(point);
  }

  toUncompressed() {
    let buf = this.Q.getEncoded(false);
    let point = Point.decodeFrom(secp256k1, buf);
    return PublicKey.fromPoint(point);
  }

  /** bts::blockchain::address (unique but not a full public key) */
  toBlockchainAddress() {
    let pub_buf = this.toBuffer();
    let pub_sha = sha512(pub_buf);
    return ripemd160(pub_sha);
  }

  /** Alias for {@link toPublicKeyString} */
  toString(address_prefix = ChainConfig.address_prefix) {
    return this.toPublicKeyString(address_prefix);
  }

  /**
        Full public key
        {return} string
    */
  toPublicKeyString(address_prefix = ChainConfig.address_prefix) {
    let pub_buf = this.toBuffer();
    let checksum = ripemd160(pub_buf);
    // Slice from the buffer directly, slicing from the checksum
    // Uint8array will return the entire array each time.
    let sliced = new Uint8Array(checksum.buffer.slice(0, 4));

    // concat only accepts buffers so initialize the sliced Uint8array as a Buffer.
    let addy = Buffer.concat([pub_buf, Buffer.from(sliced)]);
    return address_prefix + encode(addy);
  }

  /**
        @arg {string} public_key - like GPHXyz...
        @arg {string} address_prefix - like GPH
        @return PublicKey or `null` (if the public_key string is invalid)
    */
  static fromPublicKeyString(public_key, address_prefix = ChainConfig.address_prefix) {
    try {
      return PublicKey.fromStringOrThrow(public_key, address_prefix);
    } catch (e) {
      return null;
    }
  }

  /**
        @arg {string} public_key - like PPYXyz...
        @arg {string} address_prefix - like PPY
        @throws {Error} if public key is invalid
        @return PublicKey
    */
  static fromStringOrThrow(public_key, address_prefix = ChainConfig.address_prefix) {
    let prefix = public_key.slice(0, address_prefix.length);
    assert.equal(
      address_prefix,
      prefix,
      `Expecting key to begin with ${address_prefix}, instead got ${prefix}`
    );
    public_key = public_key.slice(address_prefix.length);

    public_key = Buffer.from(decode(public_key), 'binary');
    let checksum = public_key.slice(-4);
    public_key = public_key.slice(0, -4);
    let new_checksum = ripemd160(public_key);
    new_checksum = new_checksum.slice(0, 4);
    let isEqual = deepEqual(checksum, new_checksum); // , 'Invalid checksum'

    if (!isEqual) {
      throw new Error('Checksum did not match');
    }

    return PublicKey.fromBuffer(public_key);
  }

  toAddressString(address_prefix = ChainConfig.address_prefix) {
    let pub_buf = this.toBuffer();
    let pub_sha = sha512(pub_buf);
    let addy = ripemd160(pub_sha);
    let checksum = ripemd160(addy);
    addy = Buffer.concat([addy, checksum.slice(0, 4)]);
    return address_prefix + encode(addy);
  }

  toPtsAddy() {
    let pub_buf = this.toBuffer();
    let pub_sha = sha256(pub_buf);
    let addy = ripemd160(pub_sha);
    addy = Buffer.concat([Buffer.from([0x38]), addy]); // version 56(decimal)

    let checksum = sha256(addy);
    checksum = sha256(checksum);

    addy = Buffer.concat([addy, checksum.slice(0, 4)]);
    return encode(addy);
  }

  child(offset) {
    assert(Buffer.isBuffer(offset), 'Buffer required: offset');
    assert.equal(offset.length, 32, 'offset length');

    offset = Buffer.concat([this.toBuffer(), offset]);
    offset = sha256(offset);

    let c = BigInteger.fromBuffer(offset);

    if (c.compareTo(n) >= 0) {
      throw new Error('Child offset went out of bounds, try again');
    }

    let cG = G.multiply(c);
    let Qprime = this.Q.add(cG);

    if (secp256k1.isInfinity(Qprime)) {
      throw new Error('Child offset derived to an invalid key, try again');
    }

    return PublicKey.fromPoint(Qprime);
  }

  /* <HEX> */

  toByteBuffer() {
    let b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    this.appendByteBuffer(b);
    return b.copy(0, b.offset);
  }

  static fromHex(hex) {
    return PublicKey.fromBuffer(Buffer.from(hex, 'hex'));
  }

  toHex() {
    return this.toBuffer().toString('hex');
  }

  static fromPublicKeyStringHex(hex) {
    return PublicKey.fromPublicKeyString(Buffer.from(hex, 'hex'));
  }

  /* </HEX> */
}

export default PublicKey;
