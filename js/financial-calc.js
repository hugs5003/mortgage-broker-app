// ============================================================
// FINANCIAL OPTIMISATION CALCULATION ENGINE
// ============================================================

const FinancialCalc = {
  // ----------------------------------------------------------
  // FORMATTING
  // ----------------------------------------------------------
  formatCurrency(amount) {
    return "£" + Math.round(amount).toLocaleString("en-GB");
  },

  formatPercent(decimal) {
    return (decimal * 100).toFixed(1) + "%";
  },

  formatYearsMonths(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = Math.round(totalMonths % 12);
    const parts = [];
    if (years > 0) parts.push(years + " year" + (years !== 1 ? "s" : ""));
    if (months > 0) parts.push(months + " month" + (months !== 1 ? "s" : ""));
    return parts.length > 0 ? parts.join(" ") : "0 months";
  },

  // ----------------------------------------------------------
  // COMPOUND GROWTH
  // FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]
  // ----------------------------------------------------------
  compoundGrowth(principal, monthlyContribution, annualReturnRate, years) {
    const r = annualReturnRate / 100 / 12;
    const totalMonths = years * 12;
    const yearByYear = [];

    let balance = principal;
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + r) + monthlyContribution;
      }
      const contributed = principal + monthlyContribution * y * 12;
      yearByYear.push({
        year: y,
        balance: balance,
        contributed: contributed,
        growth: balance - contributed,
      });
    }

    const totalContributed = principal + monthlyContribution * totalMonths;
    return {
      finalValue: balance,
      totalContributed: totalContributed,
      totalGrowth: balance - totalContributed,
      yearByYear: yearByYear,
    };
  },

  compoundGrowthWithInflation(principal, monthlyContribution, annualReturnRate, inflationRate, years) {
    const result = this.compoundGrowth(principal, monthlyContribution, annualReturnRate, years);
    const yearByYear = result.yearByYear.map(function (entry) {
      return {
        year: entry.year,
        balance: entry.balance,
        contributed: entry.contributed,
        growth: entry.growth,
        realValue: entry.balance / Math.pow(1 + inflationRate / 100, entry.year),
      };
    });
    return {
      finalValue: result.finalValue,
      totalContributed: result.totalContributed,
      totalGrowth: result.totalGrowth,
      realFinalValue: result.finalValue / Math.pow(1 + inflationRate / 100, years),
      yearByYear: yearByYear,
    };
  },

  // ----------------------------------------------------------
  // INVESTMENT vs MORTGAGE OVERPAYMENT COMPARISON
  // ----------------------------------------------------------
  overpayVsInvest(mortgagePrincipal, mortgageRate, mortgageTermYears, monthlyExtra, investmentReturnRate, investmentYears) {
    // --- Overpayment calculation (month-by-month amortization) ---
    const mr = mortgageRate / 100 / 12;
    const totalNormalMonths = mortgageTermYears * 12;

    // Normal monthly payment
    var normalMonthly;
    if (mortgageRate === 0) {
      normalMonthly = mortgagePrincipal / totalNormalMonths;
    } else {
      normalMonthly = (mortgagePrincipal * mr * Math.pow(1 + mr, totalNormalMonths)) /
        (Math.pow(1 + mr, totalNormalMonths) - 1);
    }

    // Without overpayment
    var totalPaidWithout = normalMonthly * totalNormalMonths;

    // With overpayment
    var balance = mortgagePrincipal;
    var monthsWithOverpay = 0;
    var totalPaidWithOverpay = 0;
    while (balance > 0.01 && monthsWithOverpay < totalNormalMonths) {
      var interest = balance * mr;
      var payment = Math.min(normalMonthly + monthlyExtra, balance + interest);
      balance = balance + interest - payment;
      totalPaidWithOverpay += payment;
      monthsWithOverpay++;
      if (balance < 0.01) balance = 0;
    }

    var interestWithout = totalPaidWithout - mortgagePrincipal;
    var interestWithOverpay = totalPaidWithOverpay - mortgagePrincipal;
    var interestSaved = interestWithout - interestWithOverpay;
    var yearsSaved = (totalNormalMonths - monthsWithOverpay) / 12;

    var overpayment = {
      interestSaved: interestSaved,
      yearsSaved: yearsSaved,
      totalPaidWithOverpay: totalPaidWithOverpay,
      totalPaidWithout: totalPaidWithout,
    };

    // --- Investment calculation ---
    var investResult = this.compoundGrowth(0, monthlyExtra, investmentReturnRate, investmentYears);
    var investment = {
      finalValue: investResult.finalValue,
      totalContributed: investResult.totalContributed,
      totalGrowth: investResult.totalGrowth,
    };

    // --- Net benefit (positive = invest wins) ---
    var netBenefit = investResult.totalGrowth - interestSaved;

    // --- Break-even rate via binary search ---
    var breakEvenRate = this._findBreakEvenRate(mortgagePrincipal, mortgageRate, mortgageTermYears, monthlyExtra, investmentYears, interestSaved);

    var verdict;
    if (netBenefit > 0) {
      verdict = "Investing the extra £" + Math.round(monthlyExtra) + "/month is projected to beat overpaying the mortgage by " + this.formatCurrency(netBenefit) + " over " + investmentYears + " years.";
    } else if (netBenefit < 0) {
      verdict = "Overpaying the mortgage saves " + this.formatCurrency(Math.abs(netBenefit)) + " more than investing over " + investmentYears + " years. The guaranteed interest saving beats the projected return.";
    } else {
      verdict = "Overpaying and investing produce roughly the same outcome.";
    }

    return {
      overpayment: overpayment,
      investment: investment,
      netBenefit: netBenefit,
      breakEvenRate: breakEvenRate,
      verdict: verdict,
    };
  },

  _findBreakEvenRate(mortgagePrincipal, mortgageRate, mortgageTermYears, monthlyExtra, investmentYears, interestSaved) {
    var low = 0;
    var high = 50;
    for (var i = 0; i < 100; i++) {
      var mid = (low + high) / 2;
      var investResult = this.compoundGrowth(0, monthlyExtra, mid, investmentYears);
      var investGrowth = investResult.totalGrowth;
      if (Math.abs(investGrowth - interestSaved) < 0.01) break;
      if (investGrowth < interestSaved) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  },

  // ----------------------------------------------------------
  // ISA WRAPPER COMPARISON
  // ----------------------------------------------------------
  isaComparison(amount, annualReturn, years, isISA) {
    var r = annualReturn / 100 / 12;
    var balance = amount;
    for (var m = 0; m < years * 12; m++) {
      balance = balance * (1 + r);
    }
    var grossReturn = balance - amount;

    if (isISA) {
      return {
        grossReturn: grossReturn,
        taxPaid: 0,
        netReturn: grossReturn,
      };
    }

    // Non-ISA: 20% basic rate on gains above £1,000 personal savings allowance
    var personalAllowance = 1000;
    var taxableGain = Math.max(0, grossReturn - personalAllowance);
    var taxPaid = taxableGain * 0.20;

    return {
      grossReturn: grossReturn,
      taxPaid: taxPaid,
      netReturn: grossReturn - taxPaid,
    };
  },

  // ----------------------------------------------------------
  // SAVINGS GOAL / TIMELINE
  // ----------------------------------------------------------
  savingsTimeline(targetAmount, currentSavings, monthlySaving, annualReturnRate) {
    var r = annualReturnRate / 100 / 12;
    var balance = currentSavings;
    var months = 0;
    var monthByMonth = [];
    var maxMonths = 12 * 100; // safety cap at 100 years

    while (balance < targetAmount && months < maxMonths) {
      if (r > 0) {
        balance = balance * (1 + r) + monthlySaving;
      } else {
        balance = balance + monthlySaving;
      }
      months++;
      monthByMonth.push({ month: months, balance: balance });
    }

    var totalContributed = currentSavings + monthlySaving * months;

    return {
      monthsToTarget: months,
      yearsToTarget: months / 12,
      totalContributed: totalContributed,
      interestEarned: balance - totalContributed,
      monthByMonth: monthByMonth,
    };
  },

  // ----------------------------------------------------------
  // FIRST HOME SAVINGS (with Lifetime ISA bonus)
  // ----------------------------------------------------------
  firstHomeSavings(targetPropertyValue, targetDepositPercent, currentSavings, monthlySaving, annualReturnRate, lifetimeISABonus) {
    var targetDeposit = targetPropertyValue * (targetDepositPercent / 100);
    var timeline = this.savingsTimeline(targetDeposit, currentSavings, monthlySaving, annualReturnRate);

    var lisaBonusTotal = 0;
    if (lifetimeISABonus) {
      // LISA gives 25% bonus on up to £4,000/year contribution
      var yearsOfSaving = Math.ceil(timeline.monthsToTarget / 12);
      var annualContribution = Math.min(monthlySaving * 12, 4000);
      lisaBonusTotal = annualContribution * 0.25 * yearsOfSaving;
      // Recalculate with LISA bonus reducing the target
      var adjustedTarget = Math.max(0, targetDeposit - lisaBonusTotal);
      if (adjustedTarget < targetDeposit) {
        timeline = this.savingsTimeline(adjustedTarget, currentSavings, monthlySaving, annualReturnRate);
      }
    }

    return {
      targetDeposit: targetDeposit,
      monthsToTarget: timeline.monthsToTarget,
      yearsToTarget: timeline.yearsToTarget,
      withLISABonus: lisaBonusTotal,
      timeline: timeline,
    };
  },

  // ----------------------------------------------------------
  // RETIREMENT — "WHAT'S YOUR NUMBER"
  // ----------------------------------------------------------
  retirementNumber(desiredAnnualIncome, expectedReturnInRetirement, inflationRate) {
    // Real return = nominal - inflation (simplified)
    var realReturn = (expectedReturnInRetirement - inflationRate) / 100;
    var lumpSumNeeded;
    if (realReturn <= 0) {
      // If real return is zero or negative, use 25x rule as fallback
      lumpSumNeeded = desiredAnnualIncome * 25;
    } else {
      lumpSumNeeded = desiredAnnualIncome / realReturn;
    }
    return {
      lumpSumNeeded: lumpSumNeeded,
    };
  },

  // ----------------------------------------------------------
  // RETIREMENT PROJECTION
  // ----------------------------------------------------------
  retirementProjection(currentAge, retirementAge, currentPension, monthlyContribution, employerMatch, annualReturnRate, inflationRate) {
    var yearsToRetirement = retirementAge - currentAge;
    if (yearsToRetirement <= 0) {
      return {
        projectedPot: currentPension,
        projectedRealPot: currentPension,
        annualIncomeAt4Pct: currentPension * 0.04,
        monthlyIncomeAt4Pct: (currentPension * 0.04) / 12,
        shortfallVsTarget: 0,
        yearByYear: [],
      };
    }

    var totalMonthlyContribution = monthlyContribution + employerMatch;
    var r = annualReturnRate / 100 / 12;
    var balance = currentPension;
    var yearByYear = [];

    for (var y = 1; y <= yearsToRetirement; y++) {
      for (var m = 0; m < 12; m++) {
        balance = balance * (1 + r) + totalMonthlyContribution;
      }
      var contributed = currentPension + totalMonthlyContribution * y * 12;
      var realValue = balance / Math.pow(1 + inflationRate / 100, y);
      yearByYear.push({
        year: y,
        age: currentAge + y,
        balance: balance,
        contributed: contributed,
        growth: balance - contributed,
        realValue: realValue,
      });
    }

    var projectedPot = balance;
    var projectedRealPot = balance / Math.pow(1 + inflationRate / 100, yearsToRetirement);
    var annualIncomeAt4Pct = projectedPot * 0.04;
    var monthlyIncomeAt4Pct = annualIncomeAt4Pct / 12;

    return {
      projectedPot: projectedPot,
      projectedRealPot: projectedRealPot,
      annualIncomeAt4Pct: annualIncomeAt4Pct,
      monthlyIncomeAt4Pct: monthlyIncomeAt4Pct,
      shortfallVsTarget: 0,
      yearByYear: yearByYear,
    };
  },

  // ----------------------------------------------------------
  // RETIREMENT GAP
  // ----------------------------------------------------------
  retirementGap(desiredAnnualIncome, projectedPot, expectedReturnInRetirement) {
    var annualFromPot = projectedPot * (expectedReturnInRetirement / 100);
    var annualShortfall = Math.max(0, desiredAnnualIncome - annualFromPot);

    // Years of income available at 4% drawdown
    var yearsOfIncomeAvailable;
    if (desiredAnnualIncome <= 0) {
      yearsOfIncomeAvailable = Infinity;
    } else {
      yearsOfIncomeAvailable = projectedPot / desiredAnnualIncome;
    }

    // How much extra per month to close the gap (simplified: assumes same return rate, 30 years saving period)
    var monthlyExtraSavingNeeded = 0;
    if (annualShortfall > 0) {
      var additionalPotNeeded = annualShortfall / (expectedReturnInRetirement / 100 || 0.04);
      var r = expectedReturnInRetirement / 100 / 12;
      var n = 30 * 12;
      if (r > 0) {
        monthlyExtraSavingNeeded = additionalPotNeeded * r / (Math.pow(1 + r, n) - 1);
      } else {
        monthlyExtraSavingNeeded = additionalPotNeeded / n;
      }
    }

    return {
      annualShortfall: annualShortfall,
      monthlyExtraSavingNeeded: monthlyExtraSavingNeeded,
      yearsOfIncomeAvailable: yearsOfIncomeAvailable,
    };
  },
};
