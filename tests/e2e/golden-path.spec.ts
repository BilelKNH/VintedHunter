import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./support/auth.js";

test("golden path: register, create search, browse listings, favorite, logout", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@test.local`;
  const password = "correct-horse-battery";
  const searchName = `E2E Nike Hunter ${Date.now()}`;

  await registerAndLogin(page, email, password);
  await expect(page).toHaveURL(/\/dashboard/);

  // Create a search
  await page.goto("/searches/new");
  await page.getByLabel("Name").fill(searchName);
  await page.getByRole("button", { name: "Create search" }).click();
  await page.waitForURL("**/searches");
  await expect(page.getByText(searchName)).toBeVisible();

  // Browse listings and favorite the first one
  await page.goto("/listings");
  const firstFavoriteButton = page.getByRole("button", { name: "Add to favorites" }).first();
  await firstFavoriteButton.click();
  await expect(page.getByRole("button", { name: "Remove from favorites" }).first()).toBeVisible();

  // Favorite should persist across a reload (backed by GET /listings/favorites)
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove from favorites" }).first()).toBeVisible();

  // Logout
  await page.getByRole("button", { name: email }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.waitForURL("**/login");

  // Protected routes bounce back to /login once logged out
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
});
