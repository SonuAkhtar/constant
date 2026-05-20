import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInCalendarDays, parseISO, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useHabitStore } from "../../store/useHabitStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useSlotTimingStore, formatSlotTime, getActiveSlotIndex } from "../../store/useSlotTimingStore";
import { useToastStore } from "../../store/useToastStore";
import { haptic } from "../../utils/haptic";
import HabitCard from "../../components/HabitCard/HabitCard";
import { SlotIcon, SparkleIcon, StarIcon, WaveIcon } from "../../components/Icons";
import { Confetti } from "../../components/Today/Confetti";
import { MilestoneOverlay } from "../../components/Today/MilestoneOverlay";
import type { Goal, Milestone, TimeSlot } from "../../types";
import "./Today.css";

const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: "morning",   label: "Morning"   },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "evening",   label: "Evening"   },
  { slot: "night",     label: "Night"     },
];

const COPY_TIERS = [
  { min: 0, max: 0, title: "Your day is wide open.", sub: "Start with one." },
  { min: 1, max: 29, title: "You're moving.", sub: "Keep the momentum going." },
  {
    min: 30,
    max: 59,
    title: "Halfway there.",
    sub: "The second half is yours.",
  },
  { min: 60, max: 89, title: "Almost there.", sub: "A few more to go." },
  { min: 90, max: 99, title: "So close.", sub: "One last push." },
  {
    min: 100,
    max: 100,
    title: "You showed up.",
    sub: "That's what it takes.",
  },
] as const;

function getCopy(pct: number) {
  return COPY_TIERS.find((c) => pct >= c.min && pct <= c.max) ?? COPY_TIERS[0];
}
function getCopyKey(pct: number) {
  return COPY_TIERS.findIndex((c) => pct >= c.min && pct <= c.max);
}

function getGreeting(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function EmptyTodayState({ userName }: { userName: string }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className="today__empty"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="today__empty-illustration">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="12"
            y="16"
            width="56"
            height="52"
            rx="8"
            stroke="var(--color-border)"
            strokeWidth="2"
          />
          <rect
            x="12"
            y="16"
            width="56"
            height="14"
            rx="8"
            fill="var(--color-primary-dim)"
          />
          <rect
            x="12"
            y="22"
            width="56"
            height="8"
            fill="var(--color-primary-dim)"
          />
          <path
            d="M24 38h32M24 48h20"
            stroke="var(--color-border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="58" cy="56" r="14" fill="var(--color-primary)" />
          <path
            d="M53 56l3.5 3.5L63 51"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="today__empty-title">Your day is wide open</h3>
      <p className="today__empty-sub">
        Add your first habit to start building your routine.
      </p>
      <button className="today__empty-cta" onClick={() => navigate("/habits")}>
        {userName
          ? `Add your first habit, ${userName} →`
          : "Add your first habit →"}
      </button>
    </motion.div>
  );
}

