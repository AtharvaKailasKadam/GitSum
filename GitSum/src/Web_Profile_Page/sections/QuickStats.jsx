import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatNumber } from '../../utils/formatters.js';

/**
 * Animated counter that counts from 0 to `target` on mount.
 * Falls back instantly if prefers-reduced-motion is set.
 */
function CountUp({ target, format = formatNumber }) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => format(Math.round(v)));

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      value.set(target);
      return;
    }
    const controls = animate(value, target, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [target, value]);

  return <motion.span>{rounded}</motion.span>;
}

CountUp.propTypes = {
  target: PropTypes.number.isRequired,
  format: PropTypes.func,
};

const STATS = [
  { key: 'public_repos',  label: 'Public Repos', icon: '📁', formatFn: formatNumber },
  { key: 'followers',     label: 'Followers',    icon: '👥', formatFn: formatNumber },
  { key: 'following',     label: 'Following',    icon: '➕', formatFn: formatNumber },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

export function QuickStats({ profile, totalStars, totalForks, totalSizeFormatted, repos = [] }) {
  const derived = [
    { label: 'Total Stars',    icon: '⭐', value: totalStars,          numeric: true },
    { label: 'Total Forks',    icon: '🔀', value: totalForks,          numeric: true },
    { label: 'Cloud Storage',  icon: '☁️', value: totalSizeFormatted,  numeric: false },
  ];

  const all = [
    ...STATS.map((s) => ({ label: s.label, icon: s.icon, value: profile[s.key] ?? 0, numeric: true })),
    ...derived,
  ];

  // Calculate personal vs forked counts
  const personalCount = useMemo(() => repos.filter(r => !r.fork).length, [repos]);
  const forkedCount = useMemo(() => repos.filter(r => r.fork).length, [repos]);
  const totalRepos = personalCount + forkedCount;
  const personalPct = totalRepos > 0 ? Math.round((personalCount / totalRepos) * 100) : 0;
  const forkedPct = totalRepos > 0 ? 100 - personalPct : 0;

  return (
    <motion.section
      className="dashboard-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      id="overview-stats"
      aria-label="Quick statistics"
    >
      <h2 className="section-title">
        <span aria-hidden="true">📊</span> Quick Statistics
      </h2>
      <div className="stats-grid" role="list">
        {all.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            className="stat-card"
            role="listitem"
          >
            <div className="stat-icon" aria-hidden="true">{stat.icon}</div>
            <div className="stat-value" aria-label={`${stat.label}: ${stat.value}`}>
              {stat.numeric ? <CountUp target={stat.value} /> : stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Horizontal stacked breakdown bar */}
      {totalRepos > 0 && (
        <div className="repos-breakdown-wrapper">
          <div className="breakdown-info">
            <span className="breakdown-title">Repository Breakdown</span>
            <div className="breakdown-legend">
              <span className="legend-dot personal" />
              <span className="legend-label">Personal: {personalCount} ({personalPct}%)</span>
              <span className="legend-dot forked" />
              <span className="legend-label">Forked: {forkedCount} ({forkedPct}%)</span>
            </div>
          </div>
          <div className="breakdown-bar-container">
            <motion.div
              className="breakdown-bar-fill personal"
              initial={{ width: 0 }}
              whileInView={{ width: `${personalPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              title={`Personal: ${personalPct}%`}
            />
            <motion.div
              className="breakdown-bar-fill forked"
              initial={{ width: 0 }}
              whileInView={{ width: `${forkedPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              title={`Forked: ${forkedPct}%`}
            />
          </div>
        </div>
      )}
    </motion.section>
  );
}

QuickStats.propTypes = {
  profile: PropTypes.shape({
    public_repos: PropTypes.number,
    followers:    PropTypes.number,
    following:    PropTypes.number,
  }).isRequired,
  totalStars:          PropTypes.number.isRequired,
  totalForks:          PropTypes.number.isRequired,
  totalSizeFormatted:  PropTypes.string.isRequired,
  repos:               PropTypes.array
};
