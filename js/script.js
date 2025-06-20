// Global variables
let currentPage = 1;
let rowsPerPage = 12;
let totalPages = 1;
let amortizationData = [];

// DOM Elements
const priceInput = document.getElementById('price');
const downPaymentPercentInput = document.getElementById('downPaymentPercent');
const downPaymentAmountInput = document.getElementById('downPaymentAmount');
const downPaymentAmountLabel = document.getElementById('downPaymentAmountLabel');
const currencySelect = document.getElementById('currency');
const buyingFeesInput = document.getElementById('buyingFees');
const buyingTaxesInput = document.getElementById('buyingTaxes');
const interestRateInput = document.getElementById('interestRate');
const loanTermSelect = document.getElementById('loanTerm');

const calculateBtn = document.getElementById('calculateBtn'); // This will be null, but kept for structure if button is re-added. Consider removing if button is permanently gone.
const errorElement = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const summaryDiv = document.getElementById('summary');
const amortizationBody = document.getElementById('amortizationBody');
const paginationSelect = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// Theme switcher elements
const themeSelect = document.getElementById('theme-select');

// To prevent infinite loops during synchronization
let isUpdatingDownPayment = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
     // Load saved theme or system default

    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            applyTheme(event.target.value);
        });
    }
    priceInput.addEventListener('input', handlePriceChange);
    downPaymentPercentInput.addEventListener('input', updateDownPaymentFromPercent);
    downPaymentAmountInput.addEventListener('input', updateDownPaymentFromAmount);
    interestRateInput.addEventListener('input', calculateMortgage);
    loanTermSelect.addEventListener('input', calculateMortgage);
    buyingFeesInput.addEventListener('input', calculateMortgage);
    buyingTaxesInput.addEventListener('input', calculateMortgage);
    currencySelect.addEventListener('change', () => {
        updateDownPaymentAmountLabelText();
        calculateMortgage(); // Always attempt to recalculate on currency change
    });
    // calculateBtn.addEventListener('click', calculateMortgage); // Button no longer primary trigger
    
    // Initialize
    updateDownPaymentAmountLabelText();
    
    // Set default values for testing
    priceInput.value = '500000';
    downPaymentPercentInput.value = '15';
    document.getElementById('interestRate').value = '3.5'; // Set interest rate before functions that might use it
    buyingFeesInput.value = '0';
    buyingTaxesInput.value = '0';
    // loanTermSelect defaults via HTML 'selected' attribute

    // Calculate initial down payment amount from percent.
    // This function is expected to also call calculateMortgage(), which will now see the correct interest rate.
    updateDownPaymentFromPercent(); 

    // Initial theme load
    loadTheme();

    // Add event listeners for custom increment/decrement buttons
    const valueChangeButtons = document.querySelectorAll('.btn-decrement, .btn-increment');

    valueChangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInputId = button.dataset.targetInput;
            const targetInput = document.getElementById(targetInputId);

            if (targetInput) {
                const currentValue = parseFloat(targetInput.value) || 0;
                const stepAttribute = targetInput.step;
                const step = parseFloat(stepAttribute) || 1;
                const min = targetInput.min !== '' ? parseFloat(targetInput.min) : -Infinity;
                const max = targetInput.max !== '' ? parseFloat(targetInput.max) : Infinity;
                let newValue;

                console.log(`--- Button Click (${button.classList.contains('btn-increment') ? 'INCREMENT' : 'DECREMENT'}) for Input ID: ${targetInputId} ---`);
                console.log('Current Input Value (string):', targetInput.value);
                console.log('Parsed Current Value:', currentValue);
                console.log('Step Attribute (string):', stepAttribute);
                console.log('Parsed Step:', step);

                let calculatedNewValue;
                const scale = (String(step).split('.')[1] || '').length; // Number of decimal places in step
                const scaleFactor = Math.pow(10, scale);
                
                console.log('Scale for arithmetic (0 for integer steps):', scale);
                console.log('Scale Factor for arithmetic (1 for integer steps):', scaleFactor);

                if (button.classList.contains('btn-increment')) {
                    calculatedNewValue = (currentValue * scaleFactor + step * scaleFactor) / scaleFactor;
                } else {
                    calculatedNewValue = (currentValue * scaleFactor - step * scaleFactor) / scaleFactor;
                }

                console.log('New Value (after scaled +/- step, before min/max/rounding):', calculatedNewValue);

                // Ensure value is within min/max bounds
                calculatedNewValue = Math.max(min, Math.min(max, calculatedNewValue));
                console.log('New Value (after min/max, before final rounding):', calculatedNewValue);
                
                // Round to the number of decimal places dictated by the step attribute
                if (step % 1 !== 0) { // Only apply toFixed for decimal steps
                    console.log('Rounding: Decimal Places in Step:', scale);
                    console.log('Rounding: Value Before .toFixed():', calculatedNewValue);
                    newValue = parseFloat(calculatedNewValue.toFixed(scale));
                    console.log('Rounding: Value After .toFixed() and parseFloat():', newValue);
                } else { // For integer steps, use the value directly
                    newValue = calculatedNewValue;
                    console.log('Integer step: Value after min/max (no toFixed needed):', newValue);
                }

                targetInput.value = newValue;
                console.log('Final targetInput.value set to:', targetInput.value);
                console.log('--------------------------------------------------');

                // Manually trigger an 'input' event to ensure calculations and other listeners fire
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                targetInput.dispatchEvent(inputEvent);
            }
        });
    });
});

