import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme.js';

export function AchievementsCard({ username }) {
  const theme = useTheme();
  const cardTheme = theme === 'light' ? 'github' : 'transparent';

  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      aria-label="Profile achievements and summary"
    >
      <h2 className="section-title"><span aria-hidden="true">🏆</span> Achievements Showcase</h2>
      <div className="graph-container">
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${username}&theme=${cardTheme}`}
          alt={`${username}'s GitHub profile summary`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.alt = 'Profile summary unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

AchievementsCard.propTypes = { username: PropTypes.string.isRequired };
