const {createHash} = require('crypto');

// https://developer.marvel.com/documentation/authorization
const calculateAuth = ({privateKey, publicKey, nonce}) => ({
  ts: nonce,
  apikey: publicKey,
  hash: createHash('md5')
    .update(`${nonce}${privateKey}${publicKey}`)
    .digest('hex')
});
exports.calculateAuth = calculateAuth;
