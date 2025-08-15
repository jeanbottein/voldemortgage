# Mortgage Calculator

A multi-language mortgage calculator web application with support for different languages and currencies.

## Live Demo

🔗 **[View Live Application](https://jeanbottein.github.io/voldemortgage/)**

## Features

- **Multi-language Support**: Currently supports English with easy extensibility for additional languages
- **Mortgage Calculations**: Calculate monthly payments, total interest, and amortization schedules
- **Responsive Design**: Works on desktop and mobile devices
- **Language Persistence**: Selected language is saved in localStorage

## Usage

1. Open the application in your web browser
2. Select your preferred language from the dropdown
3. Enter your mortgage details (loan amount, interest rate, term)
4. View calculated results including monthly payments and total costs

## Technical Details

- Pure HTML, CSS, and JavaScript
- Internationalization system using `data-i18n` attributes
- Language files located in `/js/i18n/lang.js`
- Responsive CSS design in `/css/styles.css`

## Adding New Languages

To add a new language:

1. Add a new language object to the `languages` object in `/js/i18n/lang.js`
2. Add the corresponding option in the language selector dropdown in `index.html`
3. The system will automatically handle the translation switching

## Development

Simply open `index.html` in a web browser to run locally, or serve the files through any web server.
