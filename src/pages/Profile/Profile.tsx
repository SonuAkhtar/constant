import { useState, useRef, useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useHabitStore } from "../../store/useHabitStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useAuthStore } from "../../store/useAuthStore";
import { FocusIcon, TrophyIcon } from "../../components/Icons";
import HabitForm from "../../components/HabitForm/HabitForm";
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
    goals,
    updateProfile,
    addGoal,
    editGoal,
    deleteGoal,
    reset: resetOnboarding,
  } = useOnboardingStore();
  const {
    habits,
    logs,
    milestones,
    getDayProgress,
    removeHabit,
    exportData,
    importData,
    reset: resetHabits,
  } = useHabitStore();
  const { theme, toggleTheme } = useThemeStore();
  const { email, signOut } = useAuthStore();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  function handleSignOut() {
    resetHabits();
    resetOnboarding();
    signOut();
  }

  const isDark = theme === "dark";
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

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalInput, setEditGoalInput] = useState("");
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  const [pendingGoalCreation, setPendingGoalCreation] = useState(false);
  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const habitCountBeforeFormRef = useRef(0);

  function startAddingGoal() {
    habitCountBeforeFormRef.current = habits.length;
    setPendingGoalCreation(true);
    setHabitFormOpen(true);
  }

  function handleEditGoalStart(id: string, text: string) {
    setEditingGoalId(id);
    setEditGoalInput(text);
  }

  function handleEditGoalSave() {
    if (!editingGoalId) return;
    const text = editGoalInput.trim();
    if (text) editGoal(editingGoalId, text);
    setEditingGoalId(null);
    setEditGoalInput("");
  }

  function handleDeleteGoalConfirm() {
    if (!confirmDeleteGoalId) return;
    const goal = goals.find((g) => g.id === confirmDeleteGoalId);
    if (goal?.habitId) {

      removeHabit(goal.habitId);
    }
    deleteGoal(confirmDeleteGoalId);
    setConfirmDeleteGoalId(null);
  }

  function handleHabitFormOpenChange(next: boolean) {
    setHabitFormOpen(next);
    if (!next && pendingGoalCreation) {

      const after = useHabitStore.getState().habits;
      if (after.length > habitCountBeforeFormRef.current) {
        const newest = after[after.length - 1];
        addGoal(newest.title, newest.id);
      }
      setPendingGoalCreation(false);
    }
  }

  const importRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(() =>
    localStorage.getItem("progress-avatar-photo") ?? "",
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

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progress-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
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
      localStorage.setItem("progress-avatar-photo", url);
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

  return (
    <div className="profile">
      <div className={["profile__card profile__avatar-card", editing ? "profile__avatar-card--editing" : ""].join(" ")}>
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
          <div className="profile__avatar-info">
            {editing ? (
              <input
                className="profile__edit-name-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                autoFocus
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        {editing && (
          <div className="profile__edit-extras">
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

      <div className="profile__card profile__identity-card">
        <span className="profile__identity-eyebrow">You</span>
        <p className="profile__identity-line">
          {focuses.length > 0 ? (
            <>
              You're building habits in{" "}
              <span className="profile__identity-focuses">
                {focuses.join(" · ")}
              </span>
              .
            </>
          ) : (
            <>You're just getting started. Pick what matters to you above.</>
          )}
        </p>
        <div className="profile__identity-meter">
          <div className="profile__identity-meter-item">
            <span className="profile__identity-meter-value">{totalCompleted}</span>
            <span className="profile__identity-meter-label">
              habit{totalCompleted === 1 ? "" : "s"} done
            </span>
          </div>
          <div className="profile__identity-meter-sep" aria-hidden="true" />
          <div className="profile__identity-meter-item">
            <span className="profile__identity-meter-value">{daysSinceStart}</span>
            <span className="profile__identity-meter-label">
              day{daysSinceStart === 1 ? "" : "s"} with Progress
            </span>
          </div>
        </div>
        <p className="profile__identity-quote">"{dailyQuote}"</p>
      </div>

      <div className="profile__card profile__goal-card">
        <div className="profile__goal-header">
          <h2 className="profile__section-heading">30-Day Goals</h2>
          {goals.length > 0 && (
            <button
              className="profile__goal-edit-btn"
              onClick={startAddingGoal}
              aria-label="Add another goal"
            >
              + Add
            </button>
          )}
        </div>

        {goals.length === 0 && (
          <button className="profile__goal-set-btn" onClick={startAddingGoal}>
            Set a 30-day goal →
          </button>
        )}

        {goals.length > 0 && (
          <ul className="profile__goal-list">
            {goals.map((g) => {
              const elapsed = differenceInDays(new Date(), parseISO(g.setDate));
              const dayNum = Math.min(elapsed + 1, 30);
              const pct = Math.min((elapsed / 30) * 100, 100);
              const isEditing = editingGoalId === g.id;
              const linkedHabit = g.habitId ? habits.find((h) => h.id === g.habitId) : null;
              return (
                <li key={g.id} className="profile__goal-item">
                  {isEditing ? (
                    <div className="profile__goal-edit">
                      <input
                        className="profile__goal-input"
                        type="text"
                        value={editGoalInput}
                        onChange={(e) => setEditGoalInput(e.target.value)}
                        placeholder="e.g. Run 5k by June 1"
                        maxLength={60}
                        autoFocus
                      />
                      <div className="profile__edit-actions">
                        <button
                          className="profile__edit-cancel"
                          onClick={() => {
                            setEditingGoalId(null);
                            setEditGoalInput("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="profile__edit-save"
                          onClick={handleEditGoalSave}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="profile__goal-item-row">
                        <p className="profile__goal-text">"{g.text}"</p>
                        <div className="profile__goal-item-actions">
                          <button
                            className="profile__goal-icon-btn"
                            onClick={() => handleEditGoalStart(g.id, g.text)}
                            aria-label="Edit goal"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M9.5 2L12 4.5 4.5 12H2v-2.5L9.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            className="profile__goal-icon-btn profile__goal-icon-btn--danger"
                            onClick={() => setConfirmDeleteGoalId(g.id)}
                            aria-label="Delete goal"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M5 3.5v7.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="profile__goal-days">
                        Day {dayNum} of 30
                        {linkedHabit && (
                          <>
                            {" · "}
                            <span className="profile__goal-habit-link">
                              {linkedHabit.title}
                            </span>
                          </>
                        )}
                      </p>
                      <div className="profile__goal-bar">
                        <div
                          className="profile__goal-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {elapsed >= 30 && (
                        <p className="profile__goal-review">
                          30 days done. Did you achieve it?
                        </p>
                      )}
                      {confirmDeleteGoalId === g.id && (
                        <div className="profile__goal-confirm">
                          <span className="profile__goal-confirm-text">
                            {g.habitId && habits.some((h) => h.id === g.habitId)
                              ? "Delete this goal and its linked habit?"
                              : "Delete this goal?"}
                          </span>
                          <div className="profile__edit-actions">
                            <button
                              className="profile__edit-cancel"
                              onClick={() => setConfirmDeleteGoalId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="profile__goal-confirm-delete"
                              onClick={handleDeleteGoalConfirm}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

      </div>

      <HabitForm
        defaultSlot="morning"
        open={habitFormOpen}
        onOpenChange={handleHabitFormOpenChange}
      />

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
          Synced to your account. Export a backup anytime.
        </p>
        {email && <p className="profile__data-phone">Signed in as {email}</p>}
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