function updateDownPaymentAmountLabelText() {
    const selectedSymbol = currencySelect.value;
    downPaymentAmountLabel.textContent = `Down Payment (${selectedSymbol})`;
    // If amount is already set, re-format it with new currency (optional)
    // This part might not be necessary if inputs are not reformatted live
    if (downPaymentAmountInput.value) {
        const amount = parseFloat(downPaymentAmountInput.value);
        if (!isNaN(amount)) {
            // downPaymentAmountInput.value = Math.round(amount); // Keep internal value precise and rounded
        }
    }
}

function handlePriceChange() {
    if (isUpdatingDownPayment) return;
    isUpdatingDownPayment = true;

    const price = parseFloat(priceInput.value) || 0;
    const percent = parseFloat(downPaymentPercentInput.value);
    const amount = parseFloat(downPaymentAmountInput.value);

    if (!isNaN(percent) && downPaymentPercentInput.value.trim() !== '') {
        // If percent is set, update amount
        const newAmount = (price * percent) / 100;
        downPaymentAmountInput.value = Math.round(newAmount);
    } else if (!isNaN(amount) && downPaymentAmountInput.value.trim() !== '') {
        // If amount is set (and percent is not), update percent
        if (price > 0) {
            const newPercent = (amount / price) * 100;
            downPaymentPercentInput.value = newPercent.toFixed(0);
        } else {
            downPaymentPercentInput.value = ''; // Cannot calculate percent if price is 0
        }
    }
    // Update max for amount input
    downPaymentAmountInput.max = price;

    isUpdatingDownPayment = false;
    calculateMortgage(); // Trigger recalculation
}

function updateDownPaymentFromPercent() {
    console.log('[DP % Handler] Entered. Current downPaymentPercentInput.value:', document.getElementById('downPaymentPercent').value);
    if (isUpdatingDownPayment) {
        console.log('[DP % Handler] Exiting due to isUpdatingDownPayment flag.');
        return;
    }
    isUpdatingDownPayment = true;

    const price = parseFloat(priceInput.value) || 0;
    let percent = parseFloat(downPaymentPercentInput.value);
    console.log('[DP % Handler] Parsed percent:', percent);

    if (!isNaN(percent)) {
        if (percent < 0) {
            console.log('[DP % Handler] Percent < 0, clamping to 0. Old value:', downPaymentPercentInput.value);
            downPaymentPercentInput.value = '0';
            percent = 0; // Update local variable too
        }
        if (percent > 100) {
            console.log('[DP % Handler] Percent > 100, clamping to 100. Old value:', downPaymentPercentInput.value);
            downPaymentPercentInput.value = '100';
            percent = 100; // Update local variable too
        }
        const newAmount = (price * percent) / 100;
        downPaymentAmountInput.value = Math.round(newAmount);
    } else {
        downPaymentAmountInput.value = '';
    }
    isUpdatingDownPayment = false;
    calculateMortgage(); // Trigger recalculation
}

