const reportViewScript = String.raw`
(() => {
  let previousPath = window.location.pathname
  const endpoint = '/api/incr'

  function send() {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(
        endpoint,
        new Blob(['{}'], { type: 'application/json' }),
      )
      if (queued) return
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true,
    }).catch(() => {})
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(send, { timeout: 3000 })
      return
    }

    window.setTimeout(send, 1500)
  }

  function onLocationChange() {
    const nextPath = window.location.pathname
    if (nextPath === previousPath) return
    previousPath = nextPath
    schedule()
  }

  for (const method of ['pushState', 'replaceState']) {
    const original = history[method]
    history[method] = function (...args) {
      const result = original.apply(this, args)
      onLocationChange()
      return result
    }
  }

  window.addEventListener('popstate', onLocationChange)
  window.addEventListener(
    'click',
    (event) => {
      const link = event.target.closest && event.target.closest('a[href]')
      if (!link || link.target || link.origin !== window.location.origin) return
      window.setTimeout(onLocationChange, 0)
      window.setTimeout(onLocationChange, 100)
    },
    true,
  )
  schedule()
})()
`

export const ReportView = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: reportViewScript,
    }}
  />
)
