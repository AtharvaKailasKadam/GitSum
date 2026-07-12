import { useState, useEffect } from 'react';
import { fetchReposHealth } from '../services/api.js';

/**
 * Custom hook to load repository health scores for the top 10 repositories.
 * 
 * @param {string} username
 * @returns {{ healthScores: object, loading: boolean }} Map of { [repoId]: { score, details } }
 */
export function useGitHubHealth(username) {
  const [state, setState] = useState({
    username: null,
    healthScores: {},
    loading: true
  });

  if (state.username !== username) {
    setState({
      username,
      healthScores: {},
      loading: true
    });
  }

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    fetchReposHealth(username)
      .then((scores) => {
        if (!cancelled) {
          setState((s) => ({ ...s, healthScores: scores || {}, loading: false }));
        }
      })
      .catch((err) => {
        console.error('Failed to load repository health checklist scores:', err);
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return state;
}
