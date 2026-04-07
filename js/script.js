// ── Global state ────────────────────────────────────────────────────────────
let currentPage = 1;
let rowsPerPage = 12;
let totalPages = 1;
let amortizationData = [];

// Re-entrancy guard for down-payment bidirectional sync
let isUpdatingDownPayment = false;

// ── Named constants ──────────────────────────────────────────────────────────
const FLOATING_POINT_THRESHOLD = 0.005;
const MONTHLY_RATE_DIVISOR = 12;

// ── DOM element references ───────────────────────────────────────────────────
const priceInput                   = document.getElementById('price');
const downPaymentPercentInput      = document.getElementById('downPaymentPercent');
const downPaymentAmountInput       = document.getElementById('downPaymentAmount');
const downPaymentAmountLabel       = document.getElementById('downPaymentAmountLabel');
const currencySelect               = document.getElementById('currency');
const buyingFeesInput              = document.getElementById('buyingFees');
const buyingTaxesInput             = document.getElementById('buyingTaxes');
const interestRateInput            = document.getElementById('interestRate');
const loanTermSelect               = document.getElementById('loanTerm');
const monthlyUtilitiesInput        = document.getElementById('monthlyUtilities');
const monthlyInsuranceInput        = document.getElementById('monthlyInsurance');
const monthlyTaxesInput            = document.getElementById('monthlyTaxes');
const inflationRateInput           = document.getElementById('inflationRate');
const realEstateInflationRateInput = document.getElementById('realEstateInflationRate');
const resultsDiv                   = document.getElementById('results');
const summaryDiv                   = document.getElementById('summary');
const amortizationBody             = document.getElementById('amortizationBody');
const paginationSelect             = document.getElementById('pagination');
const prevBtn                      = document.getElementById('prevBtn');
const nextBtn                      = document.getElementById('nextBtn');
const pageInfo                     = document.getElementById('pageInfo');
const themeSelect                  = document.getElementById('theme-select');

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (themeSelect) {
        themeSelect.addEventListener('change', e => applyTheme(e.target.value));
    }

    if (window.i18n) {
        window.i18n.initLanguage();
    }

    priceInput.addEventListener('input',              () => syncDownPayment('price'));
    downPaymentPercentInput.addEventListener('input',  () => syncDownPayment('percent'));
    downPaymentAmountInput.addEventListener('input',   () => syncDownPayment('amount'));
    interestRateInput.addEventListener('input',  calculateMortgage);
    loanTermSelect.addEventListener('input',     calculateMortgage);
    buyingFeesInput.addEventListener('input',    calculateMortgage);
    buyingTaxesInput.addEventListener('input',   calculateMortgage);
    document.getElementById('firstPaymentDate').addEventListener('input', calculateMortgage);
    monthlyUtilitiesInput.addEventListener('input',        calculateVariables);
    monthlyInsuranceInput.addEventListener('input',        calculateVariables);
    monthlyTaxesInput.addEventListener('input',            calculateVariables);
    inflationRateInput.addEventListener('input',           calculateVariables);
    realEstateInflationRateInput.addEventListener('input', calculateVariables);
    currencySelect.addEventListener('change', () => {
        updateAllCurrencyUnitSpans(currencySelect.value);
        updateDownPaymentAmountLabelText();
        calculateMortgage();
        calculateVariables();
    });

    updateDownPaymentAmountLabelText();

    // Default values
    priceInput.value         = '500000';
    downPaymentPercentInput.value = '15';
    interestRateInput.value  = '3.5';
    buyingFeesInput.value    = '0';
    buyingTaxesInput.value   = '0';

    syncDownPayment('percent');
    loadTheme();
    updateAllCurrencyUnitSpans(currencySelect.value);

    setTimeout(() => calculateVariables(), 200);

    // Custom increment/decrement buttons
    document.querySelectorAll('.btn-decrement, .btn-increment').forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = document.getElementById(button.dataset.targetInput);
            if (!targetInput) return;

            const currentValue = parseFloat(targetInput.value) || 0;
            const step         = parseFloat(targetInput.step) || 1;
            const min          = targetInput.min !== '' ? parseFloat(targetInput.min) : -Infinity;
            const max          = targetInput.max !== '' ? parseFloat(targetInput.max) : Infinity;
            const scale        = (String(step).split('.')[1] || '').length;
            const scaleFactor  = Math.pow(10, scale);
            const delta        = button.classList.contains('btn-increment') ? step : -step;

            let newValue = (currentValue * scaleFactor + delta * scaleFactor) / scaleFactor;
            newValue = Math.max(min, Math.min(max, newValue));
            newValue = step % 1 !== 0 ? parseFloat(newValue.toFixed(scale)) : newValue;

            targetInput.value = newValue;
            targetInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        });
    });
});

