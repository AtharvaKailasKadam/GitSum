import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import PropTypes from 'prop-types';
import FloatingLanguages from './FloatingLanguages';
import logo from '../assets/logo.png';
import { useGitHubProfile, NotFoundError, RateLimitError } from '../hooks/useGitHubProfile.js';
import { useGitHubRepos } from '../hooks/useGitHubRepos.js';
import { useDerivedStats } from '../hooks/useDerivedStats.js';
import { useGitHubContributions } from '../hooks/useGitHubContributions.js';
import { useGitHubHealth } from '../hooks/useGitHubHealth.js';
import { DashboardSkeleton } from '../components/SkeletonLoader.jsx';
import { NotFoundUser } from '../components/NotFoundUser.jsx';
import { RateLimited } from '../components/RateLimited.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { ProfileOverview } from './sections/ProfileOverview.jsx';
import { QuickStats } from './sections/QuickStats.jsx';
import { TechStack } from './sections/TechStack.jsx';
import { StatsCards } from './sections/StatsCards.jsx';
import { StreakCard } from './sections/StreakCard.jsx';
import { ActivityGraph } from './sections/ActivityGraph.jsx';
import { AchievementsCard } from './sections/AchievementsCard.jsx';
import { LanguageAnalytics } from './sections/LanguageAnalytics.jsx';
import { CodingHabits } from './sections/CodingHabits.jsx';
import { RepoLanguageBars } from './sections/RepoLanguageBars.jsx';
import { TopRepos } from './sections/TopRepos.jsx';
import { AiInsights } from './sections/AiInsights.jsx';
import { ContributionCalendar } from './sections/ContributionCalendar.jsx';
import { BadgesShelf } from './sections/BadgesShelf.jsx';
import { ProfileReadme } from './sections/ProfileReadme.jsx';
import { ProfileChat } from './sections/ProfileChat.jsx';
import { GithubWrapped } from './sections/GithubWrapped.jsx';
import './Summarizer.css';

/** Copy the current page URL to the clipboard and give brief feedback. */
function useShareProfile() {
    const share = async () => {
        await navigator.clipboard.writeText(window.location.href);
        // Tiny non-blocking visual feedback via the button's title attribute
        const btn = document.getElementById('share-btn');
        if (btn) {
            const original = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => { btn.textContent = original; }, 2000);
        }
    };
    return share;
}

/** Save successfully loaded profile to recent localStorage history */
function saveProfileToHistory(login, avatarUrl) {
    try {
        const raw = localStorage.getItem('gitsum-recent') ?? '[]';
        let recent = JSON.parse(raw);
        if (!Array.isArray(recent)) recent = [];

        recent = recent.filter(u => u.login.toLowerCase() !== login.toLowerCase());
        recent.unshift({ login, avatarUrl });
        recent = recent.slice(0, 8);

        localStorage.setItem('gitsum-recent', JSON.stringify(recent));
    } catch (e) {
        console.error('Failed to save profile to history:', e);
    }
}

