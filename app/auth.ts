import { cookies } from 'next/headers'

export function auth(): string {
  const cookieStore = cookies()
  const password = cookieStore.get('password')

  return password?.value
}

export function isMax() {
  return auth() === process.env.CAL_PASSWORD
}
