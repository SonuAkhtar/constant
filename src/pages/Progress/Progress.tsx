import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type BarShapeProps,
} from "recharts";
import { useHabitStore } from "../../store/useHabitStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { FlameIcon, TrophyIcon } from "../../components/Icons";
import type { DailyProgress, Habit, HabitLog, HabitFrequency } from "../../types";
import "./Progress.css";

type View = "week" | "month";

// ---- Counter ----------------------------------------------------------------

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 800;
    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
}

// ---- StatRing ---------------------------------------------------------------

const SR = 22,
  SC = +(2 * Math.PI * SR).toFixed(2);

function StatRing({ pct, className = "" }: { pct: number; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const dash = mounted ? (Math.min(pct, 100) / 100) * SC : 0;
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      className={`progress-page__stat-ring ${className}`}
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r={SR} className="progress-page__stat-ring-track" />
      <circle
        cx="28"
        cy="28"
        r={SR}
        className="progress-page__stat-ring-fill"
        strokeDasharray={SC}
        strokeDashoffset={SC - dash}
        style={{
          transition: mounted
            ? "stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)"
            : "none",
        }}
        transform="rotate(-90 28 28)"
      />
    </svg>
  );
}

// ---- Helpers ----------------------------------------------------------------

function getIntensity(pct: number) {
  if (pct === 0) return "none";
  if (pct < 25) return "low";
  if (pct < 50) return "medium";
  if (pct < 75) return "high";
  if (pct < 100) return "very-high";
  return "complete";
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DailyProgress }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="progress-page__tooltip">
      <p className="progress-page__tooltip-date">
        {format(new Date(`${d.date}T00:00:00`), "EEE, MMM d")}
      </p>
      <p className="progress-page__tooltip-value">{d.percentage}%</p>
      <p className="progress-page__tooltip-sub">
        {d.completed} of {d.total} done
      </p>
    </div>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return (
      <span className="progress-page__trend progress-page__trend--up">↑</span>
    );
  if (trend === "down")
    return (
      <span className="progress-page__trend progress-page__trend--down">↓</span>
    );
  return (
    <span className="progress-page__trend progress-page__trend--flat">→</span>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 88,
    H = 30;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (v / max) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const rising = data[data.length - 1] >= data[0];
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="progress-page__sparkline"
    >
      <polyline
        points={pts}
        stroke={rising ? "var(--color-success)" : "#ef4444"}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function getInsight(
  weekly: DailyProgress[],
  appStreak: number,
  userName: string,
): string {
  const last3 = Math.round(
    weekly.slice(4).reduce((s, d) => s + d.percentage, 0) / 3,
  );
  const prev3 = Math.round(
    weekly.slice(1, 4).reduce((s, d) => s + d.percentage, 0) / 3,
  );
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

function WeeklyChart({ data, avg }: { data: DailyProgress[]; avg: number }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="progress-page__chart-wrap">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          barCategoryGap="30%"
          margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(`${d}T00:00:00`), "EEE")}
            tick={{ fontSize: 11, fill: "#6b6b84" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#6b6b84" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(128, 128, 128, 0.07)", radius: 6 }}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="rgba(100, 100, 100, 0.35)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}
          <Bar
            dataKey="percentage"
            radius={[6, 6, 0, 0]}
            shape={(props: BarShapeProps & { index?: number }) => {
              const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
              const entry = props.payload as DailyProgress;
              const h = Math.max(height, 0);
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={h}
                  rx={6}
                  ry={6}
                  fill="var(--color-primary)"
                  fillOpacity={entry.date === todayStr ? 1 : 0.22}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom",
                    transform: mounted ? "scaleY(1)" : "scaleY(0)",
                    transition: `transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 60}ms`,
                  }}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="progress-page__chart-legend">
        <span className="progress-page__chart-legend-dot progress-page__chart-legend-dot--dim" />
        <span className="progress-page__chart-legend-text">Past days</span>
        <span className="progress-page__chart-legend-dot" />
        <span className="progress-page__chart-legend-text">Today</span>
      </div>
    </div>
  );
}

function MonthlyHeatmap({ data }: { data: DailyProgress[] }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const firstDate = new Date(
    `${data[0]?.date ?? format(new Date(), "yyyy-MM-dd")}T00:00:00`,
  );
  const startOffset = firstDate.getDay();

  return (
    <>
      <div className="progress-page__heatmap-meta">
        <div className="progress-page__heatmap-legend">
          <span className="progress-page__legend-label">Less</span>
          {(
            ["none", "low", "medium", "high", "very-high", "complete"] as const
          ).map((i) => (
            <div
              key={i}
              className={`heatmap__cell heatmap__cell--${i} heatmap__cell--legend`}
            />
          ))}
          <span className="progress-page__legend-label">More</span>
        </div>
      </div>

      <div
        className="heatmap"
        role="grid"
        aria-label="Monthly completion heatmap"
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
          <div
            key={i}
            className="heatmap__col-label"
            role="columnheader"
            aria-label={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
          >
            {label}
          </div>
        ))}
        {Array.from({ length: startOffset }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="heatmap__cell heatmap__cell--empty"
            role="gridcell"
            aria-hidden="true"
          />
        ))}
        {data.map((day) => {
          const isToday = day.date === todayStr;
          const dateObj = new Date(`${day.date}T00:00:00`);
          const dateLabel = format(dateObj, "MMM d");
          return (
            <div
              key={day.date}
              role="gridcell"
              className={[
                "heatmap__cell",
                `heatmap__cell--${getIntensity(day.percentage)}`,
                isToday ? "heatmap__cell--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={`${dateLabel}: ${day.percentage}% (${day.completed}/${day.total})`}
              aria-label={`${dateLabel}: ${day.percentage}% complete, ${day.completed} of ${day.total} habits`}
            />
          );
        })}
      </div>
    </>
  );
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
          <rect
            x="10"
            y="50"
            width="14"
            height="22"
            rx="3"
            fill="var(--color-primary-dim)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
          />
          <rect
            x="33"
            y="34"
            width="14"
            height="38"
            rx="3"
            fill="var(--color-primary-dim)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
          />
          <rect
            x="56"
            y="20"
            width="14"
            height="52"
            rx="3"
            fill="var(--color-primary-dim)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
          />
          <path
            d="M14 36 33 26 47 32 63 18"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />
        </svg>
      </div>
      <h3 className="progress-page__empty-title">No data yet</h3>
      <p className="progress-page__empty-sub">
        Complete your first habit to see your progress here.
      </p>
      <button
        className="progress-page__empty-cta"
        onClick={() => navigate("/habits")}
      >
        Go set up habits →
      </button>
    </motion.div>
  );
}

