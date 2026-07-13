import { config } from '../config.js';

/**
 * Service to interact with GitHub GraphQL API
 */

const CALENDAR_QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

/**
 * Helper to parse GitHub public contributions HTML snippet.
 * Order-independent parsing of data-date, data-level, and count from tooltip.
 *
 * @param {string} html
 * @returns {object} The contribution calendar object
 */
function parseContributionHtml(html) {
  const tdRegex = /<td\s+[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/g;
  const dateRegex = /data-date="([^"]+)"/;
  const levelRegex = /data-level="([^"]+)"/;
  const idRegex = /id="([^"]+)"/;

  const tooltipRegex = /<tool-tip\s+[^>]*>([\s\S]*?)<\/tool-tip>/g;
  const forRegex = /for="([^"]+)"/;

  const idToCount = {};
  let match;

  // Extract all tooltips and their counts
  tooltipRegex.lastIndex = 0;
  while ((match = tooltipRegex.exec(html)) !== null) {
    const tooltipTag = match[0];
    const text = match[1].trim();
    const forM = tooltipTag.match(forRegex);

    if (forM) {
      const forId = forM[1];
      let count = 0;
      if (text.toLowerCase().includes('no contributions')) {
        count = 0;
      } else {
        const numMatch = text.match(/^(\d+)\s+contribution/i);
        if (numMatch) {
          count = parseInt(numMatch[1], 10);
        }
      }
      idToCount[forId] = count;
    }
  }

  const days = [];
  tdRegex.lastIndex = 0;
  while ((match = tdRegex.exec(html)) !== null) {
    const tdTag = match[0];
    const dateM = tdTag.match(dateRegex);
    const levelM = tdTag.match(levelRegex);
    const idM = tdTag.match(idRegex);

    if (dateM && levelM && idM) {
      const date = dateM[1];
      const level = parseInt(levelM[1], 10);
      const id = idM[1];

      let contributionCount = idToCount[id];
      if (contributionCount === undefined) {
        if (level === 0) contributionCount = 0;
        else if (level === 1) contributionCount = 1;
        else if (level === 2) contributionCount = 3;
        else if (level === 3) contributionCount = 6;
        else if (level === 4) contributionCount = 10;
      }

      const d = new Date(date);
      const weekday = d.getUTCDay();

      days.push({
        date,
        contributionCount,
        weekday
      });
    }
  }

  // Sort days chronologically
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];

  days.forEach(day => {
    // Start a new week column on Sundays
    if (day.weekday === 0 && currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  const totalContributions = days.reduce((sum, day) => sum + day.contributionCount, 0);

  return {
    totalContributions,
    weeks
  };
}

/**
 * Fetches the contribution calendar for the given username.
 * Falls back to public HTML scraping (without token) or mock calendar.
 *
 * @param {string} username
 * @returns {Promise<object>} The contribution calendar data
 */
export async function fetchContributions(username) {
  if (!config.githubToken) {
    console.warn(`⚠️ No GITHUB_TOKEN configured. Fetching public contribution calendar for ${username}.`);
    try {
      const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const html = await res.text();
        return parseContributionHtml(html);
      } else {
        console.error(`GitHub public contributions returned HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`Failed to scrape contributions: ${e.message}. Falling back to mock data.`);
    }
    return generateMockCalendar(username);
  }

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.githubToken}`,
        'User-Agent': 'GitSum-Server/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CALENDAR_QUERY,
        variables: { username }
      })
    });

    if (!res.ok) {
      throw new Error(`GitHub GraphQL HTTP error: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(`GitHub GraphQL query errors: ${json.errors.map(e => e.message).join(', ')}`);
    }

    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) {
      throw new Error(`Could not find contribution calendar for user ${username}`);
    }

    return calendar;
  } catch (err) {
    console.error(`Error fetching real contributions collection: ${err.message}. Falling back to mock data.`);
    return generateMockCalendar(username);
  }
}

/**
 * Generates a realistic mock contribution calendar for local demonstration.
 */
function generateMockCalendar(username) {
  const weeks = [];
  let totalContributions = 0;
  const today = new Date();

  // Loop back 52 weeks (approx 364 days)
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);
  // Shift start date to the preceding Sunday to align calendar grid columns
  const dayOffset = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOffset);

  let current = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const contributionDays = [];
    for (let d = 0; d < 7; d++) {
      // Don't generate days in the future
      if (current > today) {
        break;
      }

      // Generate random-looking activity
      // Mostly 0, occasionally 1-8 commits.
      const seed = Math.random();
      let contributionCount = 0;
      if (seed > 0.85) {
        contributionCount = Math.floor(Math.random() * 4) + 1; // 1-4 commits
      } else if (seed > 0.96) {
        contributionCount = Math.floor(Math.random() * 5) + 4; // 4-8 commits
      }

      totalContributions += contributionCount;

      contributionDays.push({
        date: current.toISOString().split('T')[0],
        contributionCount,
        weekday: d
      });

      // Advance by 1 day
      current.setDate(current.getDate() + 1);
    }
    weeks.push({ contributionDays });
  }

  return {
    totalContributions,
    weeks,
    isMock: true
  };
}
