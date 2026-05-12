const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const {
  PHONE_WIDTHS,
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectNoHorizontalScroll,
  go,
  seedWorker
} = require("./helpers");

const screenshotDir = path.resolve(__dirname, "..", "qa-screenshots");

test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

for (const lang of ["en", "hi"]) {
  for (const width of PHONE_WIDTHS) {
    test(`responsive ${lang} at ${width}px has no horizontal scroll or clipped app shell`, async ({ page }) => {
      const errors = attachErrorGuards(page);
      await openFresh(page, width);

      if (lang === "hi") {
        await page.locator('[data-lang="hi"]').click();
        await expect(page.locator("html")).toHaveAttribute("lang", "hi");
        await expect(page.locator("body")).not.toContainText(/[âÃÂ]|à¤/);
      }

      await expectNoHorizontalScroll(page);
      await page.screenshot({ path: path.join(screenshotDir, `${lang}-landing-${width}.png`), fullPage: false });

      await seedWorker(page);
      await go(page, "jobs");
      await expectNoHorizontalScroll(page);
      await page.screenshot({ path: path.join(screenshotDir, `${lang}-jobs-${width}.png`), fullPage: false });

      await expectNoBrowserErrors(errors);
    });
  }
}