// ---- Habit performance helpers ---------------------------------------------

type DayStatus = "done" | "skip" | "miss" | "off";

interface HabitPeriodStat {
  habit: Habit;
  rate: number;
  completed: number;
  skipped: number;
  scheduled: number;
  dayStats: { date: string; status: DayStatus }[];
}

function scheduledOn(habit: Habit, dow: number): boolean {
  const freq: HabitFrequency = habit.frequency ?? "daily";
  if (freq === "daily") return true;
  if (freq === "weekdays") return dow >= 1 && dow <= 5;
  return (habit.customDays ?? []).includes(dow);
}

function rateColor(rate: number): string {
  if (rate >= 80) return "var(--color-success)";
  if (rate >= 50) return "var(--color-primary)";
  if (rate >= 25) return "#f59e0b";
  return "#ef4444";
}

function computeHabitStats(
  habits: Habit[],
  logs: HabitLog[],
  dates: string[],
): HabitPeriodStat[] {
  return habits
    .filter((h) => !h.isArchived)
    .map((habit) => {
      const dayStats = dates.map((date) => {
        const dow = new Date(`${date}T00:00:00`).getDay();
        if (!scheduledOn(habit, dow)) return { date, status: "off" as DayStatus };
        const log = logs.find((l) => l.habitId === habit.id && l.date === date);
        if (!log) return { date, status: "miss" as DayStatus };
        if (log.completed) return { date, status: "done" as DayStatus };
        if (log.skipped) return { date, status: "skip" as DayStatus };
        return { date, status: "miss" as DayStatus };
      });
      const scheduled = dayStats.filter((d) => d.status !== "off").length;
      const completed = dayStats.filter((d) => d.status === "done").length;
      const skipped = dayStats.filter((d) => d.status === "skip").length;
      const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
      return { habit, rate, completed, skipped, scheduled, dayStats };
    })
    .sort((a, b) => b.rate - a.rate);
}

