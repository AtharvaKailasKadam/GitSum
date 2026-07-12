import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function AchievementsCard({ username }) {
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
          src={`https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${username}&theme=transparent`}
          alt={`${username}'s GitHub profile summary`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Profile summary unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

AchievementsCard.propTypes = { username: PropTypes.string.isRequired };
