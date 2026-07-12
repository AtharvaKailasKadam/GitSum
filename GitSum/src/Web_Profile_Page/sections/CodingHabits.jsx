import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function CodingHabits({ username }) {
  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      aria-label="Coding habits and productive time"
    >
      <h2 className="section-title"><span aria-hidden="true">⏰</span> Coding Habits</h2>
      <div className="graph-container">
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=${username}&theme=transparent&utcOffset=0`}
          alt={`${username}'s most productive coding times`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Coding habits data unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

CodingHabits.propTypes = { username: PropTypes.string.isRequired };
