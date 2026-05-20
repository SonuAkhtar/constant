import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useHabitStore } from "../../store/useHabitStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { FlameIcon, TrophyIcon } from "../../components/Icons";
import { Counter } from "../../components/ui/Counter";
import { StatRing } from "../../components/ui/StatRing";
import { Sparkline } from "../../components/ui/Sparkline";
import { WeeklyChart } from "../../components/Progress/WeeklyChart";
import { MonthlyHeatmap } from "../../components/Progress/MonthlyHeatmap";
import { HabitBreakdown, computeHabitStats } from "../../components/Progress/HabitBreakdown";
import { isScheduledOn } from "../../utils/schedule";
import type { DailyProgress, Habit, HabitLog } from "../../types";
import "./Progress.css";

function computeProgressForRange(habits: Habit[], logs: HabitLog[], anchorDate: Date, days: number): DailyProgress[] {
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(anchorDate, days - 1 - i), "yyyy-MM-dd");
    const dow = new Date(`${date}T00:00:00`).getDay();
    const scheduled = habits.filter(h => !h.isArchived && isScheduledOn(h, dow));
    const total = scheduled.length;
    const completed = logs.filter(l =>
      l.date === date && l.completed && scheduled.some(h => h.id === l.habitId),
    ).length;
    return { date, total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });
}

type View = "week" | "month";

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <span className="progress-page__trend progress-page__trend--up">↑</span>;
  if (trend === "down")
    return <span className="progress-page__trend progress-page__trend--down">↓</span>;
  return <span className="progress-page__trend progress-page__trend--flat">→</span>;
}

function EmptyProgressState() {
  const navigate = useNavigate();
  return (
    <motion.div
      className="progress-page__empty"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="progress-page__empty-illustration" aria-hidden="true">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="50" width="14" height="22" rx="3" fill="var(--color-primary-dim)" stroke="var(--color-primary)" strokeWidth="1.5" />
          <rect x="33" y="34" width="14" height="38" rx="3" fill="var(--color-primary-dim)" stroke="var(--color-primary)" strokeWidth="1.5" />
          <rect x="56" y="20" width="14" height="52" rx="3" fill="var(--color-primary-dim)" stroke="var(--color-primary)" strokeWidth="1.5" />
          <path d="M14 36 33 26 47 32 63 18" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
        </svg>
      </div>
      <h3 className="progress-page__empty-title">Nothing tracked yet</h3>
      <p className="progress-page__empty-sub">
        Check off habits each day to see your progress grow.
      </p>
      <button className="progress-page__empty-cta" onClick={() => navigate("/habits")}>
        Set up habits →
      </button>
    </motion.div>
  );
}

function getInsight(weekly: DailyProgress[], appStreak: number, userName: string): string {
  const recent = weekly.slice(-3);
  const prev = weekly.slice(-6, -3);
  const last3 = recent.length
    ? Math.round(recent.reduce((s, d) => s + d.percentage, 0) / recent.length)
    : 0;
  const prev3 = prev.length
    ? Math.round(prev.reduce((s, d) => s + d.percentage, 0) / prev.length)
    : 0;
  const best = weekly.reduce(
    (b, d) => (d.percentage > b.percentage ? d : b),
    weekly[0],
  );
  const name = userName ? `, ${userName}` : "";

  if (best?.percentage === 100) {
    const day = format(new Date(`${best.date}T00:00:00`), "EEEE");
    return `Your best day this week was ${day} - a perfect 100%.`;
  }
  if (appStreak >= 14)
    return `${appStreak} days straight${name}. This is becoming who you are.`;
  if (appStreak >= 7)
    return `${appStreak}-day streak${name}. Consistency is compounding.`;
  if (last3 > prev3 + 5)
    return `You're trending up${name} - ${last3 - prev3}% more consistent than earlier this week.`;
  if (prev3 > last3 + 10)
    return `Your last few days dipped. Tomorrow is a fresh start${name}.`;
  if (prev3 > last3 + 5)
    return `Slight dip at the end of the week. Happens to everyone - reset and go.`;
  if (appStreak >= 3)
    return `${appStreak} days in a row${name}. You're building something real.`;
  if (last3 >= 80)
    return `Strong finish to the week${name}. Keep that energy going.`;
  if (last3 >= 50)
    return `Over halfway there - you're moving in the right direction.`;
  const today = weekly[weekly.length - 1];
  if (today?.percentage === 0)
    return `Today is still open. Every habit you complete right now counts.`;
  return `Complete today's habits to keep building your streak.`;
}

