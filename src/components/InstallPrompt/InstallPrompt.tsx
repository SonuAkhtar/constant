import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./InstallPrompt.css";

const OPEN_COUNT_KEY = "bestofme-open-count";
const DISMISSED_KEY = "bestofme-install-dismissed";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<
    (Event & { prompt: () => Promise<void> }) | null
  >(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(OPEN_COUNT_KEY, String(count));

    if (count >= 3) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
    }
    handleDismiss();
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install-prompt__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="install-prompt__sheet"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="install-prompt__icon-wrap" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 30 30" fill="none">
                <rect
                  width="30"
                  height="30"
                  rx="8"
                  fill="var(--color-primary)"
                />
                <polyline
                  points="4.5,21 9.5,14.5 13.5,17 18.5,9 25,11.5"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div className="install-prompt__body">
              <p className="install-prompt__title">Add to Home Screen</p>
              <p className="install-prompt__sub">
                Get reminders, offline access, and a faster experience - right
                from your home screen.
              </p>
            </div>
            <div className="install-prompt__actions">
              <button
                className="install-prompt__dismiss"
                onClick={handleDismiss}
              >
                Not now
              </button>
              <button
                className="install-prompt__install"
                onClick={handleInstall}
              >
                Add to Home Screen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
