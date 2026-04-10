import { useState } from 'react'
import { useStore } from '../store'
import { Tooltip } from './Tooltip'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinanceProfile {
  profession?: string
  estimatedAnnualIncome?: number
  confirmedIncome?: boolean
  locationRegion?: string
  locationDetail?: string
  bedroomsNeeded?: number
  propertyType?: string
  estimatedPropertyValue?: number
  confirmedPropertyValue?: boolean
  mortgageYearsRemaining?: number
  mortgageRate?: number
  estimatedMortgageBalance?: number
  savingsRange?: string // 'under1k' | '1-5k' | '5-20k' | '20-50k' | '50k+'
  savingsType?: string[] // ['isa', 'savings', 'current']
  estimatedSavings?: number
  estimatedISA?: number
  estimatedCurrentAccount?: number
  yearsWorking?: number
  confirmedPension?: boolean
  pensionBalance?: number
  debts?: string[] // ['student', 'credit', 'car', 'personal']
  debtRanges?: Record<string, string>
  totalDebt?: number
  householdSize?: number
  hasChildren?: string
  monthlyOutgoings?: number
  unlocked: string[]
}

// ─── Salary estimation ───────────────────────────────────────────────────────

const SECTOR_SALARIES: Record<string, [number, number, number]> = {
  tech: [38000, 60000, 75000],
  finance: [42000, 68000, 90000],
  healthcare: [30000, 40000, 50000],
  teacher: [28000, 36000, 44000],
  engineering: [34000, 50000, 65000],
  legal: [36000, 62000, 85000],
  retail: [22000, 26000, 30000],
  construction: [28000, 40000, 52000],
  creative: [25000, 38000, 50000],
  default: [28000, 40000, 52000],
}

const PROFESSION_SECTORS: Record<string, string> = {
  developer: 'tech', engineer: 'tech', programmer: 'tech', designer: 'tech',
  banker: 'finance', accountant: 'finance', analyst: 'finance', trader: 'finance',
  doctor: 'healthcare', nurse: 'healthcare', pharmacist: 'healthcare', dentist: 'healthcare',
  teacher: 'teacher', lecturer: 'teacher', professor: 'teacher',
  lawyer: 'legal', solicitor: 'legal', barrister: 'legal',
  plumber: 'construction', carpenter: 'construction', electrician: 'construction',
  builder: 'construction', contractor: 'construction',
  chef: 'retail', barista: 'retail', manager: 'retail',
  artist: 'creative', writer: 'creative', journalist: 'creative',
}

function estimateSalary(profession: string, age: number): number {
  const p = profession.toLowerCase()
  const sector = Object.entries(PROFESSION_SECTORS).find(([k]) => p.includes(k))?.[1] ?? 'default'
  const [young, mid, senior] = SECTOR_SALARIES[sector]
  if (age < 30) return young
  if (age < 45) return mid
  return senior
}

// ─── Property value estimation ────────────────────────────────────────────────

const REGION_PRICES: Record<string, number[]> = {
  'London': [350000, 500000, 650000, 800000, 1100000],
  'South East': [250000, 340000, 450000, 570000, 750000],
  'South West': [220000, 290000, 380000, 480000, 620000],
  'East of England': [230000, 310000, 410000, 520000, 680000],
  'East Midlands': [170000, 220000, 290000, 370000, 480000],
  'West Midlands': [175000, 230000, 300000, 380000, 490000],
  'Yorkshire': [155000, 200000, 265000, 335000, 430000],
  'North West': [160000, 210000, 280000, 355000, 460000],
  'North East': [130000, 165000, 215000, 270000, 350000],
  'Wales': [150000, 195000, 255000, 320000, 415000],
  'Scotland': [145000, 190000, 250000, 315000, 405000],
  'Northern Ireland': [135000, 175000, 230000, 290000, 375000],
}

function estimatePropertyValue(region: string, bedrooms: number): number {
  const prices = REGION_PRICES[region] ?? REGION_PRICES['East Midlands']
  return prices[Math.min(bedrooms - 1, 4)]
}

// ─── Savings range mapping ────────────────────────────────────────────────────

