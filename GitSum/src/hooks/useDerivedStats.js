import { useMemo } from 'react';
import { calcLanguageStats, detectFrameworks } from '../utils/detectStack.js';
import { formatSize } from '../utils/formatters.js';

/**
 * Derives aggregated stats from a repos array.
 * All calculations are memoized — only recomputed when repos changes.
 *
 * @param {object[]} repos  Array of GitHub repo objects
 * @returns {{
 *   totalStars: number,
 *   totalForks: number,
 *   totalSizeFormatted: string,
 *   languages: Array<{ name: string, percentage: number, logo?: string }>,
 *   frameworks: Array<{ name: string, confidence: string, logo?: string }>,
 * }}
 */
export function useDerivedStats(repos) {
  return useMemo(() => {
    if (!repos?.length) {
      return {
        totalStars: 0,
        totalForks: 0,
        totalSizeFormatted: '0 B',
        languages: [],
        frameworks: [],
      };
    }

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count ?? 0), 0);
    const totalBytes = repos.reduce((sum, r) => sum + (r.size ?? 0), 0) * 1024; // KB → bytes

    return {
      totalStars,
      totalForks,
      totalSizeFormatted: formatSize(totalBytes),
      languages: calcLanguageStats(repos),
      frameworks: detectFrameworks(repos),
    };
  }, [repos]);
}
