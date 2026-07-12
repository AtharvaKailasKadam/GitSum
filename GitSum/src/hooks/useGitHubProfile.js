import { useState, useEffect } from 'react';
import { fetchUser, NotFoundError, RateLimitError, NetworkError } from '../services/api.js';

/**
 * @typedef {import('../services/api.js').NotFoundError} NotFoundError
 * @typedef {import('../services/api.js').RateLimitError} RateLimitError
 */

/**
 * Fetches a GitHub user profile, with loading / error state management.
 *
 * @param {string} username
 * @returns {{ data: object | null, loading: boolean, error: Error | null }}
 */
export function useGitHubProfile(username) {
  const [state, setState] = useState({
    username: null,
    data: null,
    loading: true,
    error: null,
  });

  // Synchronously reset state during render if username changed
  if (state.username !== username) {
    setState({
      username,
      data: null,
      loading: true,
      error: null,
    });
  }

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    fetchUser(username)
      .then((user) => {
        if (!cancelled) {
          setState((s) => ({ ...s, data: user, loading: false, error: null }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ ...s, data: null, loading: false, error: err }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return state;
}

export { NotFoundError, RateLimitError, NetworkError };
