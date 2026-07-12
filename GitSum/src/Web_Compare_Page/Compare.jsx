import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useGitHubProfile } from '../hooks/useGitHubProfile.js';
import { useGitHubRepos } from '../hooks/useGitHubRepos.js';
import { useDerivedStats } from '../hooks/useDerivedStats.js';
import { DashboardSkeleton } from '../components/SkeletonLoader.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import './Compare.css';

function CompareUserCard({ profile, stats, isWinner }) {
  return (
    <div className={`compare-user-card ${isWinner ? 'winner-glow' : ''}`}>
      {isWinner && <span className="winner-label">🏆 Dominant Presence</span>}
      <div className="compare-user-header">
        <img src={profile.avatar_url} alt="" className="compare-user-avatar" />
        <div>
          <h3 className="compare-user-name">{profile.name || profile.login}</h3>
          <span className="compare-user-login">@{profile.login}</span>
        </div>
      </div>
      {profile.bio && <p className="compare-user-bio">{profile.bio}</p>}
      
      <div className="compare-stats-list">
        <div className="compare-stat-row">
          <span>📁 Public Repos:</span>
          <strong>{profile.public_repos}</strong>
        </div>
        <div className="compare-stat-row">
          <span>👥 Followers:</span>
          <strong>{profile.followers}</strong>
        </div>
        <div className="compare-stat-row">
          <span>⭐ Total Stars:</span>
          <strong>{stats.totalStars}</strong>
        </div>
        <div className="compare-stat-row">
          <span>🔀 Total Forks:</span>
          <strong>{stats.totalForks}</strong>
        </div>
      </div>
    </div>
  );
}

export function Compare() {
  const { userA, userB } = useParams();
  const navigate = useNavigate();

  // Load User A
  const { data: profileA, loading: loadingProfileA } = useGitHubProfile(userA);
  const { data: reposA, loading: loadingReposA } = useGitHubRepos(userA);
  const statsA = useDerivedStats(reposA);

  // Load User B
  const { data: profileB, loading: loadingProfileB } = useGitHubProfile(userB);
  const { data: reposB, loading: loadingReposB } = useGitHubRepos(userB);
  const statsB = useDerivedStats(reposB);

  const loading = loadingProfileA || loadingReposA || loadingProfileB || loadingReposB;

  // Decide who is the dominant profile
  const scores = useMemo(() => {
    if (!profileA || !profileB) return { a: 0, b: 0 };
    let a = 0, b = 0;
    
    if (profileA.followers > profileB.followers) a++; else if (profileB.followers > profileA.followers) b++;
    if (profileA.public_repos > profileB.public_repos) a++; else if (profileB.public_repos > profileA.public_repos) b++;
    if (statsA.totalStars > statsB.totalStars) a++; else if (statsB.totalStars > statsA.totalStars) b++;
    if (statsA.totalForks > statsB.totalForks) a++; else if (statsB.totalForks > statsA.totalForks) b++;
    
    return { a, b };
  }, [profileA, profileB, statsA, statsB]);

  // Radar Data calculation
  const radarData = useMemo(() => {
    if (!profileA || !profileB) return [];

    // Max values for normalization
    const maxFollowers = Math.max(profileA.followers, profileB.followers, 1);
    const maxRepos = Math.max(profileA.public_repos, profileB.public_repos, 1);
    const maxStars = Math.max(statsA.totalStars, statsB.totalStars, 1);
    const maxForks = Math.max(statsA.totalForks, statsB.totalForks, 1);

    return [
      {
        subject: 'Followers',
        A: Math.round((profileA.followers / maxFollowers) * 100),
        B: Math.round((profileB.followers / maxFollowers) * 100),
        rawA: profileA.followers,
        rawB: profileB.followers
      },
      {
        subject: 'Repositories',
        A: Math.round((profileA.public_repos / maxRepos) * 100),
        B: Math.round((profileB.public_repos / maxRepos) * 100),
        rawA: profileA.public_repos,
        rawB: profileB.public_repos
      },
      {
        subject: 'Stars Earned',
        A: Math.round((statsA.totalStars / maxStars) * 100),
        B: Math.round((statsB.totalStars / maxStars) * 100),
        rawA: statsA.totalStars,
        rawB: statsB.totalStars
      },
      {
        subject: 'Forks Earned',
        A: Math.round((statsA.totalForks / maxForks) * 100),
        B: Math.round((statsB.totalForks / maxForks) * 100),
        rawA: statsA.totalForks,
        rawB: statsB.totalForks
      }
    ];
  }, [profileA, profileB, statsA, statsB]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!profileA || !profileB) {
    return (
      <div className="state-screen">
        <span className="state-icon">🔭</span>
        <h1 className="state-title">Comparison Failed</h1>
        <p className="state-message">Could not load profiles for A: {userA} or B: {userB}.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="compare-page">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="topbar-logo-icon">⚔️</span>
          <span className="topbar-title font-title">Compare Mode</span>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button onClick={() => navigate(`/profile/${userA}`)} className="btn-secondary">
            View @{userA}
          </button>
          <button onClick={() => navigate(`/profile/${userB}`)} className="btn-secondary">
            View @{userB}
          </button>
        </div>
      </header>

      <main className="compare-container">
        <motion.div
          className="compare-intro"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>@{userA} vs @{userB}</h2>
          <p>Side-by-side index comparison normalized to peak performance benchmarks.</p>
        </motion.div>

        {/* Side-by-side cards */}
        <div className="compare-grid">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CompareUserCard
              profile={profileA}
              stats={statsA}
              isWinner={scores.a > scores.b}
            />
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3 className="chart-card-title">Metric Performance Index</h3>
            <div className="radar-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--clr-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--clr-text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }} />
                  <Radar
                    name={`@${userA}`}
                    dataKey="A"
                    stroke="#ff9c42"
                    fill="#ff9c42"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name={`@${userB}`}
                    dataKey="B"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="radar-tooltip">
                            <span className="tooltip-subject">{data.subject}</span>
                            <span className="tooltip-value value-a">@{userA}: {data.rawA} ({data.A}%)</span>
                            <span className="tooltip-value value-b">@{userB}: {data.rawB} ({data.B}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CompareUserCard
              profile={profileB}
              stats={statsB}
              isWinner={scores.b > scores.a}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
