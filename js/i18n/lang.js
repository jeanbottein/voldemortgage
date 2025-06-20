// Language configuration file for multi-language support

const languages = {
    'en': {
        // Page title
        'title': 'mortgage calculator',
        
        // Form labels
        'propertyPrice': 'property price',
        'downPayment': 'down payment',
        'interestRate': 'interest rate',
        'loanTerm': 'loan term',
        'buyingFees': 'buying fees',
        'buyingTaxes': 'buying taxes',
        
        // Units
        'years': 'years',
        'percentage': '%',
        
        // Table headers
        'month': 'month',
        'payment': 'payment',
        'principal': 'principal',
        'interest': 'interest',
        'totalInterest': 'total interest',
        'remainingBalance': 'remaining balance',
        
        // Pagination
        'showRowsPerPage': 'show rows per page:',
        'previous': 'previous',
        'next': 'next',
        'page': 'page',
        'of': 'of',
        'showing': 'showing',
        'to': 'to',
        'entries': 'entries',
        'showingAll': 'showing all',
        
        // Options for pagination
        'oneYear': '12 (1 year)',
        'twoYears': '24 (2 years)',
        'fiveYears': '60 (5 years)',
        'tenYears': '120 (10 years)',
        'all': 'all',
        
        // Summary section
        'mortgageSummary': 'mortgage summary',
        'summaryPrice': 'property price:',
        'summaryBuyingFees': '+ buying fees:',
        'summaryBuyingTaxes': '+ buying taxes:',
        'summaryDownPayment': '- down payment:',
        'summaryLoanAmount': 'total loan amount:',
        'summaryInterestRate': 'interest rate:',
        'summaryLoanTerm': 'loan term:',
        'summaryMonthlyPayment': 'monthly payment:',
        'summaryTotalInterest': 'total interest:',
        'summaryTotalCost': 'total cost:',
        'summaryPayoffDate': 'pay-off date:',
        
        // Amortization
        'amortizationSchedule': 'amortization schedule',
        'paidInFull': 'property paid in full with down payment.',
        
        // Error messages
        'errorInvalidPrice': 'please enter a valid property price.',
        'errorInvalidDownPayment': 'please enter a valid down payment amount.',
        'errorDownPaymentExceedsCost': 'down payment cannot exceed total acquisition cost (price + fees + taxes).',
        'errorInvalidDownPaymentPercent': 'please enter a valid down payment percentage (0-100).',
        'errorInvalidInterestRate': 'please enter a valid interest rate.',
        'errorNegativeLoan': 'loan amount cannot be negative. check price and down payment.',
        'errorZeroPrice': 'property price cannot be zero if there is no loan.',
    },
    // French language
    'fr': {
        // Page title
        'title': 'calculatrice hypothécaire',
        
        // Form labels
        'propertyPrice': 'prix de la propriété',
        'downPayment': 'acompte',
        'interestRate': "taux d'intérêt",
        'loanTerm': 'durée du prêt',
        'buyingFees': "frais d'achat",
        'buyingTaxes': "taxes d'achat",
        
        // Units
        'years': 'ans',
        'percentage': '%',
        
        // Table headers
        'month': 'mois',
        'payment': 'paiement',
        'principal': 'principal',
        'interest': 'intérêt',
        'totalInterest': 'intérêt total',
        'remainingBalance': 'solde restant',
        
        // Pagination
        'showRowsPerPage': 'afficher lignes par page:',
        'previous': 'précédent',
        'next': 'suivant',
        'page': 'page',
        'of': 'sur',
        'showing': 'affichage',
        'to': 'à',
        'entries': 'entrées',
        'showingAll': 'affichage de toutes les',
        
        // Options for pagination
        'oneYear': '12 (1 an)',
        'twoYears': '24 (2 ans)',
        'fiveYears': '60 (5 ans)',
        'tenYears': '120 (10 ans)',
        'all': 'tout',
        
        // Summary section
        'mortgageSummary': 'résumé hypothécaire',
        'summaryPrice': 'prix de la propriété:',
        'summaryBuyingFees': '+ frais d\'achat:',
        'summaryBuyingTaxes': '+ taxes d\'achat:',
        'summaryDownPayment': '- acompte:',
        'summaryLoanAmount': 'montant total du prêt:',
        'summaryInterestRate': 'taux d\'intérêt:',
        'summaryLoanTerm': 'durée du prêt:',
        'summaryMonthlyPayment': 'paiement mensuel:',
        'summaryTotalInterest': 'intérêt total:',
        'summaryTotalCost': 'coût total:',
        'summaryPayoffDate': 'date de remboursement:',
        
        // Amortization
        'amortizationSchedule': 'tableau d\'amortissement',
        'paidInFull': 'propriété payée intégralement avec l\'acompte.',
        
        // Error messages
        'errorInvalidPrice': 'veuillez entrer un prix de propriété valide.',
        'errorInvalidDownPayment': 'veuillez entrer un montant d\'acompte valide.',
        'errorDownPaymentExceedsCost': 'l\'acompte ne peut pas dépasser le coût total d\'acquisition (prix + frais + taxes).',
        'errorInvalidDownPaymentPercent': 'veuillez entrer un pourcentage d\'acompte valide (0-100).',
        'errorInvalidInterestRate': 'veuillez entrer un taux d\'intérêt valide.',
        'errorNegativeLoan': 'le montant du prêt ne peut pas être négatif. vérifiez le prix et l\'acompte.',
        'errorZeroPrice': 'le prix de la propriété ne peut pas être zéro s\'il n\'y a pas de prêt.',
    },
    // Add more languages here in the future
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
