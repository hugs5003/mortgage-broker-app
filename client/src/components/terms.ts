export const TERMS: Record<string, string> = {
  ltv: "Loan-to-Value (LTV) is the size of your mortgage as a percentage of the property's value. Lower is better — lenders offer cheaper rates when you have more equity.",

  arrangement_fee: "A one-off fee charged by the lender when you take out the mortgage. Some deals have no fee but a higher rate — others charge up to £2,000 for a much lower rate. Run the numbers: a £999 fee can still save you thousands if the rate is low enough.",

  fixed_rate: "Your interest rate is locked in for a set period (usually 2 or 5 years). Your monthly payment stays exactly the same, so there are no surprises — but you may pay a 'break' penalty if you leave early.",

  tracker_rate: "Your rate moves up or down in line with the Bank of England base rate, usually at a set margin above it. This means lower payments when rates fall, but higher payments if rates rise.",

  aprc: "Annual Percentage Rate of Charge — the total cost of the mortgage per year, including fees and any rate changes. Used to compare deals on a like-for-like basis. A deal with a low headline rate and high fees might have a higher APRC than a rival.",

  svr: "Standard Variable Rate — the rate you're automatically moved to once your fixed or tracker deal ends. SVRs are usually much higher than deal rates. Most people remortgage before this kicks in.",

  overpayment: "Paying more than your required monthly amount. Most lenders allow up to 10% of the outstanding balance per year without a penalty. Overpaying reduces the total interest you pay and shortens your mortgage term.",

  esis: "European Standardised Information Sheet — a legal document your lender must give you before you take out a mortgage. It lists all the key terms, costs, and your right to a 7-day reflection period.",

  stress_test: "Lenders check that you could still afford your mortgage if interest rates rose significantly (often to ~7-8%). If you can't pass the stress test, you may be offered a smaller loan.",

  portability: "The ability to take your existing mortgage deal with you if you move home. Useful if you're in a fixed deal and want to avoid early repayment charges when you move.",

  remortgage: "Switching your existing mortgage to a new deal — either with your current lender (product transfer) or a different lender. People usually remortgage when their fixed deal ends to avoid the SVR.",

  early_repayment: "A fee you pay if you leave your mortgage deal before it ends. Usually 1-5% of the outstanding balance. This is why you rarely exit a deal early — it can cost thousands.",

  interest_only: "You only pay the interest each month, not the capital. Your monthly payments are much lower, but you still owe the full loan amount at the end of the term. You need a credible repayment plan (e.g. an investment vehicle or property sale).",

  capital_repayment: "The standard mortgage type — each monthly payment covers both interest and a bit of the borrowed amount. Over time you own more of your home, and eventually you own it outright.",

  net_worth: "Your total assets (home equity, savings, pension, etc.) minus your total debts (mortgage, loans, etc.). A single number that shows your overall financial position.",

  equity: "The share of your home that you actually own — property value minus whatever you still owe on the mortgage. For example, a £300k home with a £200k mortgage = £100k equity.",

  gross_income: "Your total income before tax and other deductions. Lenders typically lend 4–4.5x your gross income, though this varies by circumstances.",

  monthly_payment: "The amount you pay to your lender every month. It covers interest on what you've borrowed, plus (on a repayment mortgage) a portion that reduces your debt.",

  deposit: "The upfront cash you put towards buying a property. A bigger deposit means a lower LTV, which usually means cheaper mortgage rates.",

  isa: "Individual Savings Account — a tax-free wrapper for savings or investments. Returns and withdrawals are free from UK tax. The annual allowance is £20,000.",

  pension: "A long-term retirement savings pot. Contributions benefit from tax relief — so putting £80 in actually adds £100 if you're a basic rate taxpayer. Many workplace pensions also include employer contributions.",
}

export type TermKey = keyof typeof TERMS
