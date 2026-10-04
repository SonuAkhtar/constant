export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)
}
