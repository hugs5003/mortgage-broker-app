// ============================================================
// MORTGAGE DATA — Types, Explanations, Sample Deals
// ============================================================

const MORTGAGE_TYPES = {
  fixed_2yr: {
    id: "fixed_2yr",
    name: "2-Year Fixed Rate",
    category: "fixed",
    shortDesc: "Your rate stays the same for 2 years.",
    explanation: {
      whatItMeans:
        "Your interest rate stays exactly the same for 2 years. Your monthly payment will not change during this time, regardless of what happens in the wider economy.",
      upside:
        "Total predictability for 2 years. You know exactly what you'll pay every month, making budgeting easy. Shorter commitment means you can switch to a better deal sooner if rates fall.",
      downside:
        "If interest rates fall during those 2 years, you won't benefit — you're locked in. If you need to leave the deal early (e.g. you sell the house), you'll face an Early Repayment Charge (ERC), typically 1-3% of the outstanding loan, which can be thousands of pounds.",
      bestFor:
        "People who want certainty but don't want to be locked in for too long. Good if you think you might move or remortgage within a few years.",
    },
  },
  fixed_3yr: {
    id: "fixed_3yr",
    name: "3-Year Fixed Rate",
    category: "fixed",
    shortDesc: "Your rate stays the same for 3 years.",
    explanation: {
      whatItMeans:
        "Your interest rate stays exactly the same for 3 years. A middle ground between a 2-year and 5-year fix.",
      upside:
        "Predictability for 3 years with a slightly shorter lock-in than a 5-year fix. Often available at a competitive rate.",
      downside:
        "Same as any fixed deal — if rates fall, you can't benefit without paying early repayment charges. You'll need to remortgage again after 3 years.",
      bestFor:
        "People who want more stability than a 2-year fix but aren't ready to commit for 5 years.",
    },
  },
  fixed_5yr: {
    id: "fixed_5yr",
    name: "5-Year Fixed Rate",
    category: "fixed",
    shortDesc: "Your rate stays the same for 5 years.",
    explanation: {
      whatItMeans:
        "Your interest rate stays exactly the same for 5 years. Your monthly payment is completely predictable for a long stretch.",
      upside:
        "Five years of total payment certainty. Fewer remortgage hassles. If rates rise significantly, you're protected the whole time.",
      downside:
        "You're locked in for a long time. Early repayment charges apply for the full 5 years (often 3-5% in year one, stepping down). If rates drop substantially, you'll be paying above market rate with no easy escape.",
      bestFor:
        "People who value long-term certainty, are settling into a home, or believe rates may rise. Families on tight budgets who can't afford payment surprises.",
    },
  },
  fixed_10yr: {
    id: "fixed_10yr",
    name: "10-Year Fixed Rate",
    category: "fixed",
    shortDesc: "Your rate stays the same for 10 years.",
    explanation: {
      whatItMeans:
        "Your interest rate stays the same for a full decade. The ultimate in payment certainty.",
      upside:
        "A decade of knowing exactly what you'll pay. No remortgage stress for 10 years. Maximum protection against rate rises.",
      downside:
        "Rates are typically higher than shorter fixes to compensate for the risk the lender takes. You're locked in for a very long time — life circumstances change, and the early repayment charges can be very significant.",
      bestFor:
        "People who are certain they'll stay in the property long-term and prioritise absolute certainty above all else.",
    },
  },
  tracker: {
    id: "tracker",
    name: "Tracker Mortgage",
    category: "variable",
    shortDesc: "Your rate follows the Bank of England base rate.",
    explanation: {
      whatItMeans:
        'Your rate is directly linked to the Bank of England base rate, plus a set margin. For example, "base rate + 0.75%" means if the base rate is 4.5%, you pay 5.25%. When the base rate changes, your rate changes automatically.',
      upside:
        "Completely transparent — you always know exactly why your rate is what it is. If the Bank of England cuts rates, your payments fall immediately. Often no early repayment charges, giving you flexibility to leave.",
      downside:
        "If the base rate rises, your payments rise immediately and there's no limit to how high they can go (unless the deal includes a cap). Your monthly budget becomes unpredictable.",
      bestFor:
        "People who believe interest rates will fall or stay stable, and who have enough financial cushion to absorb payment increases if rates rise.",
    },
  },
  svr: {
    id: "svr",
    name: "Standard Variable Rate (SVR)",
    category: "variable",
    shortDesc: "The lender's default rate — can change anytime.",
    explanation: {
      whatItMeans:
        "The SVR is the lender's own default interest rate. It can change at any time, for any reason — it loosely follows the Bank of England base rate but the lender decides. Most people end up on SVR by accident when their fixed or tracker deal expires.",
      upside:
        "No early repayment charges — you can leave or overpay whenever you like with total flexibility.",
      downside:
        "SVRs are almost always more expensive than other deal types. Your payments can rise without warning. Staying on SVR is nearly always costing you money compared to switching to a new deal.",
      bestFor:
        "People in a very short-term holding pattern who plan to remortgage or move within weeks. In almost all other cases, you should switch away from SVR.",
    },
  },
  discount: {
    id: "discount",
    name: "Discount Rate Mortgage",
    category: "variable",
    shortDesc: "A set discount off the lender's variable rate.",
    explanation: {
      whatItMeans:
        'You get a set discount off the lender\'s SVR for a fixed period. For example, "SVR minus 1.5%" for two years. If the SVR is 6.5%, you\'d pay 5%.',
      upside:
        "Starts cheaper than the full SVR. Can sometimes be cheaper than equivalent fixed deals. May have lower or no early repayment charges.",
      downside:
        'Because the SVR itself can change at any time, your payments can still go up — even though you\'re getting a "discount." You\'re getting a discount off a moving target, so there\'s no real certainty about what you\'ll pay.',
      bestFor:
        "People comfortable with rate variability who want a lower starting cost than SVR but aren't ready to commit to a fixed deal.",
    },
  },
  offset: {
    id: "offset",
    name: "Offset Mortgage",
    category: "special",
    shortDesc: "Your savings reduce the mortgage balance you pay interest on.",
    explanation: {
      whatItMeans:
        "Your savings are held alongside your mortgage. Instead of earning interest on your savings, that balance is subtracted from your mortgage balance before interest is calculated. For example: £200,000 mortgage with £30,000 savings = you only pay interest on £170,000.",
      upside:
        "Can save significant money on interest, especially for higher-rate taxpayers (because you're not taxed on savings interest you never receive). Your savings remain accessible if you need them.",
      downside:
        "The mortgage rate is often slightly higher than the best non-offset deals. You need meaningful savings for it to make a noticeable difference. Your savings won't earn any interest of their own while they're offsetting.",
      bestFor:
        "People with significant savings (typically £10,000+), higher-rate taxpayers, or self-employed people who keep a cash buffer for tax bills.",
    },
  },
  interest_only: {
    id: "interest_only",
    name: "Interest-Only Mortgage",
    category: "special",
    shortDesc: "You only pay the interest — you never reduce the debt.",
    explanation: {
      whatItMeans:
        "Each month, you only pay the interest charged on the loan — you do not pay down the actual amount borrowed. At the end of the mortgage term (e.g. 25 years), you still owe the full original loan amount and must repay it in one lump sum.",
      upside:
        "Much lower monthly payments than a repayment mortgage, freeing up cash for other things.",
      downside:
        "You are not reducing your debt at all — after 25 years of payments, you owe exactly what you started with. You must have a credible, proven plan to repay the full amount at the end (sale of property, investments, pension lump sum). Many people have been caught out by having no repayment plan. Lenders now require proof of how you'll repay.",
      bestFor:
        "Buy-to-let investors (where the property itself is the repayment plan) or borrowers with a clear, evidenced repayment strategy. Rarely suitable for standard residential borrowers.",
    },
  },
};

