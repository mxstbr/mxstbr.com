import { cookies } from 'next/headers'

export function PasswordForm({
  error,
  defaultPassword,
}: {
  error?: string
  defaultPassword?: string
}) {
  return (
    <div className="min-h-[70vh] md:min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Access required
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Enter the OS password</h1>
          <p className="mt-1 text-sm text-slate-600">
            This area is locked. Provide the shared password to continue.
          </p>
        </div>

        <form
          action={async (formData) => {
            'use server'
            const cookieStore = await cookies()

            const password = formData.get('password')
            if (typeof password !== 'string') return

            cookieStore.set('password', password, {
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
              path: '/',
            })
          }}
          className="space-y-5 px-6 py-6"
        >
          <label className="block space-y-2 text-sm font-medium text-slate-800">
            <span>Password</span>
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-inner outline-hidden transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              type="password"
              name="password"
              defaultValue={defaultPassword}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-inner">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-[1px] hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:translate-y-0"
          >
            Unlock OS
          </button>
        </form>
      </div>
    </div>
  )
}