// ── Down-payment label ───────────────────────────────────────────────────────
function updateDownPaymentAmountLabelText() {
    downPaymentAmountLabel.textContent = window.i18n ? window.i18n.getText('downPayment') : 'Down Payment';
}

// ── Down-payment sync ────────────────────────────────────────────────────────
const clampPercent = value => Math.min(100, Math.max(0, value));
const clampAmount  = (value, max) => Math.min(max, Math.max(0, value));

function syncDownPayment(source) {
    if (isUpdatingDownPayment) return;
    isUpdatingDownPayment = true;

    const price   = parseFloat(priceInput.value) || 0;
    const percent = parseFloat(downPaymentPercentInput.value);
    const amount  = parseFloat(downPaymentAmountInput.value);

    if (source === 'percent') {
        if (!isNaN(percent)) {
            const clamped = clampPercent(percent);
            downPaymentPercentInput.value = clamped;
            downPaymentAmountInput.value  = Math.round((price * clamped) / 100);
        } else {
            downPaymentAmountInput.value = '';
        }
    } else if (source === 'amount') {
        if (!isNaN(amount)) {
            const clamped = clampAmount(amount, price);
            downPaymentAmountInput.value  = Math.round(clamped);
            downPaymentPercentInput.value = price > 0 ? ((clamped / price) * 100).toFixed(0) : '';
        } else {
            downPaymentPercentInput.value = '';
        }
    } else { // 'price'
        downPaymentAmountInput.max = price;
        if (!isNaN(percent) && downPaymentPercentInput.value.trim() !== '') {
            downPaymentAmountInput.value = Math.round((price * percent) / 100);
        } else if (!isNaN(amount) && downPaymentAmountInput.value.trim() !== '') {
            downPaymentPercentInput.value = price > 0 ? ((amount / price) * 100).toFixed(0) : '';
        }
    }

    isUpdatingDownPayment = false;
    calculateMortgage();
}

// ── Formatting ───────────────────────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
}

function formatDate(monthsToAdd) {
    const firstPaymentDateInput = document.getElementById('firstPaymentDate');
    let startDate = new Date();

    if (firstPaymentDateInput && firstPaymentDateInput.value) {
        const [year, month] = firstPaymentDateInput.value.split('-');
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
        startDate.setMonth(startDate.getMonth() + 1);
    }

    startDate.setMonth(startDate.getMonth() + monthsToAdd - 1);

    const lang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
    return startDate.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { year: 'numeric', month: 'short' });
}

// ── Field-level validation UI ────────────────────────────────────────────────
const VALIDATABLE_FIELD_IDS = ['price', 'downPaymentAmount', 'downPaymentPercent', 'interestRate'];

const ALL_OUTPUT_IDS = [
    'summaryLoanAmount', 'summaryMonthlyPayment', 'summaryTotalInterest',
    'summaryTotalCost', 'summaryPayoffDate',
    'estimatedTotalTaxes', 'estimatedMonthlyPayment', 'estimatedTotalCost', 'estimatedTotalInvestment',
];

function markFieldInvalid(fieldId, message) {
    document.getElementById(fieldId)?.classList.add('field-invalid');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('visible'); }
}

function clearFieldInvalid(fieldId) {
    document.getElementById(fieldId)?.classList.remove('field-invalid');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
}

function clearAllFieldErrors() {
    VALIDATABLE_FIELD_IDS.forEach(clearFieldInvalid);
}

function blankAllOutputs() {
    ALL_OUTPUT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    amortizationBody.innerHTML = '';
    resultsDiv.style.display = 'none';
}

// ── Pure calculation pipeline ────────────────────────────────────────────────
function parseMortgageInputs() {
    return {
        price:              parseFloat(priceInput.value),
        buyingFees:         parseFloat(buyingFeesInput.value) || 0,
        buyingTaxes:        parseFloat(buyingTaxesInput.value) || 0,
        interestRate:       parseFloat(interestRateInput.value) / 100 / MONTHLY_RATE_DIVISOR,
        loanTerm:           parseInt(loanTermSelect.value) * MONTHLY_RATE_DIVISOR,
        downPaymentAmount:  parseFloat(downPaymentAmountInput.value),
        downPaymentPercent: parseFloat(downPaymentPercentInput.value),
    };
}

