const {indent} = require('./string');

/**
 * A factory for a higher order function that decorates fetch such that a base url is prepended.
 *
 * The URL provided to fetch must be root relative or the base will not be prepended.
 *
 * @param {string} baseURL A base url to apply to all those passed to the fetch URL
 * @returns {function(function):function} A higher order function that decorates fetch
 */
const createWithBase = (baseURL) => (fetch) => (url, ...rest) => {
  const isRelative = url.startsWith('/');
  return fetch(isRelative ? `${baseURL}${url}` : url, ...rest);
};
exports.createWithBase = createWithBase;

/**
 * A factory for a higher order function that decorates fetch such that query parameters are added
 * to every call.
 *
 * The query is evaluated every call from a getter. This allows changeable parameters such as nonce.
 *
 * Where the url contains `{field}` and `field in query` then it is substituted in the path instead.
 * With the caveat that path substitutions must be plain alphanumeric.
 *
 * @param {object|function():object} paramsOrGetParams A hash of parameters or a getter to such
 * @returns {function(function):function} A higher order function that decorates fetch
 */
const createWithParams = (paramsOrGetParams) => (fetch) => (url, ...rest) => {
  const params = typeof paramsOrGetParams === 'function' ? paramsOrGetParams() : paramsOrGetParams;
  const entries = Object.entries(params).filter(([k, v]) => v !== undefined);

  const finalUrl = entries
    .filter(([_, v]) => /^[a-zA-Z0-9]+$/.test(v))
    .reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), url);

  const additionalQuery = entries
    .filter(([k]) => !url.includes(`{${k}}`))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const suffix = `${url.indexOf('?') === -1 ? '?' : '&'}${additionalQuery}`;

  return fetch(`${finalUrl}${suffix}`, ...rest);
};
exports.createWithParams = createWithParams;

/**
 * A higher order function that decorates fetch such that it always returns json.
 *
 * @type {function(function):function} A higher order function that decorates fetch
 */
const withJson = (fetch) => (...args) => fetch(...args).then((res) => res.json());
exports.withJson = withJson;

/**
 * A factory for a higher order function that decorates fetch such that it logs each call to it.
 *
 * @param {function} log A log function such as console.log
 * @returns {function(function):function} A higher order function that decorates fetch
 */
const createWithLogging = (log) => (fetch) => (url, options, ...rest) => {
  const stringify = (obj) =>
    JSON.stringify(obj, null, 2)
      .split('\n')
      .map(indent(2))
      .join('\n');

  log(`GET ${url}`);

  if (!!options && Object.keys(options).length) {
    log(stringify(options));
  }

  return fetch(url, options, ...rest).then((res) => {
    log(`GET ${url} : ${res.status}`);
    if (!res.ok) {
      return res
        .clone()
        .json()
        .then((json) => log(stringify(json)))
        .then(() => res);
    } else {
      return res;
    }
  });
};
exports.createWithLogging = createWithLogging;
