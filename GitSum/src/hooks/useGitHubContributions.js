import { useState, useEffect } from 'react';
import { fetchContributions } from '../services/api.js';

/**
 * Custom hook to fetch GitHub contribution calendar via the proxy API.
 * 
 * @param {string} username
 * @returns {{ data: object | null, loading: boolean, error: Error | null }}
 */
export function useGitHubContributions(username) {
  const [state, setState] = useState({
    username: null,
    data: null,
    loading: true,
    error: null,
  });

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

    fetchContributions(username)
      .then((data) => {
        if (!cancelled) {
          setState((s) => ({ ...s, data, loading: false, error: null }));
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
