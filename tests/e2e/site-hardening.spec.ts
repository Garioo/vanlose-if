import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!password, "ADMIN_PASSWORD must be set to verify admin inbox flows.");

  await page.goto("/admin/login");
  await page.getByPlaceholder("••••••••").fill(password!);
  await page.getByRole("button", { name: "LOG IND" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

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

  test("membership submissions appear in the admin inbox", async ({ page }) => {
    const email = `e2e-medlem-${Date.now()}@example.com`;

    await page.goto("/bliv-medlem");
    await page.getByPlaceholder("Dit fulde navn").fill("E2E Medlem");
    await page.getByPlaceholder("+45 00 00 00 00").fill("+45 44 44 44 44");
    await page.getByPlaceholder("din@email.dk").fill(email);
    await page.locator("#tilmeld select").selectOption("Aktiv");
    await page.getByRole("button", { name: "TILMELD MIG SOM MEDLEM" }).click();
    await expect(page.getByText("Tak. Din medlemsanmodning er modtaget, og vi vender tilbage hurtigst muligt.")).toBeVisible();

    await loginAsAdmin(page);
    await page.goto("/admin/henvendelser");
    await page.getByRole("button", { name: /Medlemskab/ }).click();
    await page.getByPlaceholder("Navn, e-mail, telefon, medlemskab...").fill(email);
    await expect(page.getByText(email)).toBeVisible();
  });
});
