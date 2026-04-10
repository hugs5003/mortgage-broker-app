import { useStore } from '../store'

export function LandingPage() {
  const { setMode } = useStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🏠</div>
        <h1 className="text-3xl font-bold text-white mb-2">MortgageOptimiser</h1>
        <p className="text-blue-200 text-base">How are you using the tool today?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
        <button
          onClick={() => setMode('consumer')}
          className="bg-white rounded-2xl p-8 text-left shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group"
        >
          <div className="text-4xl mb-4">🧑‍💼</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">I'm buying / remortgaging</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Find and compare mortgage deals, model scenarios, and understand what each deal really means for you.
          </p>
          <div className="mt-5 text-blue-600 font-semibold text-sm group-hover:underline">
            Start as consumer →
          </div>
        </button>

        <button
          onClick={() => setMode('broker')}
          className="bg-white rounded-2xl p-8 text-left shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a mortgage broker</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Create client sessions, tag the best deals, publish personalised recommendations and share them securely.
          </p>
          <div className="mt-5 text-blue-600 font-semibold text-sm group-hover:underline">
            Start as broker →
          </div>
        </button>
      </div>

      <p className="text-blue-300 text-xs mt-10 opacity-60">
        You can switch between modes at any time using the header controls.
      </p>
    </div>
  )
}
