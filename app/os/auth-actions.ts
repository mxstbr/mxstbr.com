'use server'

import { cookies } from 'next/headers'

export async function setPasswordCookie(password: string) {
  const cookieStore = cookies()
  cookieStore.set('password', password, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // One year
    path: '/',
  })
}

export async function clearPasswordCookie() {
  const cookieStore = cookies()
  cookieStore.delete('password')
}
