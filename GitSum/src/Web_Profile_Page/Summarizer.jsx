import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import FloatingLanguages from "./FloatingLanguages";
import logo from "../assets/logo.png";
import "./Summarizer.css";

export const Summarizer = () => {
    const { username } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [repositories, setRepositories] = useState([]);
    const [languages, setLanguages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalSize, setTotalSize] = useState(0);

    useEffect(() => {
        const fetchGitHubData = async () => {
            try {
                setLoading(true);
                setError(null);

                const userResponse = await fetch(`https://api.github.com/users/${username}`);
                if (!userResponse.ok) {
                    throw new Error("User not found");
                }
                const userData = await userResponse.json();
                setProfileData(userData);

                // Fetch repositories
                const reposResponse = await fetch(
                    `https://api.github.com/users/${username}/repos?sort=stars&per_page=100`
                );
                const reposData = await reposResponse.json();
                setRepositories(reposData);

                // Calculate total size
                const total = reposData.reduce((acc, repo) => acc + (repo.size || 0), 0);
                setTotalSize(total);

                // Calculate language statistics
                const langStats = {};
                let totalLanguageRepos = 0;

                reposData.forEach((repo) => {
                    if (repo.language) {
                        langStats[repo.language] = (langStats[repo.language] || 0) + 1;
                        totalLanguageRepos += 1;
                    }
                });

                // Convert to percentages
                const langPercentages = {};
                Object.keys(langStats).forEach((lang) => {
                    langPercentages[lang] = Math.round(
                        (langStats[lang] / totalLanguageRepos) * 100
                    );
                });
                setLanguages(langPercentages);

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchGitHubData();
    }, [username]);

    if (loading) {
        return (
            <div className="summarizer-overlay">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Fetching GitHub Profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="summarizer-overlay">
                <div className="error-container">
                    <p className="error-text">Error: {error}</p>
                </div>
            </div>
        );
    }

    const calculatedStats = {
        totalStars: repositories.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0),
        totalForks: repositories.reduce((acc, repo) => acc + (repo.forks_count || 0), 0),
    };

    const languageLogos = {
        JavaScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
        Python: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
        Java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
        "C++": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
        C: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
        TypeScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
        Go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
        Rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg",
        Ruby: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
        PHP: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
        Swift: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
        Kotlin: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
        CSS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
        HTML: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
        SQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
        Shell: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
        Clojure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/clojure/clojure-original.svg",
        Scala: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg",
        R: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
        Perl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/perl/perl-original.svg",
        Lua: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg",
    };

    const frameworkLogos = {
        React: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
        Vue: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
        Angular: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
        Django: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",
        Flask: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
        FastAPI: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg",
        Node: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
        Express: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
        Spring: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg",
        Rails: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-original.svg",
        Laravel: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg",
        "Next.js": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
        Nuxt: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg",
        Gatsby: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gatsby/gatsby-original.svg",
        GraphQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg",
        Docker: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
        Kubernetes: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",
        AWS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
        Tailwind: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
    };

    const detectFrameworks = () => {
        const frameworks = new Set();
        const frameworkPatterns = {
            React: /react|nextjs?|gatsby/i,
            Vue: /vue|nuxt/i,
            Angular: /angular/i,
            Django: /django/i,
            Flask: /flask/i,
            FastAPI: /fastapi/i,
            Node: /node|nodejs|npm|express/i,
            Express: /express/i,
            Spring: /spring|springboot/i,
            Rails: /rails|ruby-on-rails/i,
            Laravel: /laravel|php/i,
            "Next.js": /next|nextjs/i,
            Nuxt: /nuxt/i,
            Gatsby: /gatsby/i,
            GraphQL: /graphql|apollo/i,
            Docker: /docker|container/i,
            Kubernetes: /kubernetes|k8s/i,
            AWS: /aws|amazon|s3|lambda/i,
            Tailwind: /tailwind|css/i,
        };

        repositories.forEach((repo) => {
            const repoName = repo.name || "";
            const repoDesc = repo.description || "";
            const combinedText = (repoName + " " + repoDesc).toLowerCase();

            Object.entries(frameworkPatterns).forEach(([framework, pattern]) => {
                if (pattern.test(combinedText)) {
                    frameworks.add(framework);
                }
            });
        });

        return Array.from(frameworks).sort();
    };

    const frameworks = detectFrameworks();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="summarizer-overlay">
            <FloatingLanguages languages={languages} />

            <div className="logo-container">
                <img src={logo} alt="GitSum Logo" className="gitsum-logo" />
            </div>

            <div className="summarizer-container">
                {/* Profile Overview Section */}
                <section className="profile-section">
                    <div className="profile-header">
                        <img
                            src={profileData?.avatar_url}
                            alt={profileData?.login}
                            className="profile-avatar"
                        />
                        <div className="profile-info">
                            <h1 className="profile-username">{profileData?.login}</h1>
                            <h2 className="profile-name">{profileData?.name || "N/A"}</h2>
                            <p className="profile-bio">{profileData?.bio || "No bio available"}</p>
                            <div className="profile-meta">
                                {profileData?.location && (
                                    <span className="meta-item">📍 {profileData.location}</span>
                                )}
                                {profileData?.company && (
                                    <span className="meta-item">🏢 {profileData.company}</span>
                                )}
                            </div>
                            <div className="profile-meta-dates">
                                <span className="meta-date">
                                    📅 Joined {formatDate(profileData?.created_at)}
                                </span>
                            </div>
                            <a
                                href={profileData?.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-link"
                            >
                                View GitHub Profile →
                            </a>
                        </div>
                    </div>
                </section>

                <section className="stats-section">
                    <h2 className="section-title">📊 Quick Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{profileData?.public_repos || 0}</div>
                            <div className="stat-label">Public Repos</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{profileData?.followers || 0}</div>
                            <div className="stat-label">Followers</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{profileData?.following || 0}</div>
                            <div className="stat-label">Following</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{calculatedStats.totalStars}</div>
                            <div className="stat-label">Total Stars</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{calculatedStats.totalForks}</div>
                            <div className="stat-label">Total Forks</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{formatSize(totalSize * 1024)}</div>
                            <div className="stat-label">Cloud Storage</div>
                        </div>
                    </div>
                </section>

                <section className="tech-stack-section">
                    <h2 className="section-title">💻 Tech Stack & Frameworks</h2>
                    <div className="tech-stack-container">
                        {/* Languages */}
                        <div className="tech-category">
                            <h3 className="tech-category-title">🗣️ Programming Languages</h3>
                            <div className="tech-grid">
                                {Object.keys(languages)
                                    .sort((a, b) => languages[b] - languages[a])
                                    .map((lang) => (
                                        <div key={lang} className="tech-card" title={`${lang} - ${languages[lang]}%`}>
                                            <img
                                                src={languageLogos[lang] || `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg`}
                                                alt={lang}
                                                className="tech-logo"
                                            />
                                            <p className="tech-name">{lang}</p>
                                            <span className="tech-percentage">{languages[lang]}%</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {frameworks.length > 0 && (
                            <div className="tech-category">
                                <h3 className="tech-category-title">🚀 Frameworks & Tools</h3>
                                <div className="tech-grid">
                                    {frameworks.map((framework) => (
                                        <div key={framework} className="tech-card framework-card" title={framework}>
                                            <img
                                                src={frameworkLogos[framework]}
                                                alt={framework}
                                                className="tech-logo"
                                                onError={(e) => {
                                                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23ff9c42' width='64' height='64' rx='8'/%3E%3Ctext x='32' y='40' text-anchor='middle' fill='%23fff' font-size='12' font-weight='bold'%3E${framework.charAt(0)}%3C/text%3E%3C/svg%3E`;
                                                }}
                                            />
                                            <p className="tech-name">{framework}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="github-stats-section">
                    <h2 className="section-title">📈 GitHub Statistics</h2>

                    {/* Overall Stats Card */}
                    <div className="stats-cards-container">
                        <div className="stats-card-wrapper">
                            <img
                                src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=radical&hide_title=true`}
                                alt="GitHub Stats"
                                className="github-stats-image"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23222' width='400' height='200'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Stats...%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>

                        <div className="stats-card-wrapper">
                            <img
                                src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=radical&hide_title=true`}
                                alt="Top Languages"
                                className="github-stats-image"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23222' width='400' height='200'/%3E%3Ctext x='200' y='100' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Languages...%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>
                    </div>
                </section>

                <section className="contribution-section">
                    <h2 className="section-title">🔥 Contribution Streak</h2>
                    <div className="graph-container">
                        <img
                            src={`https://streak-stats.demolab.com?user=${username}&theme=dark&hide_border=true`}
                            alt="GitHub Contribution Streak"
                            className="github-graph-image"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Crect fill='%23222' width='600' height='300'/%3E%3Ctext x='300' y='150' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Streak Stats...%3C/text%3E%3C/svg%3E";
                            }}
                        />
                    </div>
                </section>

                <section className="activity-section">
                    <h2 className="section-title">📅 Commit Activity Graph</h2>
                    <div className="graph-container">
                        <img
                            src={`https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=react-dark&bg_color=0f2027,203a43,2c5364&color=ffffff&line=00c6ff&point=ffffff&area=true&hide_border=true`}
                            alt="GitHub Activity Graph"
                            className="github-graph-image"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='300'%3E%3Crect fill='%23222' width='900' height='300'/%3E%3Ctext x='450' y='150' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Activity Graph...%3C/text%3E%3C/svg%3E";
                            }}
                        />
                    </div>
                </section>

                <section className="profile-summary-section">
                    <h2 className="section-title">🏆 Achievements Showcase</h2>
                    <div className="graph-container">
                        <img
                            src={`https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${username}&theme=radical`}
                            alt="Profile Summary"
                            className="github-graph-image"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='300'%3E%3Crect fill='%23222' width='900' height='300'/%3E%3Ctext x='450' y='150' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Profile Summary...%3C/text%3E%3C/svg%3E";
                            }}
                        />
                    </div>
                </section>

                <section className="language-analytics-section">
                    <h2 className="section-title">🎨 Language Usage Analytics</h2>

                    <div className="analytics-cards-container">
                        {/* Repos Per Language */}
                        <div className="analytics-card-wrapper">
                            <img
                                src={`https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${username}&theme=radical`}
                                alt="Repos per Language"
                                className="github-analytics-image"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300'%3E%3Crect fill='%23222' width='500' height='300'/%3E%3Ctext x='250' y='150' text-anchor='middle' fill='%23fff' font-size='18'%3ELoading Language Stats...%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>

                        <div className="analytics-card-wrapper">
                            <img
                                src={`https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=${username}&theme=radical`}
                                alt="Most Commit Language"
                                className="github-analytics-image"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300'%3E%3Crect fill='%23222' width='500' height='300'/%3E%3Ctext x='250' y='150' text-anchor='middle' fill='%23fff' font-size='18'%3ELoading Commit Stats...%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        </div>
                    </div>
                </section>

                <section className="coding-habits-section">
                    <h2 className="section-title">⏰ Coding Habits</h2>
                    <div className="graph-container">
                        <img
                            src={`https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=${username}&theme=radical&utcOffset=5.30`}
                            alt="Productive Time"
                            className="github-graph-image"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='300'%3E%3Crect fill='%23222' width='900' height='300'/%3E%3Ctext x='450' y='150' text-anchor='middle' fill='%23fff' font-size='20'%3ELoading Coding Habits...%3C/text%3E%3C/svg%3E";
                                }}
                            />
                    </div>
                </section>

                {Object.keys(languages).length > 0 && (
                    <section className="languages-section">
                        <h2 className="section-title">🧠 Repository Languages</h2>
                        <div className="languages-container">
                            {Object.entries(languages)
                                .sort((a, b) => b[1] - a[1])
                                .map(([lang, percentage]) => (
                                    <div key={lang} className="language-item">
                                        <div className="language-header">
                                            <span className="language-name">{lang}</span>
                                            <span className="language-percentage">{percentage}%</span>
                                        </div>
                                        <div className="language-bar">
                                            <div
                                                className="language-fill"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                )}

                {repositories.length > 0 && (
                    <section className="repos-section">
                        <h2 className="section-title">⭐ Top Repositories</h2>
                        <div className="repos-container">
                            {repositories.slice(0, 10).map((repo) => (
                                <div key={repo.id} className="repo-card">
                                    <div className="repo-header">
                                        <h3 className="repo-name">
                                            <a
                                                href={repo.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {repo.name}
                                            </a>
                                        </h3>
                                        {repo.language && (
                                            <span className="repo-language">{repo.language}</span>
                                        )}
                                    </div>
                                    <p className="repo-description">
                                        {repo.description || "No description available"}
                                    </p>
                                    <div className="repo-stats">
                                        <span className="repo-stat">⭐ {repo.stargazers_count}</span>
                                        <span className="repo-stat">🔀 {repo.forks_count}</span>
                                        <span className="repo-stat">
                                            📦 {formatSize(repo.size * 1024)}
                                        </span>
                                        <span className="repo-stat">
                                            🕐 {formatDate(repo.updated_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="footer-section">
                    <div className="footer-content">
                        <p className="footer-text">
                            ✨ <strong>GitSum</strong> - Visualize your GitHub journey at a glance
                        </p>
                        <p className="footer-remarks">
                            This application provides comprehensive analytics and insights about your GitHub profile. 
                            All data is fetched in real-time from the GitHub API. No data is stored on our servers.
                        </p>
                        <p className="footer-creator">
                            Created by <a href="https://github.com/AtharvaKailasKadam" target="_blank" rel="noopener noreferrer">@AtharvaKailasKadam</a>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};
// Still working on it.