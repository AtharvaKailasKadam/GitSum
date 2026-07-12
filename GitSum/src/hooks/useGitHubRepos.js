import { useState, useEffect } from 'react';
import { fetchRepos } from '../services/api.js';

/**
 * Fetches public repos for a GitHub user.
 *
 * @param {string} username
 * @returns {{ data: object[], loading: boolean, error: Error | null }}
 */
export function useGitHubRepos(username) {
  const [state, setState] = useState({
    username: null,
    data: [],
    loading: true,
    error: null,
  });

  // Synchronously reset state during render if username changed
  if (state.username !== username) {
    setState({
      username,
      data: [],
      loading: true,
      error: null,
    });
  }

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    fetchRepos(username)
      .then((repos) => {
        if (!cancelled) {
          setState((s) => ({ ...s, data: repos, loading: false, error: null }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ ...s, data: [], loading: false, error: err }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return state;
}
