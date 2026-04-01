import { useState } from 'react'

const TOPICS = [
  {
    title: 'What is LTV?',
    body: 'Loan-to-Value compares your loan against property value. Lower LTV usually unlocks lower rates and wider lender choice.',
  },
  {
    title: 'Arrangement Fees',
    body: 'A lower rate can still be expensive if fees are high. Compare total cost, not just headline rate.',
  },
  {
    title: 'What happens after a fixed deal?',
    body: 'Most mortgages revert to SVR after the deal ends. Plan a remortgage 3-6 months before expiry.',
  },
  {
    title: 'Overpayments',
    body: 'Regular overpayments can cut years off term and reduce total interest, but check annual limits and ERC rules.',
  },
  {
    title: 'Stress testing',
    body: 'Lenders test affordability at higher rates than your initial deal to ensure resilience to future rises.',
  },
  {
    title: 'Fixed vs tracker',
    body: 'Fixed gives payment certainty; tracker can be cheaper if rates fall but carries monthly payment volatility.',
  },
  {
    title: 'Portability',
    body: 'If you may move home soon, portability can let you keep your current mortgage product.',
  },
  {
    title: 'Remortgaging timelines',
    body: 'Start comparing around 6 months before your deal ends to avoid rolling onto SVR.',
  },
]

export function EducationPanel() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Learn Before You Decide</h3>
      <div className="space-y-2">
        {TOPICS.map((topic, idx) => (
          <div key={topic.title} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-800"
            >
              {topic.title}
            </button>
            {open === idx && <div className="px-4 py-3 text-sm text-gray-600">{topic.body}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}
