// ============================================================
// APP CONTROLLER — Wizard Navigation, State, UI Updates
// ============================================================

const App = {
  currentStep: 1,
  totalSteps: 4,
  comparisonDeals: [],
  results: [],

  // Broker mode state
  brokerMode: false,
  brokerSession: null,
  brokerToken: null,
  brokerHighlights: {},
  brokerResults: [],
  apiBase: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : window.location.origin,

  // ----------------------------------------------------------
  // User profile state
  // ----------------------------------------------------------
  userProfile: {
    propertyValue: 300000,
    deposit: 60000,
    purchaseType: "firstTime",
    propertyType: "semiDetached",
    leasehold: false,
    grossIncome: 55000,
    jointApplication: false,
    secondIncome: 0,
    employmentStatus: "employed",
    monthlyOutgoings: 800,
    creditProfile: "good",
    age: 35,
    termYears: 25,
    priorities: ["lowestMonthly"],
    overpaymentPlans: false,
    overpaymentAmount: 0,
    movingWithin5Years: false,
    riskTolerance: 30,
    savingsAmount: 0,
  },

  // ----------------------------------------------------------
  // Initialise the app
  // ----------------------------------------------------------
  init() {
    this.bindEvents();
    this.bindBrokerEvents();
    this.updateProgress();
    this.updateLTVDisplay();
    this.updateDepositPercentage();
    this.showStep(1);
    this.renderLearnPanel();
  },

  // ----------------------------------------------------------
  // Bind all event listeners
  // ----------------------------------------------------------
  bindEvents() {
    // Navigation buttons
    document.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.nav;
        if (action === "next") this.nextStep();
        else if (action === "prev") this.prevStep();
        else if (action === "results") this.showResults();
      });
    });

    // Property value
    const pvInput = document.getElementById("propertyValue");
    if (pvInput) {
      pvInput.addEventListener("input", (e) => {
        this.userProfile.propertyValue = this.parseCurrency(e.target.value);
        this.updateLTVDisplay();
        this.updateDepositPercentage();
      });
    }

    // Deposit
    const depInput = document.getElementById("deposit");
    if (depInput) {
      depInput.addEventListener("input", (e) => {
        this.userProfile.deposit = this.parseCurrency(e.target.value);
        this.updateLTVDisplay();
        this.updateDepositPercentage();
      });
    }

    // Deposit slider
    const depSlider = document.getElementById("depositSlider");
    if (depSlider) {
      depSlider.addEventListener("input", (e) => {
        const pct = parseInt(e.target.value);
        this.userProfile.deposit = Math.round(
          (pct / 100) * this.userProfile.propertyValue
        );
        document.getElementById("deposit").value =
          this.userProfile.deposit.toLocaleString();
        document.getElementById("depositPctLabel").textContent = pct + "%";
        this.updateLTVDisplay();
      });
    }

    // Purchase type
    const ptSelect = document.getElementById("purchaseType");
    if (ptSelect) {
      ptSelect.addEventListener("change", (e) => {
        this.userProfile.purchaseType = e.target.value;
        this.updateStampDutyPreview();
      });
    }

    // Property type
    const propType = document.getElementById("propertyType");
    if (propType) {
      propType.addEventListener("change", (e) => {
        this.userProfile.propertyType = e.target.value;
      });
    }

    // Leasehold toggle
    const leaseholdToggle = document.getElementById("leasehold");
    if (leaseholdToggle) {
      leaseholdToggle.addEventListener("change", (e) => {
        this.userProfile.leasehold = e.target.checked;
      });
    }

    // Income
    const incomeInput = document.getElementById("grossIncome");
    if (incomeInput) {
      incomeInput.addEventListener("input", (e) => {
        this.userProfile.grossIncome = this.parseCurrency(e.target.value);
      });
    }

    // Joint application toggle
    const jointToggle = document.getElementById("jointApplication");
    if (jointToggle) {
      jointToggle.addEventListener("change", (e) => {
        this.userProfile.jointApplication = e.target.checked;
        const jointSection = document.getElementById("jointSection");
        if (jointSection) {
          jointSection.classList.toggle("hidden", !e.target.checked);
        }
      });
    }

    // Second income
    const secondIncome = document.getElementById("secondIncome");
    if (secondIncome) {
      secondIncome.addEventListener("input", (e) => {
        this.userProfile.secondIncome = this.parseCurrency(e.target.value);
      });
    }

    // Employment status
    const empStatus = document.getElementById("employmentStatus");
    if (empStatus) {
      empStatus.addEventListener("change", (e) => {
        this.userProfile.employmentStatus = e.target.value;
        const selfEmpNote = document.getElementById("selfEmployedNote");
        if (selfEmpNote) {
          selfEmpNote.classList.toggle(
            "hidden",
            e.target.value !== "selfEmployed"
          );
        }
      });
    }

    // Monthly outgoings
    const outgoings = document.getElementById("monthlyOutgoings");
    if (outgoings) {
      outgoings.addEventListener("input", (e) => {
        this.userProfile.monthlyOutgoings = this.parseCurrency(e.target.value);
      });
    }

    // Credit profile
    const creditSelect = document.getElementById("creditProfile");
    if (creditSelect) {
      creditSelect.addEventListener("change", (e) => {
        this.userProfile.creditProfile = e.target.value;
      });
    }

    // Age
    const ageInput = document.getElementById("age");
    if (ageInput) {
      ageInput.addEventListener("input", (e) => {
        this.userProfile.age = parseInt(e.target.value) || 30;
        this.updateMaxTerm();
      });
    }

    // Term slider
    const termSlider = document.getElementById("termSlider");
    if (termSlider) {
      termSlider.addEventListener("input", (e) => {
        this.userProfile.termYears = parseInt(e.target.value);
        document.getElementById("termLabel").textContent =
          e.target.value + " years";
      });
    }

    // Priority chips
    document.querySelectorAll(".priority-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("selected");
        this.updatePriorities();
      });
    });

    // Overpayment toggle
    const overpayToggle = document.getElementById("overpaymentPlans");
    if (overpayToggle) {
      overpayToggle.addEventListener("change", (e) => {
        this.userProfile.overpaymentPlans = e.target.checked;
        const overpaySection = document.getElementById("overpaySection");
        if (overpaySection)
          overpaySection.classList.toggle("hidden", !e.target.checked);
      });
    }

    // Overpayment amount
    const overpayAmount = document.getElementById("overpaymentAmount");
    if (overpayAmount) {
      overpayAmount.addEventListener("input", (e) => {
        this.userProfile.overpaymentAmount = this.parseCurrency(e.target.value);
      });
    }

    // Moving within 5 years
    const movingToggle = document.getElementById("movingWithin5Years");
    if (movingToggle) {
      movingToggle.addEventListener("change", (e) => {
        this.userProfile.movingWithin5Years = e.target.checked;
      });
    }

    // Risk tolerance slider
    const riskSlider = document.getElementById("riskTolerance");
    if (riskSlider) {
      riskSlider.addEventListener("input", (e) => {
        this.userProfile.riskTolerance = parseInt(e.target.value);
        this.updateRiskLabel();
      });
    }

    // Savings amount
    const savingsInput = document.getElementById("savingsAmount");
    if (savingsInput) {
      savingsInput.addEventListener("input", (e) => {
        this.userProfile.savingsAmount = this.parseCurrency(e.target.value);
      });
    }

    // Comparison clear
    const clearCompare = document.getElementById("clearComparison");
    if (clearCompare) {
      clearCompare.addEventListener("click", () => this.clearComparison());
    }

    // Back to results from comparison
    const backToResults = document.getElementById("backToResults");
    if (backToResults) {
      backToResults.addEventListener("click", () => {
        document.getElementById("comparisonView").classList.add("hidden");
        document.getElementById("resultsGrid").classList.remove("hidden");
      });
    }

    // Sort controls
    document.querySelectorAll("[data-sort]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-sort]")
          .forEach((b) => b.classList.remove("bg-blue-600", "text-white"));
        btn.classList.add("bg-blue-600", "text-white");
        this.sortResults(btn.dataset.sort);
      });
    });

    // Learn panel toggles
    document.addEventListener("click", (e) => {
      if (e.target.closest(".learn-toggle")) {
        const panel = e.target.closest(".learn-item").querySelector(".learn-panel");
        const arrow = e.target.closest(".learn-toggle").querySelector(".learn-arrow");
        panel.classList.toggle("open");
        arrow.classList.toggle("rotate-180");
      }
    });
  },

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (!this.validateStep(this.currentStep)) return;
      this.currentStep++;
      this.showStep(this.currentStep);
      this.updateProgress();
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgress();
    }
  },

  showStep(step) {
    document.querySelectorAll(".wizard-step").forEach((el) => {
      el.classList.remove("active");
    });
    const target = document.getElementById("step-" + step);
    if (target) target.classList.add("active");

    // Update nav button visibility
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const resultsBtn = document.getElementById("findDealsBtn");

    if (prevBtn) prevBtn.classList.toggle("invisible", step === 1);
    if (nextBtn) nextBtn.classList.toggle("hidden", step === this.totalSteps);
    if (resultsBtn) resultsBtn.classList.toggle("hidden", step !== this.totalSteps);

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  showResults() {
    if (!this.validateStep(this.currentStep)) return;
    this.currentStep = 5;

    // Combine incomes if joint
    const totalIncome = this.userProfile.jointApplication
      ? this.userProfile.grossIncome + this.userProfile.secondIncome
      : this.userProfile.grossIncome;

    const profile = { ...this.userProfile, grossIncome: totalIncome };
    this.results = MortgageCalc.filterAndRankDeals(profile);

    document.querySelectorAll(".wizard-step").forEach((el) => el.classList.remove("active"));
    document.getElementById("step-results").classList.add("active");
    document.getElementById("prevBtn").classList.add("invisible");
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("findDealsBtn").classList.add("hidden");

    // Update progress to show all completed
    document.querySelectorAll(".progress-step").forEach((s) => s.classList.add("completed"));
    document.querySelectorAll(".progress-line").forEach((l) => l.classList.add("completed"));

    this.renderResults();
    this.renderSummaryPanel();
  },

  // ----------------------------------------------------------
  // Progress bar
  // ----------------------------------------------------------
  updateProgress() {
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepEl = document.getElementById("progress-step-" + i);
      if (!stepEl) continue;
      stepEl.classList.remove("completed", "active");
      if (i < this.currentStep) stepEl.classList.add("completed");
      else if (i === this.currentStep) stepEl.classList.add("active");

      // Lines
      if (i < this.totalSteps) {
        const line = document.getElementById("progress-line-" + i);
        if (line) {
          line.classList.toggle("completed", i < this.currentStep);
        }
      }
    }
  },

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------
  validateStep(step) {
    if (step === 1) {
      if (this.userProfile.propertyValue < 50000) {
        this.showError("propertyValue", "Please enter a property value of at least £50,000");
        return false;
      }
      if (this.userProfile.deposit < 0) {
        this.showError("deposit", "Deposit must be a positive number");
        return false;
      }
      const ltv = MortgageCalc.calculateLTV(
        this.userProfile.propertyValue,
        this.userProfile.deposit
      );
      if (ltv > 95) {
        this.showError("deposit", "Most lenders require at least a 5% deposit (95% LTV)");
        return false;
      }
    }
    if (step === 2) {
      if (this.userProfile.grossIncome < 10000) {
        this.showError("grossIncome", "Please enter your annual income");
        return false;
      }
    }
    this.clearErrors();
    return true;
  },

  showError(fieldId, message) {
    this.clearErrors();
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add("border-red-500", "ring-red-200");
      const error = document.createElement("p");
      error.className = "text-red-500 text-sm mt-1 error-message";
      error.textContent = message;
      field.parentElement.appendChild(error);
    }
  },

  clearErrors() {
    document
      .querySelectorAll(".error-message")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".border-red-500")
      .forEach((el) => el.classList.remove("border-red-500", "ring-red-200"));
  },

  // ----------------------------------------------------------
  // UI Updates
  // ----------------------------------------------------------
  updateLTVDisplay() {
    const ltv = MortgageCalc.calculateLTV(
      this.userProfile.propertyValue,
      this.userProfile.deposit
    );
    const band = MortgageCalc.ltvBand(ltv);
    const ltvEl = document.getElementById("ltvDisplay");
    if (ltvEl) {
      ltvEl.textContent = ltv.toFixed(1) + "% LTV";
      ltvEl.className =
        "inline-block px-3 py-1 rounded-full text-sm font-semibold " + band.css;
    }
    const ltvLabel = document.getElementById("ltvLabel");
    if (ltvLabel) ltvLabel.textContent = band.label;

    const loanAmountEl = document.getElementById("loanAmountDisplay");
    if (loanAmountEl) {
      const loan = this.userProfile.propertyValue - this.userProfile.deposit;
      loanAmountEl.textContent =
        "Borrowing " + MortgageCalc.formatCurrency(Math.max(0, loan));
    }

    this.updateStampDutyPreview();
  },

  updateDepositPercentage() {
    const pct =
      this.userProfile.propertyValue > 0
        ? (this.userProfile.deposit / this.userProfile.propertyValue) * 100
        : 0;
    const slider = document.getElementById("depositSlider");
    if (slider) slider.value = Math.round(pct);
    const label = document.getElementById("depositPctLabel");
    if (label) label.textContent = Math.round(pct) + "%";
  },

  updateStampDutyPreview() {
    const buyerType =
      this.userProfile.purchaseType === "firstTime"
        ? "firstTime"
        : this.userProfile.purchaseType === "buyToLet"
        ? "additional"
        : "standard";
    const sd = MortgageCalc.calculateStampDuty(
      this.userProfile.propertyValue,
      buyerType
    );
    const sdEl = document.getElementById("stampDutyPreview");
    if (sdEl) {
      sdEl.textContent =
        "Estimated stamp duty: " + MortgageCalc.formatCurrency(sd);
    }
  },

  updateMaxTerm() {
    const maxRetireAge = 70;
    const maxTerm = Math.min(40, maxRetireAge - this.userProfile.age);
    const slider = document.getElementById("termSlider");
    if (slider) {
      slider.max = Math.max(5, maxTerm);
      if (this.userProfile.termYears > maxTerm) {
        this.userProfile.termYears = maxTerm;
        slider.value = maxTerm;
        document.getElementById("termLabel").textContent = maxTerm + " years";
      }
    }
  },

  updatePriorities() {
    const selected = [];
    document.querySelectorAll(".priority-chip.selected").forEach((chip) => {
      selected.push(chip.dataset.priority);
    });
    this.userProfile.priorities = selected.length > 0 ? selected : ["lowestMonthly"];
  },

  updateRiskLabel() {
    const val = this.userProfile.riskTolerance;
    const label = document.getElementById("riskLabel");
    if (!label) return;
    if (val <= 25) label.textContent = "I want total certainty";
    else if (val <= 50) label.textContent = "I prefer stability with some flexibility";
    else if (val <= 75) label.textContent = "I'm comfortable with some rate movement";
    else label.textContent = "I'm happy to ride the market";
  },

  // ----------------------------------------------------------
  // Render results
  // ----------------------------------------------------------
  renderResults() {
    const container = document.getElementById("resultsContainer");
    if (!container) return;

    if (this.results.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16">
          <div class="text-6xl mb-4">😕</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No matching deals found</h3>
          <p class="text-gray-500">Try adjusting your deposit or property value to find eligible deals.</p>
          <button onclick="App.goBackToWizard()" class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Adjust Details
          </button>
        </div>`;
      return;
    }

    let html = "";
    this.results.forEach((result, index) => {
      const { deal, typeInfo, breakdown, verdict, ltv, totalFees } = result;
      const isRecommended = index === 0;
      const isCompared = this.comparisonDeals.some((d) => d.deal.id === deal.id);

      html += `
      <div class="deal-card bg-white rounded-xl border ${isRecommended ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"} p-6 relative">
        ${
          isRecommended
            ? `<div class="recommended-badge absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                BEST MATCH
              </div>`
            : ""
        }

        <div class="flex justify-between items-start mb-4 ${isRecommended ? "mt-2" : ""}">
          <div>
            <h3 class="text-lg font-bold text-gray-900">${deal.lender}</h3>
            <p class="text-sm text-gray-500">${deal.dealName}</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">${deal.rate}%</div>
            <div class="text-xs text-gray-500">${typeInfo.name}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">Monthly payment</div>
            <div class="text-lg font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.monthlyDeal)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">Deal period cost</div>
            <div class="text-lg font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.totalDealPeriod)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">Total fees</div>
            <div class="text-lg font-bold ${totalFees > 0 ? "text-amber-600" : "text-green-600"}">
              ${totalFees > 0 ? MortgageCalc.formatCurrency(totalFees) : "None"}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">Total interest</div>
            <div class="text-lg font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.totalInterest)}</div>
          </div>
        </div>

        <!-- Features -->
        <div class="flex flex-wrap gap-2 mb-4">
          ${deal.features
            .map(
              (f) =>
                `<span class="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">${f}</span>`
            )
            .join("")}
        </div>

        <!-- Plain-English verdict -->
        <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
          <div class="text-xs font-semibold text-amber-700 mb-1">In plain English</div>
          <p class="text-sm text-amber-800">${verdict}</p>
        </div>

        <!-- What happens when deal ends -->
        <div class="bg-gray-50 rounded-lg p-3 mb-4">
          <div class="text-xs font-semibold text-gray-600 mb-1">What happens when this deal ends?</div>
          <p class="text-sm text-gray-700">
            You'll move to ${deal.lender}'s SVR of ${deal.svr}%. Your monthly payment would rise to approximately
            <strong>${MortgageCalc.formatCurrency(breakdown.monthlySVR)}</strong>
            — that's <strong>${MortgageCalc.formatCurrency(breakdown.monthlySVR - breakdown.monthlyDeal)} more per month</strong>.
            Start looking for a new deal 6 months before this one ends.
          </p>
        </div>

        <!-- Explain mortgage type -->
        <details class="mb-4">
          <summary class="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700">
            What is a ${typeInfo.name}? ▾
          </summary>
          <div class="mt-2 bg-blue-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
            <p><strong>What this means:</strong> ${typeInfo.explanation.whatItMeans}</p>
            <p><strong>The upside:</strong> ${typeInfo.explanation.upside}</p>
            <p><strong>The downside:</strong> ${typeInfo.explanation.downside}</p>
            <p><strong>Best for:</strong> ${typeInfo.explanation.bestFor}</p>
          </div>
        </details>

        <!-- Actions -->
        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
          <button onclick="App.toggleComparison('${deal.id}')"
            class="compare-check px-4 py-2 text-sm rounded-lg border border-gray-300 hover:border-blue-500 ${isCompared ? "selected" : ""}"
            id="compare-btn-${deal.id}">
            ${isCompared ? "✓ Comparing" : "Compare"}
          </button>
          <button onclick="App.showDealDetail('${deal.id}')"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Full Details
          </button>
        </div>
      </div>`;
    });

    container.innerHTML = html;
    this.updateComparisonBar();
  },

  // ----------------------------------------------------------
  // Summary panel
  // ----------------------------------------------------------
  renderSummaryPanel() {
    const el = document.getElementById("summaryPanel");
    if (!el) return;

    const pv = this.userProfile.propertyValue;
    const dep = this.userProfile.deposit;
    const loan = pv - dep;
    const ltv = MortgageCalc.calculateLTV(pv, dep);
    const band = MortgageCalc.ltvBand(ltv);

    const buyerType =
      this.userProfile.purchaseType === "firstTime"
        ? "firstTime"
        : this.userProfile.purchaseType === "buyToLet"
        ? "additional"
        : "standard";
    const sd = MortgageCalc.calculateStampDuty(pv, buyerType);

    const totalIncome = this.userProfile.jointApplication
      ? this.userProfile.grossIncome + this.userProfile.secondIncome
      : this.userProfile.grossIncome;
    const affordability = MortgageCalc.affordabilityCheck(
      totalIncome,
      this.userProfile.monthlyOutgoings,
      loan,
      this.userProfile.termYears
    );

    el.innerHTML = `
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Your Mortgage Summary</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div class="text-xs text-gray-500">Property Value</div>
            <div class="text-lg font-bold">${MortgageCalc.formatCurrency(pv)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Loan Amount</div>
            <div class="text-lg font-bold">${MortgageCalc.formatCurrency(loan)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">LTV</div>
            <div class="text-lg font-bold"><span class="inline-block px-2 py-0.5 rounded-full text-sm ${band.css}">${ltv.toFixed(1)}%</span></div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Term</div>
            <div class="text-lg font-bold">${this.userProfile.termYears} years</div>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div class="text-xs text-gray-500">Deposit</div>
            <div class="text-lg font-bold text-green-600">${MortgageCalc.formatCurrency(dep)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Stamp Duty</div>
            <div class="text-lg font-bold ${sd > 0 ? "text-amber-600" : "text-green-600"}">${sd > 0 ? MortgageCalc.formatCurrency(sd) : "£0"}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Income</div>
            <div class="text-lg font-bold">${MortgageCalc.formatCurrency(totalIncome)}/yr</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Affordability</div>
            <div class="text-lg font-bold ${affordability.affordableAtStress ? "text-green-600" : "text-red-600"}">
              ${affordability.affordableAtStress ? "Passes" : "Stretched"}
            </div>
          </div>
        </div>

        <!-- Stress test -->
        <div class="bg-slate-50 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Stress Test: What if rates rise?</h4>
          <div class="grid grid-cols-3 gap-3 text-center">
            ${MortgageCalc.stressTest(loan, this.userProfile.termYears)
              .map(
                (s) => `
                <div class="bg-white rounded-lg p-3 border border-gray-100">
                  <div class="text-xs text-gray-500 mb-1">Rate at ${s.stressedRate.toFixed(1)}%</div>
                  <div class="text-base font-bold text-gray-900">${MortgageCalc.formatCurrency(s.monthlyPayment)}/mo</div>
                  <div class="text-xs text-gray-400">+${s.rateIncrease}% increase</div>
                </div>`
              )
              .join("")}
          </div>
          <p class="text-xs text-gray-500 mt-2">These figures show what your monthly payment would be if interest rates rose by 1%, 2%, or 3% from a typical base rate.</p>
        </div>

        <button onclick="App.goBackToWizard()" class="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← Edit your details
        </button>
      </div>

      <!-- Deals found count -->
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-gray-500">${this.results.length} deals found, ranked by your priorities</p>
        <div class="flex gap-2">
          <button data-sort="recommended" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-blue-600 text-white" onclick="App.sortResults('recommended')">Best Match</button>
          <button data-sort="rate" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:border-blue-500" onclick="App.sortResults('rate')">Lowest Rate</button>
          <button data-sort="monthly" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:border-blue-500" onclick="App.sortResults('monthly')">Lowest Payment</button>
          <button data-sort="total" class="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:border-blue-500" onclick="App.sortResults('total')">Lowest Total</button>
        </div>
      </div>`;
  },

  // ----------------------------------------------------------
  // Sort results
  // ----------------------------------------------------------
  sortResults(by) {
    // Update sort button styles
    document.querySelectorAll("[data-sort], [onclick*='sortResults']").forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white");
    });
    event.target.classList.add("bg-blue-600", "text-white");

    switch (by) {
      case "rate":
        this.results.sort((a, b) => a.deal.rate - b.deal.rate);
        break;
      case "monthly":
        this.results.sort((a, b) => a.breakdown.monthlyDeal - b.breakdown.monthlyDeal);
        break;
      case "total":
        this.results.sort((a, b) => a.breakdown.totalCost - b.breakdown.totalCost);
        break;
      default:
        this.results.sort((a, b) => b.score - a.score);
    }
    this.renderResults();
  },

  // ----------------------------------------------------------
  // Comparison
  // ----------------------------------------------------------
  toggleComparison(dealId) {
    const idx = this.comparisonDeals.findIndex((d) => d.deal.id === dealId);
    if (idx >= 0) {
      this.comparisonDeals.splice(idx, 1);
    } else if (this.comparisonDeals.length < 3) {
      const result = this.results.find((r) => r.deal.id === dealId);
      if (result) this.comparisonDeals.push(result);
    } else {
      alert("You can compare up to 3 deals at a time. Remove one first.");
      return;
    }
    this.renderResults();
    this.updateComparisonBar();
  },

  updateComparisonBar() {
    const bar = document.getElementById("comparisonBar");
    if (!bar) return;

    if (this.comparisonDeals.length >= 2) {
      bar.classList.remove("hidden");
      const count = document.getElementById("comparisonCount");
      if (count)
        count.textContent = this.comparisonDeals.length + " deals selected";
    } else {
      bar.classList.add("hidden");
    }
  },

  showComparison() {
    if (this.comparisonDeals.length < 2) return;

    document.getElementById("resultsGrid").classList.add("hidden");
    const view = document.getElementById("comparisonView");
    view.classList.remove("hidden");

    const cols = this.comparisonDeals.length;
    let html = `
      <div class="grid grid-cols-${cols} gap-4">
        ${this.comparisonDeals
          .map(
            (r) => `
          <div class="text-center">
            <div class="text-lg font-bold text-gray-900">${r.deal.lender}</div>
            <div class="text-sm text-gray-500">${r.deal.dealName}</div>
            <div class="text-3xl font-bold text-blue-600 my-2">${r.deal.rate}%</div>
            <div class="text-xs text-gray-500">${r.typeInfo.name}</div>
          </div>`
          )
          .join("")}
      </div>

      <div class="mt-6 border-t border-gray-200">
        ${this.comparisonRow("Monthly Payment", this.comparisonDeals.map((r) => MortgageCalc.formatCurrency(r.breakdown.monthlyDeal)))}
        ${this.comparisonRow("Deal Period Cost", this.comparisonDeals.map((r) => MortgageCalc.formatCurrency(r.breakdown.totalDealPeriod)))}
        ${this.comparisonRow("Total Interest", this.comparisonDeals.map((r) => MortgageCalc.formatCurrency(r.breakdown.totalInterest)))}
        ${this.comparisonRow("Total Cost (Lifetime)", this.comparisonDeals.map((r) => MortgageCalc.formatCurrency(r.breakdown.totalCost)))}
        ${this.comparisonRow("Fees", this.comparisonDeals.map((r) => r.totalFees > 0 ? MortgageCalc.formatCurrency(r.totalFees) : "None"))}
        ${this.comparisonRow("Overpayment Limit", this.comparisonDeals.map((r) => r.deal.overpaymentAllowance >= 100 ? "Unlimited" : r.deal.overpaymentAllowance + "% p.a."))}
        ${this.comparisonRow("ERCs (Year 1)", this.comparisonDeals.map((r) => r.deal.ercYear1 > 0 ? r.deal.ercYear1 + "%" : "None"))}
        ${this.comparisonRow("Portable", this.comparisonDeals.map((r) => r.deal.portable ? "Yes" : "No"))}
        ${this.comparisonRow("SVR After Deal", this.comparisonDeals.map((r) => r.deal.svr + "%"))}
        ${this.comparisonRow("Payment After Deal", this.comparisonDeals.map((r) => MortgageCalc.formatCurrency(r.breakdown.monthlySVR)))}
      </div>`;

    document.getElementById("comparisonContent").innerHTML = html;

    // Render comparison chart
    this.renderComparisonChart();
  },

  comparisonRow(label, values) {
    return `
      <div class="grid grid-cols-${values.length + 1} gap-4 py-3 border-b border-gray-100">
        <div class="text-sm font-medium text-gray-600">${label}</div>
        ${values.map((v) => `<div class="text-sm font-semibold text-gray-900 text-center">${v}</div>`).join("")}
      </div>`;
  },

  clearComparison() {
    this.comparisonDeals = [];
    this.renderResults();
    this.updateComparisonBar();
    document.getElementById("comparisonView").classList.add("hidden");
    document.getElementById("resultsGrid").classList.remove("hidden");
  },

  // ----------------------------------------------------------
  // Deal detail modal
  // ----------------------------------------------------------
  showDealDetail(dealId) {
    const result = this.results.find((r) => r.deal.id === dealId);
    if (!result) return;

    const { deal, typeInfo, breakdown, totalFees, loanAmount } = result;

    // Overpayment impact
    const overpayImpact = MortgageCalc.overpaymentImpact(
      loanAmount,
      deal.rate,
      this.userProfile.termYears,
      200
    );

    const modal = document.getElementById("dealModal");
    const content = document.getElementById("dealModalContent");

    content.innerHTML = `
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">${deal.lender}</h2>
          <p class="text-gray-500">${deal.dealName}</p>
        </div>
        <button onclick="App.closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-blue-600">${deal.rate}%</div>
          <div class="text-xs text-blue-600">${typeInfo.name}</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600">${MortgageCalc.formatCurrency(breakdown.monthlyDeal)}</div>
          <div class="text-xs text-green-600">Monthly payment</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-gray-700">${MortgageCalc.formatCurrency(breakdown.totalCost)}</div>
          <div class="text-xs text-gray-500">Total cost over term</div>
        </div>
      </div>

      <!-- Full cost breakdown -->
      <div class="mb-6">
        <h3 class="text-md font-bold text-gray-800 mb-3">Full Cost Breakdown</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm"><span class="text-gray-600">Monthly payment during deal</span><span class="font-medium">${MortgageCalc.formatCurrency(breakdown.monthlyDeal)}/mo</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Total paid during deal period (${deal.fixedPeriod || 2} yrs)</span><span class="font-medium">${MortgageCalc.formatCurrency(breakdown.totalDealPeriod)}</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Monthly payment after deal (SVR ${deal.svr}%)</span><span class="font-medium text-amber-600">${MortgageCalc.formatCurrency(breakdown.monthlySVR)}/mo</span></div>
          <div class="flex justify-between text-sm"><span class="text-gray-600">Arrangement fee</span><span class="font-medium">${deal.arrangementFee > 0 ? MortgageCalc.formatCurrency(deal.arrangementFee) : "None"}</span></div>
          <div class="flex justify-between text-sm border-t pt-2"><span class="text-gray-800 font-semibold">Total interest over full term</span><span class="font-bold text-lg">${MortgageCalc.formatCurrency(breakdown.totalInterest)}</span></div>
        </div>
      </div>

      <!-- What is this type -->
      <div class="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 class="text-md font-bold text-blue-800 mb-2">Understanding: ${typeInfo.name}</h3>
        <div class="text-sm text-blue-900 space-y-2">
          <p><strong>What this means:</strong> ${typeInfo.explanation.whatItMeans}</p>
          <p><strong>The upside:</strong> ${typeInfo.explanation.upside}</p>
          <p><strong>The downside:</strong> ${typeInfo.explanation.downside}</p>
          <p><strong>Best for:</strong> ${typeInfo.explanation.bestFor}</p>
        </div>
      </div>

      <!-- Early repayment charges -->
      <div class="mb-6">
        <h3 class="text-md font-bold text-gray-800 mb-3">Early Repayment Charges</h3>
        <p class="text-sm text-gray-600 mb-2">If you need to leave this deal early (e.g. sell your home or switch lender), you'll pay:</p>
        <div class="grid grid-cols-5 gap-2 text-center">
          ${[1, 2, 3, 4, 5]
            .map((yr) => {
              const erc = deal["ercYear" + yr] || 0;
              const ercAmount = (loanAmount * erc) / 100;
              return `
              <div class="bg-gray-50 rounded-lg p-2">
                <div class="text-xs text-gray-500">Year ${yr}</div>
                <div class="text-sm font-bold ${erc > 0 ? "text-red-600" : "text-green-600"}">${erc > 0 ? erc + "%" : "Free"}</div>
                ${erc > 0 ? `<div class="text-xs text-gray-400">${MortgageCalc.formatCurrency(ercAmount)}</div>` : ""}
              </div>`;
            })
            .join("")}
        </div>
      </div>

      <!-- Overpayment impact -->
      <div class="bg-green-50 rounded-lg p-4 mb-6">
        <h3 class="text-md font-bold text-green-800 mb-2">Power of Overpaying (£200/month extra)</h3>
        <div class="grid grid-cols-2 gap-4 text-sm text-green-900">
          <div>
            <div class="text-xs text-green-600">Time saved</div>
            <div class="font-bold text-lg">${overpayImpact.yearsSaved.toFixed(1)} years earlier</div>
          </div>
          <div>
            <div class="text-xs text-green-600">Interest saved</div>
            <div class="font-bold text-lg">${MortgageCalc.formatCurrency(overpayImpact.interestSaved)}</div>
          </div>
        </div>
        <p class="text-xs text-green-700 mt-2">Based on overpaying £200/month within the ${deal.overpaymentAllowance}% annual limit.</p>
      </div>

      <!-- Features -->
      <div class="mb-6">
        <h3 class="text-md font-bold text-gray-800 mb-2">Deal Features</h3>
        <ul class="space-y-1">
          ${deal.features.map((f) => `<li class="text-sm text-gray-700 flex items-center gap-2"><span class="text-blue-500">✓</span> ${f}</li>`).join("")}
        </ul>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.querySelector(".modal-backdrop").addEventListener("click", () => this.closeModal());
  },

  closeModal() {
    document.getElementById("dealModal").classList.add("hidden");
  },

  // ----------------------------------------------------------
  // Comparison chart
  // ----------------------------------------------------------
  renderComparisonChart() {
    const canvas = document.getElementById("comparisonChart");
    if (!canvas || this.comparisonDeals.length < 2) return;

    // Destroy existing chart
    if (this.chartInstance) this.chartInstance.destroy();

    const labels = this.comparisonDeals.map((r) => r.deal.lender + " " + r.deal.dealName);
    const monthlyData = this.comparisonDeals.map((r) => Math.round(r.breakdown.monthlyDeal));
    const totalInterestData = this.comparisonDeals.map((r) => Math.round(r.breakdown.totalInterest));
    const feesData = this.comparisonDeals.map((r) => r.totalFees);

    this.chartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Monthly Payment (£)",
            data: monthlyData,
            backgroundColor: "rgba(37, 99, 235, 0.7)",
            borderRadius: 6,
          },
          {
            label: "Fees (£)",
            data: feesData,
            backgroundColor: "rgba(245, 158, 11, 0.7)",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => "£" + val.toLocaleString(),
            },
          },
        },
      },
    });
  },

  // ----------------------------------------------------------
  // Learn panel
  // ----------------------------------------------------------
  renderLearnPanel() {
    const container = document.getElementById("learnPanelContent");
    if (!container) return;

    container.innerHTML = EDUCATION_TOPICS.map(
      (topic) => `
      <div class="learn-item border-b border-gray-100 last:border-0">
        <button class="learn-toggle w-full flex items-center justify-between py-4 px-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
          <span class="flex items-center gap-3">
            <span class="text-xl">${topic.icon}</span>
            <span class="text-sm font-medium text-gray-800">${topic.title}</span>
          </span>
          <span class="learn-arrow text-gray-400 transition-transform duration-300">▼</span>
        </button>
        <div class="learn-panel px-2">
          <div class="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">${topic.content}</div>
        </div>
      </div>`
    ).join("");
  },

  // ----------------------------------------------------------
  // Go back to wizard from results
  // ----------------------------------------------------------
  goBackToWizard() {
    this.currentStep = 1;
    document.getElementById("step-results").classList.remove("active");
    document.getElementById("prevBtn").classList.remove("invisible");
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("findDealsBtn").classList.remove("hidden");
    this.showStep(1);
    this.updateProgress();
  },

  // ----------------------------------------------------------
  // Broker events
  // ----------------------------------------------------------
  bindBrokerEvents() {
    const loginLink = document.getElementById('broker-login-link');
    if (loginLink) loginLink.addEventListener('click', (e) => { e.preventDefault(); this.showBrokerLogin(); });

    const backToConsumer = document.getElementById('broker-back-to-consumer');
    if (backToConsumer) backToConsumer.addEventListener('click', (e) => { e.preventDefault(); this.hideBrokerLogin(); });

    const loginForm = document.getElementById('broker-login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.brokerLogin(); });

    const logoutBtn = document.getElementById('broker-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.brokerLogout());

    const calcBtn = document.getElementById('broker-calculate-btn');
    if (calcBtn) calcBtn.addEventListener('click', () => this.brokerCalculateDeals());

    const saveBtn = document.getElementById('broker-save-draft');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveBrokerDraft());

    const publishBtn = document.getElementById('broker-publish-btn');
    if (publishBtn) publishBtn.addEventListener('click', () => this.publishBrokerSession());

    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => this.copyShareLink());

    // Broker term slider label
    const bTermSlider = document.getElementById('broker-termSlider');
    if (bTermSlider) {
      bTermSlider.addEventListener('input', (e) => {
        const label = document.getElementById('broker-termLabel');
        if (label) label.textContent = e.target.value + ' years';
      });
    }

    // Broker priority chips
    document.querySelectorAll('.broker-priority-chip').forEach((chip) => {
      chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });

    // Event delegation for highlight toggles and comment inputs in broker results
    const brokerResults = document.getElementById('broker-results');
    if (brokerResults) {
      brokerResults.addEventListener('click', (e) => {
        const btn = e.target.closest('.highlight-btn');
        if (btn) {
          const dealId = btn.dataset.dealId;
          const type = btn.dataset.highlightType;
          this.toggleDealHighlight(dealId, type);
        }
      });
      brokerResults.addEventListener('input', (e) => {
        if (e.target.classList.contains('broker-comment-input')) {
          const dealId = e.target.dataset.dealId;
          this.updateHighlightComment(dealId, e.target.value);
        }
      });
    }
  },

  // ----------------------------------------------------------
  // Broker login / logout
  // ----------------------------------------------------------
  showBrokerLogin() {
    // Hide wizard, progress, results, nav
    document.querySelectorAll('.wizard-step').forEach((el) => el.classList.remove('active'));
    const progressBar = document.querySelector('.max-w-3xl.mx-auto.px-4.py-6');
    if (progressBar) progressBar.style.display = 'none';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    document.getElementById('broker-login').style.display = 'block';
    document.getElementById('broker-dashboard').style.display = 'none';
  },

  hideBrokerLogin() {
    document.getElementById('broker-login').style.display = 'none';
    const progressBar = document.querySelector('.max-w-3xl.mx-auto.px-4.py-6');
    if (progressBar) progressBar.style.display = '';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = '';
    this.showStep(this.currentStep);
    this.updateProgress();
  },

  async brokerLogin() {
    const email = document.getElementById('broker-email').value.trim();
    const password = document.getElementById('broker-password').value;
    const errorEl = document.getElementById('broker-login-error');
    errorEl.classList.add('hidden');

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password.';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch(this.apiBase + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Login failed.';
        errorEl.classList.remove('hidden');
        return;
      }

      // Check broker role
      if (!data.user || !data.user.role || !data.user.role.includes('broker')) {
        errorEl.textContent = 'This account does not have broker access.';
        errorEl.classList.remove('hidden');
        return;
      }

      this.brokerToken = data.token;
      this.showBrokerDashboard(data.user);
    } catch (err) {
      errorEl.textContent = 'Could not connect to server. Check your connection.';
      errorEl.classList.remove('hidden');
    }
  },

  showBrokerDashboard(user) {
    this.brokerMode = true;
    document.getElementById('broker-login').style.display = 'none';
    document.getElementById('broker-dashboard').style.display = 'block';
    document.querySelectorAll('.wizard-step').forEach((el) => el.classList.remove('active'));
    const progressBar = document.querySelector('.max-w-3xl.mx-auto.px-4.py-6');
    if (progressBar) progressBar.style.display = 'none';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.display = 'none';

    const nameEl = document.getElementById('broker-display-name');
    if (nameEl && user) nameEl.textContent = user.name || user.email || 'Broker';
  },

  brokerLogout() {
    this.brokerToken = null;
    this.brokerMode = false;
    this.brokerSession = null;
    this.brokerHighlights = {};
    this.brokerResults = [];

    document.getElementById('broker-dashboard').style.display = 'none';
    document.getElementById('broker-login').style.display = 'none';
    const progressBar = document.querySelector('.max-w-3xl.mx-auto.px-4.py-6');
    if (progressBar) progressBar.style.display = '';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = '';
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.display = '';

    this.currentStep = 1;
    this.showStep(1);
    this.updateProgress();
  },

  // ----------------------------------------------------------
  // Broker input collection & calculation
  // ----------------------------------------------------------
  collectBrokerInputs() {
    const parse = (id) => this.parseCurrency(document.getElementById(id)?.value || '0');
    const val = (id) => document.getElementById(id)?.value || '';
    const checked = (id) => document.getElementById(id)?.checked || false;

    const priorities = [];
    document.querySelectorAll('.broker-priority-chip.selected').forEach((chip) => {
      priorities.push(chip.dataset.brokerPriority);
    });

    return {
      propertyValue: parse('broker-propertyValue'),
      deposit: parse('broker-deposit'),
      purchaseType: val('broker-purchaseType'),
      propertyType: val('broker-propertyType'),
      leasehold: checked('broker-leasehold'),
      grossIncome: parse('broker-grossIncome'),
      jointApplication: checked('broker-jointApplication'),
      secondIncome: parse('broker-secondIncome'),
      employmentStatus: val('broker-employmentStatus'),
      monthlyOutgoings: parse('broker-monthlyOutgoings'),
      creditProfile: val('broker-creditProfile'),
      age: parseInt(document.getElementById('broker-age')?.value) || 35,
      savingsAmount: parse('broker-savingsAmount'),
      priorities: priorities.length > 0 ? priorities : ['lowestMonthly'],
      riskTolerance: parseInt(document.getElementById('broker-riskTolerance')?.value) || 30,
      overpaymentPlans: checked('broker-overpaymentPlans'),
      overpaymentAmount: parse('broker-overpaymentAmount'),
      movingWithin5Years: checked('broker-movingWithin5Years'),
      termYears: parseInt(document.getElementById('broker-termSlider')?.value) || 25,
    };
  },

  brokerCalculateDeals() {
    const profile = this.collectBrokerInputs();

    // Combine incomes if joint
    const totalIncome = profile.jointApplication
      ? profile.grossIncome + profile.secondIncome
      : profile.grossIncome;
    const adjustedProfile = { ...profile, grossIncome: totalIncome };

    this.brokerResults = MortgageCalc.filterAndRankDeals(adjustedProfile);
    this.brokerHighlights = {};
    this.renderBrokerResults();

    // Show the recommendation panel
    const recPanel = document.getElementById('broker-recommendation-panel');
    if (recPanel) recPanel.classList.remove('hidden');
  },

  // ----------------------------------------------------------
  // Render broker results
  // ----------------------------------------------------------
  renderBrokerResults() {
    const container = document.getElementById('broker-results');
    if (!container) return;

    if (this.brokerResults.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-5xl mb-3">😕</div>
          <h3 class="text-lg font-semibold text-gray-700 mb-1">No matching deals found</h3>
          <p class="text-gray-500 text-sm">Adjust the client details above and recalculate.</p>
        </div>`;
      return;
    }

    let html = `<h3 class="text-lg font-semibold text-gray-800 mb-3">${this.brokerResults.length} deals found</h3>`;

    this.brokerResults.forEach((result) => {
      const { deal, typeInfo, breakdown, verdict, totalFees } = result;
      const highlight = this.brokerHighlights[deal.id] || {};
      const currentType = highlight.type || '';
      const currentComment = highlight.comment || '';

      html += `
      <div class="broker-deal-card" data-deal-id="${deal.id}">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="text-base font-bold text-gray-900">${deal.lender}</h4>
            <p class="text-sm text-gray-500">${deal.dealName}</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold text-blue-600">${deal.rate}%</div>
            <div class="text-xs text-gray-500">${typeInfo.name}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div class="bg-gray-50 rounded-lg p-2.5">
            <div class="text-xs text-gray-500">Monthly</div>
            <div class="text-sm font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.monthlyDeal)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2.5">
            <div class="text-xs text-gray-500">Deal period</div>
            <div class="text-sm font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.totalDealPeriod)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2.5">
            <div class="text-xs text-gray-500">Fees</div>
            <div class="text-sm font-bold ${totalFees > 0 ? 'text-amber-600' : 'text-green-600'}">${totalFees > 0 ? MortgageCalc.formatCurrency(totalFees) : 'None'}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-2.5">
            <div class="text-xs text-gray-500">Total interest</div>
            <div class="text-sm font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.totalInterest)}</div>
          </div>
        </div>

        <div class="bg-amber-50 rounded-lg p-2.5 mb-3">
          <p class="text-sm text-amber-800">${verdict}</p>
        </div>

        <!-- Highlight toggles -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="highlight-toggle-group">
            <button class="highlight-btn ${currentType === 'recommend' ? 'active-recommend' : ''}"
              data-deal-id="${deal.id}" data-highlight-type="recommend">Recommend</button>
            <button class="highlight-btn ${currentType === 'alternative' ? 'active-alternative' : ''}"
              data-deal-id="${deal.id}" data-highlight-type="alternative">Alternative</button>
            <button class="highlight-btn ${currentType === 'avoid' ? 'active-avoid' : ''}"
              data-deal-id="${deal.id}" data-highlight-type="avoid">Avoid</button>
          </div>
        </div>
        <input type="text" class="broker-comment-input" data-deal-id="${deal.id}"
          placeholder="Add a note about this deal..." value="${currentComment}" />
      </div>`;
    });

    container.innerHTML = html;
  },

  // ----------------------------------------------------------
  // Deal highlighting
  // ----------------------------------------------------------
  toggleDealHighlight(dealId, type) {
    const current = this.brokerHighlights[dealId];
    if (current && current.type === type) {
      delete this.brokerHighlights[dealId];
    } else {
      this.brokerHighlights[dealId] = {
        type: type,
        comment: (current && current.comment) || '',
      };
    }
    this.renderBrokerResults();
  },

  updateHighlightComment(dealId, comment) {
    if (!this.brokerHighlights[dealId]) {
      this.brokerHighlights[dealId] = { type: '', comment: '' };
    }
    this.brokerHighlights[dealId].comment = comment;
  },

  // ----------------------------------------------------------
  // Broker save / publish
  // ----------------------------------------------------------
  showBrokerToast(message) {
    const existing = document.querySelector('.broker-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'broker-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  async saveBrokerDraft() {
    const profile = this.collectBrokerInputs();
    const highlights = Object.entries(this.brokerHighlights)
      .filter(([, h]) => h.type)
      .map(([dealId, h]) => ({
        dealId,
        type: h.type,
        comment: h.comment || '',
      }));

    const payload = {
      clientName: document.getElementById('broker-client-name')?.value || '',
      clientEmail: document.getElementById('broker-client-email')?.value || '',
      notes: document.getElementById('broker-notes')?.value || '',
      clientProfile: profile,
      highlights: highlights,
      dealResults: this.brokerResults.map((r) => ({
        dealId: r.deal.id,
        lender: r.deal.lender,
        dealName: r.deal.dealName,
        rate: r.deal.rate,
        monthlyPayment: r.breakdown.monthlyDeal,
        totalCost: r.breakdown.totalCost,
      })),
    };

    try {
      const isUpdate = this.brokerSession && this.brokerSession.id;
      const url = isUpdate
        ? this.apiBase + '/api/broker/sessions/' + this.brokerSession.id
        : this.apiBase + '/api/broker/sessions';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.brokerToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        this.showBrokerToast('Save failed: ' + (err.error || 'Server error'));
        return false;
      }

      const data = await res.json();
      this.brokerSession = data.session || data;
      this.showBrokerToast('Draft saved successfully');
      return true;
    } catch (err) {
      this.showBrokerToast('Could not save. Check your connection.');
      return false;
    }
  },

  async publishBrokerSession() {
    // Save first
    const saved = await this.saveBrokerDraft();
    if (!saved || !this.brokerSession || !this.brokerSession.id) return;

    try {
      // Publish session
      const pubRes = await fetch(
        this.apiBase + '/api/broker/sessions/' + this.brokerSession.id + '/publish',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.brokerToken,
          },
        }
      );

      if (!pubRes.ok) {
        const err = await pubRes.json().catch(() => ({}));
        this.showBrokerToast('Publish failed: ' + (err.error || 'Server error'));
        return;
      }

      const pubData = await pubRes.json();

      // Post highlights individually
      const highlights = Object.entries(this.brokerHighlights).filter(([, h]) => h.type);
      for (const [dealId, h] of highlights) {
        await fetch(
          this.apiBase + '/api/broker/sessions/' + this.brokerSession.id + '/highlights',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.brokerToken,
            },
            body: JSON.stringify({ dealId, type: h.type, comment: h.comment || '' }),
          }
        ).catch(() => {});
      }

      // Show share link
      const shareToken = pubData.shareToken || pubData.token || this.brokerSession.id;
      const shareUrl = window.location.origin + '?share=' + encodeURIComponent(shareToken);

      const linkDisplay = document.getElementById('share-link-display');
      const linkInput = document.getElementById('share-link-url');
      if (linkDisplay && linkInput) {
        linkInput.value = shareUrl;
        linkDisplay.classList.remove('hidden');
      }

      this.showBrokerToast('Published! Share link is ready.');
    } catch (err) {
      this.showBrokerToast('Publish failed. Check your connection.');
    }
  },

  copyShareLink() {
    const linkInput = document.getElementById('share-link-url');
    if (!linkInput || !linkInput.value) return;

    navigator.clipboard.writeText(linkInput.value).then(() => {
      const copyBtn = document.getElementById('copy-link-btn');
      if (copyBtn) {
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = original; }, 2000);
      }
    }).catch(() => {
      // Fallback: select the input
      linkInput.select();
      document.execCommand('copy');
      this.showBrokerToast('Link copied!');
    });
  },

  // ----------------------------------------------------------
  // Utility
  // ----------------------------------------------------------
  parseCurrency(value) {
    if (typeof value === "number") return value;
    return parseInt(String(value).replace(/[^0-9.-]/g, "")) || 0;
  },
};

// Initialise on DOM ready
document.addEventListener("DOMContentLoaded", () => App.init());
