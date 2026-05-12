const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const {
  PHONE_PROFILES,
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectNoHorizontalScroll,
  expectResponsiveIntegrity,
  go,
  seedWorker
} = require("./helpers");

const screenshotDir = path.resolve(__dirname, "..", "qa-screenshots");

test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

for (const lang of ["en", "hi"]) {
  for (const profile of PHONE_PROFILES) {
    test(`responsive ${lang} on ${profile.name} has no overflow, clipped text, or broken shell`, async ({ page }) => {
      const errors = attachErrorGuards(page);
      await openFresh(page, profile.width, profile.height);

      if (lang === "hi") {
        await page.locator('[data-lang="hi"]').click();
        await expect(page.locator("html")).toHaveAttribute("lang", "hi");
        await expect(page.locator("body")).not.toContainText(/[\u00e2\u00c3\u00c2]|\u00e0\u00a4/);
      }

      await expectNoHorizontalScroll(page);
      await expectResponsiveIntegrity(page);
      await page.screenshot({ path: path.join(screenshotDir, `${lang}-landing-${profile.name}.png`), fullPage: false });

      await seedWorker(page);
      await go(page, "jobs");
      await expectNoHorizontalScroll(page);
      await expectResponsiveIntegrity(page);
      await page.screenshot({ path: path.join(screenshotDir, `${lang}-jobs-${profile.name}.png`), fullPage: false });

      await expectNoBrowserErrors(errors);
    });
  }
}
