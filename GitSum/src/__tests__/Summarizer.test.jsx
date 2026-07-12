import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Summarizer } from '../Web_Profile_Page/Summarizer.jsx';
import { NotFoundError, RateLimitError } from '../hooks/useGitHubProfile.js';

// Mock IntersectionObserver for Framer Motion
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock hooks
vi.mock('../hooks/useGitHubProfile.js', () => {
  return {
    useGitHubProfile: vi.fn(),
    NotFoundError: class NotFoundError extends Error {
      constructor() { super('Not Found'); this.name = 'NotFoundError'; }
    },
    RateLimitError: class RateLimitError extends Error {
      constructor(retryAfter = 60) {
        super('Rate Limit');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
      }
    },
  };
});

vi.mock('../hooks/useGitHubRepos.js', () => {
  return {
    useGitHubRepos: vi.fn(),
  };
});

vi.mock('../hooks/useDerivedStats.js', () => {
  return {
    useDerivedStats: vi.fn(),
  };
});

// Mock floating elements
vi.mock('../Web_Profile_Page/FloatingLanguages', () => {
  return {
    default: () => <div data-testid="floating-languages" />,
  };
});

// Mock sub-sections
vi.mock('../Web_Profile_Page/sections/ProfileOverview.jsx', () => ({
  ProfileOverview: () => <div data-testid="profile-overview" />,
}));
vi.mock('../Web_Profile_Page/sections/QuickStats.jsx', () => ({
  QuickStats: () => <div data-testid="quick-stats" />,
}));

// Import the mocked hooks so we can configure their return values
import { useGitHubProfile } from '../hooks/useGitHubProfile.js';
import { useGitHubRepos } from '../hooks/useGitHubRepos.js';
import { useDerivedStats } from '../hooks/useDerivedStats.js';

describe('Summarizer Orchestrator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior
    useDerivedStats.mockReturnValue({
      totalStars: 10,
      totalForks: 5,
      totalSizeFormatted: '120 KB',
      languages: [],
      frameworks: [],
    });
  });

  it('renders shimmer skeleton loaders while loading data', () => {
    useGitHubProfile.mockReturnValue({ data: null, loading: true, error: null });
    useGitHubRepos.mockReturnValue({ data: [], loading: true, error: null });

    render(
      <BrowserRouter>
        <Summarizer />
      </BrowserRouter>
    );

    // Should find skeleton status regions
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-overview')).not.toBeInTheDocument();
  });

  it('renders NotFoundUser screen when user does not exist', () => {
    useGitHubProfile.mockReturnValue({
      data: null,
      loading: false,
      error: new NotFoundError(),
    });
    useGitHubRepos.mockReturnValue({ data: [], loading: false, error: null });

    render(
      <BrowserRouter>
        <Summarizer />
      </BrowserRouter>
    );

    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('renders RateLimited screen when rate limit is hit', () => {
    useGitHubProfile.mockReturnValue({
      data: null,
      loading: false,
      error: new RateLimitError(120),
    });
    useGitHubRepos.mockReturnValue({ data: [], loading: false, error: null });

    render(
      <BrowserRouter>
        <Summarizer />
      </BrowserRouter>
    );

    expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
    expect(screen.getByText('120s')).toBeInTheDocument();
  });

  it('renders dashboard sub-sections upon successful data fetch', () => {
    useGitHubProfile.mockReturnValue({
      data: { login: 'octocat', avatar_url: 'avatar' },
      loading: false,
      error: null,
    });
    useGitHubRepos.mockReturnValue({
      data: [{ id: 1, name: 'hello-world' }],
      loading: false,
      error: null,
    });

    render(
      <BrowserRouter>
        <Summarizer />
      </BrowserRouter>
    );

    expect(screen.getByTestId('profile-overview')).toBeInTheDocument();
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
  });
});
