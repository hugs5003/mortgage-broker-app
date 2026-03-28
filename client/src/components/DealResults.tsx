import { useStore } from '../store'
import type { MortgageDeal } from '../types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function DealResults() {
  const { deals } = useStore()

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
        No deals found. Try adjusting your criteria.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deals.slice(0, 8).map((deal: MortgageDeal, i: number) => (
        <div
          key={deal.id || i}
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
              <div className="text-xs text-gray-400">{deal.type?.replace(/_/g, ' ')}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Monthly Payment</div>
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
              <div className="text-xs text-gray-500">Arrangement Fee</div>
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
        </div>
      ))}
    </div>
  )
}
