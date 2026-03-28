import { useState } from 'react'
import { MortgageWizard } from './components/MortgageWizard'
import { AuthModal } from './components/AuthModal'
import { useStore } from './store'

export default function App() {
  const { user, logout } = useStore()
  const [showAuth, setShowAuth] = useState(false)

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

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <MortgageWizard />
      </main>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
