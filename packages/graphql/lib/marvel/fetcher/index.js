const compose = require('compose-function');

const {calculateAuth} = require('./authentication');
const {createWithBase, createWithParams} = require('../../util/fetch');

/**
 * Create a higher order function that decorates `fetch` method such that it transparently
 * authenticates with the marvel API and prepends marvel API base address to root-relative urls.
 *
 * @param {string} url Marvel API base url
 * @param {string} privateKey Marvel API private key
 * @param {string} publicKey Marvel API publicKey key
 * @returns {function(function):function} A higher order function that decorates fetch method
 */
const createWithMarvel = ({url, privateKey, publicKey}) => {
  let nonce = 0;
  return compose(
    createWithBase(url),
    createWithParams(() => calculateAuth({privateKey, publicKey, nonce: nonce++}))
  );
};
exports.createWithMarvel = createWithMarvel;
