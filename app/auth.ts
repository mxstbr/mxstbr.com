import { cookies } from 'next/headers'

export function auth(): string | undefined {
  const cookieStore = cookies()
  const password = cookieStore.get('password')

  return password?.value
}

export function isMax() {
  return auth() === process.env.CAL_PASSWORD
}

export function verifyBasicAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Basic ')) return false

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return Buffer.from(password, 'base64').toString('utf-8') === process.env.CAL_PASSWORD && username === 'max'
}
