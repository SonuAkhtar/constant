import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Check, X, MailCheck } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { usernameExists } from '../../lib/db'
import './Auth.css'

type Mode = 'login' | 'signup' | 'forgot'
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const

function isStrong(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)
}

function passwordStrength(pw: string): { score: number; label: string } {
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][s]
  return { score: s, label }
}

function friendlyError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes('network') || msg.includes('fetch')) return 'No connection. Check your internet and try again.'
  if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'An account with that email already exists.'
  return raw
}

function PasswordField({
  label, placeholder, value, onChange, show, onToggle, autoComplete,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  autoComplete: string
}) {
  return (
    <label className="auth__field">
      <span className="auth__label">{label}</span>
      <div className="auth__input-wrap">
        <input
          className="auth__input auth__input--pw"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="auth__eye"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </label>
  )
}

function StrengthMeter({ pw }: { pw: string }) {
  if (!pw) return null
  const { score, label } = passwordStrength(pw)
  return (
    <div className="auth__strength" data-score={score}>
      <div className="auth__strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={['auth__strength-seg', i < score ? 'auth__strength-seg--on' : ''].join(' ')} />
        ))}
      </div>
      <span className="auth__strength-label">{label}</span>
    </div>
  )
}

function MatchHint({ pw, confirm }: { pw: string; confirm: string }) {
  if (!confirm) return null
  const ok = pw === confirm
  return (
    <span className={['auth__hint', ok ? 'auth__hint--ok' : 'auth__hint--error'].join(' ')}>
      {ok ? <Check size={14} /> : <X size={14} />}
      {ok ? 'Passwords match' : "Passwords don't match"}
    </span>
  )
}