function updateDownPaymentFromAmount() {
    console.log('[DP Amt Handler] Entered. Current downPaymentPercentInput.value:', document.getElementById('downPaymentPercent').value, 'Current downPaymentAmountInput.value:', document.getElementById('downPaymentAmount').value);
    if (isUpdatingDownPayment) {
        console.log('[DP Amt Handler] Exiting due to isUpdatingDownPayment flag.');
        return;
    }
    isUpdatingDownPayment = true;

    const price = parseFloat(priceInput.value) || 0;
    const amount = parseFloat(downPaymentAmountInput.value);
    console.log('[DP Amt Handler] Parsed amount:', amount);

    if (!isNaN(amount)) {
        if (amount < 0) downPaymentAmountInput.value = '0';
        if (price > 0 && amount > price) downPaymentAmountInput.value = Math.round(price);
        
        if (price > 0) {
            const newPercent = (parseFloat(downPaymentAmountInput.value) / price) * 100;
            console.log('[DP Amt Handler] Calculated newPercent:', newPercent, 'Current downPaymentPercentInput.value before change:', downPaymentPercentInput.value);
            downPaymentPercentInput.value = newPercent.toFixed(0);
            console.log('[DP Amt Handler] downPaymentPercentInput.value AFTER change:', downPaymentPercentInput.value);
        } else {
            downPaymentPercentInput.value = ''; // Cannot calculate percent if price is 0
        }
    } else {
        downPaymentPercentInput.value = '';
    }
    isUpdatingDownPayment = false;
    calculateMortgage(); // Trigger recalculation
}

// Format currency
function formatCurrency(amount) {
    const selectedSymbol = currencySelect.value;
    const roundedAmount = Math.round(amount); // Round to nearest whole number

    // Format the number using browser's default locale for number parts (e.g., thousand separators)
    const formattedNumber = new Intl.NumberFormat(undefined, {
        style: 'decimal', // Just the number, no currency styling from Intl
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(roundedAmount);

    // Append the selected symbol
    return `${formattedNumber} ${selectedSymbol}`;
}

// Format date
function formatDate(monthsToAdd) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToAdd);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// Calculate mortgage
function calculateMortgage() {
    console.log('[CalcMortgage] Entered. Current interestRate.value:', document.getElementById('interestRate').value, 'Current downPaymentPercentInput.value:', document.getElementById('downPaymentPercent').value);
    // Get input values
    const price = parseFloat(priceInput.value);
    const buyingFees = parseFloat(buyingFeesInput.value) || 0;
    const buyingTaxes = parseFloat(buyingTaxesInput.value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100 / 12; // Monthly interest rate
    const loanTerm = parseInt(document.getElementById('loanTerm').value) * 12; // In months
    let downPaymentAmount = parseFloat(downPaymentAmountInput.value);

    // Validate inputs
    if (isNaN(price) || price <= 0) {
        showError('Please enter a valid property price.');
        return;
    }
    if (isNaN(downPaymentAmount) || downPaymentAmount < 0) {
        showError('Please enter a valid down payment amount.');
        return;
    }
    const totalAcquisitionCost = price + buyingFees + buyingTaxes;
    if (downPaymentAmount > totalAcquisitionCost) {
        showError('Down payment cannot exceed total acquisition cost (price + fees + taxes).');
        return;
    }
    const downPaymentPercent = parseFloat(downPaymentPercentInput.value);
    if (isNaN(downPaymentPercent) || downPaymentPercent < 0 || downPaymentPercent > 100) {
         showError('Please enter a valid down payment percentage (0-100).');
        return;
    }
    if (parseFloat(document.getElementById('interestRate').value) <=0 ){
        showError('Please enter a valid interest rate.');
        return;
    }

    const loanAmount = totalAcquisitionCost - downPaymentAmount;

    if (loanAmount < 0) { // Should be caught by downPaymentAmount > price, but good to have
        showError('Loan amount cannot be negative. Check price and down payment.');
        return;
    }
    if (loanAmount === 0 && totalAcquisitionCost > 0) { // Paid in full
        amortizationData = [];
        updateSummary(price, buyingFees, buyingTaxes, downPaymentAmount, loanAmount, interestRate * 12 * 100, loanTerm / 12, 0, amortizationData);
        resultsDiv.style.display = 'block';
        summaryDiv.style.display = 'block';
        amortizationBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Property paid in full with down payment.</td></tr>';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '';
        errorElement.style.display = 'none';
        return;
    }
     if (loanAmount === 0 && price === 0) {
        showError('Property price cannot be zero if there is no loan.');
        return;
    }

    // Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

    // Generate amortization schedule
    amortizationData = generateAmortizationSchedule(loanAmount, interestRate, monthlyPayment, loanTerm);

    // Update summary
    updateSummary(price, buyingFees, buyingTaxes, downPaymentAmount, loanAmount, interestRate * 12 * 100, loanTerm / 12, monthlyPayment, amortizationData);

    // Show results
    resultsDiv.style.display = 'block';
    summaryDiv.style.display = 'block';
    errorElement.style.display = 'none';

    // Reset pagination
    currentPage = 1;
    updatePagination();
}

// Calculate monthly payment
function calculateMonthlyPayment(principal, monthlyRate, termInMonths) {
    if (monthlyRate === 0) {
        return principal / termInMonths;
    }
    return principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths) / (Math.pow(1 + monthlyRate, termInMonths) - 1);
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, monthlyRate, monthlyPayment, termInMonths) {
    const schedule = [];
    let balance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= termInMonths; month++) {
        if (balance <= 0.005) { // Using a small threshold for floating point issues
            balance = 0; // Ensure it goes to zero
            break;
        }

        const interestPayment = balance * monthlyRate;
        let principalPayment = monthlyPayment - interestPayment;
        
        // Adjust the last payment if needed
        if (balance - principalPayment < 0.005 || month === termInMonths) {
            principalPayment = balance;
            monthlyPayment = balance + interestPayment; // Adjust monthly payment for the last one
        }
        
        totalInterest += interestPayment;
        balance -= principalPayment;
        balance = Math.max(0, balance); // Ensure balance doesn't go negative

        schedule.push({
            month,
            payment: monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            totalInterest,
            balance: balance
        });
        
        if (balance <= 0.005) { // Check again after pushing
             schedule[schedule.length-1].balance = 0; // Ensure last balance is exactly 0
            break;
        }
    }
    return schedule;
}

