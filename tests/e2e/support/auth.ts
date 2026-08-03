import type { Page } from "@playwright/test";

// The access token is memory-only (never a cookie or localStorage), so Playwright's usual
// storageState login shortcut doesn't apply here — every spec needing a session goes through
// this real registration flow.
export async function registerAndLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");
}
