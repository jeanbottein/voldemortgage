// Language configuration file for multi-language support

const languages = {
    'en': {
        // Page title
        'title': 'Mortgage Calculator',
        
        // Form labels
        'propertyPrice': 'Property Price',
        'downPayment': 'Down Payment',
        'interestRate': 'Interest Rate',
        'loanTerm': 'Loan Term',
        'buyingFees': 'Buying Fees',
        'buyingTaxes': 'Buying Taxes',
        
        // Units
        'years': 'years',
        'percentage': '%',
        
        // Table headers
        'month': 'Month',
        'payment': 'Payment',
        'principal': 'Principal',
        'interest': 'Interest',
        'totalInterest': 'Total Interest',
        'remainingBalance': 'Remaining Balance',
        
        // Pagination
        'showRowsPerPage': 'Show rows per page:',
        'previous': 'Previous',
        'next': 'Next',
        'page': 'Page',
        'of': 'of',
        'showing': 'Showing',
        'to': 'to',
        'entries': 'entries',
        'showingAll': 'Showing all',
        
        // Options for pagination
        'oneYear': '12 (1 year)',
        'twoYears': '24 (2 years)',
        'fiveYears': '60 (5 years)',
        'tenYears': '120 (10 years)',
        'all': 'All',
        
        // Summary section
        'mortgageSummary': 'Mortgage Summary',
        'summaryPrice': 'Property Price:',
        'summaryBuyingFees': '+ Buying Fees:',
        'summaryBuyingTaxes': '+ Buying Taxes:',
        'summaryDownPayment': '- Down Payment:',
        'summaryLoanAmount': 'Total Loan Amount:',
        'summaryInterestRate': 'Interest Rate:',
        'summaryLoanTerm': 'Loan Term:',
        'summaryMonthlyPayment': 'Monthly Payment:',
        'summaryTotalInterest': 'Total Interest:',
        'summaryTotalCost': 'Total Cost:',
        'summaryPayoffDate': 'Pay-off Date:',
        
        // Amortization
        'amortizationSchedule': 'Amortization Schedule',
        'paidInFull': 'Property paid in full with down payment.',
        
        // Error messages
        'errorInvalidPrice': 'Please enter a valid property price.',
        'errorInvalidDownPayment': 'Please enter a valid down payment amount.',
        'errorDownPaymentExceedsCost': 'Down payment cannot exceed total acquisition cost (price + fees + taxes).',
        'errorInvalidDownPaymentPercent': 'Please enter a valid down payment percentage (0-100).',
        'errorInvalidInterestRate': 'Please enter a valid interest rate.',
        'errorNegativeLoan': 'Loan amount cannot be negative. Check price and down payment.',
        'errorZeroPrice': 'Property price cannot be zero if there is no loan.',
    },
    // Add more languages here in the future
    // 'fr': { ... },
    // 'es': { ... },
};

// Default language
let currentLanguage = 'en';

// Function to set the current language
function setLanguage(lang) {
    if (languages[lang]) {
        currentLanguage = lang;
        updatePageLanguage();
        // Save language preference
        localStorage.setItem('language', lang);
    }
}

// Function to get a text string in the current language
function getText(key) {
    return languages[currentLanguage][key] || key;
}

// Function to initialize language from saved preference
function initLanguage() {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && languages[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    updatePageLanguage();
}

// Function to update all text elements on the page
function updatePageLanguage() {
    // Update document title
    document.title = getText('title');
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            element.textContent = getText(key);
        }
    });
    
    // Update all placeholders with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key) {
            element.placeholder = getText(key);
        }
    });
}

// Export functions for use in other files
window.i18n = {
    getText,
    setLanguage,
    initLanguage,
    updatePageLanguage,
    getCurrentLanguage: () => currentLanguage
};
