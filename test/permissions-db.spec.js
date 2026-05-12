const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  seedWorker,
  seedEmployer,
  go
} = require("./helpers");

test.describe("client-side permission smoke tests", () => {
  test("worker mode does not expose employer applicant actions without employer profile", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedWorker(page);
    await go(page, "jobs");
    await expect(page.locator(".screen.active [data-accept-app], .screen.active [data-reject-app], .screen.active [data-post-job]")).toHaveCount(0);
    await expectNoBrowserErrors(errors);
  });

  test("employer mode does not expose worker apply controls on employer dashboard", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await go(page, "employerDash");
    await expect(page.locator(".screen.active [data-apply-job]")).toHaveCount(0);
    await expectNoBrowserErrors(errors);
  });

  test("Supabase RLS policies must be tested with two real auth sessions before launch", async () => {
    test.skip(
      !process.env.SUPABASE_E2E_USER_A || !process.env.SUPABASE_E2E_USER_B,
      "Set SUPABASE_E2E_USER_A and SUPABASE_E2E_USER_B to run real cross-user RLS tests."
    );
    expect(process.env.SUPABASE_E2E_USER_A).toBeTruthy();
    expect(process.env.SUPABASE_E2E_USER_B).toBeTruthy();
  });
});
