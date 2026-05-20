import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/useToastStore'
import './Toast.css'

export default function ToastContainer() {
  const toasts  = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className="toast"
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{    y: 8,  opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => dismiss(t.id)}
            role="status"
          >
            {t.icon && <span className="toast__icon" aria-hidden="true">{t.icon}</span>}
            <span className="toast__message">{t.message}</span>
            {t.action && (
              <button
                className="toast__action"
                onClick={(e) => { e.stopPropagation(); t.action!.onClick(); dismiss(t.id) }}
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
