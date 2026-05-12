const { defineConfig, devices } = require("@playwright/test");
const path = require("path");

const appPath = path.resolve(__dirname, "kaam-karo-app", "index.html").replace(/\\/g, "/");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "qa-report", open: "never" }]],
  outputDir: "qa-results",
  use: {
    baseURL: `file:///${appPath}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
