import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRandom = Math.random;
    // Keep runtime-generated IDs unique while fixing the game's integer target.
    Math.random = () => 0.49 + nativeRandom() * 0.009;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Number Guessing Game", exact: true })).toBeVisible();
});

test("validates input without counting attempts", async ({ page }) => {
  const input = page.getByLabel("Your guess");
  for (const value of ["", "0", "101", "-1", "3.5", "1e2"]) {
    await input.fill(value);
    await page.getByRole("button", { name: "Submit Guess" }).click();
    await expect(page.getByRole("status")).toContainText("Please enter a whole number between 1 and 100.");
    await expect(page.getByTestId("attempts")).toHaveText("00");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }
});

test("evaluates guesses, wins, locks input and resets to a new target", async ({ page }) => {
  const input = page.getByLabel("Your guess");
  const submit = page.getByRole("button", { name: "Submit Guess" });
  await expect(page.getByRole("button", { name: "Play Again" })).toHaveCount(0);
  await input.fill("25");
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("Too Low! Try a higher number.");
  await expect(page.getByTestId("attempts")).toHaveText("01");
  await input.fill("75");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Too High! Try a lower number.");
  await expect(page.getByTestId("attempts")).toHaveText("02");
  await input.fill("50");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Congratulations! You guessed it!");
  await expect(page.getByRole("status")).toContainText("You got it in 3 attempts.");
  await expect(input).toBeDisabled();
  await expect(submit).toBeDisabled();
  await expect(page.getByTestId("attempts")).toHaveText("03");
  await page.evaluate(() => {
    const previousRandom = Math.random;
    Math.random = () => 0.74 + previousRandom() * 0.009;
  });
  await page.getByRole("button", { name: "Play Again" }).click();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("attempts")).toHaveText("00");
  await expect(submit).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("Your first guess");
  await input.fill("75");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Congratulations! You guessed it!");
  await expect(page.getByRole("status")).toContainText("You got it in 1 attempt.");
});

for (const [random, target] of [[0, 1], [0.99, 100]]) {
  test(`random number includes boundary ${target}`, async ({ page }) => {
    await page.addInitScript((value) => {
      const previousRandom = Math.random;
      Math.random = () => value + previousRandom() * 0.009;
    }, random);
    await page.reload();
    await page.getByLabel("Your guess").fill(String(target));
    await page.getByRole("button", { name: "Submit Guess" }).click();
    await expect(page.getByRole("status")).toContainText("Congratulations! You guessed it!");
  });
}

test("mobile layout is usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByLabel("Your guess")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Guess" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel("Your guess").fill("50");
  await page.getByRole("button", { name: "Submit Guess" }).click();
  await expect(page.getByRole("button", { name: "Play Again" })).toBeVisible();
});
