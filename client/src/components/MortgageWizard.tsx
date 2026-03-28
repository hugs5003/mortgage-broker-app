import { useStore } from '../store'
import { dealsApi } from '../services/api'
import { DealResults } from './DealResults'

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
  } = useStore()

  const loanAmount = userProfile.propertyValue - userProfile.deposit
  const ltv = Math.round((loanAmount / userProfile.propertyValue) * 100)

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dealsApi.calculate(userProfile)
      setDeals(Array.isArray(result) ? result : result.deals ?? [])
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

  const steps = ['Property', 'Finances', 'Preferences', 'Results']

  return (
    <div>
      {/* Progress */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((label, i) => (
              <span
                key={i}
                className={`text-sm font-medium ${
                  step === i + 1
                    ? 'text-blue-600'
                    : step > i + 1
                    ? 'text-green-600'
                    : 'text-gray-400'
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

      {/* Step 1 — Property */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Property Details</h2>
          <p className="text-gray-500 mb-6">Tell us about the property you're buying</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                <input
                  type="number"
                  value={userProfile.propertyValue}
                  onChange={(e) => updateProfile({ propertyValue: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                <input
                  type="number"
                  value={userProfile.deposit}
                  onChange={(e) => updateProfile({ deposit: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                LTV: <strong className="text-blue-600">{ltv}%</strong> — Loan:{' '}
                <strong>
                  £{loanAmount.toLocaleString('en-GB')}
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Type
              </label>
              <select
                value={userProfile.purchaseType}
                onChange={(e) => updateProfile({ purchaseType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="firstTime">First Time Buyer</option>
                <option value="moving">Moving Home</option>
                <option value="remortgage">Remortgage</option>
                <option value="buyToLet">Buy to Let</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Finances */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Finances</h2>
          <p className="text-gray-500 mb-6">Help us find deals you'll qualify for</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Gross Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                <input
                  type="number"
                  value={userProfile.grossIncome}
                  onChange={(e) => updateProfile({ grossIncome: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mortgage Term:{' '}
                <strong className="text-blue-600">{userProfile.termYears} years</strong>
              </label>
              <input
                type="range"
                min="10"
                max="35"
                value={userProfile.termYears}
                onChange={(e) => updateProfile({ termYears: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10 yrs</span>
                <span>35 yrs</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Preferences */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Preferences</h2>
          <p className="text-gray-500 mb-6">What matters most to you?</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Top Priority
              </label>
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
                    className={`p-3 rounded-lg border-2 text-sm text-left transition-all ${
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
                Risk Tolerance:{' '}
                <strong className="text-blue-600">
                  {userProfile.riskTolerance < 34
                    ? 'Low — prefer fixed rates'
                    : userProfile.riskTolerance < 67
                    ? 'Medium — open to tracker'
                    : 'High — variable rates ok'}
                </strong>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Low</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userProfile.riskTolerance}
                  onChange={(e) => updateProfile({ riskTolerance: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400">High</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(2)}
              className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100"
            >
              ← Back
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Finding deals...' : 'Find My Best Deals →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Results */}
      {step === 4 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Best Mortgage Deals</h2>
            <button
              onClick={() => setStep(1)}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Start again
            </button>
          </div>
          <DealResults />
        </div>
      )}
    </div>
  )
}
