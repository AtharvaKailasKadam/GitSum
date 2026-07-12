import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FloatingMarks from '../Web_Welcome_Page/FloatingMarks';
import AnimatedGithubSymbol from '../assets/AnimatedGithubSymbol.png';
import './Username.css';



export const EnterUserName = () => {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const [userName, setUserName] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [recent, setRecent]     = useState(() => {
    try {
      const raw = localStorage.getItem('gitsum-recent') ?? '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const submit = () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      setError('Please enter a GitHub username.');
      inputRef.current?.focus();
      return;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      setError('GitHub usernames may only contain letters, numbers, and hyphens.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    navigate(`/profile/${trimmed}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  const clearHistory = () => {
    localStorage.removeItem('gitsum-recent');
    setRecent([]);
  };

  return (
    <div className="Username-Overlay">
      <FloatingMarks count={12} />
      <motion.div
        className="Username-Container"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="Image-Container">
          <img className="Username-Image" src={AnimatedGithubSymbol} alt="GitHub logo" />
        </div>

        <h1 className="Username-Heading">Search a profile</h1>
        <p className="username-subheading">Enter any public GitHub username to visualize their profile.</p>

        {/* Search input */}
        <div className={`username-input-wrapper ${error ? 'has-error' : ''}`}>
          <span className="input-prefix-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 .297C5.37.297 0 5.667 0 12.297c0 5.286 3.438 9.773 8.205 11.363.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.204.087 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.606-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.468-2.382 1.236-3.222-.124-.304-.536-1.527.117-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.984-.399 3.005-.404 1.021.005 2.049.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.656 1.649.244 2.872.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.807 5.623-5.48 5.92.429.37.81 1.096.81 2.21 0 1.595-.014 2.877-.014 3.268 0 .32.217.694.825.576C20.565 22.067 24 17.582 24 12.297 24 5.667 18.627.297 12 .297z"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            id="username-input"
            type="text"
            className="Username-Input"
            placeholder="e.g. torvalds"
            value={userName}
            onChange={(e) => { setUserName(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            aria-label="GitHub username"
            aria-describedby={error ? 'username-error' : undefined}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Inline error */}
        {error && (
          <p id="username-error" className="username-error" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {/* Submit button */}
        <div className="Username-Button-Container">
          <motion.button
            className="Username-Button"
            onClick={submit}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            aria-disabled={loading}
          >
            {loading ? (
              <motion.span
                className="btn-spinner"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                ⟳
              </motion.span>
            ) : (
              'Summarize →'
            )}
          </motion.button>
        </div>

        {/* Recently viewed profiles */}
        {recent.length > 0 && (
          <div className="recent-profiles-section" aria-label="Recently viewed profiles">
            <div className="recent-header">
              <span className="recent-title">Recently viewed:</span>
              <button className="clear-history-btn" onClick={clearHistory} aria-label="Clear history">
                Clear
              </button>
            </div>
            <div className="recent-chips" role="list">
              {recent.map((user) => (
                <button
                  key={user.login}
                  className="recent-chip"
                  onClick={() => navigate(`/profile/${user.login}`)}
                  role="listitem"
                  aria-label={`View profile for ${user.login}`}
                >
                  <img src={user.avatarUrl} alt="" className="recent-chip-avatar" />
                  <span className="recent-chip-name">@{user.login}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnterUserName;