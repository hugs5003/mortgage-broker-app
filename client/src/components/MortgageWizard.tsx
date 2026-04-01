import { useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { dealsApi, feedbackApi, leadApi } from '../services/api'
import { DealResults } from './DealResults'
import { EducationPanel } from './EducationPanel'

export function MortgageWizard() {
  const {
    step,
    setStep,
    userProfile,
    updateProfile,
    setDeals,
    loading,
    setLoading,
    error,
    setError,
    utm,
    leadSubmitted,
    setLeadSubmitted,
    feedbackSubmitted,
    setFeedbackSubmitted,
  } = useStore()

  const [leadEmail, setLeadEmail] = useState('')
  const [leadConsent, setLeadConsent] = useState(false)
  const [leadMessage, setLeadMessage] = useState<string | null>(null)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const loanAmount = userProfile.propertyValue - userProfile.deposit
  const ltv = userProfile.propertyValue > 0 ? Math.round((loanAmount / userProfile.propertyValue) * 100) : 0

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dealsApi.calculate(userProfile)
      setDeals(result)
      setStep(4)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to fetch deals. Please check your connection.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLeadMessage(null)
    try {
      await leadApi.submit({
        email: leadEmail,
        consent: leadConsent,
        source: 'results_page',
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        purchase_type: userProfile.purchaseType,
      })
      setLeadSubmitted(true)
      setLeadMessage('Saved. We will use this to share updates and follow up.')
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not save your email right now.'
      setLeadMessage(msg)
    }
  }

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFeedbackMessage(null)
    try {
      await feedbackApi.submit({
        rating: feedbackRating,
        comment: feedbackComment,
        email: leadEmail || undefined,
        purchase_type: userProfile.purchaseType,
        utm_source: utm.source,
        utm_campaign: utm.campaign,
      })
      setFeedbackSubmitted(true)
      setFeedbackMessage('Thanks. Your feedback has been captured.')
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not save feedback right now.'
      setFeedbackMessage(msg)
    }
  }

  const steps = ['Property', 'Finances', 'Preferences', 'Results']

  return (
    <div>
      {step < 4 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((label, i) => (
              <span
                key={label}
                className={`text-sm font-medium ${
                  step === i + 1 ? 'text-blue-600' : step > i + 1 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-5">
          <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Value</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">GBP</span>
              <input
                type="number"
                value={userProfile.propertyValue}
                onChange={(e) => updateProfile({ propertyValue: Number(e.target.value) || 0 })}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">GBP</span>
              <input
                type="number"
                value={userProfile.deposit}
                onChange={(e) => updateProfile({ deposit: Number(e.target.value) || 0 })}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              LTV: <strong className="text-blue-600">{ltv}%</strong> - Loan: <strong>GBP {loanAmount.toLocaleString('en-GB')}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Type</label>
            <select
              value={userProfile.purchaseType}
              onChange={(e) => updateProfile({ purchaseType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="firstTime">First Time Buyer</option>
              <option value="moving">Moving Home</option>
              <option value="remortgage">Remortgage</option>
              <option value="buyToLet">Buy to Let</option>
            </select>
          </div>

          <button onClick={() => setShowAdvanced((v) => !v)} className="text-sm text-blue-600 hover:underline">
            {showAdvanced ? 'Hide' : 'Show'} extended profile fields
          </button>

          {showAdvanced && (
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Property Type</label>
                  <select
                    value={userProfile.propertyType || ''}
                    onChange={(e) => updateProfile({ propertyType: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select type</option>
                    <option value="house">House</option>
                    <option value="flat">Flat</option>
                    <option value="new-build">New Build</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={userProfile.age || ''}
                    onChange={(e) => updateProfile({ age: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Employment Status</label>
                  <select
                    value={userProfile.employmentStatus || ''}
                    onChange={(e) => updateProfile({ employmentStatus: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select status</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-employed</option>
                    <option value="contractor">Contractor</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Credit Profile</label>
                  <select
                    value={userProfile.creditProfile || ''}
                    onChange={(e) => updateProfile({ creditProfile: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select profile</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Monthly Outgoings</label>
                  <input
                    type="number"
                    value={userProfile.monthlyOutgoings || ''}
                    onChange={(e) => updateProfile({ monthlyOutgoings: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Savings</label>
                  <input
                    type="number"
                    value={userProfile.savingsAmount || ''}
                    onChange={(e) => updateProfile({ savingsAmount: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!userProfile.jointApplication}
                    onChange={(e) => updateProfile({ jointApplication: e.target.checked })}
                  />
                  Joint application
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!userProfile.leasehold}
                    onChange={(e) => updateProfile({ leasehold: e.target.checked })}
                  />
                  Leasehold
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Finances</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Gross Income</label>
            <input
              type="number"
              value={userProfile.grossIncome}
              onChange={(e) => updateProfile({ grossIncome: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mortgage Term: <strong className="text-blue-600">{userProfile.termYears} years</strong>
            </label>
            <input
              type="range"
              min="10"
              max="40"
              value={userProfile.termYears}
              onChange={(e) => updateProfile({ termYears: Number(e.target.value) || 25 })}
              className="w-full"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!userProfile.overpaymentPlans}
                onChange={(e) => updateProfile({ overpaymentPlans: e.target.checked })}
              />
              I plan to overpay monthly
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!userProfile.movingWithin5Years}
                onChange={(e) => updateProfile({ movingWithin5Years: e.target.checked })}
              />
              I may move in under 5 years
            </label>
          </div>

          {userProfile.overpaymentPlans && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overpayment Amount</label>
              <input
                type="number"
                value={userProfile.overpaymentAmount || ''}
                onChange={(e) => updateProfile({ overpaymentAmount: Number(e.target.value) || undefined })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100">
              Back
            </button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Top Priority</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'lowestMonthly', label: 'Lowest monthly payment' },
                { value: 'lowestTotal', label: 'Lowest total cost' },
                { value: 'certainty', label: 'Rate certainty (fixed)' },
                { value: 'flexibility', label: 'Overpayment flexibility' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateProfile({ priorities: [opt.value] })}
                  className={`p-3 rounded-lg border-2 text-sm text-left ${
                    userProfile.priorities.includes(opt.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance: <strong className="text-blue-600">{userProfile.riskTolerance}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={userProfile.riskTolerance}
              onChange={(e) => updateProfile({ riskTolerance: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100">
              Back
            </button>
            <button onClick={handleCalculate} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Finding deals...' : 'Find My Best Deals'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Best Mortgage Deals</h2>
            <button onClick={() => setStep(1)} className="text-blue-600 hover:underline text-sm">
              Start again
            </button>
          </div>

          <DealResults />

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <form onSubmit={handleLeadSubmit} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Get updates</h3>
              <p className="text-xs text-gray-500 mt-1">Save your email for follow-up and improved deal alerts.</p>
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
                disabled={leadSubmitted}
              />
              <label className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={leadConsent} onChange={(e) => setLeadConsent(e.target.checked)} disabled={leadSubmitted} className="mt-0.5" />
                I consent to be contacted about product updates.
              </label>
              <button type="submit" disabled={leadSubmitted} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {leadSubmitted ? 'Saved' : 'Save my email'}
              </button>
              {leadMessage && <p className="mt-2 text-xs text-gray-600">{leadMessage}</p>}
            </form>

            <form onSubmit={handleFeedbackSubmit} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Quick feedback</h3>
              <p className="text-xs text-gray-500 mt-1">Tell us what was useful or confusing.</p>
              <label className="block mt-3 text-xs text-gray-600">Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(Number(e.target.value) || 5)}
                className="mt-1 w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={feedbackSubmitted}
              />
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What should we improve?"
                className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px]"
                disabled={feedbackSubmitted}
              />
              <button type="submit" disabled={feedbackSubmitted} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black disabled:opacity-60">
                {feedbackSubmitted ? 'Feedback sent' : 'Send feedback'}
              </button>
              {feedbackMessage && <p className="mt-2 text-xs text-gray-600">{feedbackMessage}</p>}
            </form>
          </div>

          <div className="mt-8">
            <EducationPanel />
          </div>
        </div>
      )}
    </div>
  )
}
