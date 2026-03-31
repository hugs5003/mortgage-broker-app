import { useState } from 'react'
import { useStore } from '../store'
import { leadApi, feedbackApi } from '../services/api'
import type { MortgageDeal } from '../types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function DealResults() {
  const { deals, utm, userProfile, leadSubmitted, setLeadSubmitted, feedbackSubmitted, setFeedbackSubmitted } = useStore()

  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const handleLeadSubmit = async () => {
    if (!email || !consent) return
    setLeadLoading(true)
    try {
      await leadApi.submit({
        email,
        consent,
        source: 'results_page',
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        purchase_type: userProfile.purchaseType,
      })
      setLeadSubmitted(true)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lead_captured', { event_category: 'engagement', method: 'results_page' })
      }
    } catch {
      // Silently fail — do not interrupt the user experience
    } finally {
      setLeadLoading(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (rating === 0) return
    setFeedbackLoading(true)
    try {
      await feedbackApi.submit({
        rating,
        comment: comment || undefined,
        email: email || undefined,
        purchase_type: userProfile.purchaseType,
        utm_source: utm.source,
        utm_campaign: utm.campaign,
      })
      setFeedbackSubmitted(true)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'feedback_submitted', { event_category: 'engagement', value: rating })
      }
    } catch {
      // Silently fail
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
        No deals found. Try adjusting your criteria.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deals.slice(0, 8).map((deal: MortgageDeal, i: number) => (
        <div
          key={deal.id || i}
          className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            i === 0 ? 'border-green-500' : 'border-gray-200'
          }`}
        >
          {i === 0 && (
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded mb-3">
              ⭐ Best Match
            </span>
          )}

          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{deal.lender}</h3>
              <p className="text-gray-500 text-sm">{deal.dealName}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{deal.rate}%</div>
              <div className="text-xs text-gray-400">{deal.type?.replace(/_/g, ' ')}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Monthly Payment</div>
              <div className="font-semibold text-gray-900">
                {deal.calculation?.monthlyDeal
                  ? formatCurrency(deal.calculation.monthlyDeal) + '/mo'
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fixed Period</div>
              <div className="font-semibold text-gray-900">{deal.fixedPeriod || 0} yrs</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Arrangement Fee</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(deal.arrangementFee || 0)}
              </div>
            </div>
          </div>

          {deal.features && deal.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {deal.features.map((f: string) => (
                <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Email capture ───────────────────────────────────────────── */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mt-2">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Get these results by email</h3>
        <p className="text-sm text-gray-500 mb-4">
          We’ll also remind you when a better deal becomes available — so you never miss a saving.
        </p>

        {leadSubmitted ? (
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <span>✓</span>
            <span>Done! We’ll be in touch.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-blue-600 flex-shrink-0"
              />
              <span>
                I agree to receive mortgage deal updates and reminders by email. I can unsubscribe
                at any time.
              </span>
            </label>
            <button
              onClick={handleLeadSubmit}
              disabled={!email || !consent || leadLoading}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {leadLoading ? 'Saving…' : 'Send me my results →'}
            </button>
          </div>
        )}
      </div>

      {/* ── Feedback ────────────────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Was this helpful?</h3>
        <p className="text-sm text-gray-500 mb-4">Your feedback helps us improve for everyone.</p>

        {feedbackSubmitted ? (
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <span>✓</span>
            <span>Thank you!</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {rating > 0 && (
              <>
                <textarea
                  placeholder="Any comments? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackLoading}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                  {feedbackLoading ? 'Sending…' : 'Submit feedback'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
