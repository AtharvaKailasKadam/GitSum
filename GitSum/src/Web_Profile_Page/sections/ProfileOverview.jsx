import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatDate } from '../../utils/formatters.js';

export function ProfileOverview({ profile }) {
  return (
    <motion.section
      className="dashboard-section profile-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      id="overview"
    >
      <div className="profile-header">
        <img
          src={profile.avatar_url}
          alt={`${profile.login}'s GitHub avatar`}
          className="profile-avatar"
          loading="lazy"
        />
        <div className="profile-info">
          <h1 className="profile-username">@{profile.login}</h1>
          {profile.name && <h2 className="profile-name">{profile.name}</h2>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-meta" aria-label="Profile metadata">
            {profile.location && (
              <span className="meta-item">
                <span aria-hidden="true">📍</span> {profile.location}
              </span>
            )}
            {profile.company && (
              <span className="meta-item">
                <span aria-hidden="true">🏢</span> {profile.company}
              </span>
            )}
            <span className="meta-item">
              <span aria-hidden="true">📅</span> Joined {formatDate(profile.created_at)}
            </span>
          </div>
          <a
            href={profile.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-link"
            aria-label={`View ${profile.login}'s GitHub profile`}
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </motion.section>
  );
}

ProfileOverview.propTypes = {
  profile: PropTypes.shape({
    login:      PropTypes.string.isRequired,
    name:       PropTypes.string,
    bio:        PropTypes.string,
    avatar_url: PropTypes.string.isRequired,
    html_url:   PropTypes.string.isRequired,
    location:   PropTypes.string,
    company:    PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
};
