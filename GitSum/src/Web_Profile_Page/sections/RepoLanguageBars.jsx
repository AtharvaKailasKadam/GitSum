import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function RepoLanguageBars({ languages }) {
  if (!languages.length) return null;

  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      aria-label="Repository language breakdown"
    >
      <h2 className="section-title"><span aria-hidden="true">🧠</span> Repository Languages</h2>
      <div className="language-bars" role="list">
        {languages.map((lang, i) => (
          <motion.div
            key={lang.name}
            className="language-bar-item"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            role="listitem"
          >
            <div className="language-bar-header">
              <span className="language-bar-name">{lang.name}</span>
              <span className="language-bar-pct" aria-label={`${lang.percentage} percent`}>
                {lang.percentage}%
              </span>
            </div>
            <div className="language-bar-track" role="progressbar" aria-valuenow={lang.percentage} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                className="language-bar-fill"
                initial={{ width: 0 }}
                whileInView={{ width: `${lang.percentage}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 + 0.1, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

RepoLanguageBars.propTypes = {
  languages: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string, percentage: PropTypes.number })
  ).isRequired,
};