export default function Progress() {
  const [view, setView] = useState<View>("week");
  const [monthOffset, setMonthOffset] = useState(0);
  const {
    habits,
    logs,
    getWeeklyProgress,
    getMonthlyProgress,
    getDayProgress,
    getAppStreak,
    getPersonalBests,
  } = useHabitStore();
  const { userName } = useOnboardingStore();

  const weekly  = useMemo(() => getWeeklyProgress(),  [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthly = useMemo(() => getMonthlyProgress(), [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const today   = useMemo(() => getDayProgress(),     [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const appStreak = useMemo(() => getAppStreak(),     [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const bests   = useMemo(() => getPersonalBests(),   [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekAvg = Math.round(
    weekly.reduce((s, d) => s + d.percentage, 0) / (weekly.length || 1),
  );

  const bestDayEntry = monthly.reduce(
    (best, d) => (d.percentage >= best.percentage ? d : best),
    monthly[0] ?? { date: format(new Date(), "yyyy-MM-dd"), percentage: 0, total: 0, completed: 0 },
  );
  const bestDay = bestDayEntry.percentage;
  const bestDayDate = bestDayEntry.percentage > 0
    ? format(new Date(`${bestDayEntry.date}T00:00:00`), "MMM d")
    : "-";

  const recentSlice = weekly.slice(-3);
  const prevSlice   = weekly.slice(-6, -3);
  const last3avg = recentSlice.length
    ? Math.round(recentSlice.reduce((s, d) => s + d.percentage, 0) / recentSlice.length)
    : 0;
  const prev3avg = prevSlice.length
    ? Math.round(prevSlice.reduce((s, d) => s + d.percentage, 0) / prevSlice.length)
    : 0;
  const trend: "up" | "down" | "flat" =
    last3avg > prev3avg ? "up" : last3avg < prev3avg ? "down" : "flat";

  const sparkData = monthly.slice(-14).map((d) => d.percentage);
  const insight = getInsight(weekly, appStreak, userName);

  const displayMonthly = useMemo(() => {
    if (monthOffset === 0) return monthly;
    const anchor = subDays(new Date(), -monthOffset * 30);
    return computeProgressForRange(habits, logs, anchor, 30);
  }, [habits, logs, monthly, monthOffset]);

  const monthLabel = useMemo(() => {
    if (monthOffset === 0) return "Last 30 days";
    const anchor = subDays(new Date(), -monthOffset * 30);
    const end = format(anchor, "MMM d");
    const start = format(subDays(anchor, 29), "MMM d");
    return `${start} – ${end}`;
  }, [monthOffset]);

  const weekDates  = useMemo(() => weekly.map((d) => d.date),  [weekly]);
  const monthDates = useMemo(() => displayMonthly.map((d) => d.date), [displayMonthly]);
  const weekHabitStats = useMemo(
    () => computeHabitStats(habits, logs, weekDates),
    [habits, logs, weekDates],
  );
  const monthHabitStats = useMemo(
    () => computeHabitStats(habits, logs, monthDates),
    [habits, logs, monthDates],
  );

  async function handleShare() {
    const text = [
      `My Constant week${userName ? ` (${userName})` : ""}:`,
      `• ${weekAvg}% weekly average`,
      `• ${appStreak} day streak`,
      `• Best day: ${bestDay}% on ${bestDayDate}`,
      `• Longest streak ever: ${bests.longestStreakEver} days`,
    ].join("\n");
    if (navigator.share) {
      await navigator.share({ title: "My Constant progress", text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  if (habits.length === 0) {
    return (
      <div className="progress-page">
        <h1 className="progress-page__heading">Your Progress</h1>
        <EmptyProgressState />
      </div>
    );
  }

  return (
    <div className="progress-page">
      <h1 className="progress-page__heading">Your Progress</h1>

      <div className="progress-page__stats">
        <div className="progress-page__stat progress-page__stat--today">
          <StatRing pct={today.percentage} />
          <span className="progress-page__stat-value">
            <Counter to={today.percentage} suffix="%" />
          </span>
          <span className="progress-page__stat-label">Today</span>
          <span className="progress-page__stat-sub">
            {today.completed} of {today.total} done
          </span>
        </div>

        <div className="progress-page__stat progress-page__stat--streak">
          <span className="progress-page__stat-value">
            <Counter to={appStreak} />
            <FlameIcon size={13} />
          </span>
          <Sparkline data={sparkData} />
          <span className="progress-page__stat-label">day streak</span>
        </div>

        <div className="progress-page__stat">
          <span className="progress-page__stat-value">
            <Counter to={weekAvg} suffix="%" />
            <TrendArrow trend={trend} />
          </span>
          <span className="progress-page__stat-label">7-day avg</span>
        </div>

        <div className="progress-page__stat">
          <span className="progress-page__stat-value">
            <Counter to={bestDay} suffix="%" />
          </span>
          <span className="progress-page__stat-label">best day</span>
          <span className="progress-page__stat-sub">{bestDayDate}</span>
        </div>
      </div>

      <div className="progress-page__bests">
        <div className="progress-page__bests-header">
          <h3 className="progress-page__bests-title">Personal Bests</h3>
          <button
            className="progress-page__share-btn"
            onClick={handleShare}
            aria-label="Share my week"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path
                d="M11 1l3 3-3 3M14 4H5a4 4 0 000 8h1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Share
          </button>
        </div>
        <div className="progress-page__bests-pills">
          <div className="progress-page__best-pill">
            <TrophyIcon size={13} />
            <span className="progress-page__best-pill-value">{bests.longestStreakEver}d</span>
            <span className="progress-page__best-pill-label">longest streak</span>
          </div>
          <div className="progress-page__best-pill">
            <span className="progress-page__best-pill-value">{bests.mostCompletedInDay}</span>
            <span className="progress-page__best-pill-label">most in one day</span>
          </div>
          <div className="progress-page__best-pill">
            <span className="progress-page__best-pill-value">{bests.bestWeekAvg}%</span>
            <span className="progress-page__best-pill-label">best week avg</span>
          </div>
        </div>
      </div>

      <div className="progress-page__tab-bar">
        <button
          className={["progress-page__tab", view === "week" ? "progress-page__tab--active" : ""].join(" ")}
          onClick={() => setView("week")}
        >
          Week
        </button>
        <button
          className={["progress-page__tab", view === "month" ? "progress-page__tab--active" : ""].join(" ")}
          onClick={() => setView("month")}
        >
          Month
        </button>
      </div>

      {view === "month" && (
        <div className="progress-page__month-nav">
          <button
            className="progress-page__month-nav-btn"
            onClick={() => setMonthOffset(o => Math.min(o + 1, 2))}
            disabled={monthOffset >= 2}
            aria-label="Previous period"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="progress-page__month-label">{monthLabel}</span>
          <button
            className="progress-page__month-nav-btn"
            onClick={() => setMonthOffset(o => Math.max(o - 1, 0))}
            disabled={monthOffset <= 0}
            aria-label="Next period"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${monthOffset}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="progress-page__chart-title">
            {view === "week"
              ? "Daily completion · last 7 days"
              : `Daily completion · ${monthLabel.toLowerCase()}`}
          </p>
          {view === "week" ? (
            <WeeklyChart data={weekly} avg={weekAvg} />
          ) : (
            <MonthlyHeatmap data={displayMonthly} />
          )}
          {view === "week" && <p className="progress-page__insight">{insight}</p>}
          <HabitBreakdown
            stats={view === "week" ? weekHabitStats : monthHabitStats}
            view={view}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
