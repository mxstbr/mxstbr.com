// Read only on the server, then send the same deployment identity in the
// document and API headers so an always-open iPad can replace old app code.
export function choresAppVersion() {
  return (
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'development'
  )
}
