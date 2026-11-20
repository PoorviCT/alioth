# Number Guessing Game

A responsive, browser-only game built with Next.js, React, and TypeScript. Guess a random integer from 1 to 100, follow higher/lower feedback, and play again after a win.

## Run locally

```bash
npm ci
npm run dev -- --hostname 0.0.0.0
```

Open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The end-to-end suite expects the app to be running on port 3000. Set `BASE_URL` to test another running instance. Tests override browser randomness only inside the test runner to exercise all game outcomes and both range boundaries; normal games use `Math.random()`.

## Game behavior

- Unlimited attempts; repeated valid guesses count as separate attempts.
- Empty, fractional, exponent-formatted, and out-of-range input is rejected without increasing the counter.
- Correct guesses disable input and submission; Play Again clears all game state and generates a fresh random number (which may coincidentally be the same number).
- Reloading starts a new game. No accounts, persistence, external services, backend game logic, or secrets are required.
