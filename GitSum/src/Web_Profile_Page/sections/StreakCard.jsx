import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function StreakCard({ username }) {
  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      id="activity"
      aria-label="Contribution streak"
    >
      <h2 className="section-title"><span aria-hidden="true">🔥</span> Contribution Streak</h2>
      <div className="graph-container">
        <img
          src={`https://streak-stats.demolab.com?user=${username}&theme=transparent&hide_border=true&stroke=ff9c42&ring=ff9c42&fire=ff9c42&currStreakLabel=f0f0f5&dates=8e8ea0&sideLabels=8e8ea0&sideNums=f0f0f5&currStreakNum=f0f0f5`}
          alt={`${username}'s GitHub contribution streak`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Streak data unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

StreakCard.propTypes = { username: PropTypes.string.isRequired };