const SAVINGS_RANGES = [
  { id: 'under1k', label: 'Under £1k', value: 500 },
  { id: '1-5k', label: '£1k – £5k', value: 3000 },
  { id: '5-20k', label: '£5k – £20k', value: 12500 },
  { id: '20-50k', label: '£20k – £50k', value: 35000 },
  { id: '50k+', label: 'Over £50k', value: 75000 },
]

// ─── Balance sheet row ────────────────────────────────────────────────────────

function BSRow({
  icon,
  label,
  amount,
  tooltip,
  locked,
  lockCta,
  onCtaClick,
}: {
  icon: string
  label: string
  amount?: number
  tooltip?: React.ReactNode
  locked?: boolean
  lockCta?: string
  onCtaClick?: () => void
}) {
  const fmt = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
        {tooltip}
      </div>
      {locked ? (
        <button
          onClick={onCtaClick}
          className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 font-medium"
        >
          {lockCta ?? 'Unlock →'}
        </button>
      ) : (
        <span className="font-semibold text-gray-900 tabular-nums">
          {amount != null ? fmt(amount) : '—'}
        </span>
      )}
    </div>
  )
}

// ─── Tool panels ──────────────────────────────────────────────────────────────

function IncomePanel({
  fp,
  age,
  onConfirm,
}: {
  fp: FinanceProfile
  age: number
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const [profession, setProfession] = useState(fp.profession ?? '')
  const [localAge, setLocalAge] = useState(age || 35)
  const [sliderPct, setSliderPct] = useState(100)
  const base = profession.trim() ? estimateSalary(profession, localAge) : null
  const adjusted = base ? Math.round((base * sliderPct) / 100) : null

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">We'll estimate your income from your profession and age — no need to share the exact number.</p>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Your profession</label>
          <input
            value={profession}
            onChange={(e) => { setProfession(e.target.value); setSliderPct(100) }}
            placeholder="e.g. software engineer, teacher…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Your age</label>
          <input
            type="number"
            min={18}
            max={80}
            value={localAge}
            onChange={(e) => setLocalAge(Number(e.target.value) || 35)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {base && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-700 mb-0.5">
            Based on your profession and age, we estimate:
          </p>
          <p className="text-2xl font-bold text-blue-700">
            ~£{adjusted?.toLocaleString('en-GB')}/year
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Does that sound about right?</p>
          <label className="block text-xs text-gray-600 mb-1">
            Adjust estimate: {sliderPct}%
          </label>
          <input
            type="range"
            min={60}
            max={150}
            value={sliderPct}
            onChange={(e) => setSliderPct(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Lower</span><span>Higher</span>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!adjusted) return
          onConfirm({
            profession,
            estimatedAnnualIncome: adjusted,
            confirmedIncome: true,
            unlocked: [...(fp.unlocked ?? []), 'income'],
          })
        }}
        disabled={!adjusted}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        Confirm income →
      </button>
    </div>
  )
}

function HomePanel({
  fp,
  onConfirm,
}: {
  fp: FinanceProfile
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const [region, setRegion] = useState(fp.locationRegion ?? '')
  const [bedrooms, setBedrooms] = useState(fp.bedroomsNeeded ?? 3)
  const [propertyType, setPropertyType] = useState(fp.propertyType ?? 'house')
  const [sliderValue, setSliderValue] = useState<number | null>(null)
  const [mortgageYears, setMortgageYears] = useState(fp.mortgageYearsRemaining ?? 20)
  const [mortgageRate, setMortgageRate] = useState(fp.mortgageRate ?? 4.5)

  const estimate = region ? estimatePropertyValue(region, bedrooms) : null
  const displayValue = sliderValue ?? estimate

  const estimatedBalance = displayValue
    ? (() => {
        const mr = mortgageRate / 100 / 12
        const n = mortgageYears * 12
        const monthly = mr > 0
          ? (displayValue * 0.8 * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1)
          : (displayValue * 0.8) / n
        let bal = displayValue * 0.8
        for (let m = 0; m < Math.max(0, 25 - mortgageYears) * 12; m++) {
          const interest = bal * mr
          bal = Math.max(0, bal + interest - monthly)
        }
        return Math.round(bal)
      })()
    : null

  const equity = displayValue && estimatedBalance != null
    ? displayValue - estimatedBalance
    : null

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Tell us where you live and what type of property — we'll estimate the value without needing you to look it up.</p>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Region</label>
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setSliderValue(null) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select region…</option>
            {Object.keys(REGION_PRICES).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Bedrooms</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((b) => (
              <button
                key={b}
                onClick={() => { setBedrooms(b); setSliderValue(null) }}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                  bedrooms === b ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                {b === 5 ? '5+' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Property type</label>
        <div className="flex gap-2">
          {['house', 'flat', 'new-build'].map((t) => (
            <button
              key={t}
              onClick={() => setPropertyType(t)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize ${
                propertyType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {estimate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-gray-700">
            {bedrooms}-bed {propertyType} in {region} is typically worth around:
          </p>
          <p className="text-2xl font-bold text-blue-700">
            ~£{displayValue?.toLocaleString('en-GB')}
          </p>
          <label className="block text-xs text-gray-600">Adjust if different:</label>
          <input
            type="range"
            min={Math.round(estimate * 0.5)}
            max={Math.round(estimate * 2)}
            step={5000}
            value={displayValue ?? estimate}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {displayValue && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Estimate home equity</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Years left on mortgage</label>
              <input
                type="number"
                min={0}
                max={35}
                value={mortgageYears}
                onChange={(e) => setMortgageYears(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Current deal rate (%)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={15}
                value={mortgageRate}
                onChange={(e) => setMortgageRate(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          {estimatedBalance != null && equity != null && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="text-center">
                <div className="text-xs text-gray-500">Estimated mortgage balance</div>
                <div className="font-semibold text-gray-900">£{estimatedBalance.toLocaleString('en-GB')}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Your equity <Tooltip term="equity" label="Equity" /></div>
                <div className="font-semibold text-green-700">£{equity.toLocaleString('en-GB')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (!displayValue) return
          onConfirm({
            locationRegion: region,
            bedroomsNeeded: bedrooms,
            propertyType,
            estimatedPropertyValue: displayValue,
            confirmedPropertyValue: true,
            mortgageYearsRemaining: mortgageYears,
            mortgageRate,
            estimatedMortgageBalance: estimatedBalance ?? undefined,
            unlocked: [...(fp.unlocked ?? []), 'home'],
          })
        }}
        disabled={!displayValue}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        Confirm property →
      </button>
    </div>
  )
}

function SavingsPanel({
  fp,
  onConfirm,
}: {
  fp: FinanceProfile
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const [savingsRange, setSavingsRange] = useState(fp.savingsRange ?? '')
  const [savingsTypes, setSavingsTypes] = useState<string[]>(fp.savingsType ?? [])

  const toggleType = (t: string) =>
    setSavingsTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const rangeValue = SAVINGS_RANGES.find((r) => r.id === savingsRange)?.value ?? 0
  const perType = savingsTypes.length > 0 ? Math.round(rangeValue / savingsTypes.length) : rangeValue

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Rough ranges are fine — we just want to understand your financial picture.</p>

      <div>
        <label className="block text-xs text-gray-600 mb-2">Total savings ballpark</label>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSavingsRange(r.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium ${
                savingsRange === r.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-2">Where is it held? (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'isa', label: '📈 ISA' },
            { id: 'savings', label: '💰 Savings account' },
            { id: 'current', label: '💵 Current account' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => toggleType(t.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium ${
                savingsTypes.includes(t.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {savingsRange && savingsTypes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
          We'll allocate roughly <strong>£{perType.toLocaleString('en-GB')}</strong> to each account type.
        </div>
      )}

      <button
        onClick={() => {
          if (!savingsRange || savingsTypes.length === 0) return
          onConfirm({
            savingsRange,
            savingsType: savingsTypes,
            estimatedSavings: savingsTypes.includes('savings') ? perType : undefined,
            estimatedISA: savingsTypes.includes('isa') ? perType : undefined,
            estimatedCurrentAccount: savingsTypes.includes('current') ? perType : undefined,
            unlocked: [...(fp.unlocked ?? []), 'savings'],
          })
        }}
        disabled={!savingsRange || savingsTypes.length === 0}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        Confirm savings →
      </button>
    </div>
  )
}

function PensionPanel({
  fp,
  onConfirm,
}: {
  fp: FinanceProfile
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const [yearsWorking, setYearsWorking] = useState(fp.yearsWorking ?? 10)
  const [pension, setPension] = useState<number | null>(fp.pensionBalance ?? null)

  const annualIncome = fp.estimatedAnnualIncome ?? 40000
  const estimated = Math.round(annualIncome * 0.08 * yearsWorking * 12)
  const display = pension ?? estimated

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">We'll estimate your pension from your years of work and income — or enter the actual value if you know it.</p>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Years you've been working: <strong>{yearsWorking}</strong>
        </label>
        <input
          type="range"
          min={0}
          max={45}
          value={yearsWorking}
          onChange={(e) => { setYearsWorking(Number(e.target.value)); setPension(null) }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0</span><span>45 years</span></div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm text-gray-700">We estimate your pension pot is roughly:</p>
        <p className="text-2xl font-bold text-purple-700 my-1">~£{display.toLocaleString('en-GB')}</p>
        <label className="block text-xs text-gray-600 mt-3 mb-1">Or enter the actual value (check your pension app):</label>
        <input
          type="number"
          placeholder="e.g. 45000"
          value={pension ?? ''}
          onChange={(e) => setPension(Number(e.target.value) || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <button
        onClick={() => onConfirm({
          yearsWorking,
          pensionBalance: display,
          confirmedPension: true,
          unlocked: [...(fp.unlocked ?? []), 'pension'],
        })}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black"
      >
        Confirm pension →
      </button>
    </div>
  )
}

function DebtPanel({
  fp,
  onConfirm,
}: {
  fp: FinanceProfile
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const DEBT_TYPES = [
    { id: 'student', label: '🎓 Student loan' },
    { id: 'credit', label: '💳 Credit cards' },
    { id: 'car', label: '🚗 Car finance' },
    { id: 'personal', label: '🏦 Personal loan' },
    { id: 'none', label: '✅ None' },
  ]
  const DEBT_RANGES = [
    { id: 'under5k', label: 'Under £5k', value: 2500 },
    { id: '5-15k', label: '£5k–£15k', value: 10000 },
    { id: '15-30k', label: '£15k–£30k', value: 22500 },
    { id: '30k+', label: 'Over £30k', value: 40000 },
  ]

  const [selected, setSelected] = useState<string[]>(fp.debts ?? [])
  const [ranges, setRanges] = useState<Record<string, string>>(fp.debtRanges ?? {})

  const toggleDebt = (id: string) => {
    if (id === 'none') { setSelected(['none']); return }
    setSelected((prev) => {
      const filtered = prev.filter((x) => x !== 'none')
      return filtered.includes(id) ? filtered.filter((x) => x !== id) : [...filtered, id]
    })
  }

  const totalDebt = selected.includes('none') ? 0 : selected.reduce((sum, id) => {
    const rangeId = ranges[id]
    return sum + (DEBT_RANGES.find((r) => r.id === rangeId)?.value ?? 0)
  }, 0)

  const nonNone = selected.filter((s) => s !== 'none')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Select any debts you currently have — ranges are fine, we don't need exact figures.</p>

      <div className="flex flex-wrap gap-2">
        {DEBT_TYPES.map((d) => (
          <button
            key={d.id}
            onClick={() => toggleDebt(d.id)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium ${
              selected.includes(d.id) ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-700 hover:border-red-400'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {nonNone.map((id) => {
        const label = DEBT_TYPES.find((d) => d.id === id)?.label ?? id
        return (
          <div key={id}>
            <label className="block text-xs text-gray-600 mb-1">Outstanding amount: {label}</label>
            <div className="flex flex-wrap gap-2">
              {DEBT_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRanges((prev) => ({ ...prev, [id]: r.id }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    ranges[id] === r.id ? 'bg-red-100 border-red-400 text-red-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {nonNone.length > 0 && nonNone.every((id) => ranges[id]) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
          Estimated total debt: <strong>~£{totalDebt.toLocaleString('en-GB')}</strong>
          {selected.includes('student') && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Plan 2 student loans are written off after 30 years — for many people the effective cost is £0.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => onConfirm({
          debts: selected,
          debtRanges: ranges,
          totalDebt,
          unlocked: [...(fp.unlocked ?? []), 'debts'],
        })}
        disabled={selected.length === 0}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        Confirm debts →
      </button>
    </div>
  )
}

function OutgoingsPanel({
  fp,
  onConfirm,
}: {
  fp: FinanceProfile
  onConfirm: (patch: Partial<FinanceProfile>) => void
}) {
  const [food, setFood] = useState(350)
  const [transport, setTransport] = useState(150)
  const [subs, setSubs] = useState(120)
  const [bills, setBills] = useState(200)

  const total = food + transport + subs + bills

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Slide to roughly estimate your monthly spending in each category.</p>

      {[
        { label: '🛒 Food & groceries', value: food, set: setFood, min: 80, max: 800 },
        { label: '🚌 Transport', value: transport, set: setTransport, min: 30, max: 600 },
        { label: '📱 Subscriptions & leisure', value: subs, set: setSubs, min: 30, max: 500 },
        { label: '🏠 Bills & utilities', value: bills, set: setBills, min: 80, max: 600 },
      ].map(({ label, value, set, min, max }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{label}</span>
            <span className="font-semibold text-gray-900">£{value}/mo</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={10}
            value={value}
            onChange={(e) => set(Number(e.target.value))}
            className="w-full"
          />
        </div>
      ))}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
        Estimated monthly outgoings: <strong>£{total.toLocaleString('en-GB')}</strong>
      </div>

      <button
        onClick={() => onConfirm({
          monthlyOutgoings: total,
          unlocked: [...(fp.unlocked ?? []), 'outgoings'],
        })}
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black"
      >
        Confirm outgoings →
      </button>
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = 'income' | 'home' | 'savings' | 'pension' | 'debts' | 'outgoings'

const TABS: { id: TabId; icon: string; label: string; unlockKey: string }[] = [
  { id: 'income', icon: '💼', label: 'My Income', unlockKey: 'income' },
  { id: 'home', icon: '🏠', label: 'My Home', unlockKey: 'home' },
  { id: 'savings', icon: '💰', label: 'My Savings', unlockKey: 'savings' },
  { id: 'pension', icon: '🏦', label: 'My Pension', unlockKey: 'pension' },
  { id: 'debts', icon: '💳', label: 'My Debts', unlockKey: 'debts' },
  { id: 'outgoings', icon: '🧾', label: 'Outgoings', unlockKey: 'outgoings' },
]

// ─── Main component ───────────────────────────────────────────────────────────

const INITIAL_FP: FinanceProfile = { unlocked: [] }

export function PersonalFinance() {
  const { userProfile, updateProfile } = useStore()
  const [fp, setFp] = useState<FinanceProfile>(INITIAL_FP)
  const [activeTab, setActiveTab] = useState<TabId>('income')

  const patch = (updates: Partial<FinanceProfile>) => {
    setFp((prev) => ({
      ...prev,
      ...updates,
      unlocked: Array.from(new Set([...(prev.unlocked ?? []), ...(updates.unlocked ?? [])])),
    }))
    // Sync relevant fields back to mortgage wizard profile
    if (updates.estimatedAnnualIncome) {
      updateProfile({ grossIncome: updates.estimatedAnnualIncome })
    }
    if (updates.estimatedPropertyValue) {
      updateProfile({ propertyValue: updates.estimatedPropertyValue })
    }
  }

  const unlocked = new Set(fp.unlocked ?? [])
  const completedCount = unlocked.size
  const progress = Math.round((completedCount / TABS.length) * 100)

  const equity = fp.estimatedPropertyValue && fp.estimatedMortgageBalance != null
    ? fp.estimatedPropertyValue - fp.estimatedMortgageBalance
    : undefined

  const totalAssets = [
    equity ?? 0,
    fp.estimatedSavings ?? 0,
    fp.estimatedISA ?? 0,
    fp.estimatedCurrentAccount ?? 0,
    fp.pensionBalance ?? 0,
  ].reduce((a, b) => a + b, 0)

  const totalLiabilities = [
    fp.estimatedMortgageBalance ?? 0,
    fp.totalDebt ?? 0,
  ].reduce((a, b) => a + b, 0)

  const netWorth = totalAssets - totalLiabilities

  const scrollToTab = (id: TabId) => {
    setActiveTab(id)
    document.getElementById('pf-tools')?.scrollIntoView({ behavior: 'smooth' })
  }

  const age = userProfile.age ?? 35

  return (
    <div className="space-y-6">
      {/* ── Balance sheet ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">Your Financial Picture</h2>
          {completedCount > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              {progress}% complete
            </span>
          )}
        </div>

        {completedCount > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {completedCount === 0 && (
          <p className="text-sm text-gray-500 mb-5">
            Complete a tool below to start building your balance sheet. We'll never ask for sensitive details — just enough to estimate.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Assets */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assets</h3>
            <BSRow
              icon="🏠"
              label="Home equity"
              amount={equity}
              tooltip={<Tooltip term="equity" label="Home Equity" />}
              locked={!unlocked.has('home')}
              lockCta="Add My Home →"
              onCtaClick={() => scrollToTab('home')}
            />
            <BSRow
              icon="💰"
              label="Savings"
              amount={fp.estimatedSavings}
              locked={!unlocked.has('savings')}
              lockCta="Add Savings →"
              onCtaClick={() => scrollToTab('savings')}
            />
            <BSRow
              icon="📈"
              label="ISA"
              amount={fp.estimatedISA}
              tooltip={<Tooltip term="isa" label="ISA" />}
              locked={!unlocked.has('savings')}
              lockCta="Add Savings →"
              onCtaClick={() => scrollToTab('savings')}
            />
            <BSRow
              icon="💵"
              label="Current account"
              amount={fp.estimatedCurrentAccount}
              locked={!unlocked.has('savings')}
              lockCta="Add Savings →"
              onCtaClick={() => scrollToTab('savings')}
            />
            <BSRow
              icon="🏦"
              label="Pension"
              amount={fp.pensionBalance}
              tooltip={<Tooltip term="pension" label="Pension" />}
              locked={!unlocked.has('pension')}
              lockCta="Add Pension →"
              onCtaClick={() => scrollToTab('pension')}
            />
          </div>

          {/* Liabilities + summary */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Liabilities</h3>
            <BSRow
              icon="🏦"
              label="Mortgage balance"
              amount={fp.estimatedMortgageBalance}
              locked={!unlocked.has('home')}
              lockCta="Add My Home →"
              onCtaClick={() => scrollToTab('home')}
            />
            <BSRow
              icon="💳"
              label="Other debts"
              amount={fp.totalDebt}
              locked={!unlocked.has('debts')}
              lockCta="Add Debts →"
              onCtaClick={() => scrollToTab('debts')}
            />

            {completedCount >= 2 && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-700 flex items-center gap-1">
                    Net worth <Tooltip term="net_worth" label="Net Worth" />
                  </span>
                  <span className={`text-lg font-bold ${netWorth >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {netWorth >= 0 ? '' : '-'}£{Math.abs(Math.round(netWorth)).toLocaleString('en-GB')}
                  </span>
                </div>
                {fp.estimatedAnnualIncome && (
                  <div className="text-xs text-gray-500 mt-1">
                    ~£{Math.round(fp.estimatedAnnualIncome / 12).toLocaleString('en-GB')}/mo estimated income
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Tool tabs ──────────────────────────────────────────────────────── */}
      <section id="pf-tools" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Build your picture</h2>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => {
            const done = unlocked.has(t.unlockKey)
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === t.id
                    ? 'bg-gray-900 text-white'
                    : done
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.icon} {t.label} {done && '✓'}
              </button>
            )
          })}
        </div>

        {/* Panel content */}
        {activeTab === 'income' && <IncomePanel fp={fp} age={age} onConfirm={patch} />}
        {activeTab === 'home' && <HomePanel fp={fp} onConfirm={patch} />}
        {activeTab === 'savings' && <SavingsPanel fp={fp} onConfirm={patch} />}
        {activeTab === 'pension' && <PensionPanel fp={fp} onConfirm={patch} />}
        {activeTab === 'debts' && <DebtPanel fp={fp} onConfirm={patch} />}
        {activeTab === 'outgoings' && <OutgoingsPanel fp={fp} onConfirm={patch} />}
      </section>
    </div>
  )
}
