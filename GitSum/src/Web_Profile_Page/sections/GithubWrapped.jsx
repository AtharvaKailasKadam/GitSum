import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut' }
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' }
  })
};

export function GithubWrapped({ profile, stats, languages, calendarData, healthScores, onClose }) {
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    const nextPage = page + newDirection;
    if (nextPage >= 0 && nextPage < 4) {
      setPage([nextPage, newDirection]);
    }
  };

  // 1. Archetype derivation
  const developerArchetype = useMemo(() => {
    if (languages.length === 0) return 'The Quiet Coder';
    const topLang = languages[0].name.toLowerCase();
    const topLangPercent = languages[0].percentage;

    if (topLangPercent > 65) {
      if (['javascript', 'typescript', 'html', 'css'].includes(topLang)) return 'Frontend Architect';
      if (['python', 'go', 'rust', 'java'].includes(topLang)) return 'Backend Sorcerer';
      if (['c', 'cpp', 'assembly'].includes(topLang)) return 'Systems Tinkerer';
    }

    if (languages.length >= 5) return 'Polymath Technologist';
    return 'Fullstack Adventurer';
  }, [languages]);

  // 2. Health recap math
  const avgHealthScore = useMemo(() => {
    const scores = Object.values(healthScores).map(h => h.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  }, [healthScores]);

  const slidesContent = [
    // Slide 1: Welcome & Calendar
    {
      title: "Your Year in Code",
      icon: "📅",
      content: (
        <div className="wrapped-slide-inner">
          <p className="wrapped-narrative">
            You made a total of <span className="highlight-text">{calendarData.totalContributions} contributions</span> over the last 12 months!
          </p>
          <div className="wrapped-grid-metrics">
            <div className="wrapped-metric-box">
              <span className="wrapped-box-val">{calendarData.totalContributions}</span>
              <span className="wrapped-box-lbl">Commits & PRs</span>
            </div>
            <div className="wrapped-metric-box">
              <span className="wrapped-box-val">{profile.public_repos}</span>
              <span className="wrapped-box-lbl">Public Repos</span>
            </div>
          </div>
        </div>
      )
    },
    // Slide 2: Languages & Archetype
    {
      title: "Your Coding Persona",
      icon: "🔮",
      content: (
        <div className="wrapped-slide-inner">
          <p className="wrapped-archetype-title">Archetype: <span className="highlight-text">{developerArchetype}</span></p>
          <p className="wrapped-narrative">
            Your most dominant language was <span className="highlight-text">{languages[0]?.name || 'N/A'}</span>, powering <span className="highlight-text">{languages[0]?.percentage || 0}%</span> of your projects.
          </p>
          <div className="wrapped-languages-bar">
            {languages.slice(0, 3).map((l, i) => (
              <div key={i} className="wrapped-lang-segment" style={{ width: `${l.percentage}%` }} title={`${l.name}: ${l.percentage}%`}>
                <span className="lang-label">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 3: Code footprint
    {
      title: "Code Footprint & Impact",
      icon: "⚡",
      content: (
        <div className="wrapped-slide-inner">
          <p className="wrapped-narrative">
            Your creations occupy <span className="highlight-text">{stats.totalSizeFormatted}</span> on GitHub, earning the appreciation of developers worldwide.
          </p>
          <div className="wrapped-grid-metrics">
            <div className="wrapped-metric-box">
              <span className="wrapped-box-val">⭐ {stats.totalStars}</span>
              <span className="wrapped-box-lbl">Stars Received</span>
            </div>
            <div className="wrapped-metric-box">
              <span className="wrapped-box-val">🔀 {stats.totalForks}</span>
              <span className="wrapped-box-lbl">Forks Earned</span>
            </div>
          </div>
        </div>
      )
    },
    // Slide 4: Code Quality & Summary
    {
      title: "Project Health & Summary",
      icon: "🏆",
      content: (
        <div className="wrapped-slide-inner">
          <p className="wrapped-narrative">
            Your top repositories score an average of <span className="highlight-text">{avgHealthScore}/100</span> in documentation and best practices checking.
          </p>
          <div className="wrapped-final-badge">
            <span className="final-badge-icon">🎖️</span>
            <span className="final-badge-title">@{profile.login}</span>
            <span className="final-badge-archetype">{developerArchetype}</span>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slidesContent[page];

  return (
    <div className="wrapped-overlay">
      <div className="wrapped-card-container">
        {/* Background ambient glow effect */}
        <div className="wrapped-glow-bg" />

        <div className="wrapped-card-header">
          <span className="wrapped-logo comic-font">GitSum Wrapped</span>
          <button className="wrapped-close-btn" onClick={onClose} aria-label="Close wrapped slide-show">×</button>
        </div>

        <div className="wrapped-card-body">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="wrapped-slide"
            >
              <div className="slide-icon">{currentSlide.icon}</div>
              <h2 className="slide-title">{currentSlide.title}</h2>
              {currentSlide.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="wrapped-card-footer">
          {/* Progress dots */}
          <div className="wrapped-progress-dots">
            {slidesContent.map((_, idx) => (
              <span key={idx} className={`progress-dot ${idx === page ? 'active' : ''}`} />
            ))}
          </div>

          <div className="wrapped-navigation-actions">
            <button
              className="btn-wrapped-nav"
              disabled={page === 0}
              onClick={() => paginate(-1)}
              aria-label="Previous slide"
            >
              ◀ Back
            </button>
            
            {page < 3 ? (
              <button
                className="btn-wrapped-nav btn-wrapped-next"
                onClick={() => paginate(1)}
                aria-label="Next slide"
              >
                Next ▶
              </button>
            ) : (
              <button
                className="btn-wrapped-nav btn-wrapped-finish"
                onClick={onClose}
                aria-label="Finish recap"
              >
                Finish 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

GithubWrapped.propTypes = {
  profile: PropTypes.object.isRequired,
  stats: PropTypes.object.isRequired,
  languages: PropTypes.array.isRequired,
  calendarData: PropTypes.object.isRequired,
  healthScores: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};
