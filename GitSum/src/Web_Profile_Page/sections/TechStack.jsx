import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

function TechBadge({ item, index }) {
  return (
    <motion.div
      custom={index}
      variants={badgeVariants}
      whileHover={{ y: -4, scale: 1.05 }}
      className="tech-badge"
      title={`${item.name}${item.confidence ? ` (${item.confidence} confidence)` : ''}`}
    >
      {item.logo ? (
        <img
          src={item.logo}
          alt={item.name}
          className="tech-logo"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span className="tech-fallback-initial">{item.name[0]}</span>
      )}
      <span className="tech-name">{item.name}</span>
      {item.percentage != null && (
        <span className="tech-pct">{item.percentage}%</span>
      )}
    </motion.div>
  );
}

TechBadge.propTypes = {
  item: PropTypes.shape({
    name:       PropTypes.string.isRequired,
    logo:       PropTypes.string,
    confidence: PropTypes.string,
    percentage: PropTypes.number,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export function TechStack({ languages, frameworks }) {
  if (!languages.length && !frameworks.length) return null;

  return (
    <motion.section
      className="dashboard-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      id="languages"
      aria-label="Tech stack and frameworks"
    >
      <h2 className="section-title">
        <span aria-hidden="true">💻</span> Tech Stack &amp; Frameworks
      </h2>

      {languages.length > 0 && (
        <div className="tech-category">
          <h3 className="tech-category-title">
            <span aria-hidden="true">🗣️</span> Programming Languages
          </h3>
          <div className="tech-grid" role="list">
            {languages.map((lang, i) => (
              <TechBadge key={lang.name} item={lang} index={i} />
            ))}
          </div>
        </div>
      )}

      {frameworks.length > 0 && (
        <div className="tech-category">
          <h3 className="tech-category-title">
            <span aria-hidden="true">🚀</span> Frameworks &amp; Tools
          </h3>
          <div className="tech-grid" role="list">
            {frameworks.map((fw, i) => (
              <TechBadge key={fw.name} item={fw} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

TechStack.propTypes = {
  languages:  PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  frameworks: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
};