export function Summarizer() {
    const { username } = useParams();
    const navigate = useNavigate();
    const dashboardRef = useRef(null);
    const shareProfile = useShareProfile();

    const [showWrapped, setShowWrapped] = useState(false);

    const { data: profile, loading: profileLoading, error: profileError } = useGitHubProfile(username);
    const { data: repos, loading: reposLoading } = useGitHubRepos(username);
    const { totalStars, totalForks, totalSizeFormatted, languages, frameworks } = useDerivedStats(repos);

    const { data: calendarData, loading: calendarLoading } = useGitHubContributions(username);
    const { healthScores } = useGitHubHealth(username);

    const loading = profileLoading || reposLoading;

    useEffect(() => {
        if (profile) {
            saveProfileToHistory(profile.login, profile.avatar_url);
        }
    }, [profile]);

    const printResume = () => {
        window.print();
    };

    const triggerCompare = () => {
        const otherUser = prompt("Enter a GitHub username to compare with:");
        if (otherUser && otherUser.trim()) {
            navigate(`/compare/${username}/${otherUser.trim()}`);
        }
    };

    /** Download the dashboard card as a PNG image. */
    const downloadImage = async () => {
        if (!dashboardRef.current) return;
        try {
            const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
            const dataUrl = await toPng(dashboardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: isLightTheme ? '#f5f5fa' : '#0a0a0f',
                style: {
                    borderRadius: '0px',
                    padding: '24px',
                },
                skipFonts: true,
            });
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `gitsum-${username}.png`;
            link.click();
        } catch (e) {
            console.error('Image export failed:', e);
        }
    };

    // ── Error states ────────────────────────────────────────────────────────────
    if (!loading && profileError instanceof NotFoundError) {
        return (
            <div className="summarizer-overlay">
                <NotFoundUser username={username} />
            </div>
        );
    }

    if (!loading && profileError instanceof RateLimitError) {
        return (
            <div className="summarizer-overlay">
                <RateLimited retryAfter={profileError.retryAfter} />
            </div>
        );
    }

    if (!loading && profileError) {
        return (
            <div className="summarizer-overlay">
                <div className="state-screen" role="alert">
                    <div className="state-icon">❌</div>
                    <h2 className="state-title">Something went wrong</h2>
                    <p className="state-message">{profileError.message}</p>
                    <button className="btn-primary" onClick={() => navigate('/login')}>Go back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="summarizer-overlay">
            <FloatingLanguages languages={
                Object.fromEntries(languages.map((l) => [l.name, l.percentage]))
            } />

            {/* ── Top bar ── */}
            <header className="dashboard-topbar" aria-label="GitSum navigation">
                <div
                    className="topbar-logo-link"
                    onClick={() => navigate('/')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <img
                        src={logo}
                        alt="GitSum logo"
                        className="gitsum-logo"
                    />
                    <span className="gitsum-logo-text comic-font">GitSum</span>
                </div>
                <div className="topbar-actions" aria-label="Dashboard actions">
                    <button className="btn-ghost" onClick={() => setShowWrapped(true)} aria-label="Open GitHub Wrapped Year Recap" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png" alt="" className="btn-3d-icon" /> Wrapped
                    </button>
                    <button className="btn-ghost" onClick={triggerCompare} aria-label="Compare with another user" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crossed%20swords/3D/crossed_swords_3d.png" alt="" className="btn-3d-icon" /> Compare
                    </button>
                    <button className="btn-ghost" onClick={printResume} aria-label="Print as developer resume" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Page%20facing%20up/3D/page_facing_up_3d.png" alt="" className="btn-3d-icon" /> Resume
                    </button>
                    <button id="share-btn" className="btn-ghost" onClick={shareProfile} aria-label="Copy profile link" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Link/3D/link_3d.png" alt="" className="btn-3d-icon" /> Share
                    </button>
                    <button className="btn-ghost" onClick={downloadImage} aria-label="Download dashboard as image" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Down%20arrow/3D/down_arrow_3d.png" alt="" className="btn-3d-icon" /> Export
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            {/* ── Main content ── */}
            <main
                className="summarizer-container"
                ref={dashboardRef}
                aria-live="polite"
                aria-busy={loading}
            >
                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <ProfileOverview profile={profile} />

                        <nav className="inpage-nav" aria-label="Profile section navigation">
                            <a href="#overview" className="inpage-nav-link">Overview</a>
                            <a href="#ai-insights" className="inpage-nav-link">AI Narrative</a>
                            <a href="#overview-stats" className="inpage-nav-link">Stats</a>
                            <a href="#languages" className="inpage-nav-link">Tech Stack</a>
                            <a href="#overview-github" className="inpage-nav-link">GitHub Cards</a>
                            <a href="#activity" className="inpage-nav-link">Activity</a>
                            <a href="#repositories" className="inpage-nav-link">Repositories</a>
                        </nav>

                        {/* Feature 1: AI insights narrative */}
                        <AiInsights
                            username={username}
                            profile={profile}
                            languages={languages}
                            frameworks={frameworks}
                            stats={{ totalStars, totalForks, totalSizeFormatted, totalRepos: repos.length }}
                        />

                        <QuickStats
                            profile={profile}
                            totalStars={totalStars}
                            totalForks={totalForks}
                            totalSizeFormatted={totalSizeFormatted}
                            repos={repos}
                        />
                        <TechStack languages={languages} frameworks={frameworks} />
                        <StatsCards username={username} />
                        <StreakCard username={username} />
                        <ActivityGraph username={username} />

                        {/* Feature 3: Real Contribution Calendar */}
                        {!calendarLoading && calendarData && (
                            <ContributionCalendar calendarData={calendarData} />
                        )}

                        <AchievementsCard username={username} />

                        {/* Feature 8: Custom Badges Shelf */}
                        <BadgesShelf
                            stats={{ totalStars, totalForks, totalRepos: repos.length }}
                            languages={languages}
                            healthScores={healthScores}
                            longestStreak={calendarData?.longestStreak ?? 0}
                        />

                        <LanguageAnalytics username={username} />
                        <CodingHabits username={username} />
                        <RepoLanguageBars languages={languages} />


                        {/* Feature 5 & 9: Top Repos list with health checklists and sorting filters */}
                        <TopRepos repos={repos} healthScores={healthScores} />

                        <footer className="dashboard-footer">
                            <p>
                                ✨ <strong className="comic-font">GitSum</strong> — Visualize your GitHub journey at a glance.
                            </p>
                            <p className="footer-sub">
                                Data sourced from GitHub API via a secure server-side proxy.
                                No data stored on our servers.
                            </p>
                            <p className="footer-creator">
                                Created by{' '}
                                <a href="https://github.com/AtharvaKailasKadam" target="_blank" rel="noopener noreferrer">
                                    @AtharvaKailasKadam
                                </a>
                            </p>
                        </footer>
                    </>
                )}
            </main>

            {/* Feature 2: Floating AI Chat pane */}
            {!loading && profile && (
                <ProfileChat
                    username={username}
                    profile={profile}
                    languages={languages}
                    frameworks={frameworks}
                    stats={{ totalStars, totalForks }}
                />
            )}

            {/* Feature 7: GitHub Wrapped Slideshow Overlay */}
            {showWrapped && !loading && profile && calendarData && (
                <GithubWrapped
                    profile={profile}
                    stats={{ totalStars, totalForks, totalSizeFormatted }}
                    languages={languages}
                    calendarData={calendarData}
                    healthScores={healthScores}
                    onClose={() => setShowWrapped(false)}
                />
            )}
        </div>
    );
}

Summarizer.propTypes = {
    // No external props — username comes from route params
};