const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendar({
  dayStats,
  view,
}: {
  dayStats: { date: string; status: DayStatus }[];
  view: View;
}) {
  if (view === "week") {
    return (
      <div className="ph-mini-cal">
        {dayStats.map(({ date, status }) => {
          const dow = new Date(`${date}T00:00:00`).getDay();
          return (
            <div key={date} className="ph-mini-cal__col">
              <span className="ph-mini-cal__lbl">{WEEK_LABELS[dow]}</span>
              <div className={`ph-mini-cal__dot ph-mini-cal__dot--${status}`} />
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="ph-mini-dots">
      {dayStats.map(({ date, status }) => (
        <div
          key={date}
          className={`ph-mini-dots__dot ph-mini-dots__dot--${status}`}
          title={`${date}: ${status}`}
        />
      ))}
    </div>
  );
}

function HabitPerfRow({
  stat,
  index,
  view,
}: {
  stat: HabitPeriodStat;
  index: number;
  view: View;
}) {
  const [open, setOpen] = useState(false);
  const color = rateColor(stat.rate);
  const missed = Math.max(0, stat.scheduled - stat.completed - stat.skipped);

  return (
    <div className={`ph-row${open ? " ph-row--open" : ""}`}>
      <button
        className="ph-row__btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ph-row__icon" aria-hidden="true">
          {stat.habit.icon}
        </span>
        <span className="ph-row__name">{stat.habit.title}</span>
        <div className="ph-row__track">
          <motion.div
            className="ph-row__fill"
            style={{ background: color }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: stat.rate / 100 }}
            transition={{
              delay: index * 0.05,
              duration: 0.55,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        </div>
        {stat.skipped > 0 && (
          <span className="ph-row__skip-badge">{stat.skipped} skip</span>
        )}
        <span className="ph-row__pct" style={{ color }}>
          {stat.rate}%
        </span>
        <svg
          className={`ph-chevron${open ? " ph-chevron--open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="ph-row__detail"
            key="detail"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="ph-row__detail-inner">
              <MiniCalendar dayStats={stat.dayStats} view={view} />
              <div className="ph-row__counts">
                <div className="ph-row__count ph-row__count--done">
                  <span className="ph-row__count-val">{stat.completed}</span>
                  <span className="ph-row__count-lbl">Done</span>
                </div>
                <div className="ph-row__count ph-row__count--skip">
                  <span className="ph-row__count-val">{stat.skipped}</span>
                  <span className="ph-row__count-lbl">Skipped</span>
                </div>
                <div className="ph-row__count ph-row__count--miss">
                  <span className="ph-row__count-val">{missed}</span>
                  <span className="ph-row__count-lbl">Missed</span>
                </div>
                <div className="ph-row__count">
                  <span className="ph-row__count-val">{stat.scheduled}</span>
                  <span className="ph-row__count-lbl">Scheduled</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HabitPerf({ stats, view }: { stats: HabitPeriodStat[]; view: View }) {
  if (stats.length === 0) return null;
  const strong = stats.filter((s) => s.rate >= 80).length;
  const mid = stats.filter((s) => s.rate >= 50 && s.rate < 80).length;
  const low = stats.filter((s) => s.rate >= 25 && s.rate < 50).length;
  const struggling = stats.filter((s) => s.rate < 25 && s.scheduled > 0).length;
  return (
    <div className="ph-section">
      <div className="ph-section__header">
        <h3 className="ph-section__title">Habit breakdown</h3>
        <div className="ph-section__badges">
          {strong > 0 && (
            <span className="ph-badge ph-badge--strong">{strong} strong</span>
          )}
          {mid > 0 && (
            <span className="ph-badge ph-badge--mid">{mid} on track</span>
          )}
          {low > 0 && (
            <span className="ph-badge ph-badge--low">{low} needs work</span>
          )}
          {struggling > 0 && (
            <span className="ph-badge ph-badge--struggling">
              {struggling} struggling
            </span>
          )}
        </div>
      </div>
      <div className="ph-list">
        {stats.map((stat, i) => (
          <HabitPerfRow key={stat.habit.id} stat={stat} index={i} view={view} />
        ))}
      </div>
    </div>
  );
}

// ---- Page -------------------------------------------------------------------

export default function Progress() {
  const [view, setView] = useState<View>("week");
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

  const weekly = getWeeklyProgress();
  const monthly = getMonthlyProgress();
  const today = getDayProgress();
  const appStreak = getAppStreak();
  const bests = getPersonalBests();

  const weekAvg = Math.round(
    weekly.reduce((s, d) => s + d.percentage, 0) / weekly.length,
  );

  const bestDayEntry = monthly.reduce(
    (best, d) => (d.percentage >= best.percentage ? d : best),
    monthly[0] ?? {
      date: format(new Date(), "yyyy-MM-dd"),
      percentage: 0,
      total: 0,
      completed: 0,
    },
  );
  const bestDay = bestDayEntry.percentage;
  const bestDayDate =
    bestDayEntry.percentage > 0
      ? format(new Date(`${bestDayEntry.date}T00:00:00`), "MMM d")
      : "-";

  const last3avg = Math.round(
    weekly.slice(4).reduce((s, d) => s + d.percentage, 0) / 3,
  );
  const prev3avg = Math.round(
    weekly.slice(1, 4).reduce((s, d) => s + d.percentage, 0) / 3,
  );
  const trend: "up" | "down" | "flat" =
    last3avg > prev3avg ? "up" : last3avg < prev3avg ? "down" : "flat";

  const sparkData = monthly.slice(-14).map((d) => d.percentage);
  const insight = getInsight(weekly, appStreak, userName);

  const weekDates = useMemo(() => weekly.map((d) => d.date), [weekly]);
  const monthDates = useMemo(() => monthly.map((d) => d.date), [monthly]);
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
        <h2 className="progress-page__heading">Your Progress</h2>
        <EmptyProgressState />
      </div>
    );
  }

  return (
    <div className="progress-page">
      <h2 className="progress-page__heading">Your Progress</h2>

      {/* ---- 2×2 stat grid ---- */}
      <div className="progress-page__stats">
        {/* Card 1: Today */}
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

        {/* Card 2: Streak */}
        <div className="progress-page__stat progress-page__stat--streak">
          <span className="progress-page__stat-value">
            <Counter to={appStreak} />
            <FlameIcon size={13} />
          </span>
          <Sparkline data={sparkData} />
          <span className="progress-page__stat-label">
            {appStreak === 1 ? "day" : "day"} streak
          </span>
        </div>

        {/* Card 3: Week avg */}
        <div className="progress-page__stat">
          <span className="progress-page__stat-value">
            <Counter to={weekAvg} suffix="%" />
            <TrendArrow trend={trend} />
          </span>
          <span className="progress-page__stat-label">7-day avg</span>
        </div>

        {/* Card 4: Best day */}
        <div className="progress-page__stat">
          <span className="progress-page__stat-value">
            <Counter to={bestDay} suffix="%" />
          </span>
          <span className="progress-page__stat-label">best day</span>
          <span className="progress-page__stat-sub">{bestDayDate}</span>
        </div>
      </div>

      {/* ---- Personal Bests ---- */}
      <div className="progress-page__bests">
        <div className="progress-page__bests-header">
          <h3 className="progress-page__bests-title">Personal Bests</h3>
          <button
            className="progress-page__share-btn"
            onClick={handleShare}
            aria-label="Share my week"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
            >
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
            <span className="progress-page__best-pill-value">
              {bests.longestStreakEver}d
            </span>
            <span className="progress-page__best-pill-label">longest streak</span>
          </div>
          <div className="progress-page__best-pill">
            <span className="progress-page__best-pill-value">
              {bests.mostCompletedInDay}
            </span>
            <span className="progress-page__best-pill-label">most in one day</span>
          </div>
          <div className="progress-page__best-pill">
            <span className="progress-page__best-pill-value">
              {bests.bestWeekAvg}%
            </span>
            <span className="progress-page__best-pill-label">best week avg</span>
          </div>
        </div>
      </div>

      {/* ---- Tab bar ---- */}
      <div className="progress-page__tab-bar">
        <button
          className={[
            "progress-page__tab",
            view === "week" ? "progress-page__tab--active" : "",
          ].join(" ")}
          onClick={() => setView("week")}
        >
          Week
        </button>
        <button
          className={[
            "progress-page__tab",
            view === "month" ? "progress-page__tab--active" : "",
          ].join(" ")}
          onClick={() => setView("month")}
        >
          Month
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="progress-page__chart-title">
            {view === "week"
              ? "Daily completion - last 7 days"
              : "Daily completion - last 30 days"}
          </p>
          {view === "week" ? (
            <WeeklyChart data={weekly} avg={weekAvg} />
          ) : (
            <MonthlyHeatmap data={monthly} />
          )}
          {view === "week" && (
            <p className="progress-page__insight">{insight}</p>
          )}
          <HabitPerf
            stats={view === "week" ? weekHabitStats : monthHabitStats}
            view={view}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
