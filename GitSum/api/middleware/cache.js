import NodeCache from 'node-cache';
import { serverConfig as config } from '../config.js';

/**
 * In-memory cache backed by node-cache.
 * TTL is set globally from config; individual entries can override it.
 *
 * Key scheme:
 *   user:<username>   → GitHub user object
 *   repos:<username>  → GitHub repos array
 */
const cache = new NodeCache({
  stdTTL: Math.floor(config.cacheTtlMs / 1000), // node-cache works in seconds
  checkperiod: 60, // auto-delete expired keys every 60s
  useClones: false, // skip deep-clone for performance (objects are read-only)
});

/**
 * @param {string} key
 * @returns {unknown | undefined}
 */
export function cacheGet(key) {
  return cache.get(key);
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {number} [ttlSeconds] — override default TTL
 */
export function cacheSet(key, value, ttlSeconds) {
  cache.set(key, value, ttlSeconds ?? Math.floor(config.cacheTtlMs / 1000));
}

/** Returns current cache stats (useful for the /health endpoint). */
export function cacheStats() {
  return cache.getStats();
}
