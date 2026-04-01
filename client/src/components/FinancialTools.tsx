import { useState } from 'react'
import { financialApi } from '../services/api'

type Tab = 'overpay' | 'compound' | 'savings' | 'retirement' | 'firsthome' | 'isa'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overpay', label: 'Overpay vs Invest' },
  { id: 'compound', label: 'Compound Growth' },
  { id: 'savings', label: 'Savings Timeline' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'firsthome', label: 'First Home' },
  { id: 'isa', label: 'ISA Comparison' },
]

function Field({ label, value, onChange, type = 'number' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900 mt-0.5">{value}</div>
    </div>
  )
}

const fmt = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`
const fmtN = (n: number, dp = 1) => n.toLocaleString('en-GB', { maximumFractionDigits: dp })

function useCalc() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const run = async (fn: () => Promise<Record<string, unknown>>) => {
    setLoading(true)
    setError(null)
    try {
      setResult(await fn())
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Calculation failed. Check the server is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, result, run }
}

function OverpayVsInvest() {
  const [f, setF] = useState({ mortgagePrincipal: '240000', mortgageRate: '4.5', mortgageTermYears: '25', monthlyExtra: '200', investmentReturnRate: '6', investmentYears: '10' })
  const { loading, error, result, run } = useCalc()

  const go = () => run(() => financialApi.overpayVsInvest({
    mortgagePrincipal: Number(f.mortgagePrincipal), mortgageRate: Number(f.mortgageRate),
    mortgageTermYears: Number(f.mortgageTermYears), monthlyExtra: Number(f.monthlyExtra),
    investmentReturnRate: Number(f.investmentReturnRate), investmentYears: Number(f.investmentYears),
  }))

  const sf = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Compare paying down your mortgage faster versus investing the same surplus cash.</p>
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Mortgage principal (£)" value={f.mortgagePrincipal} onChange={sf('mortgagePrincipal')} />
        <Field label="Mortgage rate (%)" value={f.mortgageRate} onChange={sf('mortgageRate')} />
        <Field label="Term (years)" value={f.mortgageTermYears} onChange={sf('mortgageTermYears')} />
        <Field label="Monthly extra (£)" value={f.monthlyExtra} onChange={sf('monthlyExtra')} />
        <Field label="Investment return (%)" value={f.investmentReturnRate} onChange={sf('investmentReturnRate')} />
        <Field label="Compare over (years)" value={f.investmentYears} onChange={sf('investmentYears')} />
      </div>
      <button onClick={go} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
        {loading ? 'Calculating...' : 'Run Comparison'}
      </button>
      {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {result && (() => {
        const r = result as { overpayment: { interestSaved: number; yearsSaved: number; totalPaidWithOverpay: number; totalPaidWithout: number }; investment: { finalValue: number; totalContributed: number; totalGrowth: number }; netBenefit: number; breakEvenRate: number; verdict: string }
        return (
          <div className="mt-4 space-y-4">
            <div className={`p-4 rounded-lg border text-sm font-medium ${r.netBenefit >= 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {r.verdict}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Interest saved (overpay)" value={fmt(r.overpayment.interestSaved)} />
              <Stat label="Years off mortgage" value={`${fmtN(r.overpayment.yearsSaved)} yrs`} />
              <Stat label="Investment growth" value={fmt(r.investment.totalGrowth)} />
              <Stat label="Break-even rate" value={`${fmtN(r.breakEvenRate, 2)}%`} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function CompoundGrowth() {
  const [f, setF] = useState({ principal: '10000', monthlyContribution: '300', annualReturnRate: '7', years: '20', inflationRate: '' })
  const { loading, error, result, run } = useCalc()

  const go = () => run(() => financialApi.compoundGrowth({
    principal: Number(f.principal), monthlyContribution: Number(f.monthlyContribution),
    annualReturnRate: Number(f.annualReturnRate), years: Number(f.years),
    ...(f.inflationRate ? { inflationRate: Number(f.inflationRate) } : {}),
  }))

  const sf = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Project the future value of a lump sum plus regular monthly contributions.</p>
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Starting amount (£)" value={f.principal} onChange={sf('principal')} />
        <Field label="Monthly contribution (£)" value={f.monthlyContribution} onChange={sf('monthlyContribution')} />
        <Field label="Annual return (%)" value={f.annualReturnRate} onChange={sf('annualReturnRate')} />
        <Field label="Years" value={f.years} onChange={sf('years')} />
        <Field label="Inflation rate (%, optional)" value={f.inflationRate} onChange={sf('inflationRate')} />
      </div>
      <button onClick={go} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
        {loading ? 'Calculating...' : 'Project Growth'}
      </button>
      {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {result && (() => {
        const r = result as { finalValue: number; totalContributed: number; totalGrowth: number; realFinalValue?: number }
        return (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Final value" value={fmt(r.finalValue)} />
            <Stat label="Total contributed" value={fmt(r.totalContributed)} />
            <Stat label="Growth (interest/returns)" value={fmt(r.totalGrowth)} />
            {r.realFinalValue != null && <Stat label="Inflation-adjusted value" value={fmt(r.realFinalValue)} />}
          </div>
        )
      })()}
    </div>
  )
}

function SavingsTimeline() {
  const [f, setF] = useState({ targetAmount: '25000', currentSavings: '3000', monthlySaving: '500', annualReturnRate: '4' })
  const { loading, error, result, run } = useCalc()

  const go = () => run(() => financialApi.savingsTimeline({
    targetAmount: Number(f.targetAmount), currentSavings: Number(f.currentSavings),
    monthlySaving: Number(f.monthlySaving), annualReturnRate: Number(f.annualReturnRate),
  }))

  const sf = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Calculate how long it will take to reach a savings target.</p>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Target amount (£)" value={f.targetAmount} onChange={sf('targetAmount')} />
        <Field label="Current savings (£)" value={f.currentSavings} onChange={sf('currentSavings')} />
        <Field label="Monthly saving (£)" value={f.monthlySaving} onChange={sf('monthlySaving')} />
        <Field label="Annual return (%)" value={f.annualReturnRate} onChange={sf('annualReturnRate')} />
      </div>
      <button onClick={go} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
        {loading ? 'Calculating...' : 'Calculate Timeline'}
      </button>
      {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {result && (() => {
        const r = result as { monthsToTarget: number; yearsToTarget: number; totalContributed: number; interestEarned: number }
        return (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Time to target" value={`${fmtN(r.yearsToTarget)} yrs (${r.monthsToTarget} mo)`} />
            <Stat label="Total contributed" value={fmt(r.totalContributed)} />
            <Stat label="Interest earned" value={fmt(r.interestEarned)} />
          </div>
        )
      })()}
    </div>
  )
}

function Retirement() {
  const [projF, setProjF] = useState({ currentAge: '35', retirementAge: '67', currentPension: '20000', monthlyContribution: '400', employerMatch: '200', annualReturnRate: '6', inflationRate: '2.5' })
  const [gapF, setGapF] = useState({ desiredAnnualIncome: '30000', projectedPot: '0', expectedReturnInRetirement: '4' })
  const [subTab, setSubTab] = useState<'proj' | 'gap'>('proj')
  const { loading, error, result, run } = useCalc()

  const goProj = () => run(() => financialApi.retirementProjection({
    currentAge: Number(projF.currentAge), retirementAge: Number(projF.retirementAge),
    currentPension: Number(projF.currentPension), monthlyContribution: Number(projF.monthlyContribution),
    employerMatch: Number(projF.employerMatch), annualReturnRate: Number(projF.annualReturnRate),
    inflationRate: Number(projF.inflationRate),
  }))

  const goGap = () => run(() => financialApi.retirementGap({
    desiredAnnualIncome: Number(gapF.desiredAnnualIncome), projectedPot: Number(gapF.projectedPot),
    expectedReturnInRetirement: Number(gapF.expectedReturnInRetirement),
  }))

  const spf = (k: keyof typeof projF) => (v: string) => setProjF((p) => ({ ...p, [k]: v }))
  const sgf = (k: keyof typeof gapF) => (v: string) => setGapF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSubTab('proj')} className={`px-3 py-1.5 text-xs rounded-full font-medium ${subTab === 'proj' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Projection</button>
        <button onClick={() => setSubTab('gap')} className={`px-3 py-1.5 text-xs rounded-full font-medium ${subTab === 'gap' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Gap Analysis</button>
      </div>
      {subTab === 'proj' ? (
        <>
          <p className="text-sm text-gray-500 mb-4">Project your pension pot at retirement age.</p>
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Current age" value={projF.currentAge} onChange={spf('currentAge')} />
            <Field label="Retirement age" value={projF.retirementAge} onChange={spf('retirementAge')} />
            <Field label="Current pension (£)" value={projF.currentPension} onChange={spf('currentPension')} />
            <Field label="Your monthly contribution (£)" value={projF.monthlyContribution} onChange={spf('monthlyContribution')} />
            <Field label="Employer match (£/mo)" value={projF.employerMatch} onChange={spf('employerMatch')} />
            <Field label="Annual return (%)" value={projF.annualReturnRate} onChange={spf('annualReturnRate')} />
            <Field label="Inflation (%)" value={projF.inflationRate} onChange={spf('inflationRate')} />
          </div>
          <button onClick={goProj} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
            {loading ? 'Calculating...' : 'Project Pension'}
          </button>
          {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
          {result && (() => {
            const r = result as { projectedPot: number; projectedRealPot: number; annualIncomeAt4Pct: number; monthlyIncomeAt4Pct: number }
            return (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Projected pot" value={fmt(r.projectedPot)} />
                <Stat label="Inflation-adjusted pot" value={fmt(r.projectedRealPot)} />
                <Stat label="Annual income (4% rule)" value={fmt(r.annualIncomeAt4Pct)} />
                <Stat label="Monthly income (4% rule)" value={fmt(r.monthlyIncomeAt4Pct)} />
              </div>
            )
          })()}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">Find out if your projected pension pot will cover your desired retirement income.</p>
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Desired annual income (£)" value={gapF.desiredAnnualIncome} onChange={sgf('desiredAnnualIncome')} />
            <Field label="Projected pot (£)" value={gapF.projectedPot} onChange={sgf('projectedPot')} />
            <Field label="Return in retirement (%)" value={gapF.expectedReturnInRetirement} onChange={sgf('expectedReturnInRetirement')} />
          </div>
          <button onClick={goGap} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
            {loading ? 'Calculating...' : 'Analyse Gap'}
          </button>
          {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
          {result && (() => {
            const r = result as { annualShortfall: number; monthlyExtraSavingNeeded: number; yearsOfIncomeAvailable: number }
            return (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Annual shortfall" value={fmt(r.annualShortfall)} />
                <Stat label="Extra saving needed/mo" value={fmt(r.monthlyExtraSavingNeeded)} />
                <Stat label="Years income pot covers" value={isFinite(r.yearsOfIncomeAvailable) ? `${fmtN(r.yearsOfIncomeAvailable)} yrs` : '∞'} />
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

function FirstHome() {
  const [f, setF] = useState({ targetPropertyValue: '350000', targetDepositPercent: '10', currentSavings: '5000', monthlySaving: '600', annualReturnRate: '4', lifetimeISABonus: 'false' })
  const { loading, error, result, run } = useCalc()

  const go = () => run(() => financialApi.firstHome({
    targetPropertyValue: Number(f.targetPropertyValue), targetDepositPercent: Number(f.targetDepositPercent),
    currentSavings: Number(f.currentSavings), monthlySaving: Number(f.monthlySaving),
    annualReturnRate: Number(f.annualReturnRate), lifetimeISABonus: f.lifetimeISABonus === 'true' ? 1 : 0,
  }))

  const sf = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Calculate how long to save your deposit, with optional Lifetime ISA boost.</p>
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Property value (£)" value={f.targetPropertyValue} onChange={sf('targetPropertyValue')} />
        <Field label="Deposit required (%)" value={f.targetDepositPercent} onChange={sf('targetDepositPercent')} />
        <Field label="Current savings (£)" value={f.currentSavings} onChange={sf('currentSavings')} />
        <Field label="Monthly saving (£)" value={f.monthlySaving} onChange={sf('monthlySaving')} />
        <Field label="Annual return (%)" value={f.annualReturnRate} onChange={sf('annualReturnRate')} />
        <div>
          <label className="block text-xs text-gray-600 mb-1">Include Lifetime ISA bonus?</label>
          <select value={f.lifetimeISABonus} onChange={(e) => sf('lifetimeISABonus')(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="false">No</option>
            <option value="true">Yes (+25% bonus up to £1,000/yr)</option>
          </select>
        </div>
      </div>
      <button onClick={go} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {result && (() => {
        const r = result as { targetDeposit: number; monthsToTarget: number; yearsToTarget: number; withLISABonus: number }
        return (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Deposit needed" value={fmt(r.targetDeposit)} />
            <Stat label="Time to save" value={`${fmtN(r.yearsToTarget)} yrs (${r.monthsToTarget} mo)`} />
            {r.withLISABonus > 0 && <Stat label="LISA bonus received" value={fmt(r.withLISABonus)} />}
          </div>
        )
      })()}
    </div>
  )
}

function ISAComparison() {
  const [f, setF] = useState({ amount: '20000', annualReturn: '5', years: '10', isISA: 'true' })
  const { loading, error, result, run } = useCalc()

  const go = () => run(() => financialApi.isaComparison({
    amount: Number(f.amount), annualReturn: Number(f.annualReturn),
    years: Number(f.years), isISA: f.isISA === 'true' ? 1 : 0,
  }))

  const sf = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Compare the tax impact of investing in an ISA versus a general investment account.</p>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Amount invested (£)" value={f.amount} onChange={sf('amount')} />
        <Field label="Annual return (%)" value={f.annualReturn} onChange={sf('annualReturn')} />
        <Field label="Years" value={f.years} onChange={sf('years')} />
        <div>
          <label className="block text-xs text-gray-600 mb-1">Wrapper</label>
          <select value={f.isISA} onChange={(e) => sf('isISA')(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="true">ISA (tax-free)</option>
            <option value="false">General account (taxable)</option>
          </select>
        </div>
      </div>
      <button onClick={go} disabled={loading} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black disabled:opacity-60">
        {loading ? 'Calculating...' : 'Compare'}
      </button>
      {error && <div className="mt-3 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
      {result && (() => {
        const r = result as { grossReturn: number; taxPaid: number; netReturn: number }
        return (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Gross return" value={fmt(r.grossReturn)} />
            <Stat label="Tax paid" value={fmt(r.taxPaid)} />
            <Stat label="Net return" value={fmt(r.netReturn)} />
          </div>
        )
      })()}
    </div>
  )
}

export function FinancialTools() {
  const [activeTab, setActiveTab] = useState<Tab>('overpay')

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900">Financial Tools</h2>
      <p className="text-sm text-gray-500 mt-1">Model key financial decisions alongside your mortgage.</p>

      <div className="flex flex-wrap gap-2 mt-4 pb-4 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${activeTab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === 'overpay' && <OverpayVsInvest />}
        {activeTab === 'compound' && <CompoundGrowth />}
        {activeTab === 'savings' && <SavingsTimeline />}
        {activeTab === 'retirement' && <Retirement />}
        {activeTab === 'firsthome' && <FirstHome />}
        {activeTab === 'isa' && <ISAComparison />}
      </div>
    </section>
  )
}
