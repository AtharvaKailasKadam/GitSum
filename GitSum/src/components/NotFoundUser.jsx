import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export function NotFoundUser({ username }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className="state-screen"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
    >
      <div className="state-icon">🔍</div>
      <h2 className="state-title">User not found</h2>
      <p className="state-message">
        No GitHub account with the username <strong>@{username}</strong> could be found.
        <br />Check the spelling and try again.
      </p>
      <button className="btn-primary" onClick={() => navigate('/login')}>
        Try another username
      </button>
    </motion.div>
  );
}

NotFoundUser.propTypes = {
  username: PropTypes.string.isRequired,
};