export default function Auth() {
  const { signIn, signUp, sendPasswordReset, updatePassword, loading, recovery } = useAuthStore()

  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')

  const [identifier, setIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    if (mode !== 'signup') return
    const u = username.trim()
    if (!u) { setUsernameStatus('idle'); return }
    if (!USERNAME_RE.test(u)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    let active = true
    const timer = setTimeout(async () => {
      const taken = await usernameExists(u.toLowerCase())
      if (active) setUsernameStatus(taken ? 'taken' : 'available')
    }, 450)
    return () => { active = false; clearTimeout(timer) }
  }, [username, mode])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setUsernameStatus('idle')
    setForgotSent(false)
  }

  async function handleLogin() {
    setError('')
    if (!identifier.trim() || !loginPassword) return
    const { error: err } = await signIn(identifier, loginPassword)
    if (err) setError(friendlyError(err))
  }

  async function handleSignup() {
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!USERNAME_RE.test(username.trim())) return setError('Username must be 3-20 letters, numbers, or underscores.')
    if (usernameStatus === 'taken') return setError('That username is already taken.')
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.')
    if (!isStrong(password)) return setError('Use 8+ characters with an uppercase letter and a number.')
    if (password !== confirm) return setError("Passwords don't match.")
    const { error: err } = await signUp({ name, username, email, password })
    if (err) setError(friendlyError(err))
  }

  async function handleForgot() {
    setError('')
    if (!EMAIL_RE.test(forgotEmail.trim())) return setError('Please enter a valid email address.')
    const { error: err } = await sendPasswordReset(forgotEmail)
    if (err) setError(friendlyError(err))
    else setForgotSent(true)
  }

  async function handleRecovery() {
    setError('')
    if (!isStrong(password)) return setError('Use 8+ characters with an uppercase letter and a number.')
    if (password !== confirm) return setError("Passwords don't match.")
    const { error: err } = await updatePassword(password)
    if (err) setError(friendlyError(err))
  }

  const canLogin = identifier.trim().length > 0 && loginPassword.length > 0
  const canSignup =
    name.trim().length > 0 && username.trim().length > 0 && email.trim().length > 0 &&
    password.length > 0 && confirm.length > 0 &&
    usernameStatus !== 'taken' && usernameStatus !== 'checking'
  const canRecover = password.length > 0 && confirm.length > 0

  if (recovery) {
    return (
      <div className="auth">
        <div className="auth__bg" aria-hidden="true" />
        <img src="/new-logo-full.png" className="auth__logo-float auth__logo-float--sm" alt="Progress" />
        <motion.div
          className="auth__content"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="auth__card" style={{ marginTop: 0 }}>
            <form className="auth__form" onSubmit={(e) => { e.preventDefault(); handleRecovery() }}>
              <div className="auth__head">
                <h1 className="auth__title">Set a new password</h1>
                <p className="auth__card-label">Create a strong password to secure your account.</p>
              </div>

              <PasswordField
                label="New password" placeholder="8+ chars with a capital & a number"
                value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="new-password"
              />
              <StrengthMeter pw={password} />

              <PasswordField
                label="Confirm password" placeholder="Re-enter new password"
                value={confirm} onChange={setConfirm}
                show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} autoComplete="new-password"
              />
              <MatchHint pw={password} confirm={confirm} />

              {error && <p className="auth__error" role="alert">{error}</p>}

              <button className="auth__submit-btn" type="submit" disabled={loading || !canRecover}>
                {loading ? <span className="auth__spinner auth__spinner--dark" /> : 'Update password →'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true" />
      <img src="/new-logo-full.png" className="auth__logo-float auth__logo-float--sm" alt="Progress" />

      <motion.div
        className="auth__content"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {}
        <AnimatePresence initial={false}>
          {mode !== 'forgot' && (
            <motion.div
              className="auth__toggle"
              role="tablist"
              aria-label="Login or sign up"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            >
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={['auth__toggle-btn', mode === m ? 'auth__toggle-btn--active' : ''].join(' ')}
                  onClick={() => switchMode(m)}
                >
                  {mode === m && (
                    <motion.span layoutId="auth-pill" className="auth__toggle-pill" transition={SPRING} />
                  )}
                  <span className="auth__toggle-text">{m === 'login' ? 'Log in' : 'Sign up'}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="auth__card" layout transition={{ layout: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}>
          <AnimatePresence mode="wait" initial={false}>
            {}
            {mode === 'login' && (
              <motion.form
                key="login" className="auth__form"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={(e) => { e.preventDefault(); handleLogin() }}
              >
                <p className="auth__card-label">Welcome back, log in to continue</p>

                <label className="auth__field">
                  <span className="auth__label">Email or username</span>
                  <input
                    className="auth__input" type="text" autoCapitalize="none" autoCorrect="off"
                    placeholder="you@example.com or username"
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username" autoFocus
                  />
                </label>

                <PasswordField
                  label="Password" placeholder="Your password"
                  value={loginPassword} onChange={setLoginPassword}
                  show={showLoginPw} onToggle={() => setShowLoginPw((v) => !v)} autoComplete="current-password"
                />

                <button type="button" className="auth__link auth__forgot" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>

                {error && <p className="auth__error" role="alert">{error}</p>}

                <button className="auth__submit-btn" type="submit" disabled={loading || !canLogin}>
                  {loading ? <span className="auth__spinner auth__spinner--dark" /> : 'Log in →'}
                </button>

                <p className="auth__switch">
                  New here?{' '}
                  <button type="button" className="auth__switch-btn" onClick={() => switchMode('signup')}>Create an account</button>
                </p>
              </motion.form>
            )}

            {}
            {mode === 'signup' && (
              <motion.form
                key="signup" className="auth__form"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={(e) => { e.preventDefault(); handleSignup() }}
              >
                <p className="auth__card-label">Create your account</p>

                <label className="auth__field">
                  <span className="auth__label">Name</span>
                  <input
                    className="auth__input" type="text" placeholder="Your name"
                    value={name} onChange={(e) => setName(e.target.value)}
                    autoComplete="name" maxLength={40} autoFocus
                  />
                </label>

                <label className="auth__field">
                  <span className="auth__label">Username</span>
                  <input
                    className="auth__input" type="text" autoCapitalize="none" autoCorrect="off"
                    placeholder="3-20 letters, numbers or _  (e.g. alex_92)"
                    value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    autoComplete="username" maxLength={20}
                    aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
                  />
                  {usernameStatus === 'checking' && (
                    <span className="auth__hint"><span className="auth__hint-spinner" /> Checking availability…</span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="auth__hint auth__hint--error"><X size={14} /> 3-20 letters, numbers, or underscores.</span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="auth__hint auth__hint--error"><X size={14} /> That username is already taken.</span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="auth__hint auth__hint--ok"><Check size={14} /> Username is available</span>
                  )}
                </label>

                <label className="auth__field">
                  <span className="auth__label">Email</span>
                  <input
                    className="auth__input" type="email" autoCapitalize="none" autoCorrect="off"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  />
                </label>

                <PasswordField
                  label="Password" placeholder="8+ chars with a capital & a number"
                  value={password} onChange={setPassword}
                  show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="new-password"
                />
                <StrengthMeter pw={password} />

                <PasswordField
                  label="Confirm password" placeholder="Re-enter your password"
                  value={confirm} onChange={setConfirm}
                  show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} autoComplete="new-password"
                />
                <MatchHint pw={password} confirm={confirm} />

                {error && <p className="auth__error" role="alert">{error}</p>}

                <button className="auth__submit-btn" type="submit" disabled={loading || !canSignup}>
                  {loading ? <span className="auth__spinner auth__spinner--dark" /> : 'Create account →'}
                </button>

                <p className="auth__switch">
                  Already have an account?{' '}
                  <button type="button" className="auth__switch-btn" onClick={() => switchMode('login')}>Log in</button>
                </p>
              </motion.form>
            )}

            {}
            {mode === 'forgot' && (
              <motion.div
                key="forgot" className="auth__form"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <button type="button" className="auth__back" onClick={() => switchMode('login')}>
                  <ArrowLeft size={16} /> Back to login
                </button>

                {forgotSent ? (
                  <div className="auth__sent">
                    <div className="auth__sent-icon"><MailCheck size={28} /></div>
                    <h1 className="auth__title">Check your inbox</h1>
                    <p className="auth__card-label">
                      We sent a reset link to <strong>{forgotEmail.trim()}</strong>. Open it to set a new password.
                    </p>
                    <button type="button" className="auth__submit-btn" onClick={() => switchMode('login')}>
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleForgot() }} className="auth__form">
                    <div className="auth__head">
                      <h1 className="auth__title">Reset your password</h1>
                      <p className="auth__card-label">Enter your email and we'll send you a reset link.</p>
                    </div>

                    <label className="auth__field">
                      <span className="auth__label">Email</span>
                      <input
                        className="auth__input" type="email" autoCapitalize="none" autoCorrect="off"
                        placeholder="you@example.com"
                        value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        autoComplete="email" autoFocus
                      />
                    </label>

                    {error && <p className="auth__error" role="alert">{error}</p>}

                    <button className="auth__submit-btn" type="submit" disabled={loading || !forgotEmail.trim()}>
                      {loading ? <span className="auth__spinner auth__spinner--dark" /> : 'Send reset link →'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
