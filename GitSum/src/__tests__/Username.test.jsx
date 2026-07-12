import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { EnterUserName } from '../Web_Login_Page/Username.jsx';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock FloatingMarks since it uses requestAnimationFrame and canvas/svg which are hard to test in jsdom
vi.mock('../Web_Welcome_Page/FloatingMarks', () => {
  return {
    default: () => <div data-testid="floating-marks" />,
  };
});

describe('EnterUserName Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search profile heading and inputs correctly', () => {
    render(
      <BrowserRouter>
        <EnterUserName />
      </BrowserRouter>
    );

    expect(screen.getByText('Search a profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. torvalds')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summarize/i })).toBeInTheDocument();
  });

  it('shows inline validation error on empty submit', () => {
    render(
      <BrowserRouter>
        <EnterUserName />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Summarize/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please enter a GitHub username.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid characters', () => {
    render(
      <BrowserRouter>
        <EnterUserName />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('e.g. torvalds');
    fireEvent.change(input, { target: { value: 'user_name_with_underscores' } });

    const submitBtn = screen.getByRole('button', { name: /Summarize/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('GitHub usernames may only contain letters, numbers, and hyphens.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to profile page on valid username submission', () => {
    render(
      <BrowserRouter>
        <EnterUserName />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('e.g. torvalds');
    fireEvent.change(input, { target: { value: 'Gaearon' } });

    const submitBtn = screen.getByRole('button', { name: /Summarize/i });
    fireEvent.click(submitBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/profile/Gaearon');
  });
});
