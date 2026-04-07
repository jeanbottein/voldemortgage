# CLAUDE.md — AI Assistant Guide for voldemortgage

## Project Overview

**voldemortgage** is a static, single-page mortgage calculator web app built with pure vanilla JavaScript, HTML, and CSS. It has zero external dependencies and no build system. It is deployed as a GitHub Pages site at https://jeanbottein.github.io/voldemortgage/.

### Key characteristics
- Pure frontend: no Node.js, no package manager, no backend
- No build step: files are served as-is
- No testing framework: verification is manual (open in browser)
- No linting/formatting config files
- State is managed via localStorage and in-memory JS globals

---

## Repository Structure

```
voldemortgage/
├── index.html          # Single-page app entrypoint (350 lines)
├── css/
│   └── styles.css      # All styling including dark mode (634 lines)
├── js/
│   ├── script.js       # Core logic — calculations, UI, events (721 lines)
│   └── i18n/
│       └── lang.js     # Language definitions and i18n helpers (230 lines)
├── README.md           # User-facing project documentation
└── CLAUDE.md           # This file
```

---

## Development Workflow

### Running Locally
No server needed. Open `index.html` directly in a browser, or use any static file server:
```bash
# Simple options
python3 -m http.server 8080
npx serve .
```

### Making Changes
1. Edit `index.html`, `css/styles.css`, or `js/script.js` / `js/i18n/lang.js`
2. Reload the browser — no build step required
3. Test in multiple scenarios (different inputs, both languages, both themes, mobile width)

### Git Workflow
- Feature branches follow the pattern: `claude/<feature-name>-<id>`
- Push to feature branch, then merge to `main`
- `main` branch auto-deploys to GitHub Pages

---

## Architecture & Key Files

### `index.html`
Single HTML file containing all page structure:
- **Form section**: inputs for price, down payment (percent + amount, bidirectional), interest rate, loan term, fees, taxes, first payment date, currency selector
- **Summary section**: calculated mortgage results displayed in a table layout
- **Variables section**: additional monthly costs (utilities, insurance, taxes) and inflation rates for advanced projections
- **Amortization table**: paginated schedule of monthly payments with principal/interest/balance breakdown
- **Controls**: language switcher, currency selector, theme switcher (top-right of page)

Internationalized elements use `data-i18n="<key>"` attributes. Input placeholders use `data-i18n-placeholder="<key>"`.

### `js/script.js`
All application logic lives here. Key functions:

| Function | Purpose |
|---|---|
| `calculateMortgage()` | Main orchestrator — reads inputs, runs all calculations, updates DOM |
| `calculateMonthlyPayment(principal, monthlyRate, numPayments)` | Standard amortization formula |
| `generateAmortizationSchedule(...)` | Builds month-by-month payment array |
| `calculateVariables()` | Inflation-adjusted total cost projections |
| `renderTable()` | Renders current page of amortization schedule |
| `applyTheme(theme)` / `loadTheme()` | Theme system (system/light/dark) |
| `formatCurrency(value)` | Locale-aware number formatting via `Intl.NumberFormat` |

**Global state variables:**
- `amortizationData` — array of schedule rows, populated by `calculateMortgage()`
- `currentPage`, `rowsPerPage`, `totalPages` — pagination state
- `isUpdatingDownPayment` — flag to prevent infinite loop in bidirectional down-payment sync

**Event listeners** are set up in `DOMContentLoaded`. All inputs trigger recalculation on `input` events.

**Down payment bidirectional sync**: Changing price/percent/amount recalculates the other values. Uses `isUpdatingDownPayment` flag to avoid infinite event loops.

**Amortization formula:**
```javascript
// Standard compound amortization (monthly rate > 0)
P * r * (1 + r)^n / ((1 + r)^n - 1)
// Zero interest edge case
principal / numPayments
```

**Floating-point handling**: Last payment is adjusted manually to bring balance to exactly zero. Uses a 0.005 threshold for comparisons.

### `js/i18n/lang.js`
- `languages` object contains two locales: `en` (English) and `fr` (French)
- Each locale has 67 translation keys
- `setLanguage(lang)` — switches locale and saves to `localStorage` (`language` key)
- `getText(key)` — returns translated string for current locale
- `initLanguage()` — loads saved preference on startup
- `updatePageLanguage()` — scans the DOM for `data-i18n` and `data-i18n-placeholder` attributes and updates text/placeholders

### `css/styles.css`
- CSS custom properties (`--bg-color`, `--text-color`, `--container-bg`, etc.) for theming
- Dark mode applied via `body.dark-mode` class (not `prefers-color-scheme` media query — JS handles detection)
- Responsive breakpoint at `768px` for mobile layout
- Form layout uses flexbox (`form-row`, `form-field-wrapper`, `form-label-wrapper`)
- Number inputs: browser spinners are hidden via `appearance: textfield`
- Theme transitions: `0.3s` on `background-color` and `color`

---

## Conventions & Patterns

### Adding a New Language
1. Add a new key to the `languages` object in `js/i18n/lang.js` (copy the `en` block and translate all 67 values)
2. Add an `<option>` to the language `<select>` in `index.html`
3. No other changes needed

### Adding a New Currency
1. Add an `<option>` to the currency `<select>` in `index.html` with the currency code as its value
2. The `formatCurrency()` function in `script.js` uses `Intl.NumberFormat` with the selected currency code — it will work automatically

### Adding a New Translation Key
1. Add the key to all locales in `lang.js`
2. Add `data-i18n="<key>"` to the corresponding HTML element
3. Call `updatePageLanguage()` if the element is added dynamically

### Modifying Calculations
- `calculateMortgage()` is the single entry point for all recalculation
- Always validate inputs before computing (check for NaN, out-of-range values)
- After any calculation change, rebuild and re-render the amortization schedule

### localStorage Keys
| Key | Value |
|---|---|
| `language` | `"en"` or `"fr"` |
| `theme` | `"system"`, `"light"`, or `"dark"` |

---

## Things to Avoid

- Do NOT introduce a build system or package manager unless the project explicitly needs it — the zero-dependency nature is intentional
- Do NOT add external JavaScript libraries (jQuery, lodash, etc.)
- Do NOT remove the `isUpdatingDownPayment` guard — it prevents an infinite event loop in the down-payment sync logic
- Do NOT hardcode currency symbols — use the currency selector and `formatCurrency()`
- Do NOT hardcode language strings in JS or HTML — use `getText()` and `data-i18n` attributes
- Do NOT skip floating-point edge cases in amortization (last payment adjustment is required)

---

## Default Input Values

These are the values populated on page load (set in `script.js`):

| Field | Default |
|---|---|
| Property Price | 500,000 |
| Down Payment | 15% |
| Interest Rate | 3.5% |
| Loan Term | 30 years |
| Monthly Utilities | 0 |
| Monthly Insurance | 0 |
| Monthly Taxes | 0 |
| General Inflation | 3% |
| Real Estate Inflation | 4% |

---

## Debugging Notes

- `console.log` statements exist in the down-payment event handlers — these are intentional debug traces and can be removed once the sync logic is considered stable
- All calculation results flow through `calculateMortgage()` — add logs there for tracing output values
- Theme and language are applied immediately on `DOMContentLoaded` from localStorage

---

## Deployment

The project deploys automatically to GitHub Pages from the `main` branch. No CI/CD pipeline is configured — pushes to `main` trigger GitHub's built-in Pages deployment.

Live URL: https://jeanbottein.github.io/voldemortgage/
