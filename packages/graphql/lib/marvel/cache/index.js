const fetchCached = require('fetch-cached').default;
const lruCache = require('lru-cache');

/**
 * Create a higher order function that decorates `fetch` method such that it transparently
 * caches its responses.
 *
 * @param {number} size Maximum LRU cache size
 * @param {number} ttl Maximum cache duration
 * @returns {function(function):function} A higher order function that decorates fetch method
 */
const createWithCache = ({size, ttl}) =>
  size > 0 && ttl > 0
    ? (fetch) => {
        const syncCache = lruCache({max: size, maxAge: ttl * 1000});
        return fetchCached({
          fetch,
          cache: {
            get: (...args) => Promise.resolve(syncCache.get(...args)),
            set: (...args) => Promise.resolve(syncCache.set(...args))
          }
        });
      }
    : (x) => x;
exports.createWithCache = createWithCache;
