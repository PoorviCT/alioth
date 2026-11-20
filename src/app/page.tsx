"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Feedback = { kind: "low" | "high" | "success" | "error"; message: string };
const randomNumber = () => Math.floor(Math.random() * 100) + 1;

function TargetIcon({ small = false }: { small?: boolean }) {
  return (
    <svg width={small ? 22 : 40} height={small ? 22 : 40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <path d="M20 1v7M20 32v7M1 20h7M32 20h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const target = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const won = feedback?.kind === "success";

  useEffect(() => {
    target.current = randomNumber();
  }, []);

  function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (won) return;
    const value = Number(guess);
    if (!/^\d+$/.test(guess.trim()) || !Number.isInteger(value) || value < 1 || value > 100) {
      setFeedback({ kind: "error", message: "Please enter a whole number between 1 and 100." });
      inputRef.current?.focus();
      return;
    }
    if (target.current === null) target.current = randomNumber();
    setAttempts((count) => count + 1);
    if (value < target.current) {
      setFeedback({ kind: "low", message: "Too Low! Try a higher number." });
    } else if (value > target.current) {
      setFeedback({ kind: "high", message: "Too High! Try a lower number." });
    } else {
      setFeedback({ kind: "success", message: "Congratulations! You guessed it!" });
    }
    if (value !== target.current) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  function playAgain() {
    target.current = randomNumber();
    setGuess("");
    setAttempts(0);
    setFeedback(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="wordmark"><TargetIcon small /> <span>little games<span className="wordmark-dot">.</span></span></div>
        <span className="header-note">A little challenge for your day</span>
      </header>

      <main className="main-content">
        <div className="intro">
          <span className="eyebrow"><span className="status-dot" /> SIMPLE GAME. SHARP MIND.</span>
          <h1>Number Guessing Game</h1>
          <p>One secret number. A little intuition. How close can you get?</p>
        </div>

        <section className={`game-card${won ? " is-won" : ""}`} aria-label="Guess the secret number">
          <div className="card-topline"><span>THE NUMBER CHALLENGE</span><span className="range-pill">1–100</span></div>
          <div className="game-symbol"><TargetIcon /></div>
          <h2>{won ? "You found it!" : "Take your best guess."}</h2>
          <p className="game-instructions">{won ? `The secret number was ${guess}. Nicely done.` : "Guess a number between 1 and 100."}</p>

          <form onSubmit={submitGuess} noValidate>
            <label htmlFor="guess">Your guess</label>
            <div className="input-wrap">
              <input ref={inputRef} id="guess" name="guess" type="number" inputMode="numeric" min="1" max="100" step="1" autoComplete="off" placeholder="e.g. 50" value={guess} onChange={(event) => setGuess(event.target.value)} disabled={won} aria-invalid={feedback?.kind === "error"} aria-describedby="guess-help feedback" />
              <span aria-hidden="true">#</span>
            </div>
            <p id="guess-help" className="input-help">Whole numbers only. You have unlimited tries.</p>
            <button className="primary-button" type="submit" disabled={won}>Submit Guess <span aria-hidden="true">↗</span></button>
          </form>

          <div id="feedback" className={`feedback ${feedback?.kind ?? "idle"}`} role="status" aria-live="polite" aria-atomic="true">
            <span className="feedback-icon" aria-hidden="true">{feedback?.kind === "success" ? "✓" : feedback?.kind === "error" ? "!" : feedback?.kind === "low" ? "↑" : feedback?.kind === "high" ? "↓" : "✧"}</span>
            <div><p>{feedback?.message ?? "Your first guess is the start of something good."}</p>{won && <p className="win-detail">You got it in {attempts} {attempts === 1 ? "attempt" : "attempts"}.</p>}</div>
          </div>
          {won && <button type="button" className="play-again" onClick={playAgain}>Play Again <span aria-hidden="true">↻</span></button>}

          <div className="attempts-row"><span><span aria-hidden="true" className="counter-icon">≡</span> Attempts made</span><strong aria-label={`${attempts} attempts`} data-testid="attempts">{String(attempts).padStart(2, "0")}</strong></div>
        </section>

        <section className="how-to-play" aria-labelledby="how-title">
          <h2 id="how-title">A quick guide</h2>
          <div className="guide-steps">
            <div><span className="step-number">01</span><p><strong>Pick a number</strong><span>Anywhere from 1 to 100.</span></p></div>
            <div><span className="step-number">02</span><p><strong>Follow the clues</strong><span>Go higher or lower.</span></p></div>
            <div><span className="step-number">03</span><p><strong>Find the secret</strong><span>Then give it another go.</span></p></div>
          </div>
        </section>
      </main>
      <footer>No timer. No pressure. Just one more guess.<span aria-hidden="true">✧</span></footer>
    </div>
  );
}
