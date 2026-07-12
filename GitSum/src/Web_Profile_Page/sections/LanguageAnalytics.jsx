import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function LanguageAnalytics({ username }) {
  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      id="languages-detail"
      aria-label="Language usage analytics"
    >
      <h2 className="section-title"><span aria-hidden="true">🎨</span> Language Analytics</h2>
      <div className="analytics-grid">
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${username}&theme=transparent`}
          alt={`${username}'s repos per language`}
          className="github-analytics-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Language stats unavailable'; }}
        />
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=${username}&theme=transparent`}
          alt={`${username}'s most committed languages`}
          className="github-analytics-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Commit language stats unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

LanguageAnalytics.propTypes = { username: PropTypes.string.isRequired };
