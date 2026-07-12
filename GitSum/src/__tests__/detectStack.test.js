import { describe, it, expect } from 'vitest';
import { calcLanguageStats, detectFrameworks } from '../utils/detectStack.js';

describe('calcLanguageStats', () => {
  it('correctly calculates language percentages and sorts them', () => {
    const repos = [
      { language: 'JavaScript' },
      { language: 'JavaScript' },
      { language: 'Python' },
      { language: null },
      { language: 'JavaScript' },
      { language: 'Go' },
    ];

    const stats = calcLanguageStats(repos);

    expect(stats).toHaveLength(3);
    // Total valid languages = 5 (3 JS, 1 Python, 1 Go)
    expect(stats[0]).toEqual({
      name: 'JavaScript',
      percentage: 60,
      logo: expect.any(String),
    });
    expect(stats[1]).toEqual({
      name: 'Python',
      percentage: 20,
      logo: expect.any(String),
    });
    expect(stats[2]).toEqual({
      name: 'Go',
      percentage: 20,
      logo: expect.any(String),
    });
  });

  it('returns empty array if no valid languages present', () => {
    const repos = [{ language: null }, {}];
    expect(calcLanguageStats(repos)).toEqual([]);
  });
});

describe('detectFrameworks', () => {
  it('detects frameworks using word boundary matching', () => {
    const repos = [
      { name: 'my-react-app', description: 'A cool React application' },
      { name: 'vue-dashboard', description: 'Dashboard built with vuejs' },
      { name: 'nuxt-project', description: 'Nuxt framework rules' },
    ];

    const detected = detectFrameworks(repos);

    // React matches 'react' in name & description (twice)
    // Vue matches 'vue' and 'vuejs' (twice)
    // Nuxt matches 'nuxt' (once)
    const names = detected.map(f => f.name);
    expect(names).toContain('React');
    expect(names).toContain('Vue');
    expect(names).toContain('Nuxt');
  });

  it('filters out false positives via word boundaries', () => {
    // "react" is in "reaction", which shouldn't match React.
    // "node" is in "denote", which shouldn't match Node.
    const repos = [
      { name: 'chemical-reaction', description: 'Does it denote anything?' }
    ];

    const detected = detectFrameworks(repos);
    expect(detected).toEqual([]);
  });

  it('assigns correct confidence scores based on hits', () => {
    const repos = [
      { name: 'react-app-1', description: 'some react project' },
      { name: 'react-app-2', description: 'another react project' },
      { name: 'react-app-3', description: 'third react project' },
    ];

    const detected = detectFrameworks(repos);
    expect(detected[0]).toEqual({
      name: 'React',
      confidence: 'high',
      logo: expect.any(String),
    });
  });
});
