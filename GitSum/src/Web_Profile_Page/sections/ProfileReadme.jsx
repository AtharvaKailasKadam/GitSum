import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { fetchProfileReadme } from '../../services/api.js';

export function ProfileReadme({ username }) {
  const [state, setState] = useState({
    username: null,
    readme: '',
    loading: true
  });
  const [expanded, setExpanded] = useState(true);

  if (state.username !== username) {
    setState({
      username,
      readme: '',
      loading: true
    });
  }

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    fetchProfileReadme(username)
      .then(res => {
        if (!cancelled) {
          setState(s => ({ ...s, readme: res.readme || '', loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(s => ({ ...s, readme: '', loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const { readme, loading } = state;

  // If there is no README content, don't show the card at all.
  if (!loading && !readme) return null;

  return (
    <motion.section
      className="dashboard-section profile-readme-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      aria-label="GitHub profile readme"
    >
      <div className="readme-header" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <span aria-hidden="true">📖</span> Profile README
        </h2>
        <button
          className="readme-toggle-btn"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse README' : 'Expand README'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="readme-markdown-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {loading ? (
              <div className="readme-skeleton" role="status" aria-label="Loading README">
                <div className="readme-skeleton-line shimmer" style={{ width: '90%' }} />
                <div className="readme-skeleton-line shimmer" style={{ width: '80%' }} />
                <div className="readme-skeleton-line shimmer" style={{ width: '85%' }} />
              </div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {readme}
                </ReactMarkdown>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

ProfileReadme.propTypes = {
  username: PropTypes.string.isRequired,
};
