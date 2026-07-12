/**
 * Skeleton loader components — shimmer placeholders that match the shape
 * of each dashboard section. Shown during data fetch instead of a spinner.
 */

/** Generic shimmer line */
function ShimmerLine({ width = '100%', height = '1rem', radius = '6px' }) {
  return (
    <div
      className="shimmer"
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Skeleton for the profile header */
export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile" aria-label="Loading profile…">
      <div className="shimmer skeleton-avatar" />
      <div className="skeleton-profile-info">
        <ShimmerLine width="200px" height="1.5rem" />
        <ShimmerLine width="140px" height="1rem" />
        <ShimmerLine width="90%" height="0.875rem" />
        <ShimmerLine width="70%" height="0.875rem" />
      </div>
    </div>
  );
}

/** Skeleton for a row of stat cards */
export function StatsSkeleton() {
  return (
    <div className="skeleton-stats-grid" aria-label="Loading stats…">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer skeleton-stat-card" />
      ))}
    </div>
  );
}

/** Skeleton for a generic section block */
export function SectionSkeleton({ lines = 4 }) {
  return (
    <div className="skeleton-section" aria-label="Loading…">
      <ShimmerLine width="180px" height="1.25rem" radius="8px" />
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerLine key={i} width={i % 2 === 0 ? '100%' : '80%'} height="0.875rem" />
      ))}
    </div>
  );
}

/** Skeleton for a grid of repo cards */
export function ReposSkeleton() {
  return (
    <div className="skeleton-repos" aria-label="Loading repos…">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer skeleton-repo-card" />
      ))}
    </div>
  );
}

/** Full-page skeleton that mirrors the dashboard layout */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" role="status" aria-live="polite" aria-label="Loading dashboard…">
      <ProfileSkeleton />
      <StatsSkeleton />
      <SectionSkeleton lines={3} />
      <SectionSkeleton lines={5} />
      <ReposSkeleton />
    </div>
  );
}
