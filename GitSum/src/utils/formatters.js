/**
 * src/utils/formatters.js
 * Pure formatting utilities — no side effects, easy to unit-test.
 */

/**
 * Convert a raw byte count to a human-readable string.
 * GitHub repo sizes are reported in kilobytes, so pass (size * 1024) for bytes.
 *
 * @param {number} bytes
 * @returns {string}  e.g. "4.5 MB"
 */
export function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

/**
 * Format an ISO date string into a short locale date.
 *
 * @param {string} isoString
 * @returns {string}  e.g. "Jun 12, 2024"
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a number with thousands separators.
 *
 * @param {number} n
 * @returns {string}  e.g. "1,248"
 */
export function formatNumber(n) {
  return (n ?? 0).toLocaleString('en-US');
}

/**
 * Given a Unix timestamp of when the rate limit resets, return how many
 * whole minutes remain (minimum 1).
 *
 * @param {number} retryAfterSeconds
 * @returns {number}
 */
export function minutesUntilReset(retryAfterSeconds) {
  return Math.max(1, Math.ceil(retryAfterSeconds / 60));
}
