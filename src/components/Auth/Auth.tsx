import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/useAuthStore'
import { COUNTRY_CODES, type CountryCode } from '../../data/countryCodes'
import './Auth.css'

const INDIA = COUNTRY_CODES.find(c => c.code === 'IN')!

function friendlyError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes('network') || msg.includes('fetch')) return 'No connection. Check your internet and try again.'
  if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (msg.includes('invalid') && msg.includes('phone')) return 'That phone number doesn\'t look right. Please check it.'
  if (msg.includes('not found') || msg.includes('no rows')) return 'Something went wrong. Please try again.'
  return 'Something went wrong. Please try again.'
}

export default function Auth() {
  const { signIn, loading } = useAuthStore()

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(INDIA)
  const [phone, setPhone]                     = useState('')
  const [error, setError]                     = useState('')
  const [showDropdown, setShowDropdown]       = useState(false)
  const [countrySearch, setCountrySearch]     = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  const digits = phone.replace(/\D/g, '')
  const fullPhone = `${selectedCountry.dial}${digits}`
  const isPhoneValid = digits.length >= 6 && digits.length <= 15

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dial.includes(countrySearch)
  )

  useEffect(() => {
    if (showDropdown) setTimeout(() => searchRef.current?.focus(), 60)
    else setCountrySearch('')
  }, [showDropdown])

  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  async function handleContinue() {
    if (!isPhoneValid) return
    setError('')
    const { error: err } = await signIn(fullPhone)
    if (err) {
      setError(friendlyError(err))
    } else {
      window.history.replaceState({}, '', '/')
    }
  }

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true" />
      <img src="/new-logo-full.png" className="auth__logo-float" alt="Constant" />

      <motion.div
        className="auth__content"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="auth__card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
        >
          <p className="auth__card-label">Enter your phone number to continue</p>

          <div className="auth__phone-row">
            <div className="auth__country-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="auth__country-trigger"
                onClick={() => setShowDropdown(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={showDropdown}
              >
                <span className="auth__country-flag">{selectedCountry.flag}</span>
                <span className="auth__country-dial">{selectedCountry.dial}</span>
                <svg
                  className={['auth__chevron', showDropdown ? 'auth__chevron--open' : ''].join(' ')}
                  width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="auth__dropdown"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="auth__dropdown-search-wrap">
                      <input
                        ref={searchRef}
                        className="auth__dropdown-search"
                        type="text"
                        placeholder="Search country or code…"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                      />
                    </div>
                    <ul className="auth__dropdown-list" role="listbox" aria-label="Country code">
                      {filteredCountries.map(c => (
                        <li
                          key={c.code}
                          role="option"
                          aria-selected={c.code === selectedCountry.code}
                          tabIndex={0}
                          className={['auth__dropdown-item', c.code === selectedCountry.code ? 'auth__dropdown-item--selected' : ''].join(' ')}
                          onClick={() => { setSelectedCountry(c); setShowDropdown(false) }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedCountry(c)
                              setShowDropdown(false)
                            }
                          }}
                        >
                          <span className="auth__item-flag">{c.flag}</span>
                          <span className="auth__item-name">{c.name}</span>
                          <span className="auth__item-dial">{c.dial}</span>
                        </li>
                      ))}
                      {filteredCountries.length === 0 && (
                        <li className="auth__dropdown-empty">No results</li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              className="auth__phone-input"
              type="tel"
              inputMode="numeric"
              placeholder="Phone number"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleContinue()}
              maxLength={13}
              autoFocus
            />
          </div>

          {error && <p className="auth__error" role="alert">{error}</p>}

          <button
            className="auth__submit-btn"
            onClick={handleContinue}
            disabled={loading || !isPhoneValid}
          >
            {loading
              ? <span className="auth__spinner auth__spinner--dark" />
              : 'Continue →'
            }
          </button>
        </motion.div>

        <p className="auth__privacy">
          <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: '-0.1em', marginRight: '4px' }}>
            <rect x="2" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          No password needed. Your number is your identity.
        </p>
      </motion.div>
    </div>
  )
}
