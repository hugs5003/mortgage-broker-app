// ============================================================
// APP CONTROLLER — Wizard Navigation, State, UI Updates
// ============================================================

const App = {
  // Access gate
  ACCESS_CODE: 'mortgage2026',
  isAuthenticated: false,

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

  // Financial tools state
  activeFinancialTab: 'overpay-invest',
  financialCharts: {},
  activeSavingsMode: 'home',

  // Share view state
  isShareView: false,
  shareToken: null,
  shareSession: null,
  shareHighlights: [],
  originalShareData: null,
  currentOverrides: {},
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
    // Share links bypass the gate entirely
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('share')) {
      this.isAuthenticated = true;
      this.unlockApp();
      this.checkForShareLink();
      return;
    }

    // Check if already authenticated this session
    if (sessionStorage.getItem('mo_access') === 'granted') {
      this.isAuthenticated = true;
      this.showRoleChooser();
      return;
    }

    // Show gate and bind its events
    this.bindGateEvents();
  },

  // ----------------------------------------------------------
  // Access gate
  // ----------------------------------------------------------
  bindGateEvents() {
    const submitBtn = document.getElementById('access-submit-btn');
    const input = document.getElementById('access-code-input');
    if (submitBtn) submitBtn.addEventListener('click', () => this.checkAccessCode());
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.checkAccessCode(); });
  },

  checkAccessCode() {
    const input = document.getElementById('access-code-input');
    const error = document.getElementById('access-error');
    const code = input.value.trim();

    if (code === this.ACCESS_CODE) {
      this.isAuthenticated = true;
      sessionStorage.setItem('mo_access', 'granted');
      error.classList.add('hidden');
      this.showRoleChooser();
    } else {
      error.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  },

  // ----------------------------------------------------------
  // Role chooser
  // ----------------------------------------------------------
  showRoleChooser() {
    document.getElementById('access-gate').style.display = 'none';
    document.getElementById('role-chooser').style.display = 'flex';

    document.getElementById('choose-consumer').addEventListener('click', () => this.enterConsumerMode());
    document.getElementById('choose-broker').addEventListener('click', () => this.enterBrokerMode());
  },

  enterConsumerMode() {
    document.getElementById('role-chooser').style.display = 'none';
    this.unlockApp();
    this.bindEvents();
    this.bindFinancialEvents();
    this.updateProgress();
    this.updateLTVDisplay();
    this.updateDepositPercentage();
    this.showStep(1);
    this.renderLearnPanel();
  },

  enterBrokerMode() {
    document.getElementById('role-chooser').style.display = 'none';
    this.unlockApp();
    this.bindBrokerEvents();
    this.renderLearnPanel();
    this.showBrokerLogin();
  },

  unlockApp() {
    const header = document.getElementById('app-header');
    const progress = document.getElementById('progress-bar-container');
    const main = document.getElementById('app-main');
    const nav = document.getElementById('wizardNav');
    if (header) header.style.display = '';
    if (progress) progress.style.display = '';
    if (main) main.style.display = '';
    if (nav) nav.style.display = '';
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

    // Show financial tools CTA
    const financialCta = document.getElementById('financial-cta');
    if (financialCta) financialCta.classList.remove('hidden');
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
      <div class="grid gap-4" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">
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
      <div class="grid gap-4 py-3 border-b border-gray-100" style="grid-template-columns: repeat(${values.length + 1}, minmax(0, 1fr))">
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
    const progressBar = document.getElementById('progress-bar-container');
    if (progressBar) progressBar.style.display = 'none';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    document.getElementById('broker-login').style.display = 'block';
    document.getElementById('broker-dashboard').style.display = 'none';
  },

  hideBrokerLogin() {
    document.getElementById('broker-login').style.display = 'none';
    const progressBar = document.getElementById('progress-bar-container');
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
    const progressBar = document.getElementById('progress-bar-container');
    if (progressBar) progressBar.style.display = 'none';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    const mainEl = document.getElementById('app-main');
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
    const progressBar = document.getElementById('progress-bar-container');
    if (progressBar) progressBar.style.display = '';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = '';
    const mainEl = document.getElementById('app-main');
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
  // Share view — consumer opens broker's share link
  // ----------------------------------------------------------
  checkForShareLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      this.isShareView = true;
      this.shareToken = token;
      this.loadShareView(token);
    }
  },

  async loadShareView(token) {
    // Hide wizard, progress bar, nav, broker sections
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    const progressBar = document.getElementById('progress-bar-container');
    if (progressBar) progressBar.style.display = 'none';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    const mainEl = document.getElementById('app-main');
    if (mainEl) mainEl.style.display = 'none';
    document.getElementById('broker-login').style.display = 'none';
    document.getElementById('broker-dashboard').style.display = 'none';

    // Show share view with loading state
    const shareView = document.getElementById('share-view');
    shareView.style.display = 'block';

    try {
      const res = await fetch(this.apiBase + '/api/share/' + encodeURIComponent(token));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        document.getElementById('share-results').innerHTML = `
          <div class="text-center py-16">
            <div class="text-6xl mb-4">🔗</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">Link not found</h3>
            <p class="text-gray-500">${err.error || 'This share link may have expired or is invalid.'}</p>
          </div>`;
        return;
      }

      const data = await res.json();
      this.shareSession = data.session || data;
      this.shareHighlights = data.highlights || this.shareSession.highlights || [];
      this.originalShareData = JSON.parse(JSON.stringify(this.shareSession));
      this.currentOverrides = {};

      this.renderShareView();
      this.bindShareEvents();
    } catch (err) {
      document.getElementById('share-results').innerHTML = `
        <div class="text-center py-16">
          <div class="text-6xl mb-4">⚠️</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Could not load recommendation</h3>
          <p class="text-gray-500">Please check your connection and try again.</p>
        </div>`;
    }
  },

  renderShareView() {
    const session = this.shareSession;
    const profile = session.clientProfile || session.client_profile || session;

    // Broker name
    const brokerNameEl = document.getElementById('share-broker-name');
    if (brokerNameEl) {
      brokerNameEl.textContent = session.brokerName || session.broker_name || 'Your Broker';
    }

    // Broker message
    const notes = session.brokerNotes || session.broker_notes || session.notes || '';
    const msgPanel = document.getElementById('share-broker-message');
    const notesEl = document.getElementById('share-broker-notes');
    if (notes && msgPanel && notesEl) {
      notesEl.textContent = notes;
      msgPanel.style.display = 'block';
    } else if (msgPanel) {
      msgPanel.style.display = 'none';
    }

    // Summary bar
    const pv = profile.propertyValue || profile.property_value || 0;
    const dep = profile.deposit || 0;
    const loan = pv - dep;
    const ltv = pv > 0 ? ((loan / pv) * 100) : 0;
    const term = profile.termYears || profile.term_years || 25;

    document.getElementById('share-property-value').textContent = MortgageCalc.formatCurrency(pv);
    document.getElementById('share-loan-amount').textContent = MortgageCalc.formatCurrency(loan);
    document.getElementById('share-ltv').textContent = ltv.toFixed(1) + '%';
    document.getElementById('share-deposit').textContent = MortgageCalc.formatCurrency(dep);
    document.getElementById('share-term').textContent = term + ' years';

    // Populate what-if fields
    document.getElementById('whatif-propertyValue').value = pv.toLocaleString();
    document.getElementById('whatif-deposit').value = dep.toLocaleString();
    document.getElementById('whatif-grossIncome').value = (profile.grossIncome || profile.gross_income || 55000).toLocaleString();
    document.getElementById('whatif-termYears').value = term;
    document.getElementById('whatif-monthlyOutgoings').value = (profile.monthlyOutgoings || profile.monthly_outgoings || 800).toLocaleString();

    // Build user profile for calculation
    const userProfile = this.buildShareProfile(profile);
    const results = MortgageCalc.filterAndRankDeals(userProfile);

    // Split into highlighted and other deals
    const highlightMap = {};
    if (Array.isArray(this.shareHighlights)) {
      this.shareHighlights.forEach(h => {
        const id = h.dealId || h.deal_id;
        if (id) highlightMap[id] = h;
      });
    }

    // Highlighted deals sorted by display_order
    const highlightedResults = [];
    const otherResults = [];

    results.forEach(result => {
      if (highlightMap[result.deal.id]) {
        highlightedResults.push({ result, highlight: highlightMap[result.deal.id] });
      } else {
        otherResults.push(result);
      }
    });

    // Sort highlighted by display_order
    highlightedResults.sort((a, b) => {
      const orderA = a.highlight.display_order || a.highlight.displayOrder || 0;
      const orderB = b.highlight.display_order || b.highlight.displayOrder || 0;
      return orderA - orderB;
    });

    // Render highlighted deals
    const highlightContainer = document.getElementById('share-results');
    highlightContainer.innerHTML = highlightedResults.map(({ result, highlight }) =>
      this.renderShareDealCard(result, highlight)
    ).join('');

    // Render other deals
    const otherHeader = document.getElementById('other-deals-header');
    const otherContainer = document.getElementById('share-other-results');
    if (otherResults.length > 0) {
      otherHeader.style.display = 'block';
      otherContainer.innerHTML = otherResults.map(result =>
        this.renderShareDealCard(result, null)
      ).join('');
    } else {
      otherHeader.style.display = 'none';
      otherContainer.innerHTML = '';
    }
  },

  buildShareProfile(profile) {
    return {
      propertyValue: profile.propertyValue || profile.property_value || 300000,
      deposit: profile.deposit || 60000,
      purchaseType: profile.purchaseType || profile.purchase_type || 'firstTime',
      propertyType: profile.propertyType || profile.property_type || 'semiDetached',
      leasehold: profile.leasehold || false,
      grossIncome: profile.grossIncome || profile.gross_income || 55000,
      jointApplication: profile.jointApplication || profile.joint_application || false,
      secondIncome: profile.secondIncome || profile.second_income || 0,
      employmentStatus: profile.employmentStatus || profile.employment_status || 'employed',
      monthlyOutgoings: profile.monthlyOutgoings || profile.monthly_outgoings || 800,
      creditProfile: profile.creditProfile || profile.credit_profile || 'good',
      age: profile.age || 35,
      termYears: profile.termYears || profile.term_years || 25,
      priorities: profile.priorities || ['lowestMonthly'],
      overpaymentPlans: profile.overpaymentPlans || profile.overpayment_plans || false,
      overpaymentAmount: profile.overpaymentAmount || profile.overpayment_amount || 0,
      movingWithin5Years: profile.movingWithin5Years || profile.moving_within_5_years || false,
      riskTolerance: profile.riskTolerance || profile.risk_tolerance || 30,
      savingsAmount: profile.savingsAmount || profile.savings_amount || 0,
    };
  },

  renderShareDealCard(result, highlight) {
    const { deal, typeInfo, breakdown, verdict, totalFees } = result;

    let cardClass = 'share-deal-card';
    let badgeHtml = '';
    let commentHtml = '';

    if (highlight) {
      const hType = highlight.highlight_type || highlight.type || '';

      if (hType === 'recommended' || hType === 'recommend') {
        cardClass += ' highlight-recommended';
        badgeHtml = '<span class="highlight-badge highlight-badge-recommended">Broker Recommended</span>';
      } else if (hType === 'alternative') {
        cardClass += ' highlight-alternative';
        badgeHtml = '<span class="highlight-badge highlight-badge-alternative">Also Consider</span>';
      } else if (hType === 'avoid') {
        cardClass += ' highlight-avoid';
        badgeHtml = '<span class="highlight-badge highlight-badge-avoid">Broker Advises Caution</span>';
      }

      const comment = highlight.broker_comment || highlight.comment || '';
      if (comment) {
        commentHtml = `<div class="broker-deal-comment">"${comment}"</div>`;
      }
    }

    return `
    <div class="${cardClass}" data-deal-id="${deal.id}">
      ${badgeHtml ? `<div class="mb-3">${badgeHtml}${commentHtml}</div>` : ''}

      <div class="flex justify-between items-start mb-4">
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
          <div class="text-lg font-bold ${totalFees > 0 ? 'text-amber-600' : 'text-green-600'}">
            ${totalFees > 0 ? MortgageCalc.formatCurrency(totalFees) : 'None'}
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs text-gray-500 mb-1">Total interest</div>
          <div class="text-lg font-bold text-gray-900">${MortgageCalc.formatCurrency(breakdown.totalInterest)}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        ${deal.features.map(f =>
          `<span class="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">${f}</span>`
        ).join('')}
      </div>

      <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
        <div class="text-xs font-semibold text-amber-700 mb-1">In plain English</div>
        <p class="text-sm text-amber-800">${verdict}</p>
      </div>

      <div class="bg-gray-50 rounded-lg p-3">
        <div class="text-xs font-semibold text-gray-600 mb-1">What happens when this deal ends?</div>
        <p class="text-sm text-gray-700">
          You'll move to ${deal.lender}'s SVR of ${deal.svr}%. Your monthly payment would rise to approximately
          <strong>${MortgageCalc.formatCurrency(breakdown.monthlySVR)}</strong>
          — that's <strong>${MortgageCalc.formatCurrency(breakdown.monthlySVR - breakdown.monthlyDeal)} more per month</strong>.
        </p>
      </div>
    </div>`;
  },

  toggleWhatIfPanel() {
    const panel = document.getElementById('whatif-panel');
    const btn = document.getElementById('whatif-toggle-btn');
    if (panel) {
      panel.classList.toggle('open');
      if (btn) {
        btn.textContent = panel.classList.contains('open') ? 'Adjust Scenario ▴' : 'Adjust Scenario ▾';
      }
    }
  },

  applyWhatIf() {
    const origProfile = (this.originalShareData.clientProfile || this.originalShareData.client_profile || this.originalShareData);

    const parse = (id) => this.parseCurrency(document.getElementById(id)?.value || '0');

    const fields = {
      propertyValue: parse('whatif-propertyValue'),
      deposit: parse('whatif-deposit'),
      grossIncome: parse('whatif-grossIncome'),
      termYears: parseInt(document.getElementById('whatif-termYears')?.value) || 25,
      monthlyOutgoings: parse('whatif-monthlyOutgoings'),
    };

    // Determine which fields changed
    this.currentOverrides = {};
    const origValues = {
      propertyValue: origProfile.propertyValue || origProfile.property_value || 0,
      deposit: origProfile.deposit || 0,
      grossIncome: origProfile.grossIncome || origProfile.gross_income || 55000,
      termYears: origProfile.termYears || origProfile.term_years || 25,
      monthlyOutgoings: origProfile.monthlyOutgoings || origProfile.monthly_outgoings || 800,
    };

    const fieldIds = ['whatif-propertyValue', 'whatif-deposit', 'whatif-grossIncome', 'whatif-termYears', 'whatif-monthlyOutgoings'];
    const fieldKeys = ['propertyValue', 'deposit', 'grossIncome', 'termYears', 'monthlyOutgoings'];

    fieldKeys.forEach((key, i) => {
      const input = document.getElementById(fieldIds[i]);
      if (fields[key] !== origValues[key]) {
        this.currentOverrides[key] = fields[key];
        if (input) input.classList.add('whatif-modified');
      } else {
        if (input) input.classList.remove('whatif-modified');
      }
    });

    // Merge overrides into profile
    const mergedProfile = { ...origProfile };
    Object.keys(this.currentOverrides).forEach(key => {
      mergedProfile[key] = this.currentOverrides[key];
    });

    // Update session temporarily for re-render
    const sessionProfile = this.shareSession.clientProfile || this.shareSession.client_profile || this.shareSession;
    Object.keys(fields).forEach(key => {
      sessionProfile[key] = fields[key];
    });

    this.renderShareView();

    // POST override to server (fire-and-forget)
    if (Object.keys(this.currentOverrides).length > 0) {
      fetch(this.apiBase + '/api/share/' + encodeURIComponent(this.shareToken) + '/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override_data: this.currentOverrides }),
      }).catch(() => {});
    }

    // Re-apply whatif-modified classes after re-render
    fieldKeys.forEach((key, i) => {
      const input = document.getElementById(fieldIds[i]);
      if (this.currentOverrides[key] !== undefined && input) {
        input.classList.add('whatif-modified');
      }
    });
  },

  resetWhatIf() {
    const origProfile = (this.originalShareData.clientProfile || this.originalShareData.client_profile || this.originalShareData);

    // Restore session to original
    this.shareSession = JSON.parse(JSON.stringify(this.originalShareData));
    this.currentOverrides = {};

    // Remove modified indicators
    ['whatif-propertyValue', 'whatif-deposit', 'whatif-grossIncome', 'whatif-termYears', 'whatif-monthlyOutgoings'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.classList.remove('whatif-modified');
    });

    this.renderShareView();
  },

  bindShareEvents() {
    const recalcBtn = document.getElementById('whatif-recalculate');
    if (recalcBtn) recalcBtn.addEventListener('click', () => this.applyWhatIf());

    const resetBtn = document.getElementById('whatif-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetWhatIf());

    const exploreCta = document.getElementById('explore-finances-cta');
    if (exploreCta) exploreCta.addEventListener('click', () => {
      if (typeof this.showFinancialTools === 'function') {
        this.showFinancialTools();
      }
    });
  },

  // ----------------------------------------------------------
  // Financial Tools
  // ----------------------------------------------------------
  bindFinancialEvents() {
    const exploreBtn = document.getElementById('explore-finances-btn');
    if (exploreBtn) exploreBtn.addEventListener('click', () => this.showFinancialTools());

    const backBtn = document.getElementById('back-to-results-btn');
    if (backBtn) backBtn.addEventListener('click', () => this.backToResults());

    // Tab buttons
    document.querySelectorAll('.financial-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchFinancialTab(btn.dataset.tab));
    });

    // Savings mode toggle
    document.querySelectorAll('.fi-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fi-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeSavingsMode = btn.dataset.savingsMode;
        document.getElementById('savings-mode-home').classList.toggle('hidden', this.activeSavingsMode !== 'home');
        document.getElementById('savings-mode-custom').classList.toggle('hidden', this.activeSavingsMode !== 'custom');
        this.renderSavingsGoal();
      });
    });

    // Slider value displays and re-render on change
    const sliderBindings = [
      { id: 'fi-monthly-extra', display: 'fi-monthly-extra-val', prefix: '£', suffix: '' },
      { id: 'fi-invest-rate', display: 'fi-invest-rate-val', prefix: '', suffix: '%' },
      { id: 'fi-target-deposit-pct', display: 'fi-target-deposit-pct-val', prefix: '', suffix: '%' },
      { id: 'fi-monthly-saving', display: 'fi-monthly-saving-val', prefix: '£', suffix: '' },
      { id: 'fi-savings-rate', display: 'fi-savings-rate-val', prefix: '', suffix: '%' },
      { id: 'fi-monthly-saving-custom', display: 'fi-monthly-saving-custom-val', prefix: '£', suffix: '' },
      { id: 'fi-savings-rate-custom', display: 'fi-savings-rate-custom-val', prefix: '', suffix: '%' },
      { id: 'fi-retirement-age', display: 'fi-retirement-age-val', prefix: '', suffix: '' },
      { id: 'fi-employer-match', display: 'fi-employer-match-val', prefix: '', suffix: '%' },
      { id: 'fi-return-rate', display: 'fi-return-rate-val', prefix: '', suffix: '%' },
      { id: 'fi-inflation-rate', display: 'fi-inflation-rate-val', prefix: '', suffix: '%' },
    ];

    sliderBindings.forEach(({ id, display, prefix, suffix }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const disp = document.getElementById(display);
          if (disp) disp.textContent = prefix + el.value + suffix;
          this.renderActiveFinancialTab();
        });
      }
    });

    // Non-slider inputs that also trigger re-render
    const inputIds = [
      'fi-invest-years', 'fi-isa-toggle',
      'fi-target-property', 'fi-current-savings', 'fi-lisa-toggle',
      'fi-target-amount', 'fi-current-savings-custom',
      'fi-current-age', 'fi-current-pension', 'fi-pension-contribution', 'fi-desired-income'
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const evtType = (el.type === 'checkbox') ? 'change' : 'input';
        el.addEventListener(evtType, () => this.renderActiveFinancialTab());
      }
    });
  },

  showFinancialTools() {
    // Hide results / share view
    document.getElementById('step-results').classList.remove('active');
    const shareView = document.getElementById('share-view');
    if (shareView) shareView.style.display = 'none';
    document.getElementById('financial-tools').style.display = 'block';
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav) wizardNav.style.display = 'none';
    const compBar = document.getElementById('comparisonBar');
    if (compBar) compBar.classList.add('hidden');

    // Pre-fill from user profile
    this.prefillFinancialInputs();
    this.renderActiveFinancialTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  backToResults() {
    document.getElementById('financial-tools').style.display = 'none';
    if (this.isShareView) {
      const shareView = document.getElementById('share-view');
      if (shareView) shareView.style.display = 'block';
    } else {
      document.getElementById('step-results').classList.add('active');
    }
    const wizardNav = document.getElementById('wizardNav');
    if (wizardNav && !this.isShareView) wizardNav.style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  prefillFinancialInputs() {
    const p = this.userProfile;

    // Overpay tab
    const investYears = document.getElementById('fi-invest-years');
    if (investYears) investYears.value = p.termYears;
    if (p.overpaymentAmount > 0) {
      const extra = document.getElementById('fi-monthly-extra');
      if (extra) {
        extra.value = Math.min(1000, Math.max(50, p.overpaymentAmount));
        const disp = document.getElementById('fi-monthly-extra-val');
        if (disp) disp.textContent = '£' + extra.value;
      }
    }

    // Savings tab
    const targetProp = document.getElementById('fi-target-property');
    if (targetProp) targetProp.value = p.propertyValue.toLocaleString();

    // Retirement tab
    const ageInput = document.getElementById('fi-current-age');
    if (ageInput && p.age) ageInput.value = p.age;
  },

  switchFinancialTab(tabId) {
    this.activeFinancialTab = tabId;
    document.querySelectorAll('.financial-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.financial-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.add('active');
    this.renderActiveFinancialTab();
  },

  renderActiveFinancialTab() {
    switch (this.activeFinancialTab) {
      case 'overpay-invest': this.renderOverpayVsInvest(); break;
      case 'savings-goal': this.renderSavingsGoal(); break;
      case 'retirement': this.renderRetirement(); break;
    }
  },

  renderOverpayVsInvest() {
    const loan = this.userProfile.propertyValue - this.userProfile.deposit;
    const bestDeal = this.results && this.results.length > 0 ? this.results[0] : null;
    const mortgageRate = bestDeal ? bestDeal.deal.rate : 4.5;
    const mortgageTerm = this.userProfile.termYears;

    const monthlyExtra = parseFloat(document.getElementById('fi-monthly-extra')?.value) || 200;
    const investRate = parseFloat(document.getElementById('fi-invest-rate')?.value) || 7;
    const investYears = parseInt(document.getElementById('fi-invest-years')?.value) || mortgageTerm;
    const isISA = document.getElementById('fi-isa-toggle')?.checked || false;

    const result = FinancialCalc.overpayVsInvest(loan, mortgageRate, mortgageTerm, monthlyExtra, investRate, investYears);

    // Tax note for non-ISA
    let taxNote = '';
    if (!isISA && result.investment.totalGrowth > 0) {
      const isaResult = FinancialCalc.isaComparison(result.investment.totalContributed, investRate, investYears, false);
      taxNote = '<p class="text-sm text-gray-500 mt-2">Estimated tax on gains (outside ISA): <span class="font-semibold text-amber-600">' + FinancialCalc.formatCurrency(isaResult.taxPaid) + '</span></p>';
    }

    const verdictClass = result.netBenefit > 0 ? 'fi-verdict-positive' : 'fi-verdict-negative';

    const container = document.getElementById('overpay-invest-results');
    if (container) {
      container.innerHTML =
        '<div class="fi-comparison-columns">' +
          '<div class="fi-column-overpay">' +
            '<div class="fi-column-header bg-green-50 rounded-t-xl px-5 py-3 border-b border-green-100">' +
              '<h3 class="font-bold text-green-800">Overpay Mortgage</h3>' +
            '</div>' +
            '<div class="p-5 space-y-3">' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Interest saved</span><span class="text-sm font-bold text-green-700">' + FinancialCalc.formatCurrency(result.overpayment.interestSaved) + '</span></div>' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Years saved</span><span class="text-sm font-bold text-green-700">' + result.overpayment.yearsSaved.toFixed(1) + ' years</span></div>' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Total cost reduction</span><span class="text-sm font-bold text-green-700">' + FinancialCalc.formatCurrency(result.overpayment.totalPaidWithout - result.overpayment.totalPaidWithOverpay) + '</span></div>' +
              '<div class="text-xs text-gray-500 pt-2 border-t border-gray-100">Guaranteed saving at ' + mortgageRate + '% mortgage rate</div>' +
            '</div>' +
          '</div>' +
          '<div class="fi-column-invest">' +
            '<div class="fi-column-header bg-blue-50 rounded-t-xl px-5 py-3 border-b border-blue-100">' +
              '<h3 class="font-bold text-blue-800">Invest Instead</h3>' +
            '</div>' +
            '<div class="p-5 space-y-3">' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Projected pot value</span><span class="text-sm font-bold text-blue-700">' + FinancialCalc.formatCurrency(result.investment.finalValue) + '</span></div>' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Total contributed</span><span class="text-sm font-bold text-gray-700">' + FinancialCalc.formatCurrency(result.investment.totalContributed) + '</span></div>' +
              '<div class="flex justify-between"><span class="text-sm text-gray-600">Total growth</span><span class="text-sm font-bold text-blue-700">' + FinancialCalc.formatCurrency(result.investment.totalGrowth) + '</span></div>' +
              taxNote +
              '<div class="text-xs text-gray-500 pt-2 border-t border-gray-100">Projected at ' + investRate + '% p.a. — not guaranteed' + (isISA ? ' (ISA: tax-free)' : '') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="fi-verdict-box ' + verdictClass + '">' +
          '<p class="text-lg font-bold">' + result.verdict + '</p>' +
          '<p class="text-sm mt-2 opacity-80">Break-even investment return rate: ' + result.breakEvenRate.toFixed(1) + '%</p>' +
        '</div>';
    }

    this.renderOverpayChart(result);
  },

  renderOverpayChart(result) {
    const canvas = document.getElementById('overpay-invest-chart');
    if (!canvas) return;
    if (this.financialCharts.overpay) this.financialCharts.overpay.destroy();

    this.financialCharts.overpay = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Overpay Mortgage', 'Invest Instead'],
        datasets: [
          {
            label: 'Saving / Growth (£)',
            data: [Math.round(result.overpayment.interestSaved), Math.round(result.investment.totalGrowth)],
            backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(59, 130, 246, 0.7)'],
            borderRadius: 8,
          },
          {
            label: 'Total Contributed (£)',
            data: [
              Math.round(result.overpayment.totalPaidWithOverpay - result.overpayment.totalPaidWithout + result.overpayment.interestSaved),
              Math.round(result.investment.totalContributed)
            ],
            backgroundColor: ['rgba(34, 197, 94, 0.25)', 'rgba(59, 130, 246, 0.25)'],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: function(v) { return '£' + v.toLocaleString(); } } },
        },
      },
    });
  },

  renderSavingsGoal() {
    if (this.activeSavingsMode === 'home') {
      this.renderSavingsHome();
    } else {
      this.renderSavingsCustom();
    }
  },

  renderSavingsHome() {
    const targetProp = this.parseCurrency(document.getElementById('fi-target-property')?.value) || 300000;
    const depositPct = parseFloat(document.getElementById('fi-target-deposit-pct')?.value) || 10;
    const currentSavings = this.parseCurrency(document.getElementById('fi-current-savings')?.value) || 0;
    const monthlySaving = parseFloat(document.getElementById('fi-monthly-saving')?.value) || 500;
    const savingsRate = parseFloat(document.getElementById('fi-savings-rate')?.value) || 4;
    const lisaOn = document.getElementById('fi-lisa-toggle')?.checked || false;

    const result = FinancialCalc.firstHomeSavings(targetProp, depositPct, currentSavings, monthlySaving, savingsRate, lisaOn);

    const container = document.getElementById('savings-home-results');
    if (container) {
      container.innerHTML =
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
          '<div class="bg-blue-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-blue-600 mb-1">Target deposit</div>' +
            '<div class="text-xl font-bold text-blue-800">' + FinancialCalc.formatCurrency(result.targetDeposit) + '</div>' +
          '</div>' +
          '<div class="bg-green-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-green-600 mb-1">Time to reach</div>' +
            '<div class="text-xl font-bold text-green-800">' + FinancialCalc.formatYearsMonths(result.monthsToTarget) + '</div>' +
          '</div>' +
          '<div class="bg-purple-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-purple-600 mb-1">Total contributed</div>' +
            '<div class="text-xl font-bold text-purple-800">' + FinancialCalc.formatCurrency(result.timeline.totalContributed) + '</div>' +
          '</div>' +
          '<div class="bg-amber-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-amber-600 mb-1">Interest earned</div>' +
            '<div class="text-xl font-bold text-amber-800">' + FinancialCalc.formatCurrency(result.timeline.interestEarned) + '</div>' +
          '</div>' +
        '</div>' +
        (lisaOn
          ? '<div class="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">' +
              '<p class="text-sm font-semibold text-purple-800">Lifetime ISA bonus: ' + FinancialCalc.formatCurrency(result.withLISABonus) + '</p>' +
              '<p class="text-xs text-purple-600 mt-1">This reduces the amount you need to save from your own funds.</p>' +
            '</div>'
          : '');
    }

    this.renderSavingsChart(result.timeline.monthByMonth, result.targetDeposit, 'savings-timeline-chart');
  },

  renderSavingsCustom() {
    const targetAmount = this.parseCurrency(document.getElementById('fi-target-amount')?.value) || 20000;
    const currentSavings = this.parseCurrency(document.getElementById('fi-current-savings-custom')?.value) || 0;
    const monthlySaving = parseFloat(document.getElementById('fi-monthly-saving-custom')?.value) || 500;
    const rate = parseFloat(document.getElementById('fi-savings-rate-custom')?.value) || 4;

    const result = FinancialCalc.savingsTimeline(targetAmount, currentSavings, monthlySaving, rate);

    const container = document.getElementById('savings-custom-results');
    if (container) {
      container.innerHTML =
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">' +
          '<div class="bg-blue-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-blue-600 mb-1">Time to reach goal</div>' +
            '<div class="text-xl font-bold text-blue-800">' + FinancialCalc.formatYearsMonths(result.monthsToTarget) + '</div>' +
          '</div>' +
          '<div class="bg-green-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-green-600 mb-1">Total contributed</div>' +
            '<div class="text-xl font-bold text-green-800">' + FinancialCalc.formatCurrency(result.totalContributed) + '</div>' +
          '</div>' +
          '<div class="bg-amber-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-amber-600 mb-1">Interest earned</div>' +
            '<div class="text-xl font-bold text-amber-800">' + FinancialCalc.formatCurrency(result.interestEarned) + '</div>' +
          '</div>' +
        '</div>';
    }

    this.renderSavingsChart(result.monthByMonth, targetAmount, 'savings-custom-chart');
  },

  renderSavingsChart(monthByMonth, targetAmount, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !monthByMonth || monthByMonth.length === 0) return;

    if (this.financialCharts[canvasId]) this.financialCharts[canvasId].destroy();

    // Sample points to keep chart performant
    const data = monthByMonth.length > 120
      ? monthByMonth.filter(function(_, i) { return i % Math.ceil(monthByMonth.length / 120) === 0 || i === monthByMonth.length - 1; })
      : monthByMonth;

    this.financialCharts[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(function(d) { return d.month <= 24 ? d.month + ' mo' : (d.month / 12).toFixed(1) + ' yr'; }),
        datasets: [
          {
            label: 'Savings Balance',
            data: data.map(function(d) { return Math.round(d.balance); }),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Target',
            data: data.map(function() { return targetAmount; }),
            borderColor: 'rgba(239, 68, 68, 0.5)',
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: function(v) { return '£' + v.toLocaleString(); } } },
        },
      },
    });
  },

  renderRetirement() {
    const currentAge = parseInt(document.getElementById('fi-current-age')?.value) || 35;
    const retirementAge = parseInt(document.getElementById('fi-retirement-age')?.value) || 67;
    const currentPension = this.parseCurrency(document.getElementById('fi-current-pension')?.value) || 0;
    const monthlyContribution = this.parseCurrency(document.getElementById('fi-pension-contribution')?.value) || 300;
    const employerMatchPct = parseFloat(document.getElementById('fi-employer-match')?.value) || 3;
    const returnRate = parseFloat(document.getElementById('fi-return-rate')?.value) || 5;
    const inflationRate = parseFloat(document.getElementById('fi-inflation-rate')?.value) || 2.5;
    const desiredIncome = this.parseCurrency(document.getElementById('fi-desired-income')?.value) || 25000;

    // Employer match as monthly amount
    const employerMonthly = monthlyContribution * (employerMatchPct / 100);

    const projection = FinancialCalc.retirementProjection(
      currentAge, retirementAge, currentPension,
      monthlyContribution, employerMonthly,
      returnRate, inflationRate
    );
    const gap = FinancialCalc.retirementGap(desiredIncome, projection.projectedPot, 4);

    const isOnTrack = gap.annualShortfall <= 0;

    const container = document.getElementById('retirement-results');
    if (container) {
      container.innerHTML =
        '<div class="text-center mb-6">' +
          '<p class="text-sm text-gray-500 mb-1">Your projected pension pot</p>' +
          '<div class="fi-big-number">' + FinancialCalc.formatCurrency(projection.projectedPot) + '</div>' +
          '<p class="text-sm text-gray-500 mt-1">In today\'s money: ' + FinancialCalc.formatCurrency(projection.projectedRealPot) + '</p>' +
        '</div>' +
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">' +
          '<div class="bg-blue-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-blue-600 mb-1">Monthly income (4% rule)</div>' +
            '<div class="text-xl font-bold text-blue-800">' + FinancialCalc.formatCurrency(projection.monthlyIncomeAt4Pct) + '/mo</div>' +
          '</div>' +
          '<div class="bg-blue-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-blue-600 mb-1">Annual income (4% rule)</div>' +
            '<div class="text-xl font-bold text-blue-800">' + FinancialCalc.formatCurrency(projection.annualIncomeAt4Pct) + '/yr</div>' +
          '</div>' +
          '<div class="bg-gray-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs text-gray-500 mb-1">Years of income</div>' +
            '<div class="text-xl font-bold text-gray-800">' + (gap.yearsOfIncomeAvailable === Infinity ? '∞' : gap.yearsOfIncomeAvailable.toFixed(1)) + ' yrs</div>' +
          '</div>' +
        '</div>' +
        (isOnTrack
          ? '<div class="fi-on-track">' +
              '<div class="flex items-center gap-3">' +
                '<span class="text-2xl">✅</span>' +
                '<div>' +
                  '<p class="font-bold text-green-800">You\'re on track!</p>' +
                  '<p class="text-sm text-green-700">Your projected pot should provide ' + FinancialCalc.formatCurrency(projection.annualIncomeAt4Pct) + '/year, meeting your ' + FinancialCalc.formatCurrency(desiredIncome) + '/year target.</p>' +
                '</div>' +
              '</div>' +
            '</div>'
          : '<div class="fi-gap-warning">' +
              '<div class="flex items-center gap-3">' +
                '<span class="text-2xl">⚠️</span>' +
                '<div>' +
                  '<p class="font-bold text-amber-800">There\'s a gap to close</p>' +
                  '<p class="text-sm text-amber-700">To reach ' + FinancialCalc.formatCurrency(desiredIncome) + '/year, you\'d need to save an extra <strong>' + FinancialCalc.formatCurrency(gap.monthlyExtraSavingNeeded) + '/month</strong>.</p>' +
                  '<p class="text-xs text-amber-600 mt-1">Shortfall: ' + FinancialCalc.formatCurrency(gap.annualShortfall) + '/year</p>' +
                '</div>' +
              '</div>' +
            '</div>');
    }

    this.renderRetirementChart(projection.yearByYear, desiredIncome / 0.04);
  },

  renderRetirementChart(yearByYear, targetPot) {
    const canvas = document.getElementById('retirement-chart');
    if (!canvas || !yearByYear || yearByYear.length === 0) return;
    if (this.financialCharts.retirement) this.financialCharts.retirement.destroy();

    this.financialCharts.retirement = new Chart(canvas, {
      type: 'line',
      data: {
        labels: yearByYear.map(function(d) { return 'Age ' + d.age; }),
        datasets: [
          {
            label: 'Pension Pot',
            data: yearByYear.map(function(d) { return Math.round(d.balance); }),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Real Value (after inflation)',
            data: yearByYear.map(function(d) { return Math.round(d.realValue); }),
            borderColor: 'rgba(34, 197, 94, 0.8)',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          },
          {
            label: 'Target Pot',
            data: yearByYear.map(function() { return Math.round(targetPot); }),
            borderColor: 'rgba(239, 68, 68, 0.5)',
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: function(v) { return '£' + v.toLocaleString(); } } },
        },
      },
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
