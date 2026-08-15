import { expect, test } from "@playwright/test";

const REMOVED_INTAKE_ENDPOINTS = [
  "/api/contact",
  "/api/volunteer",
  "/api/membership",
  "/api/newsletter",
];

test.describe("Contact routes", () => {
  test("removed intake endpoints no longer accept submissions", async ({ request }) => {
    for (const endpoint of REMOVED_INTAKE_ENDPOINTS) {
      const response = await request.post(endpoint, {
        data: { name: "Test", email: "test@example.com" },
      });

      expect(response.status(), `${endpoint} should be gone`).toBe(404);
    }
  });

  test("kontakt page exposes mailto and tel links instead of a form", async ({ page }) => {
    await page.goto("/kontakt");

    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
  });

  test("bliv-medlem offers a mailto per membership tier", async ({ page }) => {
    await page.goto("/bliv-medlem");

    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.locator('#tilmeld a[href^="mailto:"]').first()).toBeVisible();
  });

  test("frivillig keeps its #tilmeld anchor reachable from the homepage", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Bliv Frivillig" }).click();
    await expect(page).toHaveURL(/\/frivillig#tilmeld$/);
    await expect(page.locator('#tilmeld a[href^="mailto:"]').first()).toBeVisible();
  });
});
