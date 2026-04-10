import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import type { MortgageDeal } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  Filler
)

interface Props {
  deal: MortgageDeal
  propertyValue: number
  loanAmount: number
  termYears: number
}

function buildAmortisation(loan: number, annualRate: number, termYears: number) {
  const mr = annualRate / 100 / 12
  const n = termYears * 12
  const monthly = mr > 0
    ? (loan * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1)
    : loan / n

  const yearly: { year: number; balance: number; principalPaid: number; interestPaid: number }[] = []
  let balance = loan
  for (let y = 1; y <= termYears; y++) {
    let yearInterest = 0
    let yearPrincipal = 0
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break
      const interest = balance * mr
      const principal = Math.min(monthly - interest, balance)
      yearInterest += interest
      yearPrincipal += principal
      balance = Math.max(0, balance - principal)
    }
    yearly.push({
      year: y,
      balance: Math.max(0, balance),
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
    })
  }
  return yearly
}

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed']

const CHART_OPTIONS_LINE = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number } }) =>
          `£${Math.round(ctx.parsed.y).toLocaleString('en-GB')}`,
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (v: number | string) => `£${(Number(v) / 1000).toFixed(0)}k`,
      },
    },
  },
}

export function DealViz({ deal, propertyValue, loanAmount, termYears, colorIdx = 0 }: Props & { colorIdx?: number }) {
  const rate = deal.rate ?? 4.5
  const yearly = buildAmortisation(loanAmount, rate, termYears)
  const labels = yearly.map((r) => `Yr ${r.year}`)
  const color = CHART_COLORS[colorIdx % CHART_COLORS.length]

  const equityData = yearly.map((r) => propertyValue - r.balance)
  const debtData = yearly.map((r) => r.balance)

  const totalInterest = yearly.reduce((s, r) => s + r.interestPaid, 0)
  const totalPrincipal = loanAmount

  return (
    <div className="space-y-5">
      {/* Monthly payment summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Monthly payment</div>
          <div className="font-bold text-blue-700 text-lg">
            {deal.calculation?.monthlyDeal
              ? `£${Math.round(deal.calculation.monthlyDeal).toLocaleString('en-GB')}`
              : '—'}
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Total interest</div>
          <div className="font-bold text-green-700 text-lg">
            £{Math.round(totalInterest).toLocaleString('en-GB')}
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">You own at end</div>
          <div className="font-bold text-purple-700 text-lg">100%</div>
        </div>
      </div>

      {/* Equity growth chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Your ownership grows over time</h4>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Your equity',
                data: equityData,
                borderColor: color,
                backgroundColor: color + '22',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
              {
                label: 'Remaining debt',
                data: debtData,
                borderColor: '#e5e7eb',
                backgroundColor: '#f9fafb',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
            ],
          }}
          options={CHART_OPTIONS_LINE as Parameters<typeof Line>[0]['options']}
          height={140}
        />
      </div>

      {/* Cost breakdown donut */}
      <div className="flex items-center gap-6">
        <div className="w-28 flex-shrink-0">
          <Doughnut
            data={{
              labels: ['Capital repaid', 'Total interest'],
              datasets: [
                {
                  data: [Math.round(totalPrincipal), Math.round(totalInterest)],
                  backgroundColor: [color, '#e5e7eb'],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: { parsed: number }) => `£${Math.round(ctx.parsed).toLocaleString('en-GB')}` } } },
              cutout: '70%',
            }}
          />
        </div>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-gray-600">Loan repaid: <strong>£{Math.round(totalPrincipal).toLocaleString('en-GB')}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0" />
            <span className="text-gray-600">Interest cost: <strong>£{Math.round(totalInterest).toLocaleString('en-GB')}</strong></span>
          </div>
          <div className="text-xs text-gray-400 pt-1">
            Total repaid: £{Math.round(totalPrincipal + totalInterest).toLocaleString('en-GB')}
          </div>
        </div>
      </div>
    </div>
  )
}
