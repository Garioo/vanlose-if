import { expect, test } from "@playwright/test";

test.describe("Public forms", () => {
  test("contact form can be submitted", async ({ page }) => {
    await page.goto("/kontakt");

    await page.getByPlaceholder("Dit navn").fill("Test Bruger");
    await page.getByPlaceholder("din@email.dk").fill(`kontakt-${Date.now()}@example.com`);
    await page.locator("select").first().selectOption("Medlemskab");
    await page.getByPlaceholder("Skriv din besked her...").fill("Hej Vanløse IF, dette er en testbesked.");

    await page.getByRole("button", { name: "SEND BESKED" }).click();
    await expect(page.getByText("Tak. Din besked er modtaget, og vi svarer hurtigst muligt.")).toBeVisible();
  });

  test("volunteer form can be submitted", async ({ page }) => {
    await page.goto("/frivillig");

    await page.getByPlaceholder("Dit fulde navn").fill("Frivillig Test");
    await page.getByPlaceholder("din@email.dk").fill(`frivillig-${Date.now()}@example.com`);
    await page.locator("#tilmeld select").first().selectOption("Event & Kiosk");

    await page.getByRole("button", { name: "SEND TILMELDING" }).click();
    await expect(page.getByText("Tak. Vi kontakter dig snart om næste skridt.")).toBeVisible();
  });

  test("newsletter form can be submitted", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Din e-mail adresse").fill(`nyhedsbrev-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Tilmeld" }).click();

    await expect(page.getByText("Tak. Du er nu tilmeldt nyhedsbrevet.")).toBeVisible();
  });
});
