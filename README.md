# ComboSimulator

**The osu! for League of Legends combos** — Practice champion combos with timing-graded key presses synced to videos.

## Features

- 151 champions with 839 combo videos
- Timing-graded key presses (Perfect / Great / Good / Miss)
- Configurable difficulty modes (Easy / Normal / Strict)
- Rebindable hotkeys matching your in-game keybinds
- Unstable Rate (UR) metric borrowed from osu!
- Input latency calibration wizard
- Session stats tracking (accuracy, streak, combo success rate)
- Combo bar overlay with real-time grade coloring
- Responsive design (desktop + mobile)

## Tech Stack

- **Framework:** React 19 + Vite 6 + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** Zustand with persist middleware
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deploy:** Cloudflare Pages (app) + Cloudflare R2 (videos)

## Architecture

The timing engine is **pure TypeScript with zero React dependency**. It runs in a `requestAnimationFrame` loop, reads `performance.now()` and `video.currentTime`, scores hits, and writes results to a Zustand store. React subscribes via selectors so only meaningful state changes trigger re-renders.

```
React UI ←── reads ←── Zustand Stores ←── writes at 60fps ←── Pure TS Engine
```

## Getting Started

```bash
# Clone
git clone https://github.com/1-Future/ComboSimulator.git
cd ComboSimulator

# Install
npm install

# Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run e2e` | Run Playwright E2E tests |
| `npm run validate` | Full validation (typecheck + lint + test) |

## Project Structure

```
src/
  engine/        # Pure TypeScript timing engine (no React)
  components/    # React components (layout, champion, player, stats, settings)
  stores/        # Zustand state stores
  hooks/         # React hooks
  lib/           # Utilities (audio, constants, formatters)
  types/         # TypeScript type definitions
  data/          # Champion and combo JSON data
public/
  audio/         # Sound effects
  images/        # Champion thumbnails, logo
  data/          # Static data files served at runtime
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on:
- Setting up the development environment
- Contributing combo timing data
- Code style guidelines

## Community

- [Discord](https://discord.gg/aYsPnYmfjV)
- [YouTube](https://www.youtube.com/@YasuoArchive)
- [Ko-fi](https://ko-fi.com/combosim)

## License

[MIT](LICENSE)
