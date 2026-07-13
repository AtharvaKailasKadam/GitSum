import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme.js';

export function ActivityGraph({ username }) {
  const theme = useTheme();
  const graphTheme = theme === 'light' ? 'react' : 'react-dark';
  const textClr = theme === 'light' ? '5c5c73' : '8e8ea0';
  const accentClr = theme === 'light' ? 'ff6200' : 'ff9c42';

  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      aria-label="Commit activity graph"
    >
      <h2 className="section-title"><img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Calendar/3D/calendar_3d.png" alt="" className="header-3d-icon" /> Commit Activity</h2>
      <div className="graph-container">
        <img
          src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=${graphTheme}&bg_color=transparent&color=${textClr}&line=${accentClr}&point=${accentClr}&area=true&hide_border=true`}
          alt={`${username}'s commit activity graph`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.alt = 'Activity graph unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

ActivityGraph.propTypes = { username: PropTypes.string.isRequired };
