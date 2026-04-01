import { useEffect, useState } from 'react'
import { dealsApi, shareApi } from '../services/api'
import type { MortgageDeal, ShareSessionData, UserProfile } from '../types'

const currency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

interface Props {
  token: string
}

export function ShareView({ token }: Props) {
  const [payload, setPayload] = useState<ShareSessionData | null>(null)
  const [deals, setDeals] = useState<MortgageDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [override, setOverride] = useState({
    deposit: '',
    termYears: '',
    riskTolerance: '',
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await shareApi.getByToken(token)
      const normalized: ShareSessionData = {
        token,
        expiresAt: data?.shareLink?.expires_at || data?.shareLink?.expiresAt,
        session: data?.session || {},
      }
      setPayload(normalized)

      const profile: UserProfile = {
        propertyValue: Number(data?.session?.property_value || data?.session?.propertyValue || 300000),
        deposit: Number(data?.session?.deposit || 60000),
        purchaseType: String(data?.session?.purchase_type || data?.session?.purchaseType || 'moving'),
        grossIncome: Number(data?.session?.gross_income || data?.session?.grossIncome || 55000),
        termYears: Number(data?.session?.term_years || data?.session?.termYears || 25),
        priorities: Array.isArray(data?.session?.priorities) ? data.session.priorities : ['lowestMonthly'],
        riskTolerance: Number(data?.session?.risk_tolerance || data?.session?.riskTolerance || 50),
      }
      const dealsData = await dealsApi.calculate(profile)
      setDeals(dealsData)
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not load shared recommendation.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  const applyWhatIf = async () => {
    if (!payload) return

    const overrideData: Record<string, number> = {}
    if (override.deposit) overrideData.deposit = Number(override.deposit)
    if (override.termYears) overrideData.termYears = Number(override.termYears)
    if (override.riskTolerance) overrideData.riskTolerance = Number(override.riskTolerance)

    try {
      await shareApi.applyOverride(token, overrideData)
      const profile: UserProfile = {
        propertyValue: Number(payload.session.property_value || payload.session.propertyValue || 300000),
        deposit: Number(overrideData.deposit || payload.session.deposit || 60000),
        purchaseType: String(payload.session.purchase_type || payload.session.purchaseType || 'moving'),
        grossIncome: Number(payload.session.gross_income || payload.session.grossIncome || 55000),
        termYears: Number(overrideData.termYears || payload.session.term_years || payload.session.termYears || 25),
        priorities: Array.isArray(payload.session.priorities) ? payload.session.priorities : ['lowestMonthly'],
        riskTolerance: Number(overrideData.riskTolerance || payload.session.risk_tolerance || payload.session.riskTolerance || 50),
      }
      const dealsData = await dealsApi.calculate(profile)
      setDeals(dealsData)
    } catch {
      setError('Could not apply what-if changes.')
    }
  }

  if (loading) return <div className="bg-white rounded-xl p-6 border border-gray-100">Loading shared recommendation...</div>
  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-6 border border-red-200">{error}</div>
  if (!payload) return null

  const session = payload.session
  const clientName = session.client_name || session.clientName || 'Client'
  const brokerNotes = session.broker_notes || session.brokerNotes

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xl font-bold text-gray-900">Broker Recommendation</h2>
        <p className="text-sm text-gray-500 mt-1">Prepared for {String(clientName)}</p>
        {brokerNotes && <p className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">{String(brokerNotes)}</p>}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900">What-if Simulator</h3>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <input placeholder="New deposit" value={override.deposit} onChange={(e) => setOverride((o) => ({ ...o, deposit: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="New term years" value={override.termYears} onChange={(e) => setOverride((o) => ({ ...o, termYears: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Risk tolerance (0-100)" value={override.riskTolerance} onChange={(e) => setOverride((o) => ({ ...o, riskTolerance: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <button onClick={applyWhatIf} className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
          Apply what-if
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900">Suggested Deals</h3>
        <div className="space-y-2 mt-3">
          {deals.slice(0, 6).map((deal, idx) => (
            <div key={deal.id} className={`border rounded-lg p-3 ${idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{deal.lender}</div>
                  <div className="text-xs text-gray-500">{deal.dealName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-700">{deal.rate}%</div>
                  <div className="text-xs text-gray-500">{currency(deal.calculation?.monthlyDeal || 0)} / mo</div>
                </div>
              </div>
            </div>
          ))}
          {deals.length === 0 && <div className="text-sm text-gray-500">No deals available.</div>}
        </div>
      </section>
    </div>
  )
}
