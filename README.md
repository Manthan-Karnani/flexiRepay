# flexiRepay

Microfinance borrower repayment record — a single-page React app to track a loan repayment schedule, extra principal payments, pauses, buffer balance, on-time streaks, and benefits.

Built with React 19 + Vite + Recharts. No backend. Demo data persists in the browser via `localStorage` (keys starting with `mfi:`).

## Prerequisites

- **Node.js**: v18+ (v20 LTS recommended)
- **npm**: v9+ (comes with Node) — or use `yarn` / `pnpm` equivalently
- Verify:
  ```bash
  node -v
  npm -v
  ```

## Run locally

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd flexiRepay
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Open the app:
   - Vite prints a URL, usually **http://localhost:5173**
   - Open it in your browser.

## Other scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally (`npm run build` first) |

Example:
```bash
npm run build
npm run preview
```

## Project structure

```
flexiRepay/
├── index.html          # Entry HTML, mounts #root
├── vite.config.js      # Vite + React plugin config
├── package.json        # Scripts and dependencies
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # App shell, schedule state, toasts, modals
│   ├── app.css         # Global styles
│   ├── components/     # LoanOverview, PaymentPlanner, Heatmap,
│   │                   # ExtraPayment, PauseManager, BufferManager,
│   │                   # StreakTracker, Rewards, Insights, ui
│   ├── hooks/          # useLocalStorage
│   ├── services/       # loanEngine (EMI, schedule, summary, streaks, rewards)
│   └── utils/          # format helpers
└── dist/               # Production build output (generated)
```

## How data works

- On first load, a demo schedule is generated (₹50,000 principal, 12% p.a., 12 months, monthly, starting ~4 months ago so there is history).
- Everything is stored in browser `localStorage`:
  - `mfi:config`, `mfi:schedule`, `mfi:extras`, `mfi:pauses`, `mfi:buffer`
- To reset demo data, click **Reset** in the top bar, or clear site data in browser devtools.

## Troubleshooting

- **Port already in use**: run `npm run dev -- --port 5174`
- **Blank page / stale data**: hard-refresh, or clear `localStorage` keys starting with `mfi:` and reload.
- **`npm install` fails**: delete `node_modules` + `package-lock.json`, then `npm install` again. Ensure Node >= 18.
