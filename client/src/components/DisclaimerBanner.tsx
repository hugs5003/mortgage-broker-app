import { useState } from 'react'

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('disclaimer_dismissed') === '1'
  )

  if (dismissed) {
    return (
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-2">
        <p className="text-center text-xs text-gray-400 max-w-3xl mx-auto">
          ⚠️ Not regulated financial advice — estimates are illustrative only.{' '}
          <button
            onClick={() => { sessionStorage.removeItem('disclaimer_dismissed'); setDismissed(false) }}
            className="underline hover:text-gray-600"
          >
            Show full notice
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border-t border-amber-200 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <span className="text-amber-500 text-base mt-0.5 shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Not regulated financial advice.</strong> The information on this site is for general guidance and illustrative purposes only. It does not constitute regulated financial advice, a personal recommendation, or a mortgage offer. All figures, rates, and estimates are indicative and may not reflect current market conditions or your personal circumstances. Mortgage products are subject to status and eligibility.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            You should always seek advice from a qualified, FCA-authorised mortgage adviser or independent financial adviser before making any financial decisions.{' '}
            <a
              href="https://register.fca.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              Check the FCA register
            </a>
            .
          </p>
        </div>
        <button
          onClick={() => { sessionStorage.setItem('disclaimer_dismissed', '1'); setDismissed(true) }}
          aria-label="Minimise disclaimer"
          className="shrink-0 text-amber-400 hover:text-amber-600 text-lg leading-none mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  )
}
