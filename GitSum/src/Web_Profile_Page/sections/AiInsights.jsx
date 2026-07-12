import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { fetchInsights } from '../../services/api.js';

export function AiInsights({ username, profile, languages, frameworks, stats }) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const getInsights = useCallback(async (bypass = false) => {
    if (bypass) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const payload = {
      profile: {
        login: profile.login,
        name: profile.name,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        public_repos: profile.public_repos
      },
      languages,
      frameworks,
      stats
    };

    try {
      const res = await fetchInsights(username, payload, bypass);
      setInsights(res.summary);
    } catch (err) {
      console.error('Failed to retrieve AI developer narrative:', err);
      setError('Could not connect to the AI service.');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [username, profile, languages, frameworks, stats]);

  useEffect(() => {
    if (username) {
      getInsights(false);
    }
  }, [username, getInsights]);

  return (
    <motion.section
      className="dashboard-section ai-insights-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      id="ai-insights"
      aria-label="AI developer insights narrative"
    >
      <div className="ai-insights-header">
        <h2 className="ai-insights-title">
          <span className="ai-spark-icon" aria-hidden="true">✨</span> AI Developer Narrative
        </h2>
        <button
          className="btn-regenerate"
          onClick={() => getInsights(true)}
          disabled={loading || regenerating}
          aria-label="Regenerate developer narrative report"
        >
          {regenerating ? (
            <motion.span
              className="regen-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            >
              ⟳
            </motion.span>
          ) : (
            '🔄 Regenerate'
          )}
        </button>
      </div>

      <div className="ai-insights-content">
        {loading ? (
          <div className="ai-skeleton" role="status" aria-label="Loading AI report">
            <div className="ai-skeleton-line shimmer" />
            <div className="ai-skeleton-line shimmer" />
            <div className="ai-skeleton-line shimmer" />
            <div className="ai-skeleton-line shimmer" style={{ width: '70%' }} />
          </div>
        ) : error ? (
          <p className="ai-insights-error">{error} Displaying fallback summary.</p>
        ) : (
          <div className="ai-narrative-text">
            {insights.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      <div className="ai-insights-footer">
        <span className="ai-disclaimer">ℹ️ Narrative is AI-generated and based on public metadata.</span>
      </div>
    </motion.section>
  );
}

AiInsights.propTypes = {
  username: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    login: PropTypes.string.isRequired,
    name: PropTypes.string,
    bio: PropTypes.string,
    followers: PropTypes.number,
    following: PropTypes.number,
    public_repos: PropTypes.number
  }).isRequired,
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      percentage: PropTypes.number.isRequired
    })
  ).isRequired,
  frameworks: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      confidence: PropTypes.string.isRequired
    })
  ).isRequired,
  stats: PropTypes.shape({
    totalStars: PropTypes.number.isRequired,
    totalForks: PropTypes.number.isRequired,
    totalSizeFormatted: PropTypes.string.isRequired,
    totalRepos: PropTypes.number
  }).isRequired
};
