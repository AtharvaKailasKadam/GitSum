import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatDate, formatSize } from '../../utils/formatters.js';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.04, 0.4), duration: 0.3, ease: 'easeOut' },
  }),
};

function RepoCard({ repo, index, health }) {
  const [expanded, setExpanded] = useState(false);

  const healthClass = useMemo(() => {
    if (!health) return '';
    if (health.score >= 75) return 'health-green';
    if (health.score >= 45) return 'health-yellow';
    return 'health-red';
  }, [health]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      whileHover={{ scale: 1.015, y: -2 }}
      layout
      className="repo-card"
    >
      <div className="repo-card-header">
        <div className="repo-header-main">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="repo-name"
            aria-label={`Open ${repo.name} on GitHub`}
          >
            {repo.name}
          </a>
          
          <div className="repo-badge-row">
            {repo.language && (
              <span className="repo-language-badge">{repo.language}</span>
            )}
            
            {/* Repository Health Score Badge with Checklist Tooltip */}
            {health && (
              <div className={`repo-health-badge ${healthClass}`} role="status">
                <span>Health: {health.score}/100</span>
                
                <div className="health-tooltip" aria-hidden="true">
                  <span className="health-tooltip-title">Checklist Breakdown:</span>
                  <ul className="health-checklist">
                    <li className={health.details.hasReadme ? 'checked' : 'unchecked'}>
                      {health.details.hasReadme ? '✓' : '✗'} README (+20)
                    </li>
                    <li className={health.details.hasLicense ? 'checked' : 'unchecked'}>
                      {health.details.hasLicense ? '✓' : '✗'} LICENSE (+15)
                    </li>
                    <li className={health.details.hasCI ? 'checked' : 'unchecked'}>
                      {health.details.hasCI ? '✓' : '✗'} CI Workflows (+20)
                    </li>
                    <li className={health.details.hasTests ? 'checked' : 'unchecked'}>
                      {health.details.hasTests ? '✓' : '✗'} Tests Folder/Files (+20)
                    </li>
                    <li className={health.details.updatedRecently ? 'checked' : 'unchecked'}>
                      {health.details.updatedRecently ? '✓' : '✗'} Active &lt; 6mo (+15)
                    </li>
                    <li className={health.details.hasDescription ? 'checked' : 'unchecked'}>
                      {health.details.hasDescription ? '✓' : '✗'} Description set (+10)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {repo.description && (
          <button
            className="repo-expand-btn"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse description' : 'Expand description'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && repo.description && (
          <motion.p
            className="repo-description"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {repo.description}
          </motion.p>
        )}
      </AnimatePresence>

      {!expanded && repo.description && (
        <p className="repo-description repo-description--clipped">{repo.description}</p>
      )}

      <div className="repo-stats" aria-label="Repository statistics">
        <span className="repo-stat" aria-label={`${repo.stargazers_count} stars`}>
          ⭐ {repo.stargazers_count}
        </span>
        <span className="repo-stat" aria-label={`${repo.forks_count} forks`}>
          🔀 {repo.forks_count}
        </span>
        <span className="repo-stat" aria-label={`Size: ${formatSize(repo.size * 1024)}`}>
          📦 {formatSize(repo.size * 1024)}
        </span>
        <span className="repo-stat" aria-label={`Updated ${formatDate(repo.updated_at)}`}>
          🕐 {formatDate(repo.updated_at)}
        </span>
      </div>
    </motion.div>
  );
}

RepoCard.propTypes = {
  repo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    html_url: PropTypes.string.isRequired,
    description: PropTypes.string,
    language: PropTypes.string,
    stargazers_count: PropTypes.number,
    forks_count: PropTypes.number,
    size: PropTypes.number,
    updated_at: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  health: PropTypes.shape({
    score: PropTypes.number.isRequired,
    details: PropTypes.shape({
      hasReadme: PropTypes.bool.isRequired,
      hasLicense: PropTypes.bool.isRequired,
      hasCI: PropTypes.bool.isRequired,
      hasTests: PropTypes.bool.isRequired,
      updatedRecently: PropTypes.bool.isRequired,
      hasDescription: PropTypes.bool.isRequired,
    }).isRequired
  })
};

export function TopRepos({ repos, healthScores = {} }) {
  const [searchVal, setSearchVal] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('stars');

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Extract unique languages list
  const languagesList = useMemo(() => {
    const langs = new Set();
    repos.forEach(r => { if (r.language) langs.add(r.language); });
    return Array.from(langs).sort();
  }, [repos]);

  // Process sorting & filtering
  const processedRepos = useMemo(() => {
    let list = [...repos];

    // 1. Language Filter
    if (selectedLanguage) {
      list = list.filter(r => r.language === selectedLanguage);
    }

    // 2. Text Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'stars') {
        return (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
      }
      if (sortBy === 'forks') {
        return (b.forks_count ?? 0) - (a.forks_count ?? 0);
      }
      if (sortBy === 'updated') {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list.slice(0, 30);
  }, [repos, selectedLanguage, debouncedSearch, sortBy]);

  return (
    <motion.section
      className="dashboard-section repositories-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      id="repositories"
      aria-label="Top repositories list"
    >
      <div className="repos-section-header">
        <h2 className="section-title">
          <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star/3D/star_3d.png" alt="" className="header-3d-icon" /> Top Repositories
          <span className="section-count">{processedRepos.length}</span>
        </h2>
        
        {/* Controls bar: search, language filter, sort */}
        <div className="repos-controls-bar">
          <div className="control-search-wrapper">
            <input
              type="text"
              placeholder="Search repository..."
              className="control-input search-input"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              aria-label="Search repositories"
            />
            {searchVal && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchVal('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          
          <select
            className="control-input select-input"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            aria-label="Filter by programming language"
          >
            <option value="">All Languages</option>
            {languagesList.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select
            className="control-input select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort repositories by"
          >
            <option value="stars">Most Stars</option>
            <option value="forks">Most Forks</option>
            <option value="updated">Recent Activity</option>
            <option value="name">Repository Name</option>
          </select>
        </div>
      </div>

      {processedRepos.length === 0 ? (
        <div className="repos-empty-state">
          <span className="empty-state-icon" aria-hidden="true">🔍</span>
          <p className="empty-state-message">No repositories match your criteria.</p>
        </div>
      ) : (
        <motion.div className="repos-grid" layout>
          <AnimatePresence mode="popLayout">
            {processedRepos.map((repo, idx) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                index={idx}
                health={healthScores[repo.id]}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.section>
  );
}

TopRepos.propTypes = {
  repos: PropTypes.array.isRequired,
  healthScores: PropTypes.object
};
