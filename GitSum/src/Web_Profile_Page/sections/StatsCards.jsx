import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { useTheme } from '../../hooks/useTheme.js';

/** Reusable embedded stats image with error fallback */
function StatsImage({ src, alt, className = '' }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`github-stats-image ${className}`}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.currentTarget.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect fill='%23161b22' width='400' height='160' rx='10'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236e7681' font-size='14' font-family='sans-serif'%3EStats unavailable%3C/text%3E%3C/svg%3E";
      }}
    />
  );
}

StatsImage.propTypes = { src: PropTypes.string.isRequired, alt: PropTypes.string.isRequired, className: PropTypes.string };

export function StatsCards({ username }) {
  const theme = useTheme();
  const textClr = theme === 'light' ? '111118' : 'f0f0f5';
  const accentClr = theme === 'light' ? 'ff6200' : 'ff9c42';

  return (
    <motion.section
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      id="overview-github"
      aria-label="GitHub statistics cards"
    >
      <h2 className="section-title"><span aria-hidden="true">📈</span> GitHub Statistics</h2>
      <div className="stats-cards-grid">
        <StatsImage
          src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=transparent&hide_border=true&text_color=${textClr}&icon_color=${accentClr}&title_color=${accentClr}`}
          alt={`${username}'s overall GitHub statistics`}
        />
        <StatsImage
          src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=transparent&hide_border=true&text_color=${textClr}&title_color=${accentClr}`}
          alt={`${username}'s top programming languages`}
        />
      </div>
    </motion.section>
  );
}

StatsCards.propTypes = { username: PropTypes.string.isRequired };
