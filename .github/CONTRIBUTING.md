# Contributing to ComboSimulator

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/1-Future/ComboSimulator.git
cd ComboSimulator
npm install
npm run dev
```

## Available Scripts

- `npm run dev` — Start dev server with HMR
- `npm run build` — TypeScript check + production build
- `npm test` — Run unit tests
- `npm run lint` — Lint with ESLint
- `npm run e2e` — Run Playwright E2E tests

## Contributing Combos

The easiest way to contribute is by adding combo timing data:

1. Use the in-app Combo Editor to record timing for a champion
2. Export the JSON data
3. Open an issue using the "Combo Submission" template
4. Or submit a PR adding/editing a file in `public/data/combos/`

### Combo JSON Format

Each champion has a JSON file in `public/data/combos/{championId}.json`. See existing files for the expected format.

## Code Contributions

1. Fork the repo and create a feature branch
2. Make your changes
3. Ensure `npm run validate` passes (typecheck + lint + test)
4. Submit a PR with a clear description

## Code Style

- TypeScript strict mode — no `any` types
- Prettier for formatting (runs on save)
- ESLint for linting
- Engine code (`src/engine/`) must have zero React imports
