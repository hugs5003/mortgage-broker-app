import { useState } from 'react'
import { useStore } from '../store'
import { leadApi } from '../services/api'
import type { MortgageDeal } from '../types'
import { DealComparison } from './DealComparison'
import { DealViz } from './DealViz'
import { Tooltip } from './Tooltip'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function DealResults() {
  const {
    deals,
    utm,
    userProfile,
    leadSubmitted,
    setLeadSubmitted,
    comparisonDealIds,
    toggleComparisonDeal,
    clearComparison,
  } = useStore()

  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadDone, setLeadDone] = useState(leadSubmitted)
  const [expandedViz, setExpandedViz] = useState<string | null>(null)

  const loanAmount = userProfile.propertyValue - userProfile.deposit
  const termYears = userProfile.termYears || 25

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
      setLeadDone(true)
    } catch {
      // Silent fail
    } finally {
      setLeadLoading(false)
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
      {deals.slice(0, 8).map((deal: MortgageDeal, i: number) => {
        const dealId = deal.id || String(i)
        const vizOpen = expandedViz === dealId
        const inComparison = comparisonDealIds.includes(deal.id)
        return (
        <div
          key={dealId}
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
              <div className="text-xs text-gray-400 flex items-center justify-end gap-0.5">
                {deal.type?.replace(/_/g, ' ')}
                <Tooltip term={deal.type?.includes('tracker') ? 'tracker_rate' : 'fixed_rate'} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 flex items-center gap-0.5">
                Monthly Payment <Tooltip term="monthly_payment" label="Monthly Payment" />
              </div>
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
              <div className="text-xs text-gray-500 flex items-center gap-0.5">
                Arrangement Fee <Tooltip term="arrangement_fee" label="Arrangement Fee" />
              </div>
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => toggleComparisonDeal(deal.id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                inComparison
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-blue-700 border-blue-300 hover:bg-blue-50'
              }`}
            >
              {inComparison ? '✓ In comparison' : '+ Compare'}
            </button>
            <button
              onClick={() => setExpandedViz(vizOpen ? null : dealId)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                vizOpen
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-purple-700 border-purple-300 hover:bg-purple-50'
              }`}
            >
              {vizOpen ? 'Hide visualisation' : '📊 Visualise this deal'}
            </button>
          </div>

          {vizOpen && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <DealViz
                deal={deal}
                propertyValue={userProfile.propertyValue}
                loanAmount={loanAmount}
                termYears={termYears}
                colorIdx={i}
              />
            </div>
          )}
        </div>
        )
      })}

      {comparisonDealIds.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Comparison ({comparisonDealIds.length}/3)
            </h3>
            <button onClick={clearComparison} className="text-xs text-gray-500 hover:underline">
              Clear
            </button>
          </div>
          <DealComparison
            deals={deals}
            selectedIds={comparisonDealIds}
            onRemove={toggleComparisonDeal}
          />
        </div>
      )}

      {!leadDone ? (
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <h3 className="text-base font-semibold text-gray-900">Get these results by email</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            We'll remind you when a better deal becomes available.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleLeadSubmit}
              disabled={!email || !consent || leadLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {leadLoading ? 'Saving…' : 'Send me my results'}
            </button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded"
            />
            I agree to receive mortgage deal updates by email. Unsubscribe any time.
          </label>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
          ✓ Done — we'll keep you updated on better deals.
        </div>
      )}
    </div>
  )
}
