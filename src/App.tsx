import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  { title: "Morning Stretch", icon: "morning", timeSlot: "morning" },
  { title: "Drink 8 Glasses of Water", icon: "afternoon", timeSlot: "afternoon" },
  { title: "Read for 20 Min", icon: "evening", timeSlot: "evening" },
  { title: "Sleep by 10:30pm", icon: "night", timeSlot: "night" },
];

function AppSpinner() {
  return (
    <div className="app-loading">
      <div className="app-loading__ring" />
    </div>
  );
}

export default function App() {
  const { applyTheme } = useThemeStore();
  const { completed, loadFromDb: loadProfile, complete } = useOnboardingStore();
  const { userId } = useAuthStore();
  const { loadFromDb: loadHabits, addHabit } = useHabitStore();
  const [syncing, setSyncing] = useState(false);
  const autoSetupRef = useRef(false);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    if (!userId) return;
    setSyncing(true);
    Promise.all([loadHabits(userId), loadProfile(userId)]).finally(() =>
      setSyncing(false),
    );
  }, [userId, loadHabits, loadProfile]);

  // Auto-setup for new users - skip onboarding, seed 4 default habits
  useEffect(() => {
    if (syncing || !userId || completed || autoSetupRef.current) return;
    autoSetupRef.current = true;
    const snapshot = useHabitStore.getState().habits;
    if (snapshot.length === 0) {
      DEFAULT_HABITS.forEach((h) => addHabit(h));
    }
    complete("", []);
  }, [syncing, userId, completed, addHabit, complete]);

  if (syncing || (userId && !completed)) return <AppSpinner />;
  if (!userId) return <Auth />;

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
