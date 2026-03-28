// ============================================================
// MORTGAGE CALCULATION ENGINE
// ============================================================

const MortgageCalc = {
  // ----------------------------------------------------------
  // Core monthly payment calculation (capital + interest)
  // ----------------------------------------------------------
  monthlyPayment(principal, annualRate, termYears) {
    if (annualRate === 0) return principal / (termYears * 12);
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  },

  // ----------------------------------------------------------
  // Interest-only monthly payment
  // ----------------------------------------------------------
  monthlyInterestOnly(principal, annualRate) {
    return (principal * (annualRate / 100)) / 12;
  },

  // ----------------------------------------------------------
  // LTV calculation
  // ----------------------------------------------------------
  calculateLTV(propertyValue, deposit) {
    if (propertyValue <= 0) return 0;
    return ((propertyValue - deposit) / propertyValue) * 100;
  },

  // ----------------------------------------------------------
  // LTV colour band
  // ----------------------------------------------------------
  ltvBand(ltv) {
    if (ltv <= 60) return { label: "Excellent", color: "green", css: "text-green-600 bg-green-50" };
    if (ltv <= 75) return { label: "Good", color: "emerald", css: "text-emerald-600 bg-emerald-50" };
    if (ltv <= 80) return { label: "Moderate", color: "amber", css: "text-amber-600 bg-amber-50" };
    if (ltv <= 90) return { label: "High", color: "orange", css: "text-orange-600 bg-orange-50" };
    return { label: "Very High", color: "red", css: "text-red-600 bg-red-50" };
  },

  // ----------------------------------------------------------
  // Total interest over a period
  // ----------------------------------------------------------
  totalInterest(principal, annualRate, termYears, interestOnly = false) {
    if (interestOnly) {
      return this.monthlyInterestOnly(principal, annualRate) * termYears * 12;
    }
    const monthly = this.monthlyPayment(principal, annualRate, termYears);
    return monthly * termYears * 12 - principal;
  },

  // ----------------------------------------------------------
  // Total cost over deal period (intro rate), then reversion
  // ----------------------------------------------------------
  totalCostBreakdown(principal, dealRate, dealYears, svrRate, termYears, fees, interestOnly = false) {
    const loanAmount = principal;
    let totalPaid = fees;
    let remainingBalance = principal;
    let monthlyDeal, monthlySVR;

    if (interestOnly) {
      monthlyDeal = this.monthlyInterestOnly(loanAmount, dealRate);
      // Deal period
      const dealMonths = dealYears * 12;
      totalPaid += monthlyDeal * dealMonths;
      // SVR period (interest only continues)
      const svrMonths = (termYears - dealYears) * 12;
      monthlySVR = this.monthlyInterestOnly(loanAmount, svrRate);
      totalPaid += monthlySVR * svrMonths;
      remainingBalance = principal; // Still owe full amount

      return {
        monthlyDeal: monthlyDeal,
        monthlySVR: monthlySVR,
        totalDealPeriod: monthlyDeal * dealMonths + fees,
        totalSVRPeriod: monthlySVR * svrMonths,
        totalCost: totalPaid,
        totalInterest: totalPaid - fees,
        remainingBalance: remainingBalance,
        fees: fees,
      };
    }

    // Repayment mortgage
    monthlyDeal = this.monthlyPayment(loanAmount, dealRate, termYears);
    const dealMonths = Math.min(dealYears * 12, termYears * 12);

    // Calculate remaining balance after deal period
    let balance = loanAmount;
    const monthlyRate = dealRate / 100 / 12;
    for (let i = 0; i < dealMonths; i++) {
      const interest = balance * monthlyRate;
      const capitalRepaid = monthlyDeal - interest;
      balance -= capitalRepaid;
    }
    remainingBalance = Math.max(0, balance);

    const dealTotal = monthlyDeal * dealMonths;
    totalPaid += dealTotal;

    // SVR period
    const remainingMonths = termYears * 12 - dealMonths;
    if (remainingMonths > 0 && remainingBalance > 0) {
      const remainingTermYears = remainingMonths / 12;
      monthlySVR = this.monthlyPayment(remainingBalance, svrRate, remainingTermYears);
      totalPaid += monthlySVR * remainingMonths;
    } else {
      monthlySVR = 0;
    }

    return {
      monthlyDeal: monthlyDeal,
      monthlySVR: monthlySVR,
      totalDealPeriod: dealTotal + fees,
      totalSVRPeriod: monthlySVR * (termYears * 12 - dealMonths),
      totalCost: totalPaid,
      totalInterest: totalPaid - fees - loanAmount,
      remainingBalance: remainingBalance,
      fees: fees,
    };
  },

  // ----------------------------------------------------------
  // Stress test — what if rates rise?
  // ----------------------------------------------------------
  stressTest(principal, termYears, rateIncreases = [1, 2, 3]) {
    return rateIncreases.map((increase) => {
      const stressedRate = 5.25 + increase; // Base rate scenario
      const monthly = this.monthlyPayment(principal, stressedRate, termYears);
      return {
        rateIncrease: increase,
        stressedRate: stressedRate,
        monthlyPayment: monthly,
      };
    });
  },

  // ----------------------------------------------------------
  // Overpayment impact calculator
  // ----------------------------------------------------------
  overpaymentImpact(principal, annualRate, termYears, monthlyOverpayment) {
    const normalMonthly = this.monthlyPayment(principal, annualRate, termYears);
    const normalTotalPaid = normalMonthly * termYears * 12;

    // Simulate with overpayment
    const r = annualRate / 100 / 12;
    let balance = principal;
    let months = 0;
    let totalPaid = 0;

    while (balance > 0 && months < termYears * 12) {
      const interest = balance * r;
      const payment = Math.min(normalMonthly + monthlyOverpayment, balance + interest);
      balance = balance + interest - payment;
      totalPaid += payment;
      months++;
      if (balance < 0.01) balance = 0;
    }

    const yearsSaved = termYears - months / 12;
    const interestSaved = normalTotalPaid - totalPaid;

    return {
      normalMonthly: normalMonthly,
      newMonthly: normalMonthly + monthlyOverpayment,
      originalTermMonths: termYears * 12,
      newTermMonths: months,
      yearsSaved: yearsSaved,
      interestSaved: interestSaved,
      totalWithOverpayment: totalPaid,
      totalWithout: normalTotalPaid,
    };
  },

  // ----------------------------------------------------------
  // Stamp duty calculation
  // ----------------------------------------------------------
  calculateStampDuty(propertyValue, buyerType = "standard") {
    let bands;
    if (buyerType === "firstTime" && propertyValue <= 625000) {
      bands = STAMP_DUTY_BANDS.firstTimeBuyer;
    } else if (buyerType === "additional") {
      bands = STAMP_DUTY_BANDS.additionalProperty;
    } else {
      bands = STAMP_DUTY_BANDS.standard;
    }

    let tax = 0;
    let previousThreshold = 0;

    for (const band of bands) {
      if (propertyValue <= previousThreshold) break;
      const taxableAmount =
        Math.min(propertyValue, band.threshold) - previousThreshold;
      if (taxableAmount > 0) {
        tax += taxableAmount * (band.rate / 100);
      }
      previousThreshold = band.threshold;
    }

    return Math.round(tax);
  },

  // ----------------------------------------------------------
  // Affordability check
  // ----------------------------------------------------------
  affordabilityCheck(grossIncome, monthlyOutgoings, loanAmount, termYears) {
    // Standard lending multiple: 4-4.5x income
    const maxBorrowConservative = grossIncome * 4;
    const maxBorrowStretch = grossIncome * 4.5;

    // Stress test at ~7-8%
    const stressRate = 7.5;
    const stressMonthly = this.monthlyPayment(loanAmount, stressRate, termYears);

    // Net monthly income after tax (rough estimate)
    const monthlyGross = grossIncome / 12;
    const estimatedTax = this.estimateMonthlyTax(grossIncome);
    const monthlyNet = monthlyGross - estimatedTax;

    // Available for mortgage after commitments
    const available = monthlyNet - monthlyOutgoings;
    const affordableAtStress = stressMonthly < available * 0.45; // 45% of disposable income

    return {
      maxBorrowConservative,
      maxBorrowStretch,
      stressRate,
      stressMonthly,
      monthlyNet,
      monthlyDisposable: available,
      affordableAtStress,
      ratio: available > 0 ? (stressMonthly / available) * 100 : 999,
    };
  },

  // Rough UK tax estimator
  estimateMonthlyTax(annualGross) {
    let tax = 0;
    const personalAllowance = 12570;
    const basicCeiling = 50270;
    const higherCeiling = 125140;

    if (annualGross > personalAllowance) {
      const basicTaxable = Math.min(annualGross, basicCeiling) - personalAllowance;
      tax += basicTaxable * 0.2;
    }
    if (annualGross > basicCeiling) {
      const higherTaxable = Math.min(annualGross, higherCeiling) - basicCeiling;
      tax += higherTaxable * 0.4;
    }
    if (annualGross > higherCeiling) {
      tax += (annualGross - higherCeiling) * 0.45;
    }
    // National Insurance (simplified)
    const niThreshold = 12570;
    const niUpperLimit = 50270;
    if (annualGross > niThreshold) {
      const niLower = Math.min(annualGross, niUpperLimit) - niThreshold;
      tax += niLower * 0.08;
      if (annualGross > niUpperLimit) {
        tax += (annualGross - niUpperLimit) * 0.02;
      }
    }
    return tax / 12;
  },

  // ----------------------------------------------------------
  // Filter and rank deals based on user profile
  // ----------------------------------------------------------
  filterAndRankDeals(userProfile) {
    const {
      propertyValue,
      deposit,
      termYears,
      grossIncome,
      purchaseType,
      priorities,
      riskTolerance,
      overpaymentPlans,
      overpaymentAmount,
      movingWithin5Years,
      savingsAmount,
    } = userProfile;

    const loanAmount = propertyValue - deposit;
    const ltv = this.calculateLTV(propertyValue, deposit);
    const isInterestOnly = purchaseType === "buyToLet";

    // Filter deals by LTV
    let eligible = SAMPLE_DEALS.filter((deal) => ltv <= deal.maxLTV);

    // Score and rank each deal
    const scored = eligible.map((deal) => {
      const typeInfo = MORTGAGE_TYPES[deal.type];
      const isIO = deal.type === "interest_only" || isInterestOnly;
      const totalFees = deal.arrangementFee + deal.valuationFee + deal.legalFees;

      const breakdown = this.totalCostBreakdown(
        loanAmount,
        deal.rate,
        deal.fixedPeriod || 2,
        deal.svr,
        termYears,
        totalFees,
        isIO
      );

      // Calculate score based on priorities
      let score = 100;

      // Priority: Lowest monthly payment
      if (priorities.includes("lowestMonthly")) {
        score -= breakdown.monthlyDeal / 20;
      }

      // Priority: Lowest total cost
      if (priorities.includes("lowestTotal")) {
        score -= breakdown.totalCost / 10000;
      }

      // Priority: Payment certainty
      if (priorities.includes("certainty")) {
        if (typeInfo.category === "fixed") score += 25;
        if (typeInfo.category === "variable") score -= 20;
      }

      // Priority: Flexibility to overpay
      if (priorities.includes("flexibility")) {
        score += deal.overpaymentAllowance > 10 ? 15 : 0;
        score += deal.ercYear1 === 0 ? 20 : -deal.ercYear1 * 2;
      }

      // Priority: Ability to move/port
      if (priorities.includes("portability") || movingWithin5Years) {
        score += deal.portable ? 15 : -10;
        // Penalise long fixes if planning to move
        if (movingWithin5Years && deal.fixedPeriod >= 5) score -= 10;
      }

      // Risk tolerance adjustment
      if (riskTolerance <= 30) {
        // Low risk tolerance — boost fixed
        if (typeInfo.category === "fixed") score += 15;
        if (typeInfo.category === "variable") score -= 15;
      } else if (riskTolerance >= 70) {
        // High risk tolerance — boost trackers
        if (deal.type === "tracker") score += 10;
      }

      // Offset scoring
      if (deal.type === "offset" && savingsAmount > 10000) {
        const effectiveSaving = (savingsAmount * deal.rate) / 100 / 12;
        score += effectiveSaving / 10;
      }

      // Overpayment plans
      if (overpaymentPlans && overpaymentAmount > 0) {
        if (deal.overpaymentAllowance >= 100) score += 10;
        const monthlyAllowed = (loanAmount * deal.overpaymentAllowance) / 100 / 12;
        if (overpaymentAmount > monthlyAllowed) score -= 10;
      }

      // Generate verdict
      const verdict = this.generateVerdict(deal, typeInfo, breakdown, totalFees, ltv);

      return {
        deal,
        typeInfo,
        breakdown,
        score,
        verdict,
        ltv,
        loanAmount,
        totalFees,
        isInterestOnly: isIO,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
  },

  // ----------------------------------------------------------
  // Generate plain-English verdict for a deal
  // ----------------------------------------------------------
  generateVerdict(deal, typeInfo, breakdown, totalFees, ltv) {
    const parts = [];

    if (typeInfo.category === "fixed") {
      parts.push(
        `Locks your rate at ${deal.rate}% for ${deal.fixedPeriod} year${deal.fixedPeriod > 1 ? "s" : ""}`
      );
    } else if (deal.type === "tracker") {
      parts.push(`Follows the base rate — currently ${deal.rate}%`);
    } else if (deal.type === "svr") {
      parts.push("The lender's default rate — usually the most expensive option");
    } else if (deal.type === "discount") {
      parts.push(`A discounted variable rate — currently ${deal.rate}%`);
    } else if (deal.type === "offset") {
      parts.push("Your savings reduce the balance you pay interest on");
    } else if (deal.type === "interest_only") {
      parts.push("Lower payments, but you won't reduce the debt");
    }

    if (totalFees > 0) {
      parts.push(
        `£${totalFees.toLocaleString()} in fees ${totalFees > 1000 ? "(which eats into the rate saving)" : ""}`
      );
    } else {
      parts.push("no arrangement fee");
    }

    if (deal.cashback > 0) {
      parts.push(`£${deal.cashback} cashback on completion`);
    }

    return parts.join(". ") + ".";
  },

  // ----------------------------------------------------------
  // Format currency
  // ----------------------------------------------------------
  formatCurrency(amount) {
    return "£" + Math.round(amount).toLocaleString("en-GB");
  },

  formatCurrencyFull(amount) {
    return (
      "£" +
      amount.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  },
};
