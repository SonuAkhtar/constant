import { useRef, useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '../Header/Header'
import BottomNav from '../BottomNav/BottomNav'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  const mainRef  = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setScrolled(prev => prev ? el.scrollTop > 4 : el.scrollTop > 16)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    setScrolled(false)
  }, [location.pathname])

  const isToday = location.pathname === '/'

  return (
    <div className={['layout', scrolled && !isToday ? 'layout--scrolled' : ''].join(' ')}>
      {!isToday && <Header scrolled={scrolled} />}
      <main className="layout__main" ref={mainRef}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="layout__page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
