import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export function ActivityGraph({ username }) {
  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      aria-label="Commit activity graph"
    >
      <h2 className="section-title"><span aria-hidden="true">📅</span> Commit Activity</h2>
      <div className="graph-container">
        <img
          src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=react-dark&bg_color=transparent&color=8e8ea0&line=ff9c42&point=ff9c42&area=true&hide_border=true`}
          alt={`${username}'s commit activity graph`}
          className="github-graph-image"
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.alt = 'Activity graph unavailable'; }}
        />
      </div>
    </motion.section>
  );
}

ActivityGraph.propTypes = { username: PropTypes.string.isRequired };
