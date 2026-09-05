import { expect, test } from "@playwright/test";

test.describe("Site hardening", () => {
  test("homepage shows a truthful primary season state", async ({ page }) => {
    await page.goto("/");

    const matches = page.getByRole("region", { name: "Kampe og resultater" });
    await expect(matches).toBeVisible();
    await expect(matches).toContainText(/Næste kamp|Live nu/);
    await expect(matches.getByRole("link", { name: /Se kampprogram/ })).toBeVisible();
    const info = matches.getByRole("link", { name: "Kampinfo", exact: true });
    if (await info.count()) {
      await expect(info).toHaveAttribute("href", /\/kampe\/.+/);
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
