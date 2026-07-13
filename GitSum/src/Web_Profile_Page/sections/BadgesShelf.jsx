import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { BADGE_RULES } from '../../utils/badges.js';

const shelfVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 15 }
  }
};

export function BadgesShelf({ stats, languages, healthScores, longestStreak }) {
  const checkData = {
    totalStars: stats.totalStars,
    totalForks: stats.totalForks,
    publicRepos: stats.totalRepos ?? 0,
    languages,
    healthScores,
    longestStreak
  };

  return (
    <motion.section
      className="dashboard-section badges-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      aria-label="Achievements and earned developer badges"
    >
      <h2 className="section-title"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Military%20medal/3D/military_medal_3d.png" alt="" className="header-3d-icon" /> Earned Badges</h2>
      
      <motion.div className="badges-shelf-grid" variants={shelfVariants}>
        {BADGE_RULES.map((badge) => {
          const isEarned = badge.check(checkData);
          
          return (
            <motion.div
              key={badge.id}
              className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
              variants={badgeVariants}
              whileHover={{ scale: 1.05 }}
              title={`${badge.label}: ${badge.description}`}
            >
              <div className="badge-icon-wrapper">
                <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
                {!isEarned && <span className="badge-lock-icon" aria-hidden="true">🔒</span>}
              </div>
              <span className="badge-name">{badge.label}</span>
              <span className="badge-desc">{badge.description}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}

BadgesShelf.propTypes = {
  stats: PropTypes.shape({
    totalStars: PropTypes.number.isRequired,
    totalForks: PropTypes.number.isRequired,
    totalRepos: PropTypes.number
  }).isRequired,
  languages: PropTypes.array.isRequired,
  healthScores: PropTypes.object,
  longestStreak: PropTypes.number.isRequired
};
