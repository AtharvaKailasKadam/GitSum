import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { askChat } from '../../services/api.js';

export function ProfileChat({ username, profile, languages, frameworks, stats }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || question.trim();
    if (!text) return;

    if (!textToSend) {
      setQuestion('');
    }

    const newHistory = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setLoading(true);
    setError(null);

    const context = {
      name: profile.name,
      bio: profile.bio,
      followers: profile.followers,
      following: profile.following,
      publicRepos: profile.public_repos,
      totalStars: stats.totalStars,
      totalForks: stats.totalForks,
      languages,
      frameworks
    };

    try {
      const res = await askChat(username, text, history, context);
      setHistory([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Could not send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starters = [
    'What are their primary skills?',
    'Tell me about their repository health.',
    'Are they active recently?'
  ];

  return (
    <div className="profile-chat-widget">
      {/* Trigger floating button */}
      {!isOpen && (
        <motion.button
          className="chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open AI profile analyst chat"
          layoutId="chat-panel"
        >
          <span className="chat-trigger-icon" aria-hidden="true">💬</span>
          <span className="chat-trigger-label">Ask Profile</span>
        </motion.button>
      )}

      {/* Chat pane */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            layoutId="chat-panel"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-title-wrapper">
                <span className="chat-header-icon" aria-hidden="true">✨</span>
                <div>
                  <h3 className="chat-title">AI Profile Analyst</h3>
                  <span className="chat-subtitle">Q&A about @{username}</span>
                </div>
              </div>
              <button
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat pane"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages-container" role="log">
              {history.length === 0 && (
                <div className="chat-welcome">
                  <span className="welcome-icon" aria-hidden="true">🤖</span>
                  <p className="welcome-msg">
                    Hi! I'm your AI Analyst. Ask me anything about @{username}'s GitHub activity, stacks, stars, or project quality.
                  </p>
                  
                  {/* Starter questions */}
                  <div className="chat-starters">
                    {starters.map((s, idx) => (
                      <button
                        key={idx}
                        className="starter-btn"
                        onClick={() => handleSend(s)}
                        disabled={loading}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`} role="listitem">
                  <div className="message-bubble">{msg.content}</div>
                </div>
              ))}

              {loading && (
                <div className="chat-message assistant loading" role="status" aria-label="AI is typing">
                  <div className="message-bubble">
                    <span className="typing-dots">
                      <span>•</span><span>•</span><span>•</span>
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="chat-error-bubble" role="alert">
                  ⚠️ {error}
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-bar">
              <textarea
                className="chat-input-field"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Write a question"
                disabled={loading}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSend()}
                disabled={loading || !question.trim()}
                aria-label="Send question"
              >
                ➔
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

ProfileChat.propTypes = {
  username: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    name: PropTypes.string,
    bio: PropTypes.string,
    followers: PropTypes.number,
    following: PropTypes.number,
    public_repos: PropTypes.number
  }).isRequired,
  languages: PropTypes.array.isRequired,
  frameworks: PropTypes.array.isRequired,
  stats: PropTypes.shape({
    totalStars: PropTypes.number.isRequired,
    totalForks: PropTypes.number.isRequired
  }).isRequired
};
