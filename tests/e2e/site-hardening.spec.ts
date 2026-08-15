import { expect, test } from "@playwright/test";

test.describe("Site hardening", () => {
  test("homepage shows a truthful primary season state", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("body")).toContainText(/Næste Kamp|Sæsonen 2026/);

    const bodyText = (await page.locator("body").textContent()) ?? "";
    if (bodyText.includes("Næste Kamp")) {
      await expect(page.getByRole("link", { name: "Se Match Center" })).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Se Kampprogram" })).toBeVisible();
    }
  });

  test("public placeholder sponsor and board content is not shown", async ({ page }) => {
    await page.goto("/sponsorer");
    await expect(page.locator("body")).not.toContainText("Sponsor A/S");
    await expect(page.locator("body")).not.toContainText("Lokal Partner 1");

    await page.goto("/klubben");
    await expect(page.locator("body")).not.toContainText("Erik Hansen");
    await expect(page.locator("body")).not.toContainText("Klubbens Vedtægter 2024");
  });
});
