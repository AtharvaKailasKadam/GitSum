/**
 * Pure helper utility to check for custom developer badges based on profile stats,
 * repository lists, contribution calendar, and repository health scores.
 */
export const BADGE_RULES = [
  {
    id: 'polyglot',
    label: 'Polyglot',
    icon: '🔮',
    description: 'Master of many languages (5+ programming languages used).',
    check: (data) => data.languages && data.languages.length >= 5
  },
  {
    id: 'star-collector',
    label: 'Star Collector',
    icon: '✨',
    description: 'Earned 100+ total repository stars.',
    check: (data) => data.totalStars >= 100
  },
  {
    id: 'prolific-builder',
    label: 'Prolific Builder',
    icon: '🧱',
    description: 'Created 30+ public repositories.',
    check: (data) => data.publicRepos >= 30
  },
  {
    id: 'consistent-builder',
    label: 'Consistent',
    icon: '🔥',
    description: 'Maintained a contribution streak of 14+ days.',
    check: (data) => data.longestStreak >= 14
  },
  {
    id: 'open-sourcerer',
    label: 'Open Sourcerer',
    icon: '🧙‍♂️',
    description: 'Repositories have been forked 15+ times in total.',
    check: (data) => data.totalForks >= 15
  },
  {
    id: 'well-documented',
    label: 'Well Documented',
    icon: '📚',
    description: 'High codebase standards (Average repository health score >= 75/100).',
    check: (data) => {
      if (!data.healthScores || Object.keys(data.healthScores).length === 0) return false;
      const scores = Object.values(data.healthScores).map(h => h.score);
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return avg >= 75;
    }
  }
];
