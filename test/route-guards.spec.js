const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  go,
  loginBypass,
  seedWorker,
  seedEmployer
} = require("./helpers");

test.describe("auth route guards and role permissions", () => {
  test("logged out users only see public/login pages through normal flow", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);

    await expectActiveScreen(page, "landing");
    await expect(page.locator("#bottomNav")).toBeEmpty();
    await page.locator('[data-go="otp"]').first().click();
    await expectActiveScreen(page, "otp");
    await expect(page.locator("#bottomNav")).toBeEmpty();

    await expectNoBrowserErrors(errors);
  });

  test("direct protected screen calls are blocked while logged out", async ({ page }) => {
    await openFresh(page);
    await go(page, "jobs");
    await expect(page.locator("#jobs")).not.toHaveClass(/active/);
    await expectActiveScreen(page, "landing");
  });

  test("worker without employer profile is forced to business setup for employer routes", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await loginBypass(page);
    await seedWorker(page);
    await go(page, "profile");
    await page.locator('[data-switch-mode="employer"]').click();
    await expectActiveScreen(page, "employerSetup");
    await expectNoBrowserErrors(errors);
  });

  test("employer without worker profile is forced to worker setup for worker routes", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await go(page, "employerProfile");
    await page.locator('[data-switch-mode="worker"]').click();
    await expectActiveScreen(page, "workerBasic");
    await expectNoBrowserErrors(errors);
  });
});
