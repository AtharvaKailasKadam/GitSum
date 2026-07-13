import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme.js';

export function LanguageAnalytics({ username }) {
  const theme = useTheme();
  const cardTheme = theme === 'light' ? 'github' : 'transparent';

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
      <h2 className="section-title"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Artist%20palette/3D/artist_palette_3d.png" alt="" className="header-3d-icon" /> Language Analytics</h2>
      <div className="analytics-grid">
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${username}&theme=${cardTheme}`}
          alt={`${username}'s repos per language`}
          className="github-analytics-image"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.alt = 'Language stats unavailable'; }}
        />
        <img
          src={`https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=${username}&theme=${cardTheme}`}
          alt={`${username}'s most committed languages`}
          className="github-analytics-image"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.alt = 'Commit language stats unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

LanguageAnalytics.propTypes = { username: PropTypes.string.isRequired };
