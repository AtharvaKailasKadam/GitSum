import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme.js';

export function StreakCard({ username }) {
  const theme = useTheme();
  const strokeClr = theme === 'light' ? 'ff6200' : 'ff9c42';
  const labelClr = theme === 'light' ? '111118' : 'f0f0f5';
  const datesClr = theme === 'light' ? '5c5c73' : '8e8ea0';

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
      <h2 className="section-title"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png" alt="" className="header-3d-icon" /> Contribution Streak</h2>
      <div className="graph-container">
        <img
          src={`https://streak-stats.demolab.com?user=${username}&theme=transparent&hide_border=true&stroke=${strokeClr}&ring=${strokeClr}&fire=${strokeClr}&currStreakLabel=${labelClr}&dates=${datesClr}&sideLabels=${datesClr}&sideNums=${labelClr}&currStreakNum=${labelClr}`}
          alt={`${username}'s GitHub contribution streak`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.alt = 'Streak data unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

StreakCard.propTypes = { username: PropTypes.string.isRequired };
