// Baked into the server bundles, then send the same build identity in the
// document and API headers so an always-open iPad can replace old app code.
export function choresAppVersion() {
  return process.env.CHORES_APP_VERSION || 'development'
}
