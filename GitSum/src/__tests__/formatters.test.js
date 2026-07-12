import { describe, it, expect } from 'vitest';
import { formatSize, formatDate, formatNumber, minutesUntilReset } from '../utils/formatters.js';

describe('formatSize', () => {
  it('correctly formats bytes to human readable formats', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1024 * 1024)).toBe('1 MB');
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('handles negative or invalid sizes gracefully', () => {
    expect(formatSize(-100)).toBe('0 B');
    expect(formatSize(null)).toBe('0 B');
    expect(formatSize(undefined)).toBe('0 B');
  });
});

describe('formatDate', () => {
  it('formats ISO date string into locale date', () => {
    const formatted = formatDate('2026-07-12T14:03:18Z');
    // locale dependent test fallback or broad match
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Jul');
  });

  it('handles empty dates gracefully', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(0)).toBe('0');
  });
});

describe('minutesUntilReset', () => {
  it('returns ceiling of minutes remaining', () => {
    expect(minutesUntilReset(120)).toBe(2);
    expect(minutesUntilReset(59)).toBe(1);
    expect(minutesUntilReset(0)).toBe(1);
    expect(minutesUntilReset(-10)).toBe(1);
  });
});
