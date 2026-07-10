import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "./components/Layout/Layout";
import Auth from "./components/Auth/Auth";
import Today from "./pages/Today/Today";
import InstallPrompt from "./components/InstallPrompt/InstallPrompt";
import ToastContainer from "./components/Toast/Toast";

function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  chunkName: string,
) {
  return lazy(async () => {
    const RELOAD_KEY = `progress-chunk-reload:${chunkName}`;
    try {
      return await factory();
    } catch (err) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();

        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem(RELOAD_KEY);
      throw err;
    }
  });
}

const loadProgress = () => import("./pages/Progress/Progress");
const loadHabits   = () => import("./pages/Habits/Habits");
const loadWellness = () => import("./pages/Wellness/Wellness");
const loadProfile  = () => import("./pages/Profile/Profile");

const Progress = lazyWithRetry(loadProgress, "progress");
const Habits   = lazyWithRetry(loadHabits,   "habits");
const Wellness = lazyWithRetry(loadWellness, "wellness");
const Profile  = lazyWithRetry(loadProfile,  "profile");

function preloadRoutes() {
  loadProgress();
  loadHabits();
  loadWellness();
  loadProfile();
}
import { useThemeStore } from "./store/useThemeStore";
import { useOnboardingStore } from "./store/useOnboardingStore";
import { useAuthStore } from "./store/useAuthStore";
import { useHabitStore } from "./store/useHabitStore";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", gap: "1rem", padding: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.5rem" }}>⚠️</p>
          <p style={{ fontWeight: 700 }}>Something went wrong</p>
          <button
            style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", background: "var(--color-primary)", color: "#fff", fontWeight: 600 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageSkeleton() {
  return (
    <div className="layout__page layout__page-loading" aria-hidden="true">
      <motion.img
        src="/new-logo-full.png"
        className="layout__page-loading-logo"
        alt=""
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.3, 0.5] }}
        transition={{
          opacity: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    </div>
  );
}

function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AppSpinner() {
  return (
    <div className="app-loading">
      <motion.img
        src="/new-logo-full.png"
        className="app-loading__logo"
        alt="Progress"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

export default function App() {
  const { applyTheme } = useThemeStore();
  const { loadFromDb: loadProfile } = useOnboardingStore();
  const { userId, initializing, init, recovery } = useAuthStore();
  const { loadFromDb: loadHabits } = useHabitStore();
  const [syncing, setSyncing] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    init();
  }, [init]);

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

  useEffect(() => {
    if (!dbLoaded) return;
    type RIC = (cb: () => void, opts?: { timeout: number }) => number;
    type CIC = (id: number) => void;
    const w = window as Window & {
      requestIdleCallback?: RIC;
      cancelIdleCallback?: CIC;
    };
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(preloadRoutes, { timeout: 2000 })
      : window.setTimeout(preloadRoutes, 800);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [dbLoaded]);

  if (initializing) return <AppSpinner />;

  if (recovery) return <Auth />;
  if (!userId) return <Auth />;
  if (syncing || !dbLoaded) return <AppSpinner />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ErrorBoundary><Today /></ErrorBoundary>} />
          <Route path="progress"  element={<RouteBoundary><Progress /></RouteBoundary>} />
          <Route path="habits"    element={<RouteBoundary><Habits /></RouteBoundary>} />
          <Route path="wellness"  element={<RouteBoundary><Wellness /></RouteBoundary>} />
          <Route path="profile"   element={<RouteBoundary><Profile /></RouteBoundary>} />
        </Route>
      </Routes>
      <InstallPrompt />
      <ToastContainer />
    </BrowserRouter>
  );
}
