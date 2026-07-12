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
 * Fetches the contribution calendar for the given username.
 * Falls back to a mock calendar if no GITHUB_TOKEN is configured.
 * 
 * @param {string} username
 * @returns {Promise<object>} The contribution calendar data
 */
export async function fetchContributions(username) {
  if (!config.githubToken) {
    console.warn(`⚠️ No GITHUB_TOKEN configured. Serving mock contribution calendar for ${username}.`);
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