// ============================================================
// SAMPLE MORTGAGE DEALS (representative data)
// ============================================================

const SAMPLE_DEALS = [
  // 2-Year Fixed
  {
    id: "deal_1",
    lender: "Barclays",
    dealName: "2-Year Fixed Saver",
    type: "fixed_2yr",
    rate: 4.29,
    fixedPeriod: 2,
    svr: 7.99,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 2.0,
    ercYear2: 1.0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Free valuation", "Portable", "10% overpayment allowed"],
  },
  {
    id: "deal_2",
    lender: "HSBC",
    dealName: "2-Year Fixed",
    type: "fixed_2yr",
    rate: 4.19,
    fixedPeriod: 2,
    svr: 8.19,
    arrangementFee: 1499,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 80,
    minLTV: 0,
    ercYear1: 3.0,
    ercYear2: 2.0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Free valuation", "Free legal fees on remortgage", "Portable"],
  },
  {
    id: "deal_3",
    lender: "NatWest",
    dealName: "2-Year Fixed (No Fee)",
    type: "fixed_2yr",
    rate: 4.59,
    fixedPeriod: 2,
    svr: 7.74,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 85,
    minLTV: 0,
    ercYear1: 2.0,
    ercYear2: 1.0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 250,
    features: ["No arrangement fee", "£250 cashback", "Portable"],
  },
  // 3-Year Fixed
  {
    id: "deal_4",
    lender: "Nationwide",
    dealName: "3-Year Fixed",
    type: "fixed_3yr",
    rate: 4.39,
    fixedPeriod: 3,
    svr: 7.49,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 80,
    minLTV: 0,
    ercYear1: 3.0,
    ercYear2: 2.0,
    ercYear3: 1.0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Free valuation", "Portable", "Switch & Fix option"],
  },
  // 5-Year Fixed
  {
    id: "deal_5",
    lender: "Barclays",
    dealName: "5-Year Fixed",
    type: "fixed_5yr",
    rate: 4.09,
    fixedPeriod: 5,
    svr: 7.99,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 5.0,
    ercYear2: 4.0,
    ercYear3: 3.0,
    ercYear4: 2.0,
    ercYear5: 1.0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Free valuation", "Portable", "10% annual overpayment"],
  },
  {
    id: "deal_6",
    lender: "Halifax",
    dealName: "5-Year Fixed (No Fee)",
    type: "fixed_5yr",
    rate: 4.39,
    fixedPeriod: 5,
    svr: 8.24,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 85,
    minLTV: 0,
    ercYear1: 4.0,
    ercYear2: 3.0,
    ercYear3: 2.0,
    ercYear4: 1.0,
    ercYear5: 0.5,
    overpaymentAllowance: 10,
    portable: false,
    cashback: 500,
    features: ["No arrangement fee", "£500 cashback"],
  },
  {
    id: "deal_7",
    lender: "Santander",
    dealName: "5-Year Fixed",
    type: "fixed_5yr",
    rate: 4.15,
    fixedPeriod: 5,
    svr: 7.5,
    arrangementFee: 1499,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 5.0,
    ercYear2: 4.0,
    ercYear3: 3.0,
    ercYear4: 2.0,
    ercYear5: 1.0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Free property valuation", "Portable deal", "Cashback on completion"],
  },
  // 10-Year Fixed
  {
    id: "deal_8",
    lender: "Halifax",
    dealName: "10-Year Fixed",
    type: "fixed_10yr",
    rate: 4.59,
    fixedPeriod: 10,
    svr: 8.24,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 6.0,
    ercYear2: 6.0,
    ercYear3: 5.0,
    ercYear4: 4.0,
    ercYear5: 3.0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: ["Decade of certainty", "Free valuation", "Portable"],
  },
  // Tracker
  {
    id: "deal_9",
    lender: "HSBC",
    dealName: "2-Year Tracker",
    type: "tracker",
    rate: 4.49,
    rateMargin: 0.24,
    fixedPeriod: 2,
    svr: 8.19,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 60,
    minLTV: 0,
    ercYear1: 0,
    ercYear2: 0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 100,
    portable: true,
    cashback: 0,
    features: [
      "No early repayment charges",
      "Unlimited overpayments",
      "No arrangement fee",
    ],
  },
  {
    id: "deal_10",
    lender: "Nationwide",
    dealName: "Lifetime Tracker",
    type: "tracker",
    rate: 4.74,
    rateMargin: 0.49,
    fixedPeriod: 0,
    svr: 7.49,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 0,
    ercYear2: 0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 100,
    portable: true,
    cashback: 0,
    features: [
      "No ERCs — leave any time",
      "Unlimited overpayments",
      "Tracks for entire mortgage term",
    ],
  },
  // SVR
  {
    id: "deal_11",
    lender: "Various",
    dealName: "Standard Variable Rate",
    type: "svr",
    rate: 7.99,
    fixedPeriod: 0,
    svr: 7.99,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 90,
    minLTV: 0,
    ercYear1: 0,
    ercYear2: 0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 100,
    portable: false,
    cashback: 0,
    features: [
      "No ERCs",
      "Flexible overpayments",
      "Warning: usually much more expensive than other deals",
    ],
  },
  // Discount
  {
    id: "deal_12",
    lender: "Yorkshire BS",
    dealName: "2-Year Discount",
    type: "discount",
    rate: 5.19,
    discountAmount: 1.8,
    fixedPeriod: 2,
    svr: 6.99,
    arrangementFee: 0,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 80,
    minLTV: 0,
    ercYear1: 2.0,
    ercYear2: 1.0,
    ercYear3: 0,
    ercYear4: 0,
    ercYear5: 0,
    overpaymentAllowance: 10,
    portable: false,
    cashback: 0,
    features: [
      "No arrangement fee",
      "Discount off SVR for 2 years",
      "Rate can still change",
    ],
  },
  // Offset
  {
    id: "deal_13",
    lender: "Coventry BS",
    dealName: "5-Year Fixed Offset",
    type: "offset",
    rate: 4.49,
    fixedPeriod: 5,
    svr: 7.75,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 75,
    minLTV: 0,
    ercYear1: 5.0,
    ercYear2: 4.0,
    ercYear3: 3.0,
    ercYear4: 2.0,
    ercYear5: 1.0,
    overpaymentAllowance: 10,
    portable: false,
    cashback: 0,
    features: [
      "Savings offset against mortgage",
      "Savings remain accessible",
      "Fixed rate for 5 years",
    ],
  },
  // Interest Only
  {
    id: "deal_14",
    lender: "Barclays",
    dealName: "5-Year Fixed Interest Only",
    type: "interest_only",
    rate: 4.39,
    fixedPeriod: 5,
    svr: 7.99,
    arrangementFee: 999,
    valuationFee: 0,
    legalFees: 0,
    maxLTV: 50,
    minLTV: 0,
    ercYear1: 5.0,
    ercYear2: 4.0,
    ercYear3: 3.0,
    ercYear4: 2.0,
    ercYear5: 1.0,
    overpaymentAllowance: 10,
    portable: true,
    cashback: 0,
    features: [
      "Lower monthly payments",
      "Capital owed does not reduce",
      "Requires repayment strategy",
      "Max 50% LTV",
    ],
  },
];

