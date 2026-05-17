const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  loginBypass,
  completeWorkerSetup,
  seedWorker,
  seedEmployer,
  go
} = require("./helpers");

test.describe("main flows, form validation, and fraud blocking", () => {
  test("worker can login, complete setup, apply, and see application confirmation", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await loginBypass(page, "9876543210");
    await completeWorkerSetup(page);
    await page.locator("[data-apply-job]").first().click();
    await expectActiveScreen(page, "applied");
    await expect(page.locator("#applied")).toContainText("Application sent");
    await expect(page.locator("#applied")).not.toContainText("Employer viewed your profile");
    await expectNoBrowserErrors(errors);
  });

  test("new phone login starts a fresh account without old chats or applications", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await loginBypass(page, "9876543210");
    await completeWorkerSetup(page);
    await page.locator("[data-apply-job]").first().click();
    await expectActiveScreen(page, "applied");

    await go(page, "otp");
    await page.locator("#phoneInput").fill("9123456780");
    await page.locator("[data-send-otp]").click();
    await page.waitForFunction(() => {
      const state = JSON.parse(localStorage.getItem("kkState") || "{}");
      return state.user && state.user.phone === "9123456780";
    });
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.user.phone).toBe("9123456780");
    expect(state.applications).toEqual([]);
    expect(state.conversations).toEqual([]);
    expect(state.messages).toEqual([]);
    await expectNoBrowserErrors(errors);
  });

  test("invalid forms show clean errors and stay on screen", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await page.locator('[data-go="otp"]').first().click();
    await page.locator("#phoneInput").fill("123");
    await page.locator("[data-send-otp]").click();
    await expect(page.locator("#toast")).toContainText("Enter a valid 10 digit phone number");
    await expectActiveScreen(page, "otp");

    await seedEmployer(page);
    await go(page, "postJob");
    await page.locator("#postTitle").fill("Chef");
    await page.locator("#postPayAmount").fill("1000");
    await page.locator("#postLocation").fill("NotARealPlace");
    await page.locator("#postDesc").fill("Too short");
    await page.locator("[data-review-job]").click();
    await expect(page.locator("#toast")).toContainText("Please select a location from the list.");
    await expectActiveScreen(page, "postJob");
    await expectNoBrowserErrors(errors);
  });

  test("job scam words are blocked before publish", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await go(page, "postJob");

    await page.locator("#postTitle").fill("Office job");
    await page.locator("#postPayAmount").fill("18000");
    await page.locator("#postLocation").fill("Delhi, India");
    await page.locator("#postDesc").fill("Daily tasks include customer service and stock handling. Registration fee and security deposit must be paid before joining this job.");
    await page.locator("[data-review-job]").click();
    await expectActiveScreen(page, "jobVisibility");
    await page.locator('[data-visibility="boost"]').click();
    await page.locator("#jobRules").check();
    await page.locator("[data-post-job]").click();
    await page.locator("[data-confirm-post-job]").click();
    await expect(page.locator("#toast")).toContainText("cannot be published");
    await expect(page.locator("#published")).not.toHaveClass(/active/);
    await expectNoBrowserErrors(errors);
  });

  test("free job limit blocks second active free post and explains rule", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await go(page, "postJob");

    await page.locator("#postTitle").fill("Delivery Helper");
    await page.locator("#postPayAmount").fill("12000");
    await page.locator("#postLocation").fill("Delhi, India");
    await page.locator("#postDesc").fill("Daily tasks include helping customers, handling stock, keeping the shop clean, and supporting the team during busy hours.");
    await page.locator("[data-review-job]").click();
    await expectActiveScreen(page, "jobVisibility");
    await page.locator('[data-visibility="free"]').click();
    await page.locator("#jobRules").check();
    await page.locator("[data-post-job]").click();
    await page.locator("[data-confirm-post-job]").click();
    await expect(page.locator("#toast")).toContainText("already have 1 free job live");
    await expect(page.locator("#published")).not.toHaveClass(/active/);
    await expectNoBrowserErrors(errors);
  });

  test("unsafe chat message is blocked and logged", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedWorker(page);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      state.conversations = [{
        id: "qa-chat",
        jobId: "clerk",
        workerId: "qa-worker",
        employerId: "qa-employer",
        status: "active",
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        lastMessage: "",
        unreadWorker: 0,
        unreadEmployer: 0,
        deletedForWorker: [],
        deletedForEmployer: []
      }];
      state.messages = [];
      localStorage.setItem("kkState", JSON.stringify(state));
    });
    await page.reload();
    await go(page, "chat");
    await page.locator('[data-open-conversation="qa-chat"]').click();
    await page.locator("#chatText").fill("Please pay registration fee before job starts");
    await page.locator("#sendChat").click();
    await expect(page.locator("#modalTitle")).toContainText("Message blocked for safety");
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")).moderationLogs || []);
    expect(logs.length).toBeGreaterThan(0);
    await expectNoBrowserErrors(errors);
  });
});
