import { useEffect, useState } from 'react';

/**
 * Custom hook to subscribe to dark/light theme changes.
 * Returns the current theme ('dark' or 'light').
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('gitsum-theme') ?? 'dark');

  useEffect(() => {
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener('gitsum-theme-change', handleThemeChange);
    return () => window.removeEventListener('gitsum-theme-change', handleThemeChange);
  }, []);

  return theme;
}
