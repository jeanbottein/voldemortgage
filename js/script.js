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

const calculateBtn = document.getElementById('calculateBtn');
const errorElement = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const summaryDiv = document.getElementById('summary');
const amortizationBody = document.getElementById('amortizationBody');
const paginationSelect = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// To prevent infinite loops during synchronization
let isUpdatingDownPayment = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    priceInput.addEventListener('input', handlePriceChange);
    downPaymentPercentInput.addEventListener('input', updateDownPaymentFromPercent);
    downPaymentAmountInput.addEventListener('input', updateDownPaymentFromAmount);
    currencySelect.addEventListener('change', updateDownPaymentAmountLabelText);
    calculateBtn.addEventListener('click', calculateMortgage);
    
    // Initialize
    updateDownPaymentAmountLabelText();
    
    // Set default values for testing
    priceInput.value = '300000';
    downPaymentPercentInput.value = '20';
    updateDownPaymentFromPercent(); // Calculate initial amount from percent
    document.getElementById('interestRate').value = '3.5';
});

function updateDownPaymentAmountLabelText() {
    downPaymentAmountLabel.textContent = `Down Payment (${currencySelect.value})`;
    // If amount is already set, re-format it with new currency (optional)
    if (downPaymentAmountInput.value) {
        const amount = parseFloat(downPaymentAmountInput.value);
        if (!isNaN(amount)) {
            // This might be slightly confusing if user is typing, so use with caution
            // downPaymentAmountInput.value = amount.toFixed(2); // Just ensure it's a number, formatCurrency will handle display
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
        downPaymentAmountInput.value = newAmount.toFixed(2);
    } else if (!isNaN(amount) && downPaymentAmountInput.value.trim() !== '') {
        // If amount is set (and percent is not), update percent
        if (price > 0) {
            const newPercent = (amount / price) * 100;
            downPaymentPercentInput.value = newPercent.toFixed(2);
        } else {
            downPaymentPercentInput.value = ''; // Cannot calculate percent if price is 0
        }
    }
    // Update max for amount input
    downPaymentAmountInput.max = price;

    isUpdatingDownPayment = false;
}

function updateDownPaymentFromPercent() {
    if (isUpdatingDownPayment) return;
    isUpdatingDownPayment = true;

    const price = parseFloat(priceInput.value) || 0;
    const percent = parseFloat(downPaymentPercentInput.value);

    if (!isNaN(percent)) {
        if (percent < 0) downPaymentPercentInput.value = '0';
        if (percent > 100) downPaymentPercentInput.value = '100';
        const newAmount = (price * parseFloat(downPaymentPercentInput.value)) / 100;
        downPaymentAmountInput.value = newAmount.toFixed(2);
    } else {
        downPaymentAmountInput.value = '';
    }
    isUpdatingDownPayment = false;
}

function updateDownPaymentFromAmount() {
    if (isUpdatingDownPayment) return;
    isUpdatingDownPayment = true;

    const price = parseFloat(priceInput.value) || 0;
    const amount = parseFloat(downPaymentAmountInput.value);

    if (!isNaN(amount)) {
        if (amount < 0) downPaymentAmountInput.value = '0';
        if (price > 0 && amount > price) downPaymentAmountInput.value = price.toFixed(2);
        
        if (price > 0) {
            const newPercent = (parseFloat(downPaymentAmountInput.value) / price) * 100;
            downPaymentPercentInput.value = newPercent.toFixed(2);
        } else {
            downPaymentPercentInput.value = ''; // Cannot calculate percent if price is 0
        }
    } else {
        downPaymentPercentInput.value = '';
    }
    isUpdatingDownPayment = false;
}

// Format currency
function formatCurrency(amount) {
    const currency = currencySelect.value;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // Base for formatting, symbol replaced by selected currency
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace(/^\D+/, currency); // Replace only the currency symbol at the beginning
}

// Format date
function formatDate(monthsToAdd) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToAdd);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// Calculate mortgage
function calculateMortgage() {
    // Get input values
    const price = parseFloat(priceInput.value);
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
    if (downPaymentAmount > price) {
        showError('Down payment cannot exceed property price.');
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

    const loanAmount = price - downPaymentAmount;

    if (loanAmount < 0) { // Should be caught by downPaymentAmount > price, but good to have
        showError('Loan amount cannot be negative. Check price and down payment.');
        return;
    }
    if (loanAmount === 0 && price > 0) { // Paid in full
        amortizationData = [];
        updateSummary(price, downPaymentAmount, loanAmount, interestRate * 12 * 100, loanTerm / 12, 0, amortizationData);
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
    updateSummary(price, downPaymentAmount, loanAmount, interestRate * 12 * 100, loanTerm / 12, monthlyPayment, amortizationData);

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
function updateSummary(price, downPayment, loanAmount, annualRate, years, monthlyPayment, schedule) {
    const totalInterest = schedule.length > 0 ? schedule[schedule.length - 1].totalInterest : 0;
    const totalCost = price + totalInterest;
    const payoffDate = loanAmount > 0 && schedule.length > 0 ? formatDate(schedule.length) : 'N/A';

    document.getElementById('summaryPrice').textContent = formatCurrency(price);
    document.getElementById('summaryDownPayment').textContent = formatCurrency(downPayment) +
        (price > 0 ? ` (${(downPayment / price * 100).toFixed(1)}%)` : '');
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

// Make functions available in global scope for HTML event handlers
window.updatePagination = updatePagination;
window.previousPage = previousPage;
window.nextPage = nextPage;
