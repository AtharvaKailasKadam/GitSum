import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { minutesUntilReset } from '../utils/formatters.js';

/**
 * Shown when the GitHub API rate limit has been hit.
 * Displays a countdown and a retry button.
 */
export function RateLimited({ retryAfter = 60 }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(retryAfter);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const minutes = minutesUntilReset(remaining);

  return (
    <motion.div
      className="state-screen"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
    >
      <div className="state-icon">⏳</div>
      <h2 className="state-title">Rate limit reached</h2>
      <p className="state-message">
        GitHub's API limit has been hit. This happens because API calls are proxied
        through a shared server.
        <br />
        <strong>Try again in ~{minutes} minute{minutes !== 1 ? 's' : ''}.</strong>
      </p>
      <div className="rate-limit-counter" aria-live="polite">
        {remaining}s
      </div>
      <button
        className="btn-primary"
        disabled={remaining > 0}
        onClick={() => navigate(0)}
        aria-disabled={remaining > 0}
      >
        {remaining > 0 ? `Retry in ${remaining}s` : 'Retry now'}
      </button>
      <button className="btn-ghost" onClick={() => navigate('/login')}>
        Try a different username
      </button>
    </motion.div>
  );
}

RateLimited.propTypes = {
  retryAfter: PropTypes.number,
};