// ============================================================
// EDUCATIONAL CONTENT
// ============================================================

const EDUCATION_TOPICS = [
  {
    id: "ltv",
    title: "What is LTV and why does it matter?",
    icon: "📊",
    content:
      "LTV stands for Loan-to-Value. It's the percentage of the property's value that you're borrowing. For example, if you buy a £300,000 home with a £60,000 deposit, you're borrowing £240,000 — that's an 80% LTV.\n\nWhy does it matter? The lower your LTV, the better deals you'll be offered. Lenders see you as less risky because you have more of your own money in the property. The best rates typically kick in below 60% LTV, with another step-change below 75%. Above 90% LTV, options become very limited and rates are higher.\n\nEvery 5% drop in LTV can unlock noticeably better rates. If you're close to a threshold (e.g. 77% LTV), it may be worth finding a little extra deposit to push below 75%.",
  },
  {
    id: "arrangement_fee",
    title: "What is an arrangement fee — and is it worth paying?",
    icon: "💷",
    content:
      "An arrangement fee (sometimes called a product fee) is a charge the lender makes for setting up your mortgage. It typically ranges from £0 to £1,999.\n\nHere's the key question: deals with fees often have lower interest rates. So you need to work out whether the interest you save over the deal period outweighs the fee. For larger mortgages, the rate saving usually wins. For smaller mortgages, a no-fee deal at a slightly higher rate might actually cost less overall.\n\nDanger: you can usually add the fee to your mortgage balance, but then you'll pay interest on it for years. A £1,500 fee added to your mortgage could end up costing £3,000+ over the full term. Pay it upfront if you possibly can.",
  },
  {
    id: "fees_upfront",
    title: "Should I add fees to the loan or pay upfront?",
    icon: "🏦",
    content:
      "If you add a £1,000 arrangement fee to a £200,000 mortgage at 4.5% over 25 years, that £1,000 actually costs you about £1,670 by the end. That's because you're paying interest on the fee for the life of the mortgage.\n\nPaying upfront saves you money in the long run. However, if paying the fee upfront would leave you dangerously low on cash reserves, it may be better to add it to the loan for peace of mind. The extra cost is the price of keeping cash in hand.\n\nOur calculator shows you the true cost both ways so you can decide.",
  },
  {
    id: "deal_ends",
    title: "What happens when my deal ends?",
    icon: "⏰",
    content:
      "When your fixed, tracker, or discount period ends, you'll automatically roll onto your lender's Standard Variable Rate (SVR). This is almost always significantly more expensive — often 2-4% higher than your deal rate.\n\nFor example, going from a 4.5% fix to a 7.5% SVR on a £200,000 mortgage adds roughly £350 per month to your payments.\n\nThe solution: start looking for a new deal about 6 months before your current one expires. Most lenders let you lock in a new rate months in advance. Set a calendar reminder — this single action could save you thousands.",
  },
  {
    id: "stress_test",
    title: "What is a mortgage stress test?",
    icon: "📈",
    content:
      "When you apply for a mortgage, the lender doesn't just check whether you can afford today's payments. They test whether you could still afford the payments if interest rates rose significantly — typically by 3 percentage points above their SVR, or a minimum stress rate of around 7-8%.\n\nThis means even if the deal you want has a 4% rate, the lender checks if you could cope at 7% or more. This is why you sometimes get offered less than you expect.\n\nIt's actually a good protection for you — it ensures you won't be in trouble if rates rise. Our calculator shows you what your payments would look like at stressed rates so there are no surprises.",
  },
  {
    id: "base_rate",
    title: "How does the Bank of England base rate affect me?",
    icon: "🏛️",
    content:
      "The Bank of England sets a 'base rate' which influences what lenders charge. When the base rate goes up, mortgage rates tend to follow. When it falls, mortgage rates usually (but not always) come down.\n\nIf you're on a fixed rate: it doesn't affect you at all until your fix ends. That's the whole point of fixing.\n\nIf you're on a tracker: your rate moves automatically with the base rate — usually within the same month.\n\nIf you're on SVR or a discount deal: your lender may (or may not) change your rate. They're not obliged to pass on cuts.\n\nKeeping an eye on base rate expectations can help you decide whether to fix (if you think rates will rise) or track (if you think they'll fall).",
  },
  {
    id: "overpaying",
    title: "Overpaying: the hidden superpower",
    icon: "⚡",
    content:
      "Overpaying means paying more than your required monthly payment. Even small overpayments can have a dramatic effect because the extra goes straight to reducing your debt, which means less interest builds up.\n\nExample: on a £200,000 mortgage at 4.5% over 25 years, overpaying just £100/month would save you about £22,000 in interest and clear the mortgage roughly 3.5 years early.\n\nMost deals allow you to overpay up to 10% of the outstanding balance per year without penalty. Going over that limit triggers early repayment charges. Always check your deal's specific terms.\n\nOverpaying is almost always a better use of spare cash than leaving it in a savings account (where you'd earn less interest than you're paying on the mortgage).",
  },
  {
    id: "remortgaging",
    title: "Remortgaging: when and why",
    icon: "🔄",
    content:
      "Remortgaging means switching your mortgage to a new deal — either with your existing lender (a 'product transfer') or a different one. You should actively consider remortgaging when:\n\n• Your current deal is about to end (you'll drop onto the expensive SVR)\n• Your property has increased in value (lower LTV = better rates)\n• Your financial circumstances have improved\n• You want to borrow more for home improvements\n\nStart looking 6 months before your deal expires. Many lenders issue mortgage offers valid for 6 months, so you can lock in a rate early with no commitment.\n\nRemortgaging typically costs £0–£1,500 in fees but can save thousands per year in lower payments. Some deals offer free legal work and valuations, making the switch virtually free.",
  },
];

// ============================================================
// STAMP DUTY CALCULATOR DATA (England & Northern Ireland rates 2024-25)
// ============================================================

const STAMP_DUTY_BANDS = {
  standard: [
    { threshold: 250000, rate: 0 },
    { threshold: 925000, rate: 5 },
    { threshold: 1500000, rate: 10 },
    { threshold: Infinity, rate: 12 },
  ],
  firstTimeBuyer: [
    { threshold: 425000, rate: 0 },
    { threshold: 625000, rate: 5 },
    // Above £625,000, first-time buyer relief does not apply — use standard rates
  ],
  additionalProperty: [
    { threshold: 250000, rate: 3 },
    { threshold: 925000, rate: 8 },
    { threshold: 1500000, rate: 13 },
    { threshold: Infinity, rate: 15 },
  ],
};
