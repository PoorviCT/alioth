import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "New task", exact: true })).toBeEnabled();
});

async function addTask(page: import("@playwright/test").Page, title: string) {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByPlaceholder("e.g. Take a walk after lunch").fill(title);
  await page.getByRole("button", { name: "Add task", exact: true }).click();
}

test("create, edit, prioritize, complete, persist, delete and undo a task", async ({ page }) => {
  await addTask(page, "Buy fresh groceries");
  await expect(page.getByRole("button", { name: "Buy fresh groceries", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit: Buy fresh groceries", exact: true }).click();
  await page.getByPlaceholder("e.g. Take a walk after lunch").fill("Buy vegetables");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Prioritize: Buy vegetables", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove priority: Buy vegetables", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Complete: Buy vegetables", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Mark incomplete: Buy vegetables", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("button", { name: "Buy vegetables", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete: Buy vegetables", exact: true }).click();
  await expect(page.getByRole("button", { name: "Buy vegetables", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Buy vegetables", exact: true })).toBeVisible();
});

test("due dates, category filters, search, empty states and sorting", async ({ page }) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByPlaceholder("e.g. Take a walk after lunch").fill("Arrange team meeting");
  await page.getByLabel("List", { exact: true }).selectOption("Work");
  const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  await page.getByLabel("Due date").fill(today);
  await page.getByLabel("Mark as important").check();
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arrange team meeting", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Task categories" }).getByRole("button", { name: /^Work/ }).click();
  await expect(page.getByRole("heading", { name: "Work.", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Sort tasks" }).selectOption("alphabetical");
  await expect(page.locator(".task-title").first()).toHaveText("Arrange team meeting");
  await page.getByRole("textbox", { name: "Search tasks" }).fill("not a matching task");
  await expect(page.getByRole("heading", { name: "No matching tasks" })).toBeVisible();
  await page.getByRole("textbox", { name: "Search tasks" }).fill("Arrange");
  await expect(page.locator(".task-row")).toHaveCount(1);
});

test("form rejects blank titles and supports cancel", async ({ page }) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add task", exact: true })).toBeDisabled();
  await page.getByPlaceholder("e.g. Take a walk after lunch").fill("   ");
  await expect(page.getByRole("button", { name: "Add task", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("clear completed tasks persists an empty workspace without restoring sample data", async ({ page }) => {
  const completeButtons = page.getByRole("button", { name: /^Complete: / });
  while (await completeButtons.count()) await completeButtons.first().click();
  await page.getByRole("button", { name: /^Clear completed/ }).click();
  await expect(page.getByRole("heading", { name: "A little breathing room" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "A little breathing room" })).toBeVisible();
});

test("phone layout supports creation without horizontal overflow or browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await addTask(page, "A mobile task");
  await expect(page.getByRole("button", { name: "A mobile task", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Complete: A mobile task", exact: true }).click();
  expect(errors).toEqual([]);
});
