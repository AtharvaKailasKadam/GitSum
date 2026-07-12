import { useEffect, useState } from 'react';

/**
 * Light/dark theme toggle.
 * Reads/writes the `data-theme` attribute on <html> and persists to localStorage.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('gitsum-theme') ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gitsum-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
