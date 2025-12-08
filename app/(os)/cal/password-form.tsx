import { cookies } from 'next/headers'

export function PasswordForm({
  error,
  defaultPassword,
}: {
  error?: string
  defaultPassword?: string
}) {
  return (
    <form
      action={async (formData) => {
        'use server'
        const cookieStore = await cookies()

        const password = formData.get('password')
        if (typeof password !== 'string') return

        cookieStore.set('password', password, {
          // One year
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        })
      }}
    >
      <label>
        Password
        <input type="password" name="password" defaultValue={defaultPassword} />
      </label>
      <button type="submit">Submit</button>
      {error && <p>{error}</p>}
    </form>
  )
}
