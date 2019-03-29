const crypto = require('crypto');
const multihash = require('multihashes');
const base58 = require('bs58');

const sha1 = (data, encoding) =>
    crypto
        .createHash('sha1')
        .update(data)
        .digest(encoding);

/**
    @arg {Buffer} hash
    @arg {string} mhashType = sha1, sha2-256, ...
*/
const mhashEncode = (hash, mhashType) => base58.encode(multihash.encode(hash, mhashType));

module.exports = {
    sha1,
    mhashEncode,
};
