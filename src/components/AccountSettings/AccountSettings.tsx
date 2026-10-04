import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useHabitStore } from '../../store/useHabitStore'
import { useOnboardingStore } from '../../store/useOnboardingStore'
import { useToastStore } from '../../store/useToastStore'
import { resetAccountSettings } from '../../lib/settingsSync'
import { EMAIL_RE, isStrongPassword } from '../../utils/validation'
import './AccountSettings.css'

type Panel = 'none' | 'password' | 'email' | 'delete'


export default function AccountSettings() {
  const { email, loading, changePassword, changeEmail, deleteAccount } = useAuthStore()
  const resetHabits = useHabitStore((s) => s.reset)
  const resetOnboarding = useOnboardingStore((s) => s.reset)
  const pushToast = useToastStore((s) => s.push)

  const [panel, setPanel] = useState<Panel>('none')
  const [error, setError] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [deleteText, setDeleteText] = useState('')

  function open(p: Panel) {
    setPanel(panel === p ? 'none' : p)
    setError('')
    setCurrent('')
    setNext('')
    setConfirm('')
    setNewEmail('')
    setDeleteText('')
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isStrongPassword(next)) return setError('Use 8+ characters with an uppercase letter and a number.')
    if (next !== confirm) return setError("Passwords don't match.")
    const { error: err } = await changePassword(current, next)
    if (err) return setError(err)
    open('none')
    pushToast('Password updated')
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(newEmail.trim())) return setError('Enter a valid email address.')
    if (newEmail.trim().toLowerCase() === email?.toLowerCase()) return setError('That is already your email.')
    const { error: err } = await changeEmail(newEmail)
    if (err) return setError(err)
    open('none')
    pushToast('Check your inbox to confirm the new address')
  }

  async function submitDelete(e: React.FormEvent) {
    e.preventDefault()
    if (deleteText !== 'DELETE') return setError('Type DELETE to confirm.')
    const { error: err } = await deleteAccount()
    if (err) return setError(err)
    resetHabits()
    resetOnboarding()
    resetAccountSettings()
  }

  return (
    <div className="profile__card account">
      <h2 className="profile__section-heading">Account</h2>
      {email && <p className="account__email">{email}</p>}

      <div className="account__actions">
        <button className="profile__data-btn" aria-expanded={panel === 'password'} onClick={() => open('password')}>
          Change password
        </button>
        <button className="profile__data-btn" aria-expanded={panel === 'email'} onClick={() => open('email')}>
          Change email
        </button>
      </div>

      {panel === 'password' && (
        <form className="account__form" onSubmit={submitPassword}>
          <label className="account__field">
            <span>Current password</span>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <label className="account__field">
            <span>New password</span>
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </label>
          <label className="account__field">
            <span>Confirm new password</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
          {error && <p className="account__error" role="alert">{error}</p>}
          <button className="account__submit" type="submit" disabled={loading}>Update password</button>
        </form>
      )}

      {panel === 'email' && (
        <form className="account__form" onSubmit={submitEmail}>
          <label className="account__field">
            <span>New email</span>
            <input type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </label>
          <p className="account__hint">We'll send a confirmation link. Your email changes once you open it.</p>
          {error && <p className="account__error" role="alert">{error}</p>}
          <button className="account__submit" type="submit" disabled={loading}>Send confirmation</button>
        </form>
      )}

      <button className="account__delete-link" aria-expanded={panel === 'delete'} onClick={() => open('delete')}>
        Delete account
      </button>

      {panel === 'delete' && (
        <form className="account__form account__form--danger" onSubmit={submitDelete}>
          <p className="account__hint">
            This permanently deletes your account, habits, history and goals. It can't be undone.
            Export a backup first if you want to keep your data.
          </p>
          <label className="account__field">
            <span>Type DELETE to confirm</span>
            <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          </label>
          {error && <p className="account__error" role="alert">{error}</p>}
          <button className="account__submit account__submit--danger" type="submit" disabled={loading || deleteText !== 'DELETE'}>
            Delete my account
          </button>
        </form>
      )}
    </div>
  )
}