function validateMortgageInputs({ price, buyingFees, buyingTaxes, interestRate, downPaymentAmount, downPaymentPercent }) {
    const totalAcquisitionCost = price + buyingFees + buyingTaxes;

    if (isNaN(price) || price <= 0)
        return { valid: false, fieldId: 'price', errorKey: 'errorInvalidPrice' };
    if (isNaN(downPaymentAmount) || downPaymentAmount < 0)
        return { valid: false, fieldId: 'downPaymentAmount', errorKey: 'errorInvalidDownPayment' };
    if (downPaymentAmount > totalAcquisitionCost)
        return { valid: false, fieldId: 'downPaymentAmount', errorKey: 'errorDownPaymentExceedsCost' };
    if (isNaN(downPaymentPercent) || downPaymentPercent < 0 || downPaymentPercent > 100)
        return { valid: false, fieldId: 'downPaymentPercent', errorKey: 'errorInvalidDownPaymentPercent' };
    if (interestRate * 100 * MONTHLY_RATE_DIVISOR <= 0)
        return { valid: false, fieldId: 'interestRate', errorKey: 'errorInvalidInterestRate' };

    return { valid: true };
}

function computeMortgage({ price, buyingFees, buyingTaxes, interestRate, loanTerm, downPaymentAmount }) {
    const totalAcquisitionCost = price + buyingFees + buyingTaxes;
    const loanAmount = totalAcquisitionCost - downPaymentAmount;

    if (loanAmount < 0)
        return { error: 'errorNegativeLoan', fieldId: 'downPaymentAmount' };
    if (loanAmount === 0 && price === 0)
        return { error: 'errorZeroPrice', fieldId: 'price' };
    if (loanAmount === 0 && totalAcquisitionCost > 0)
        return { paidInFull: true, loanAmount: 0, monthlyPayment: 0, schedule: [],
                 annualRate: interestRate * MONTHLY_RATE_DIVISOR * 100, years: loanTerm / MONTHLY_RATE_DIVISOR };

    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    const schedule       = generateAmortizationSchedule(loanAmount, interestRate, monthlyPayment, loanTerm);

    return {
        paidInFull: false,
        loanAmount,
        monthlyPayment,
        schedule,
        annualRate: interestRate * MONTHLY_RATE_DIVISOR * 100,
        years: loanTerm / MONTHLY_RATE_DIVISOR,
    };
}

function calculateMonthlyPayment(principal, monthlyRate, termInMonths) {
    if (monthlyRate === 0) return principal / termInMonths;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)
         / (Math.pow(1 + monthlyRate, termInMonths) - 1);
}

function adjustLastPayment(balance, interestPayment) {
    return { principalPayment: balance, monthlyPayment: balance + interestPayment };
}

function generateAmortizationSchedule(principal, monthlyRate, monthlyPayment, termInMonths) {
    const schedule = [];
    let balance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= termInMonths; month++) {
        if (balance <= FLOATING_POINT_THRESHOLD) { balance = 0; break; }

        const interestPayment = balance * monthlyRate;
        let principalPayment  = monthlyPayment - interestPayment;

        const isLastPayment = balance - principalPayment < FLOATING_POINT_THRESHOLD || month === termInMonths;
        if (isLastPayment) {
            ({ principalPayment, monthlyPayment } = adjustLastPayment(balance, interestPayment));
        }

        totalInterest += interestPayment;
        balance = Math.max(0, balance - principalPayment);

        schedule.push({ month, payment: monthlyPayment, principal: principalPayment,
                        interest: interestPayment, totalInterest, balance });

        if (balance <= FLOATING_POINT_THRESHOLD) {
            schedule[schedule.length - 1].balance = 0;
            break;
        }
    }
    return schedule;
}

// ── Mortgage orchestrator ────────────────────────────────────────────────────
function calculateMortgage() {
    clearAllFieldErrors();

    const inputs   = parseMortgageInputs();
    const validity = validateMortgageInputs(inputs);

    if (!validity.valid) {
        markFieldInvalid(validity.fieldId, window.i18n ? window.i18n.getText(validity.errorKey) : validity.errorKey);
        blankAllOutputs();
        return;
    }

    const computed = computeMortgage(inputs);

    if (computed.error) {
        markFieldInvalid(computed.fieldId, window.i18n ? window.i18n.getText(computed.error) : computed.error);
        blankAllOutputs();
        return;
    }

    amortizationData = computed.schedule;
    renderMortgageResults(inputs, computed);
}

