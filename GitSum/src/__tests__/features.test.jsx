import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContributionCalendar } from '../Web_Profile_Page/sections/ContributionCalendar.jsx';
import { BadgesShelf } from '../Web_Profile_Page/sections/BadgesShelf.jsx';
import React from 'react';

beforeAll(() => {
  globalThis.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});


describe('ContributionCalendar', () => {
  const mockCalendar = {
    totalContributions: 120,
    weeks: [
      {
        contributionDays: [
          { date: '2026-01-01', contributionCount: 0, weekday: 0 },
          { date: '2026-01-02', contributionCount: 5, weekday: 1 },
        ]
      }
    ]
  };

  it('renders total contributions and metric grid cards', () => {
    render(<ContributionCalendar calendarData={mockCalendar} />);
    expect(screen.getByText('120')).toBeDefined();
    expect(screen.getByText('Total Contributions')).toBeDefined();
  });
});

describe('BadgesShelf', () => {
  const mockStats = { totalStars: 150, totalForks: 20, totalRepos: 10 };
  const mockLanguages = [
    { name: 'JavaScript', percentage: 40 },
    { name: 'Python', percentage: 30 },
  ];

  it('renders achievement badges shelf', () => {
    render(
      <BadgesShelf
        stats={mockStats}
        languages={mockLanguages}
        healthScores={{}}
        longestStreak={5}
      />
    );
    expect(screen.getByText('Star Collector')).toBeDefined();
  });
});
