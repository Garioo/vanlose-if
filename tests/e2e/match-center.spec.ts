import { expect, test } from "@playwright/test";

test.describe("Match center", () => {
  test("match center page renders scorebar, timeline and lineup sections", async ({ page, request }) => {
    const response = await request.get("/api/matches");
    expect(response.ok()).toBeTruthy();
    const matches = (await response.json().catch(() => [])) as Array<{ id?: string }>;
    test.skip(!Array.isArray(matches) || matches.length === 0 || !matches[0]?.id, "Ingen kampe at teste mod.");

    const matchId = matches[0].id as string;
    await page.goto(`/kampe/${matchId}`);

    await expect(page.getByText("LIVE TIDSLINJE")).toBeVisible();
    await expect(page.getByText("VANLØSE LINEUP")).toBeVisible();
    await expect(page.locator("body")).toContainText(/KOMMENDE|LIVE|SLUT/);
  });
});
