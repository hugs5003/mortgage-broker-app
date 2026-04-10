import { useState, useEffect } from 'react'
import { MortgageWizard } from './components/MortgageWizard'
import { AuthModal } from './components/AuthModal'
import { useStore } from './store'
import { BrokerDashboard } from './components/BrokerDashboard'
import { FinancialTools } from './components/FinancialTools'
import { ShareView } from './components/ShareView'
import { PasswordGate, isAccessGranted } from './components/PasswordGate'
import { LandingPage } from './components/LandingPage'
import { FeedbackBanner } from './components/FeedbackBanner'
import { PersonalFinance } from './components/PersonalFinance'
import { DisclaimerBanner } from './components/DisclaimerBanner'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
  _fbq?: unknown
}

export default function App() {
  const { user, logout, setUtm, mode, setMode, activePage, setActivePage } = useStore()
  const [showAuth, setShowAuth] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [granted, setGranted] = useState(isAccessGranted)

  // Capture UTM parameters on first load so they travel with leads/feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtm({
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    })

    const pathMatch = window.location.pathname.match(/^\/share\/([a-f0-9]{64})$/i)
    const queryToken = params.get('share')
    if (pathMatch?.[1]) {
      setShareToken(pathMatch[1])
    } else if (queryToken && /^[a-f0-9]{64}$/i.test(queryToken)) {
      setShareToken(queryToken)
    }
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

  if (!granted) {
    return <PasswordGate onGranted={() => setGranted(true)} />
  }

  if (!mode) {
    return <LandingPage />
  }

  if (shareToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-blue-700">MortgageOptimiser</h1>
            <p className="text-xs text-gray-500">Shared recommendation view</p>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <ShareView token={shareToken} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">MortgageOptimiser</h1>
            <p className="text-xs text-gray-400">Consumer and broker decision platform</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Hi, {user.name}</span>
                <button onClick={logout} className="text-sm text-blue-600 hover:underline">
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Rainbow "personal finances" banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold leading-tight">Mortgage intelligence for consumers and brokers</h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-0.5">Compare deals, run what-if scenarios, and track better outcomes.</p>
          </div>
          <button
            onClick={() => setActivePage(activePage === 'personal-finance' ? 'wizard' : 'personal-finance')}
            className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-purple-700 hover:bg-purple-50 shadow-md transition-all"
          >
            ✨ Optimise my personal finances
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activePage === 'personal-finance' ? (
          <PersonalFinance />
        ) : activePage === 'financial-tools' ? (
          <FinancialTools />
        ) : mode === 'broker' ? (
          user ? (
            <BrokerDashboard />
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900">Broker login required</h3>
              <p className="text-sm text-gray-500 mt-1">Sign in with your broker account to create, tag, and publish client sessions.</p>
              <button onClick={() => setShowAuth(true)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                Sign in now
              </button>
            </div>
          )
        ) : (
          <MortgageWizard />
        )}
      </main>

      <DisclaimerBanner />
      <FeedbackBanner />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