function NumRoll({ n }: { n: number }) {
  return (
    <span className="today__progress-count-wrap">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={n}
          initial={{ y: 7, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -7, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ display: "block" }}
        >
          {n}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const RING_R = 20;
const RING_CIRC = +(2 * Math.PI * RING_R).toFixed(2);

export default function Today() {
  const {
    habits,
    logs,
    getTodayHabits,
    getScheduledHabits,
    toggleHabit,
    getStreak,
    getDayProgress,
    getAppStreak,
    getLastActiveDate,
  } = useHabitStore();
  const { userName, goals, joinedAt } = useOnboardingStore();
  const { timings } = useSlotTimingStore();

  // Banner shows the most recent goal by default; user can switch via dropdown.
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);
  const activeGoal: Goal | undefined =
    goals.find((g) => g.id === selectedGoalId) ?? goals[goals.length - 1];

  function computeGoalProgress(goal: Goal) {
    const elapsed = differenceInCalendarDays(new Date(), parseISO(goal.setDate));
    const dayNum = Math.min(Math.max(elapsed + 1, 1), 30);
    let doneCount = 0;
    if (goal.habitId) {
      doneCount = logs.filter(
        (l) =>
          l.habitId === goal.habitId &&
          l.completed &&
          l.date >= goal.setDate,
      ).length;
    }
    return { dayNum, doneCount, hasHabit: !!goal.habitId };
  }

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const isViewingToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  const todayHabits = useMemo(() => getTodayHabits(), [habits, logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const viewHabits = useMemo(
    () => isViewingToday ? todayHabits : getScheduledHabits(selectedDate),
    [isViewingToday, todayHabits, selectedDate, habits, logs], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { completed, total, percentage } = getDayProgress();
  const { completed: viewCompleted, total: viewTotal } = isViewingToday
    ? { completed, total }
    : getDayProgress(selectedDate);

  const now = new Date();
  const dayAbbr = format(now, "EEE");
  const monthAbbr = format(now, "MMM");
  const dayNum = format(now, "d");

  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  const orderedSlots = useMemo(() => {
    const idx = getActiveSlotIndex(timings, currentHour);
    return [...SLOTS.slice(idx), ...SLOTS.slice(0, idx)];
  }, [currentHour, timings]);

  const slotsToRender = isViewingToday ? orderedSlots : SLOTS;

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))
  , []);

  const completedSet = useMemo(
    () => new Set(logs.filter(l => l.date === selectedDate && l.completed).map(l => l.habitId)),
    [logs, selectedDate],
  );
  const skippedSet = useMemo(
    () => new Set(logs.filter(l => l.date === selectedDate && l.skipped).map(l => l.habitId)),
    [logs, selectedDate],
  );

  const pushToast = useToastStore(s => s.push);

  const [ringMounted, setRingMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(
    null,
  );
  const prevPctRef = useRef(percentage);
  const prevCompletedRef = useRef(completed);
  const [pillBump, setPillBump] = useState(false);
  const auroraTriggeredRef = useRef(new Set<number>());
  const [auroraBurst, setAuroraBurst] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<TimeSlot>>(new Set());

  function toggleSlotExpand(slot: TimeSlot) {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  }

  const appStreak = getAppStreak();
  const lastActiveDate = getLastActiveDate();
  const isReturning = appStreak === 0 && !!lastActiveDate;
  const daysSince = lastActiveDate
    ? differenceInCalendarDays(new Date(), parseISO(lastActiveDate))
    : 0;

  const [todayDate, setTodayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  useEffect(() => {
    const id = setInterval(() => {
      const now = format(new Date(), "yyyy-MM-dd");
      if (now !== todayDate) setTodayDate(now);
    }, 30_000);
    return () => clearInterval(id);
  }, [todayDate]);

  useEffect(() => {
    const update = () => setCurrentHour(new Date().getHours());
    const id = setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRingMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (percentage === 100 && prevPctRef.current < 100 && isViewingToday) {
      setShowConfetti(true);
      haptic('celebration');
    }
    prevPctRef.current = percentage;
  }, [percentage, isViewingToday]);

  useEffect(() => {
    if (completed > prevCompletedRef.current) {
      setPillBump(true);
      const t = setTimeout(() => setPillBump(false), 400);
      prevCompletedRef.current = completed;
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  useEffect(() => {
    for (const threshold of [25, 50, 75]) {
      if (
        percentage >= threshold &&
        !auroraTriggeredRef.current.has(threshold)
      ) {
        auroraTriggeredRef.current.add(threshold);
        setAuroraBurst(true);
        const t = setTimeout(() => setAuroraBurst(false), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [percentage]);

  function handleToggle(habitId: string) {
    const wasCompleted = completedSet.has(habitId);
    const milestone = toggleHabit(habitId, selectedDate);
    pushToast('Saved ✓', undefined, {
      label: 'Undo',
      onClick: () => toggleHabit(habitId, selectedDate),
    });
    if (!wasCompleted && isViewingToday && milestone) setActiveMilestone(milestone);
  }

  const strokeDash = ringMounted ? (percentage / 100) * RING_CIRC : 0;
  const copy = getCopy(percentage);
  const copyKey = getCopyKey(percentage);

  return (
    <div className="today">
      <motion.div
        className={["today__hero", auroraBurst ? "today__hero--burst" : ""]
          .filter(Boolean)
          .join(" ")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="today__hero-inner">
          <div
            className="today__hero-ring"
            role="meter"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentage}% complete today`}
          >
            <svg
              viewBox="0 0 50 50"
              className="today__hero-ring-svg"
              aria-hidden="true"
            >
              <circle
                cx="25"
                cy="25"
                r={RING_R}
                className="today__hero-ring-track"
              />
              <circle
                cx="25"
                cy="25"
                r={RING_R}
                className={[
                  "today__hero-ring-fill",
                  percentage === 100
                    ? "today__hero-ring-fill--complete"
                    : appStreak >= 30
                    ? "today__hero-ring-fill--blazing"
                    : appStreak >= 14
                    ? "today__hero-ring-fill--hot"
                    : "",
                ].filter(Boolean).join(" ")}
                strokeDasharray={`${strokeDash} ${RING_CIRC}`}
              />
            </svg>
            <div className="today__hero-ring-center">
              <span className="today__hero-ring-pct-wrap">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={percentage}
                    className="today__hero-ring-pct"
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{ display: "block" }}
                  >
                    {percentage}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="today__hero-ring-sym">%</span>
            </div>
          </div>

          <div className="today__hero-content">
            <p className="today__hero-greeting">
              {getGreeting(currentHour)}
              {userName && <span className="today__hero-name">, {userName}</span>}
            </p>

            <AnimatePresence mode="wait">
              <motion.p
                key={copyKey}
                className="today__hero-copy"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                <span className="today__hero-copy-title">{copy.title}</span>
                <span className="today__hero-copy-sep"> · </span>
                <span className="today__hero-copy-sub">{copy.sub}</span>
              </motion.p>
            </AnimatePresence>

            <div className="today__hero-meta">
              {appStreak >= 3 && (
                <span className="today__hero-meta-streak">
                  <span aria-hidden="true">✦</span>
                  {appStreak}-day streak
                </span>
              )}
              <span className="today__hero-meta-date">
                <span className="today__hero-date-day">{dayAbbr}</span>
                <span className="today__hero-date-num">{dayNum}</span>
                <span className="today__hero-date-month">{monthAbbr}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="today__date-strip" role="radiogroup" aria-label="Select date">
        {weekDates.map(date => {
          const isToday = date === format(new Date(), 'yyyy-MM-dd')
          const isSelected = date === selectedDate
          const isDisabled = !!joinedAt && date < joinedAt
          return (
            <button
              key={date}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              className={[
                'today__date-chip',
                isSelected ? 'today__date-chip--selected' : '',
                isToday ? 'today__date-chip--today' : '',
                isDisabled ? 'today__date-chip--disabled' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !isDisabled && setSelectedDate(date)}
            >
              <span className="today__date-chip-day">
                {isToday ? 'Today' : format(parseISO(date), 'EEE')}
              </span>
              <span className="today__date-chip-num">{format(parseISO(date), 'd')}</span>
            </button>
          )
        })}
      </div>

      {!isViewingToday && (
        <div className="today__past-banner">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" className="today__past-banner-icon">
            <rect x="1" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 1v3M10 1v3M1 7h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span className="today__past-banner-text">
            {format(parseISO(selectedDate), 'EEEE, MMMM d')}
            {' · '}<span className="today__past-banner-count">{viewCompleted}/{viewTotal} done</span>
          </span>
          <button className="today__past-banner-back" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
            Today
          </button>
        </div>
      )}

      <AnimatePresence>
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isViewingToday && percentage === 100 && (
          <motion.div
            className="today__celebration"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            role="status"
            aria-live="assertive"
          >
            <span className="today__celebration-icon" aria-hidden="true">
              <SparkleIcon size={28} />
            </span>
            <div>
              <p className="today__celebration-title">
                Perfect day{userName ? `, ${userName}` : ""}!
              </p>
              <p className="today__celebration-sub">
                All {total} done
                {appStreak > 1 ? ` · ${appStreak}-day streak` : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isViewingToday && isReturning && daysSince >= 2 && (
          <motion.div
            className="today__return-banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
          >
            <span className="today__return-icon"><WaveIcon size={22} /></span>
            <div className="today__return-body">
              <p className="today__return-title">
                Welcome back{userName ? `, ${userName}` : ""}.
              </p>
              <p className="today__return-sub">
                Today is a fresh start.
                {daysSince > 0
                  ? ` Last active ${daysSince} day${daysSince === 1 ? "" : "s"} ago.`
                  : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeGoal && (() => {
        const { dayNum, doneCount, hasHabit } = computeGoalProgress(activeGoal);
        const hasMulti = goals.length > 1;
        return (
          <div className="today__goal-banner" aria-live="polite">
            <div className="today__goal-banner-row">
              <span className="today__goal-label">Goal</span>
              <span className="today__goal-text">{activeGoal.text}</span>
              {hasMulti && (
                <button
                  className={[
                    "today__goal-switcher",
                    goalDropdownOpen ? "today__goal-switcher--open" : "",
                  ].join(" ")}
                  onClick={() => setGoalDropdownOpen((o) => !o)}
                  aria-expanded={goalDropdownOpen}
                  aria-label={`Switch goal · ${goals.length} total`}
                >
                  <span className="today__goal-switcher-count">{goals.length}</span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            <div className="today__goal-progress-row">
              <span className="today__goal-meta-text">
                Day <strong>{dayNum}</strong> / 30
                {hasHabit && (
                  <>
                    {" · "}
                    <strong>{doneCount}</strong> done
                  </>
                )}
              </span>
              <div
                className="today__goal-bar"
                role="progressbar"
                aria-valuenow={dayNum}
                aria-valuemin={0}
                aria-valuemax={30}
              >
                <div
                  className="today__goal-bar-fill"
                  style={{ width: `${(dayNum / 30) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence>
              {hasMulti && goalDropdownOpen && (
                <>
                  <motion.div
                    className="today__goal-dropdown-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setGoalDropdownOpen(false)}
                  />
                  <motion.ul
                    className="today__goal-dropdown"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    role="listbox"
                    aria-label="Your goals"
                  >
                    {goals.map((g) => {
                      const prog = computeGoalProgress(g);
                      const isActive = g.id === activeGoal.id;
                      return (
                        <li key={g.id}>
                          <button
                            role="option"
                            aria-selected={isActive}
                            className={[
                              "today__goal-dropdown-item",
                              isActive ? "today__goal-dropdown-item--active" : "",
                            ].join(" ")}
                            onClick={() => {
                              setSelectedGoalId(g.id);
                              setGoalDropdownOpen(false);
                            }}
                          >
                            <span className="today__goal-dropdown-text">{g.text}</span>
                            <span className="today__goal-dropdown-meta">
                              Day {prog.dayNum} / 30
                              {prog.hasHabit && ` · ${prog.doneCount} done`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                </>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {viewHabits.length === 0 && isViewingToday && <EmptyTodayState userName={userName} />}
      {viewHabits.length === 0 && !isViewingToday && (
        <motion.div
          className="today__past-empty"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="36" height="30" rx="5" stroke="var(--color-border)" strokeWidth="1.6"/>
            <path d="M14 4v6M30 4v6M4 18h36" stroke="var(--color-border)" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M14 26h16M17 32h10" stroke="var(--color-border)" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p className="today__past-empty-text">No habits were scheduled on this day.</p>
        </motion.div>
      )}

      {(() => {
        const pinned = viewHabits.filter((h) => h.isPinned);
        if (pinned.length === 0) return null;
        const pinnedDone = pinned.filter((h) => completedSet.has(h.id)).length;
        return (
          <section
            className="today__section today__section--core"
            data-slot="pinned"
          >
            <div className="today__section-header">
              <div className="today__section-left">
                <span className="today__section-icon"><StarIcon size={16} /></span>
                <h3 className="today__section-title">Core habits</h3>
              </div>
              <span className="today__section-count">
                <span className="today__section-count-inner">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={pinnedDone}
                      className="today__section-count-num"
                      initial={{ y: 9, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -9, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {pinnedDone}
                    </motion.span>
                  </AnimatePresence>
                </span>
                /{pinned.length}
              </span>
            </div>
            <ul className="today__list">
              {pinned.map((habit, i) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  done={completedSet.has(habit.id)}
                  skipped={skippedSet.has(habit.id)}
                  streak={getStreak(habit.id)}
                  onToggle={() => handleToggle(habit.id)}
                  index={i}
                />
              ))}
            </ul>
          </section>
        );
      })()}

      {slotsToRender.map(({ slot, label }) => {
        const slotHabits = viewHabits.filter((h) => h.timeSlot === slot);
        if (slotHabits.length === 0) return null;

        const slotDone = slotHabits.filter((h) => completedSet.has(h.id)).length;
        const slotComplete = slotDone === slotHabits.length;
        const isCollapsed = slotComplete && !expandedSlots.has(slot);

        return (
          <section key={slot} className="today__section" data-slot={slot}>
            <div
              className={[
                "today__section-header",
                slotComplete ? "today__section-header--complete" : "",
                slotComplete ? "today__section-header--collapsible" : "",
              ].filter(Boolean).join(" ")}
              onClick={slotComplete ? () => toggleSlotExpand(slot) : undefined}
              role={slotComplete ? "button" : undefined}
              aria-expanded={slotComplete ? !isCollapsed : undefined}
            >
              <div className="today__section-left">
                <span className="today__section-icon"><SlotIcon slot={slot} size={16} /></span>
                <h3 className="today__section-title">{label}</h3>
                {!isCollapsed && <span className="today__section-time">{formatSlotTime(timings[slot])}</span>}
              </div>
              <div className="today__section-right">
                <span
                  className={[
                    "today__section-count",
                    slotComplete ? "today__section-count--complete" : "",
                  ].join(" ")}
                  aria-live="polite"
                >
                  <span className="today__section-count-inner">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={slotDone}
                        className="today__section-count-num"
                        initial={{ y: 9, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -9, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {slotDone}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  /{slotHabits.length}
                </span>
                {slotComplete && (
                  <motion.svg
                    className="today__section-expand"
                    animate={{ rotate: isCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    aria-hidden="true"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  key="slot-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <ul className="today__list">
                    {slotHabits.map((habit, i) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        done={completedSet.has(habit.id)}
                        skipped={skippedSet.has(habit.id)}
                        streak={getStreak(habit.id)}
                        onToggle={() => handleToggle(habit.id)}
                        index={i}
                      />
                    ))}
                  </ul>
                  {slotComplete && (
                    <div className="today__slot-done" role="status">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                        <circle cx="6.5" cy="6.5" r="6.5" fill="var(--color-success)" />
                        <path d="M4 6.5l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      All {label.toLowerCase()} habits done
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}

      {viewHabits.length > 0 && (
        <div className="today__count-bar" aria-live="polite">
          <motion.div
            className="today__count-pill"
            animate={pillBump ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <NumRoll n={viewCompleted} />
            <span className="today__count-sep">/</span>
            <span>{viewTotal}</span>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {activeMilestone && (
          <MilestoneOverlay
            milestone={activeMilestone}
            onDone={() => setActiveMilestone(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
