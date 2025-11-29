import { cookies } from 'next/headers'
import { PasswordField } from './password-field'

export function PasswordForm({ error }: { error?: string }) {
  async function setPassword(formData: FormData) {
    'use server'
    const cookieStore = cookies()

    const password = formData.get('password')
    if (typeof password !== 'string') return

    cookieStore.set('password', password, {
      // One year
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    })
  }

  return (
    <form action={setPassword}>
      <label>
        Password
        <PasswordField name="password" />
      </label>
      <button type="submit">Submit</button>
      {error && <p>{error}</p>}
    </form>
  )
}
