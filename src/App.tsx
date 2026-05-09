import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "./components/Layout/Layout";
import Auth from "./components/Auth/Auth";
import Today from "./pages/Today/Today";
import Progress from "./pages/Progress/Progress";
import Habits from "./pages/Habits/Habits";
import Profile from "./pages/Profile/Profile";
import InstallPrompt from "./components/InstallPrompt/InstallPrompt";
import { useThemeStore } from "./store/useThemeStore";
import { useOnboardingStore } from "./store/useOnboardingStore";
import { useAuthStore } from "./store/useAuthStore";
import { useHabitStore } from "./store/useHabitStore";
import type { TimeSlot } from "./types";

const DEFAULT_HABITS: { title: string; icon: string; timeSlot: TimeSlot }[] = [
  { title: "Morning Stretch",      icon: "stretch",  timeSlot: "morning"   },
  { title: "Drink Water",          icon: "water",    timeSlot: "morning"   },
  { title: "Meditate 5 Min",       icon: "meditate", timeSlot: "morning"   },
  { title: "Morning Journal",      icon: "journal",  timeSlot: "morning"   },
  { title: "Stay Hydrated",        icon: "water",    timeSlot: "afternoon" },
  { title: "Take a Walk",          icon: "run",      timeSlot: "afternoon" },
  { title: "Eat Well",             icon: "meal",     timeSlot: "afternoon" },
  { title: "Focus Block",          icon: "focus",    timeSlot: "afternoon" },
  { title: "Read for 20 Min",      icon: "book",     timeSlot: "evening"   },
  { title: "Evening Workout",      icon: "gym",      timeSlot: "evening"   },
  { title: "Connect with Someone", icon: "heart",    timeSlot: "evening"   },
  { title: "Evening Bike Ride",    icon: "bike",     timeSlot: "evening"   },
  { title: "Sleep by 10:30pm",     icon: "sleep",    timeSlot: "night"     },
  { title: "Night Journal",        icon: "journal",  timeSlot: "night"     },
  { title: "Take Vitamins",        icon: "medicine", timeSlot: "night"     },
  { title: "Night Stretch",        icon: "stretch",  timeSlot: "night"     },
];

function AppSpinner() {
  return (
    <div className="app-loading">
      <motion.img
        src="/logo.png"
        className="app-loading__logo"
        alt="Constant"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

function Onboarding({ onDone, onBack }: { onDone: (name: string) => void; onBack: () => void }) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onDone(trimmed);
  }

  return (
    <div className="app-onboarding">
      <div className="app-onboarding__bg" aria-hidden="true" />
      <img src="/logo.png" className="app-onboarding__logo-float" alt="Constant" />
      <motion.div
        className="app-onboarding__card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1 className="app-onboarding__title">What's your name?</h1>
        <p className="app-onboarding__sub">
          We'll use it to personalize your experience.
        </p>

        <form className="app-onboarding__form" onSubmit={handleSubmit}>
          <input
            className="app-onboarding__input"
            type="text"
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
            autoComplete="given-name"
          />
          <button
            className="app-onboarding__btn"
            type="submit"
            disabled={!name.trim()}
          >
            Let's start →
          </button>
        </form>
        <button className="app-onboarding__back" type="button" onClick={onBack}>
          ← Change number
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { applyTheme } = useThemeStore();
  const { completed, loadFromDb: loadProfile, complete } = useOnboardingStore();
  const { userId, signOut } = useAuthStore();
  const { loadFromDb: loadHabits, addHabit } = useHabitStore();
  const [syncing, setSyncing] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    if (!userId) {
      setSyncing(false);
      setDbLoaded(false);
      return;
    }
    setSyncing(true);
    setDbLoaded(false);
    Promise.all([loadHabits(userId), loadProfile(userId)]).finally(() => {
      setSyncing(false);
      setDbLoaded(true);
    });
  }, [userId, loadHabits, loadProfile]);

  function handleOnboardingDone(name: string) {
    if (useHabitStore.getState().habits.length === 0) {
      DEFAULT_HABITS.forEach((h) => addHabit(h));
    }
    complete(name, []);
  }

  if (!userId) return <Auth />;
  if (syncing || !dbLoaded) return <AppSpinner />;
  if (!completed) return <Onboarding onDone={handleOnboardingDone} onBack={signOut} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="progress" element={<Progress />} />
          <Route path="habits" element={<Habits />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      <InstallPrompt />
    </BrowserRouter>
  );
}