// ── Rendering ────────────────────────────────────────────────────────────────
function renderMortgageResults(inputs, computed) {
    const { price, buyingFees, buyingTaxes, downPaymentAmount } = inputs;
    const { paidInFull, loanAmount, monthlyPayment, schedule, annualRate, years } = computed;

    updateSummary({ price, buyingFees, buyingTaxes, downPayment: downPaymentAmount,
                    loanAmount, annualRate, years, monthlyPayment, schedule });

    summaryDiv.style.display = 'block';

    if (paidInFull) {
        const msg = window.i18n ? window.i18n.getText('paidInFull') : 'Property paid in full with down payment.';
        amortizationBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${msg}</td></tr>`;
        resultsDiv.style.display = 'block';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '';
        return;
    }

    currentPage = 1;
    resultsDiv.style.display = 'block';
    updatePagination();
}

function updateSummary({ price, buyingFees, buyingTaxes, downPayment, loanAmount, annualRate, years, monthlyPayment, schedule }) {
    const totalInterest              = schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0;
    const totalCost                  = price + totalInterest;
    const payoffDate                 = loanAmount > 0 && schedule.length > 0 ? formatDate(schedule.length) : 'N/A';
    const totalAcquisitionCost       = price + buyingFees + buyingTaxes;

    document.getElementById('summaryPrice').textContent       = formatCurrency(price);
    document.getElementById('summaryBuyingFees').textContent  = formatCurrency(buyingFees);
    document.getElementById('summaryBuyingTaxes').textContent = formatCurrency(buyingTaxes);
    document.getElementById('summaryDownPayment').textContent = formatCurrency(downPayment) +
        (totalAcquisitionCost > 0 ? ` (${(downPayment / totalAcquisitionCost * 100).toFixed(1)}%)` : '');
    document.getElementById('summaryLoanAmount').textContent     = formatCurrency(loanAmount);
    document.getElementById('summaryInterestRate').textContent   = annualRate.toFixed(2) + '%';
    document.getElementById('summaryLoanTerm').textContent       = years + ' years (' + (years * 12) + ' months)';
    document.getElementById('summaryMonthlyPayment').textContent = loanAmount > 0 ? formatCurrency(monthlyPayment) : formatCurrency(0);
    document.getElementById('summaryTotalInterest').textContent  = formatCurrency(totalInterest);
    document.getElementById('summaryTotalCost').textContent      = formatCurrency(totalCost);
    document.getElementById('summaryPayoffDate').textContent     = payoffDate;
}

function buildAmortizationRow(row) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${row.month} (${formatDate(row.month)})</td>
        <td>${formatCurrency(row.payment)}</td>
        <td>${formatCurrency(row.principal)}</td>
        <td>${formatCurrency(row.interest)}</td>
        <td>${formatCurrency(row.totalInterest)}</td>
        <td>${formatCurrency(row.balance)}</td>
    `;
    return tr;
}

function updatePagination() {
    if (!amortizationData || amortizationData.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '';
        amortizationBody.innerHTML = '';
        return;
    }

    rowsPerPage = parseInt(paginationSelect.value) || amortizationData.length;
    totalPages  = rowsPerPage > 0 ? Math.ceil(amortizationData.length / rowsPerPage) : 1;
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || rowsPerPage === 0;

    updateAmortizationTable();
}

function updateAmortizationTable() {
    if (!amortizationData || amortizationData.length === 0) return;

    const startIndex  = rowsPerPage > 0 ? (currentPage - 1) * rowsPerPage : 0;
    const endIndex    = rowsPerPage > 0 ? Math.min(startIndex + rowsPerPage, amortizationData.length) : amortizationData.length;
    const currentData = amortizationData.slice(startIndex, endIndex);

    amortizationBody.innerHTML = '';
    currentData.forEach(row => amortizationBody.appendChild(buildAmortizationRow(row)));

    const t          = key => window.i18n ? window.i18n.getText(key) : key;
    const totalCount = amortizationData.length;

    pageInfo.textContent = rowsPerPage === 0 || totalCount === 0
        ? `${t('showingAll')} ${totalCount} ${t('entries')}`
        : `${t('showing')} ${startIndex + 1} ${t('to')} ${endIndex} ${t('of')} ${totalCount} ${t('entries')} (${t('page')} ${currentPage} ${t('of')} ${totalPages})`;
}

function previousPage() {
    if (currentPage > 1) { currentPage--; updatePagination(); }
}

function nextPage() {
    if (currentPage < totalPages) { currentPage++; updatePagination(); }
}

// ── Variables section ────────────────────────────────────────────────────────
function parseVariableInputs() {
    return {
        monthlyUtilities:        parseFloat(monthlyUtilitiesInput.value)          || 0,
        monthlyInsurance:        parseFloat(monthlyInsuranceInput.value)           || 0,
        monthlyTaxes:            parseFloat(monthlyTaxesInput.value)               || 0,
        inflationRate:           parseFloat(inflationRateInput.value)              || 0,
        realEstateInflationRate: parseFloat(realEstateInflationRateInput.value)    || 0,
        loanTerm:                parseInt(loanTermSelect.value) * MONTHLY_RATE_DIVISOR,
        monthlyMortgagePayment:  parseFloat(document.getElementById('summaryMonthlyPayment').textContent.replace(/[^0-9.-]/g, '')) || 0,
        totalMortgageCost:       parseFloat(document.getElementById('summaryTotalCost').textContent.replace(/[^0-9.-]/g, ''))      || 0,
        propertyPrice:           parseFloat(priceInput.value) || 0,
    };
}

function computeVariableCosts({ monthlyUtilities, monthlyInsurance, monthlyTaxes, inflationRate,
                                 realEstateInflationRate, loanTerm, monthlyMortgagePayment,
                                 totalMortgageCost, propertyPrice }) {
    let totalUtilitiesCost = 0, totalInsuranceCost = 0, totalTaxes = 0, totalInflatedMonthlyPayments = 0;

    for (let month = 1; month <= loanTerm; month++) {
        const yearsPassed         = (month - 1) / MONTHLY_RATE_DIVISOR;
        const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsPassed);
        const inflatedUtilities   = monthlyUtilities * inflationMultiplier;
        const inflatedInsurance   = monthlyInsurance * inflationMultiplier;
        const inflatedTaxes       = monthlyTaxes     * inflationMultiplier;

        totalUtilitiesCost           += inflatedUtilities;
        totalInsuranceCost           += inflatedInsurance;
        totalTaxes                   += inflatedTaxes;
        totalInflatedMonthlyPayments += monthlyMortgagePayment + inflatedUtilities + inflatedInsurance + inflatedTaxes;
    }

    const averageMonthlyPayment = loanTerm > 0 ? totalInflatedMonthlyPayments / loanTerm : 0;
    const estimatedTotalCost    = totalMortgageCost + totalUtilitiesCost + totalInsuranceCost + totalTaxes;
    const inflatedPropertyValue = propertyPrice * Math.pow(1 + realEstateInflationRate / 100, loanTerm / MONTHLY_RATE_DIVISOR);

    return { totalTaxes, averageMonthlyPayment, estimatedTotalCost, inflatedPropertyValue };
}

