import { useRegisterSW } from 'virtual:pwa-register/react'
import { AnimatePresence, motion } from 'framer-motion'
import './UpdateBanner.css'

const CHECK_EVERY_MS = 60 * 60 * 1000

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, CHECK_EVERY_MS)
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="update-banner"
          role="status"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="update-banner__text">A new version is available.</span>
          <button className="update-banner__later" onClick={() => setNeedRefresh(false)}>
            Later
          </button>
          <button className="update-banner__refresh" onClick={() => void updateServiceWorker(true)}>
            Refresh
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
