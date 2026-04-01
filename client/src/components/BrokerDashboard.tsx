import { useEffect, useMemo, useState } from 'react'
import { brokerApi, dealsApi } from '../services/api'
import type { BrokerSession, MortgageDeal, UserProfile } from '../types'

const emptyProfile: UserProfile = {
  propertyValue: 300000,
  deposit: 60000,
  purchaseType: 'moving',
  grossIncome: 60000,
  termYears: 25,
  priorities: ['lowestMonthly'],
  riskTolerance: 50,
}

function toNumber(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function BrokerDashboard() {
  const [sessions, setSessions] = useState<BrokerSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [brokerNotes, setBrokerNotes] = useState('')
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [deals, setDeals] = useState<MortgageDeal[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<Record<string, 'recommended' | 'alternative' | 'avoid'>>({})

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) || null,
    [sessions, currentSessionId]
  )

  const loadSessions = async () => {
    try {
      const data = await brokerApi.getSessions()
      setSessions(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Could not load existing sessions.')
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const createSession = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const payload = {
        clientName,
        clientEmail,
        brokerNotes,
        propertyValue: profile.propertyValue,
        deposit: profile.deposit,
        purchaseType: profile.purchaseType,
        propertyType: profile.propertyType,
        leasehold: profile.leasehold,
        grossIncome: profile.grossIncome,
        jointApplication: profile.jointApplication,
        secondIncome: profile.secondIncome,
        employmentStatus: profile.employmentStatus,
        monthlyOutgoings: profile.monthlyOutgoings,
        creditProfile: profile.creditProfile,
        age: profile.age,
        termYears: profile.termYears,
        priorities: profile.priorities,
        overpaymentPlans: profile.overpaymentPlans,
        overpaymentAmount: profile.overpaymentAmount,
        movingWithin5Years: profile.movingWithin5Years,
        riskTolerance: profile.riskTolerance,
        savingsAmount: profile.savingsAmount,
      }
      const created = await brokerApi.createSession(payload)
      setCurrentSessionId(created.id)
      setMessage('Draft session created.')
      await loadSessions()
    } catch (err) {
      setMessage(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not create session.'
      )
    } finally {
      setLoading(false)
    }
  }

  const calculateDeals = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const data = await dealsApi.calculate(profile)
      setDeals(data)
      setMessage('Deals calculated. Tag recommendations before publishing.')
    } catch {
      setMessage('Could not calculate deals.')
    } finally {
      setLoading(false)
    }
  }

  const saveSession = async () => {
    if (!currentSessionId) return
    setLoading(true)
    try {
      await brokerApi.updateSession(currentSessionId, {
        clientName,
        clientEmail,
        brokerNotes,
        ...profile,
      })
      setMessage('Session updated.')
      await loadSessions()
    } catch {
      setMessage('Could not update session.')
    } finally {
      setLoading(false)
    }
  }

  const publish = async () => {
    if (!currentSessionId) return
    setLoading(true)
    try {
      for (const [dealId, highlightType] of Object.entries(highlights)) {
        await brokerApi.addHighlight(currentSessionId, {
          dealId,
          type: highlightType,
          comment: '',
        })
      }
      const result = await brokerApi.publishSession(currentSessionId)
      const token = result?.shareLink?.token
      if (token) {
        setShareUrl(`${window.location.origin}/share/${token}`)
      }
      setMessage('Published. Share link generated.')
      await loadSessions()
    } catch (err) {
      setMessage(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not publish session.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xl font-bold text-gray-900">Broker Mode</h2>
        <p className="text-sm text-gray-500 mt-1">Create draft recommendations, highlight top deals, then publish a client share link.</p>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Client email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Property value" value={String(profile.propertyValue)} onChange={(e) => setProfile((p) => ({ ...p, propertyValue: toNumber(e.target.value) }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Deposit" value={String(profile.deposit)} onChange={(e) => setProfile((p) => ({ ...p, deposit: toNumber(e.target.value) }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Gross income" value={String(profile.grossIncome)} onChange={(e) => setProfile((p) => ({ ...p, grossIncome: toNumber(e.target.value) }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Term years" value={String(profile.termYears)} onChange={(e) => setProfile((p) => ({ ...p, termYears: toNumber(e.target.value) || 25 }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <textarea placeholder="Broker notes" value={brokerNotes} onChange={(e) => setBrokerNotes(e.target.value)} className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px]" />

        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={createSession} disabled={loading || !clientName} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">Create draft</button>
          <button onClick={saveSession} disabled={loading || !currentSessionId} className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-black disabled:opacity-60">Save draft</button>
          <button onClick={calculateDeals} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">Calculate deals</button>
          <button onClick={publish} disabled={loading || !currentSessionId} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60">Publish & generate link</button>
        </div>

        {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        {shareUrl && <div className="mt-2 text-sm text-green-700 break-all">Share URL: {shareUrl}</div>}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900">Draft Sessions</h3>
        <div className="mt-3 space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full text-left p-3 rounded-lg border ${currentSessionId === session.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="text-sm font-medium text-gray-900">{String(session.clientName || session.client_name || 'Unnamed client')}</div>
              <div className="text-xs text-gray-500">Status: {session.status}</div>
            </button>
          ))}
          {sessions.length === 0 && <div className="text-sm text-gray-500">No sessions yet.</div>}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900">Highlight Deals</h3>
        <p className="text-sm text-gray-500 mt-1">Mark each deal as recommended, alternative, or avoid before publishing.</p>

        <div className="space-y-2 mt-3">
          {deals.map((deal) => (
            <div key={deal.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{deal.lender} - {deal.dealName}</div>
                  <div className="text-xs text-gray-500">Rate {deal.rate}%</div>
                </div>
                <select
                  value={highlights[deal.id] || ''}
                  onChange={(e) => setHighlights((h) => ({ ...h, [deal.id]: e.target.value as 'recommended' | 'alternative' | 'avoid' }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">No tag</option>
                  <option value="recommended">Recommended</option>
                  <option value="alternative">Alternative</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>
            </div>
          ))}
          {deals.length === 0 && <div className="text-sm text-gray-500">Run deal calculation to get recommendations.</div>}
        </div>
      </section>

      {selectedSession && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900">Current Session</h3>
          <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs overflow-auto">
{JSON.stringify(selectedSession, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