// Update summary section
function updateSummary(price, buyingFees, buyingTaxes, downPayment, loanAmount, annualRate, years, monthlyPayment, schedule) {
    const totalInterest = schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0;
    const totalCost = price + totalInterest;
    const payoffDate = loanAmount > 0 && schedule.length > 0 ? formatDate(schedule.length) : 'N/A';

    document.getElementById('summaryPrice').textContent = formatCurrency(price);
    document.getElementById('summaryBuyingFees').textContent = formatCurrency(buyingFees);
    document.getElementById('summaryBuyingTaxes').textContent = formatCurrency(buyingTaxes);
    const totalAcquisitionCostForDisplay = price + buyingFees + buyingTaxes;
    document.getElementById('summaryDownPayment').textContent = formatCurrency(downPayment) +
        (totalAcquisitionCostForDisplay > 0 ? ` (${(downPayment / totalAcquisitionCostForDisplay * 100).toFixed(1)}%)` : '');
    document.getElementById('summaryLoanAmount').textContent = formatCurrency(loanAmount);
    document.getElementById('summaryInterestRate').textContent = annualRate.toFixed(2) + '%';
    document.getElementById('summaryLoanTerm').textContent = years + ' years (' + (years * 12) + ' months)';
    document.getElementById('summaryMonthlyPayment').textContent = loanAmount > 0 ? formatCurrency(monthlyPayment) : formatCurrency(0);
    document.getElementById('summaryTotalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('summaryTotalCost').textContent = formatCurrency(totalCost);
    document.getElementById('summaryPayoffDate').textContent = payoffDate;
}

// Update pagination
function updatePagination() {
    if (!amortizationData || amortizationData.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = '';
        if (parseFloat(priceInput.value) > 0 && parseFloat(downPaymentAmountInput.value) === parseFloat(priceInput.value)) {
            // Handled in calculateMortgage, but as a fallback
            amortizationBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Property paid in full with down payment.</td></tr>';
        } else {
            amortizationBody.innerHTML = ''; // Clear if no data for other reasons
        }
        return;
    }

    rowsPerPage = parseInt(paginationSelect.value) || amortizationData.length;
    totalPages = rowsPerPage > 0 ? Math.ceil(amortizationData.length / rowsPerPage) : 1;
    currentPage = Math.min(currentPage, totalPages);
    currentPage = Math.max(1, currentPage); // Ensure currentPage is at least 1

    // Update pagination controls
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || rowsPerPage === 0;
    
    // Update table
    updateAmortizationTable();
}

// Update amortization table
function updateAmortizationTable() {
    if (!amortizationData || amortizationData.length === 0) {
        // Already handled in updatePagination, but good for direct calls
        return;
    }

    const startIndex = rowsPerPage > 0 ? (currentPage - 1) * rowsPerPage : 0;
    const endIndex = rowsPerPage > 0 ? Math.min(startIndex + rowsPerPage, amortizationData.length) : amortizationData.length;
    const currentData = amortizationData.slice(startIndex, endIndex);

    amortizationBody.innerHTML = '';

    currentData.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.month} (${formatDate(payment.month)})</td>
            <td>${formatCurrency(payment.payment)}</td>
            <td>${formatCurrency(payment.principal)}</td>
            <td>${formatCurrency(payment.interest)}</td>
            <td>${formatCurrency(payment.totalInterest)}</td>
            <td>${formatCurrency(payment.balance)}</td>
        `;
        amortizationBody.appendChild(row);
    });

    // Update pagination info
    const startCount = amortizationData.length > 0 ? startIndex + 1 : 0;
    const endCount = endIndex;
    const totalCount = amortizationData.length;

    if (rowsPerPage === 0 || totalCount === 0) {
        pageInfo.textContent = `Showing all ${totalCount} entries`;
    } else {
        pageInfo.textContent = `Showing ${startCount} to ${endCount} of ${totalCount} entries (Page ${currentPage} of ${totalPages})`;
    }
}

// Pagination functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
}

// Show error message
function showError(message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    resultsDiv.style.display = 'none';
    summaryDiv.style.display = 'none';

    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

/** THEME SWITCHER LOGIC **/

function applyTheme(theme) {
    let effectiveTheme = theme;
    if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (effectiveTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    if (themeSelect) {
        themeSelect.value = theme;
    }

    // Save the user's explicit choice (light, dark, or system)
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme);
}

// Listen for OS theme changes if 'system' is selected
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentThemeSetting = localStorage.getItem('theme');
    if (currentThemeSetting === 'system') {
        applyTheme('system');
    }
});

// Make functions available in global scope for HTML event handlers
window.updatePagination = updatePagination;
window.previousPage = previousPage;
window.nextPage = nextPage;

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for custom increment/decrement buttons
    const valueChangeButtons = document.querySelectorAll('.btn-decrement, .btn-increment');

    valueChangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInputId = button.dataset.targetInput;
            const targetInput = document.getElementById(targetInputId);

            if (targetInput) {
                const currentValue = parseFloat(targetInput.value) || 0;
                const step = parseFloat(targetInput.step) || 1;
                const min = targetInput.min !== '' ? parseFloat(targetInput.min) : -Infinity;
                const max = targetInput.max !== '' ? parseFloat(targetInput.max) : Infinity;
                let newValue;

                if (button.classList.contains('btn-increment')) {
                    newValue = currentValue + step;
                } else {
                    newValue = currentValue - step;
                }

                // Ensure value is within min/max bounds
                newValue = Math.max(min, Math.min(max, newValue));
                
                // Round to a reasonable number of decimal places if step is a float
                if (step % 1 !== 0) {
                    // Count decimal places in step
                    const decimalPlaces = (String(step).split('.')[1] || '').length;
                    newValue = parseFloat(newValue.toFixed(decimalPlaces));
                }

                targetInput.value = newValue;

                // Manually trigger an 'input' event to ensure calculations and other listeners fire
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                targetInput.dispatchEvent(inputEvent);
            }
        });
    });

    // Initial theme load
    loadTheme();
});