function renderVariableCosts({ totalTaxes, averageMonthlyPayment, estimatedTotalCost, inflatedPropertyValue }) {
    document.getElementById('estimatedTotalTaxes').textContent      = formatCurrency(totalTaxes);
    document.getElementById('estimatedMonthlyPayment').textContent  = formatCurrency(averageMonthlyPayment);
    document.getElementById('estimatedTotalCost').textContent       = formatCurrency(estimatedTotalCost);
    document.getElementById('estimatedTotalInvestment').textContent = formatCurrency(inflatedPropertyValue);
}

function calculateVariables() {
    renderVariableCosts(computeVariableCosts(parseVariableInputs()));
}

// ── Currency spans ───────────────────────────────────────────────────────────
function updateAllCurrencyUnitSpans(newSymbol) {
    const CURRENCY_UNIT_IDS = [
        'priceUnit', 'downPaymentAmountUnit', 'buyingFeesUnit',
        'buyingTaxesUnit', 'monthlyUtilitiesUnit', 'monthlyInsuranceUnit', 'monthlyTaxesUnit',
    ];
    CURRENCY_UNIT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = newSymbol;
    });
}

// ── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
    const effectiveTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    document.body.classList.toggle('dark-mode', effectiveTheme === 'dark');
    if (themeSelect) themeSelect.value = theme;
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    applyTheme(localStorage.getItem('theme') || 'system');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'system') applyTheme('system');
});

// ── Global exports for HTML onclick handlers ─────────────────────────────────
window.updatePagination = updatePagination;
window.previousPage = previousPage;
window.nextPage = nextPage;
