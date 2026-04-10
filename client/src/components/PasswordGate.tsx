import { useState } from 'react'

const CORRECT = import.meta.env.VITE_ACCESS_PASSWORD || 'mortgage2026'
const SESSION_KEY = 'mo_access_granted'

export function isAccessGranted(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function PasswordGate({ onGranted }: { onGranted: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (value.trim() === CORRECT) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onGranted()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center px-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center transition-transform ${shake ? 'animate-bounce' : ''}`}
      >
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MortgageOptimiser</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Thanks for testing out my mortgage broker app — I'd love your feedback!
          <br />
          Please enter the password to get started.
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Enter password"
          autoFocus
          className={`w-full px-4 py-3 border-2 rounded-xl text-center text-lg tracking-widest focus:outline-none transition-colors ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500'
          }`}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2">Incorrect password — try again</p>
        )}

        <button
          onClick={submit}
          className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-md"
        >
          Enter →
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Need the password? Ask the person who shared this link with you.
        </p>
      </div>
    </div>
  )
}
