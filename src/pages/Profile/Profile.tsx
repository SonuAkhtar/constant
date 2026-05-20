import { useState, useRef, useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useHabitStore } from "../../store/useHabitStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useAuthStore } from "../../store/useAuthStore";
import { FocusIcon, TrophyIcon } from "../../components/Icons";
import "./Profile.css";

const DAILY_QUOTES = [
  "Small steps every day build the life you want.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to the level of your goals - you fall to the level of your systems.",
  "Every habit you keep is a vote for the person you're becoming.",
  "Progress, not perfection, is the goal.",
  "The secret is to start before you feel ready.",
  "Consistency beats intensity every time.",
];

function getStreakLabel(n: number): string {
  if (n >= 15) return "Unstoppable";
  if (n >= 7) return "Consistent";
  if (n >= 3) return "Building";
  return "Day Streak";
}

const RING_R = 36;
const RING_C = 2 * Math.PI * RING_R;

function AvatarRing({ pct }: { pct: number }) {
  const isComplete = pct >= 100;
  const isHalf = pct >= 50;

  const fillOffset = RING_C * (1 - Math.min(pct, 100) / 100);

  return (
    <svg
      className={[
        "profile__avatar-ring",
        isComplete ? "profile__avatar-ring--complete" : "",
      ].join(" ")}
      viewBox="0 0 78 78"
      width="78"
      height="78"
      aria-hidden="true"
    >
      <circle cx="39" cy="39" r={RING_R} className="profile__ring-track" />
      <circle
        cx="39"
        cy="39"
        r={RING_R}
        className={[
          "profile__ring-fill",
          isComplete
            ? "profile__ring-fill--complete"
            : isHalf
              ? "profile__ring-fill--half"
              : "profile__ring-fill--partial",
        ].join(" ")}
        strokeDasharray={isComplete ? undefined : `${RING_C}`}
        strokeDashoffset={isComplete ? 0 : fillOffset}
        transform="rotate(-90 39 39)"
      />
    </svg>
  );
}

const MINI_R = 7;
const MINI_C = 2 * Math.PI * MINI_R;

function MiniRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? completed / total : 0;
  const offset = MINI_C * (1 - pct);
  return (
    <svg
      className="profile__mini-ring"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r={MINI_R} className="profile__mini-track" />
      <circle
        cx="10"
        cy="10"
        r={MINI_R}
        className="profile__mini-fill"
        strokeDasharray={`${MINI_C}`}
        strokeDashoffset={offset}
        transform="rotate(-90 10 10)"
      />
    </svg>
  );
}

