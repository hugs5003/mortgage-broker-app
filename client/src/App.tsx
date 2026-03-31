import { useState, useEffect } from 'react'
import { MortgageWizard } from './components/MortgageWizard'
import { AuthModal } from './components/AuthModal'
import { useStore } from './store'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
  _fbq?: unknown
}

export default function App() {
  const { user, logout, setUtm } = useStore()
  const [showAuth, setShowAuth] = useState(false)

  // Capture UTM parameters on first load so they travel with leads/feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtm({
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    })
  }, [])

  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
    const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim()
    const analyticsWindow = window as AnalyticsWindow

    if (gaId && !document.querySelector(`script[data-ga-id="${gaId}"]`)) {
      analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
      analyticsWindow.gtag = analyticsWindow.gtag || ((...args: unknown[]) => {
        analyticsWindow.dataLayer?.push(args)
      })

      analyticsWindow.gtag('js', new Date())
      analyticsWindow.gtag('config', gaId)

      const gaScript = document.createElement('script')
      gaScript.async = true
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
      gaScript.dataset.gaId = gaId
      document.head.appendChild(gaScript)
    }

    if (pixelId && !document.querySelector(`script[data-meta-pixel-id="${pixelId}"]`)) {
      ;((f: AnalyticsWindow, b: Document, e: string, v: string) => {
        if (f.fbq) return

        const fbq = function (...args: unknown[]) {
          const callMethod = (fbq as unknown as { callMethod?: (...args: unknown[]) => void }).callMethod
          if (callMethod) {
            callMethod(...args)
            return
          }

          ;((fbq as unknown as { queue?: unknown[][] }).queue ||= []).push(args)
        }

        fbq.loaded = true
        fbq.version = '2.0'
        ;(fbq as unknown as { queue?: unknown[][] }).queue = []
        f.fbq = fbq as unknown as AnalyticsWindow['fbq']
        f._fbq = fbq

        const script = b.createElement(e) as HTMLScriptElement
        script.async = true
        script.src = v
        script.setAttribute('data-meta-pixel-id', pixelId)
        const firstScript = b.getElementsByTagName(e)[0]
        firstScript?.parentNode?.insertBefore(script, firstScript)
      })(analyticsWindow, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

      analyticsWindow.fbq?.('init', pixelId)
      analyticsWindow.fbq?.('track', 'PageView')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">MortgageOptimiser</h1>
            <p className="text-xs text-gray-400">Find your best mortgage deal</p>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Hi, {user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero banner — remortgage-focused for Instagram and search traffic */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Could you save money by remortgaging?</h2>
          <p className="text-blue-100 text-base sm:text-lg">Find your best deal in 60 seconds — free, instant, personalised.</p>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <MortgageWizard />
      </main>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
