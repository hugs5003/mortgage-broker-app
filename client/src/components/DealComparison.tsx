import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useMemo } from 'react'
import type { MortgageDeal } from '../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const currency = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

interface Props {
  deals: MortgageDeal[]
  selectedIds: string[]
  onRemove: (id: string) => void
}

export function DealComparison({ deals, selectedIds, onRemove }: Props) {
  const selectedDeals = useMemo(
    () => deals.filter((d) => selectedIds.includes(d.id)),
    [deals, selectedIds]
  )

  if (selectedDeals.length < 2) return null

  const data = {
    labels: selectedDeals.map((d) => d.lender),
    datasets: [
      {
        label: 'Monthly Payment',
        data: selectedDeals.map((d) => d.calculation?.monthlyDeal || 0),
        backgroundColor: '#2563eb',
      },
      {
        label: 'Arrangement Fee',
        data: selectedDeals.map((d) => d.arrangementFee || 0),
        backgroundColor: '#f59e0b',
      },
    ],
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Deal Comparison</h3>
      <div className="mb-5">
        <Bar data={data} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {selectedDeals.map((deal) => (
          <div key={deal.id} className="border border-gray-200 rounded-lg p-3">
            <div className="font-semibold text-gray-900 text-sm">{deal.lender}</div>
            <div className="text-xs text-gray-500">{deal.dealName}</div>
            <div className="mt-2 text-sm">Rate: <strong>{deal.rate}%</strong></div>
            <div className="text-sm">Monthly: <strong>{currency(deal.calculation?.monthlyDeal || 0)}</strong></div>
            <button onClick={() => onRemove(deal.id)} className="mt-2 text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