const FOCUS_OPTIONS = [
  { id: "health",       label: "Health"       },
  { id: "mindfulness",  label: "Mindfulness"  },
  { id: "productivity", label: "Productivity" },
  { id: "learning",     label: "Learning"     },
  { id: "sleep",        label: "Sleep"        },
  { id: "nutrition",    label: "Nutrition"    },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Profile() {
  const {
    userName,
    focuses,
    goal,
    goalSetDate,
    updateProfile,
    setGoal,
    clearGoal,
    reset: resetOnboarding,
  } = useOnboardingStore();
  const {
    habits,
    logs,
    milestones,
    getAppStreak,
    getDayProgress,
    exportData,
    importData,
    reset: resetHabits,
  } = useHabitStore();
  const { theme, toggleTheme } = useThemeStore();
  const { phone, signOut } = useAuthStore();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  function handleSignOut() {
    resetHabits();
    resetOnboarding();
    signOut();
  }

  const isDark = theme === "dark";
  const appStreak = getAppStreak();
  const { completed, total } = getDayProgress();
  const initials = getInitials(userName);
  const todayPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { earliestDate, totalCompleted } = useMemo(() => {
    const completedLogs = logs.filter((l) => l.completed);
    const sorted = [...completedLogs].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      earliestDate: sorted[0]?.date ?? null,
      totalCompleted: completedLogs.length,
    };
  }, [logs]);

  const daysSinceStart = earliestDate
    ? differenceInDays(new Date(), parseISO(earliestDate)) + 1
    : 0;

  const dayOfYear = Math.floor(
    (new Date().getTime() -
      new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000,
  );
  const dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editFocuses, setEditFocuses] = useState<string[]>(focuses);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goal);

  const importRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(() =>
    localStorage.getItem("constant-avatar-photo") ?? "",
  );

  function handleEditOpen() {
    setEditName(userName);
    setEditFocuses(focuses);
    setEditing(true);
  }

  function handleEditSave() {
    if (editName.trim()) updateProfile(editName.trim(), editFocuses);
    setEditing(false);
  }

  function toggleFocus(id: string) {
    setEditFocuses((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  function handleGoalSave() {
    if (goalInput.trim()) {
      setGoal(goalInput.trim());
    } else {
      clearGoal();
    }
    setEditingGoal(false);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `constant-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      setPhotoUrl(url);
      localStorage.setItem("constant-avatar-photo", url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      importData(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const goalDaysElapsed = goalSetDate
    ? differenceInDays(new Date(), parseISO(goalSetDate))
    : 0;

  return (
    <div className="profile">
      <div className="profile__card profile__avatar-card">
        <div className="profile__avatar-row">
          <button
            className="profile__avatar-wrap"
            onClick={() => photoRef.current?.click()}
            aria-label="Change profile photo"
          >
            <AvatarRing pct={todayPct} />
            <div className="profile__avatar" aria-hidden="true">
              {photoUrl ? (
                <img src={photoUrl} className="profile__avatar-img" alt="" />
              ) : (
                editing ? getInitials(editName || userName) : initials
              )}
            </div>
            <span className="profile__avatar-cam" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 4a1 1 0 0 1 1-1h.38l.8-1.5h3.64l.8 1.5H9a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round"/>
                <circle cx="5.5" cy="5.7" r="1.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </span>
          </button>
          {!editing && (
            <div className="profile__avatar-info">
              <h1 className="profile__name">{userName || "You"}</h1>
              {focuses.length > 0 && (
                <div className="profile__focuses">
                  {focuses.map((focus) => (
                    <span key={focus} className="profile__focus-pill">{focus}</span>
                  ))}
                </div>
              )}
              <button className="profile__edit-btn" onClick={handleEditOpen} aria-label="Edit profile">
                Edit profile
              </button>
            </div>
          )}
        </div>
        {editing && (
          <div className="profile__edit-block">
            <input
              className="profile__edit-name-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              autoFocus
            />
            <div className="profile__edit-focuses">
              {FOCUS_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  className={[
                    "profile__focus-toggle",
                    editFocuses.includes(id) ? "profile__focus-toggle--active" : "",
                  ].join(" ")}
                  onClick={() => toggleFocus(id)}
                >
                  <FocusIcon id={id} size={14} /> {label}
                </button>
              ))}
            </div>
            <div className="profile__edit-actions">
              <button className="profile__edit-cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="profile__edit-save" onClick={handleEditSave}>
                Save
              </button>
            </div>
          </div>
        )}
        <label htmlFor="profile-photo-input" className="sr-only">Upload profile photo</label>
        <input
          id="profile-photo-input"
          ref={photoRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoChange}
        />
      </div>

      <div className="profile__card profile__stats-card">
        <div className="profile__stat">
          <span className="profile__stat-value">
            {habits.filter((h) => !h.isArchived).length}
          </span>
          <span className="profile__stat-label">Habits</span>
        </div>
        <div className="profile__stat-divider" />
        <div className="profile__stat">
          <span className="profile__stat-value profile__stat-value--ring">
            <MiniRing completed={completed} total={total} />
          </span>
          <span className="profile__stat-label">
            {completed}/{total} Today
          </span>
        </div>
        <div className="profile__stat-divider" />
        <div className="profile__stat">
          <span className="profile__stat-value">{appStreak}</span>
          <span className="profile__stat-label">
            {getStreakLabel(appStreak)}
          </span>
        </div>
      </div>

      <div className="profile__card profile__goal-card">
        <div className="profile__goal-header">
          <h2 className="profile__section-heading">30-Day Goal</h2>
          {goal && !editingGoal && (
            <button
              className="profile__goal-edit-btn"
              onClick={() => {
                setGoalInput(goal);
                setEditingGoal(true);
              }}
            >
              Edit
            </button>
          )}
        </div>
        {editingGoal ? (
          <div className="profile__goal-edit">
            <input
              className="profile__goal-input"
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Run 5k by June 1"
              maxLength={60}
              autoFocus
            />
            <div className="profile__edit-actions">
              <button
                className="profile__edit-cancel"
                onClick={() => setEditingGoal(false)}
              >
                Cancel
              </button>
              <button className="profile__edit-save" onClick={handleGoalSave}>
                Save
              </button>
            </div>
          </div>
        ) : goal ? (
          <div className="profile__goal-display">
            <p className="profile__goal-text">"{goal}"</p>
            <p className="profile__goal-days">
              Day {Math.min(goalDaysElapsed + 1, 30)} of 30
            </p>
            <div className="profile__goal-bar">
              <div
                className="profile__goal-bar-fill"
                style={{
                  width: `${Math.min((goalDaysElapsed / 30) * 100, 100)}%`,
                }}
              />
            </div>
            {goalDaysElapsed >= 30 && (
              <p className="profile__goal-review">
                30 days done. Did you achieve it?
              </p>
            )}
          </div>
        ) : (
          <button
            className="profile__goal-set-btn"
            onClick={() => {
              setGoalInput("");
              setEditingGoal(true);
            }}
          >
            Set a 30-day goal →
          </button>
        )}
      </div>

      {milestones.length > 0 && (
        <div className="profile__card profile__moments-card">
          <h2 className="profile__section-heading">Moments</h2>
          <div className="profile__moments-list">
            {[...milestones].reverse().map((m, i) => (
              <div key={i} className="profile__moment">
                <span className="profile__moment-icon"><TrophyIcon size={22} /></span>
                <div className="profile__moment-body">
                  <p className="profile__moment-message">{m.message}</p>
                  <p className="profile__moment-date">
                    {format(parseISO(m.date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile__card profile__journey-card">
        <h2 className="profile__section-heading">Your Journey</h2>
        <div className="profile__journey-stats">
          <div className="profile__journey-stat">
            <span className="profile__journey-value">{daysSinceStart}</span>
            <span className="profile__journey-label">days active</span>
          </div>
          <div className="profile__journey-stat">
            <span className="profile__journey-value">{totalCompleted}</span>
            <span className="profile__journey-label">habits done</span>
          </div>
          <div className="profile__journey-stat">
            <span className="profile__journey-value">
              {habits.filter((h) => !h.isArchived).length}
            </span>
            <span className="profile__journey-label">active habits</span>
          </div>
        </div>
        <p className="profile__journey-quote">"{dailyQuote}"</p>
      </div>

      <div className="profile__card profile__settings-card">
        <div className="profile__setting-row">
          <span className="profile__setting-label">Appearance</span>
          <button
            className={["profile__toggle", isDark ? "profile__toggle--dark" : ""].join(" ")}
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
          >
            <span className={["profile__toggle-thumb", isDark ? "profile__toggle-thumb--on" : ""].join(" ")}>
              {isDark ? (
                <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M17 12A7 7 0 0 1 8 3a7 7 0 1 0 9 9z" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="3.5" fill="currentColor" />
                  <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1 1M14.9 14.9l1 1M14.9 5.1l1-1M4.1 15.9l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="profile__card profile__data-card">
        <h2 className="profile__section-heading">Your Data</h2>
        <p className="profile__data-privacy">
          <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: '-0.1em', marginRight: '4px' }}>
            <rect x="2" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Synced to your account via phone number. Export a backup anytime.
        </p>
        {phone && <p className="profile__data-phone">Signed in as {phone}</p>}
        <div className="profile__data-actions">
          <button className="profile__data-btn" onClick={handleExport}>
            Export backup
          </button>
          <button
            className="profile__data-btn profile__data-btn--import"
            onClick={() => importRef.current?.click()}
          >
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
        {confirmSignOut ? (
          <div className="profile__signout-confirm">
            <p className="profile__signout-confirm-text">Sign out and clear local data?</p>
            <div className="profile__signout-confirm-actions">
              <button className="profile__signout-cancel" onClick={() => setConfirmSignOut(false)}>
                Cancel
              </button>
              <button className="profile__signout-confirm-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <button className="profile__signout-btn" onClick={() => setConfirmSignOut(true)}>
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
