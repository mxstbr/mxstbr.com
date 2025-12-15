export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}


