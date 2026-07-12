import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.012 } }
};

const columnVariants = {
  hidden: { opacity: 0, scaleY: 0.8 },
  visible: { opacity: 1, scaleY: 1, transition: { duration: 0.25, ease: 'easeOut' } }
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ContributionCalendar({ calendarData }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { totalContributions, weeks } = calendarData;

  // Flatten days to compute streaks and trends
  const days = useMemo(() => {
    if (!weeks) return [];
    return weeks.flatMap(w => w.contributionDays);
  }, [weeks]);

  const metrics = useMemo(() => {
    if (days.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeWeekday: 'N/A', activeMonth: 'N/A' };
    }

    // 1. Longest Streak
    let longestStreak = 0;
    let runningStreak = 0;
    days.forEach(day => {
      if (day.contributionCount > 0) {
        runningStreak++;
        longestStreak = Math.max(longestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    });

    // 2. Current Streak
    let currentStreak = 0;
    // Iterate backwards from the end of the calendar (most recent day)
    for (let i = days.length - 1; i >= 0; i--) {
      const count = days[i].contributionCount;
      if (count > 0) {
        currentStreak++;
      } else {
        // If the last day has 0 commits, check if it's today. If it is today, allow checking yesterday before breaking.
        if (i === days.length - 1) {
          const lastDate = new Date(days[i].date);
          const today = new Date();
          // If the last date is today, check yesterday. If yesterday is also 0, streak is 0.
          if (lastDate.toDateString() === today.toDateString()) {
            continue;
          }
        }
        break;
      }
    }

    // 3. Most Active Weekday
    const weekdaySum = Array(7).fill(0);
    days.forEach(day => {
      weekdaySum[day.weekday] += day.contributionCount;
    });
    let maxDayVal = -1;
    let activeWeekdayIdx = 0;
    weekdaySum.forEach((val, idx) => {
      if (val > maxDayVal) {
        maxDayVal = val;
        activeWeekdayIdx = idx;
      }
    });
    const activeWeekday = weekdayNames[activeWeekdayIdx];

    // 4. Most Active Month
    const monthSum = Array(12).fill(0);
    days.forEach(day => {
      const monthIdx = new Date(day.date).getMonth();
      monthSum[monthIdx] += day.contributionCount;
    });
    let maxMonthVal = -1;
    let activeMonthIdx = 0;
    monthSum.forEach((val, idx) => {
      if (val > maxMonthVal) {
        maxMonthVal = val;
        activeMonthIdx = idx;
      }
    });
    const activeMonth = monthNames[activeMonthIdx];

    return { currentStreak, longestStreak, activeWeekday, activeMonth };
  }, [days]);

  // Color intensity mapping
  const getColorLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 8) return 3;
    return 4;
  };

  // Find month labels position (first week of each month)
  const monthLabels = useMemo(() => {
    if (!weeks) return [];
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, wIdx) => {
      const firstDay = week.contributionDays[0];
      if (firstDay) {
        const currentMonth = new Date(firstDay.date).getMonth();
        if (currentMonth !== lastMonth) {
          labels.push({ label: monthNames[currentMonth], index: wIdx });
          lastMonth = currentMonth;
        }
      }
    });
    return labels;
  }, [weeks]);

  const handleMouseMove = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay(day);
    setTooltipPos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 40
    });
  };

  return (
    <motion.section
      className="dashboard-section calendar-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      id="activity"
      aria-label="Contribution calendar and streaks"
    >
      <h2 className="section-title"><span aria-hidden="true">📅</span> Contribution Calendar</h2>

      {/* Metrics Row */}
      <div className="calendar-metrics">
        <div className="calendar-metric-card">
          <span className="cal-metric-value">{totalContributions}</span>
          <span className="cal-metric-label">Total Contributions</span>
        </div>
        <div className="calendar-metric-card">
          <span className="cal-metric-value">{metrics.currentStreak} days</span>
          <span className="cal-metric-label">Current Streak</span>
        </div>
        <div className="calendar-metric-card">
          <span className="cal-metric-value">{metrics.longestStreak} days</span>
          <span className="cal-metric-label">Longest Streak</span>
        </div>
        <div className="calendar-metric-card">
          <span className="cal-metric-value">{metrics.activeWeekday}</span>
          <span className="cal-metric-label">Busy Weekday</span>
        </div>
        <div className="calendar-metric-card">
          <span className="cal-metric-value">{metrics.activeMonth}</span>
          <span className="cal-metric-label">Peak Month</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-header-months">
          {monthLabels.map(ml => (
            <div
              key={ml.index}
              className="calendar-month-label"
              style={{ gridColumnStart: ml.index + 2 }}
            >
              {ml.label}
            </div>
          ))}
        </div>

        <div className="calendar-grid-body">
          {/* Weekday labels column */}
          <div className="calendar-weekdays">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          {/* Heatmap column grid */}
          <motion.div
            className="calendar-days-columns"
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {weeks.map((week, wIdx) => (
              <motion.div
                key={wIdx}
                className="calendar-week-column"
                variants={columnVariants}
              >
                {week.contributionDays.map(day => (
                  <div
                    key={day.date}
                    className={`calendar-day-cell level-${getColorLevel(day.contributionCount)}`}
                    onMouseEnter={(e) => handleMouseMove(e, day)}
                    onMouseMove={(e) => handleMouseMove(e, day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    aria-label={`${day.contributionCount} contributions on ${day.date}`}
                  />
                ))}
              </motion.div>
            ))}

            {/* Custom Tooltip */}
            {hoveredDay && (
              <div
                className="calendar-tooltip"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`
                }}
              >
                <strong>{hoveredDay.contributionCount} contributions</strong>
                <span>on {new Date(hoveredDay.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <span>Less</span>
          <div className="calendar-day-cell level-0" />
          <div className="calendar-day-cell level-1" />
          <div className="calendar-day-cell level-2" />
          <div className="calendar-day-cell level-3" />
          <div className="calendar-day-cell level-4" />
          <span>More</span>
        </div>
      </div>
    </motion.section>
  );
}

ContributionCalendar.propTypes = {
  calendarData: PropTypes.shape({
    totalContributions: PropTypes.number.isRequired,
    weeks: PropTypes.arrayOf(
      PropTypes.shape({
        contributionDays: PropTypes.arrayOf(
          PropTypes.shape({
            date: PropTypes.string.isRequired,
            contributionCount: PropTypes.number.isRequired,
            weekday: PropTypes.number.isRequired
          })
        ).isRequired
      })
    ).isRequired
  }).isRequired
};
