const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  seedWorker,
  go
} = require("./helpers");

async function seedAcceptedMatch(page, role = "employer") {
  await page.evaluate((activeRole) => {
    const now = Date.now();
    const state = JSON.parse(localStorage.getItem("kkState") || "{}");
    state.user = {
      id: activeRole === "employer" ? "qa-user-employer" : "qa-user-worker",
      displayName: activeRole === "employer" ? "Rick Sharma" : "Aman Lalh",
      phone: "9876543210",
      city: "Delhi",
      location: "Delhi, India",
      phoneVerified: true,
      authenticated: true,
      photoVerificationStatus: "verified",
      photoVerified: true,
      activeRole
    };
    state.workerComplete = true;
    state.defaultWorkerId = "qa-worker";
    state.worker = {
      id: "qa-worker",
      name: "Aman Lalh",
      age: "25",
      city: "Delhi",
      state: "Delhi",
      experience: "2+ years",
      skills: ["Cleaning", "Customer Service", "Data Entry"],
      jobTypes: ["Office Work"],
      availability: "Available immediately for weekday and weekend shifts",
      preferredJob: "Office Work",
      preferredType: "Full-time",
      phoneVerified: true,
      photoVerified: true
    };
    state.workerProfiles = {
      "qa-worker": {
        workerId: "qa-worker",
        userId: "qa-user-worker",
        name: "Aman Lalh",
        city: "Delhi",
        skills: state.worker.skills,
        photo_verified: true
      }
    };
    state.employerComplete = true;
    state.defaultBusinessId = "qa-biz";
    state.businessProfiles = {
      "qa-biz": {
        businessId: "qa-biz",
        ownerId: "qa-user-employer",
        businessName: "QA Retail",
        contactPersonName: "Rick Sharma",
        city: "Delhi",
        type: "Retail Shop",
        createdAt: now - 40 * 86400000
      }
    };
    state.employer = {
      id: "qa-biz",
      ownerId: "qa-user-employer",
      name: "Rick Sharma",
      business: "QA Retail",
      phone: "9876543210",
      type: "Retail Shop",
      city: "Delhi"
    };
    state.jobs = [{
      id: "qa-job-1",
      businessId: "qa-biz",
      employerId: "qa-biz",
      companyName: "QA Retail",
      title: "Office Clerk",
      pay: "Rs 18000 month",
      city: "Delhi",
      distance: "Nearby",
      type: "Full-time",
      employer: "QA Retail",
      badge: "New",
      visibility: "free",
      remote: false,
      desc: "Counter billing, records and basic customer help.",
      status: "approved",
      createdAt: now
    }];
    state.applications = [{
      id: "qa-app-1",
      jobId: "qa-job-1",
      workerId: "qa-worker",
      employerId: "qa-biz",
      status: "Accepted",
      createdAt: now,
      updatedAt: now
    }];
    state.conversations = [{
      id: "qa-chat-1",
      jobId: "qa-job-1",
      applicationId: "qa-app-1",
      workerId: "qa-worker",
      employerId: "qa-biz",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      lastMessage: "Employer accepted your interest. You can now chat directly.",
      unreadWorker: 1,
      unreadEmployer: 0,
      favouriteWorker: false,
      favouriteEmployer: false,
      deletedForWorker: [],
      deletedForEmployer: []
    }];
    state.messages = [{
      id: "qa-msg-system",
      conversationId: "qa-chat-1",
      senderId: "rick",
      text: "Employer accepted your interest. You can now chat directly.",
      createdAt: now,
      status: "delivered",
      deliveryStatus: "delivered",
      flaggedRisk: false,
      isSystem: true
    }];
    state.blockedPairs = [];
    state.reports = [];
    localStorage.setItem("kkState", JSON.stringify(state));
    localStorage.setItem("kkRole", activeRole);
  }, role);
  await page.reload();
}

test.describe("applicants, profile views, and chat lifecycle", () => {
  test("accepted tab removes accept/reject and shows profile, chat, disconnect", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedAcceptedMatch(page, "employer");
    await go(page, "applicants");
    await page.locator('#allApplicants [data-applicants-tab="accepted"]').click();

    await expect(page.locator("#allApplicants [data-accept-app]")).toHaveCount(0);
    await expect(page.locator("#allApplicants [data-reject-app]")).toHaveCount(0);
    await expect(page.locator("#allApplicants")).toContainText("View profile");
    await expect(page.locator("#allApplicants")).toContainText("Chat");
    await expect(page.locator("#allApplicants")).toContainText("Disconnect");
    await expectNoBrowserErrors(errors);
  });

  test("employer opens premium worker profile with correct accepted actions", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedAcceptedMatch(page, "employer");
    await go(page, "applicants");
    await page.locator('#allApplicants [data-applicants-tab="accepted"]').click();
    await page.locator("#allApplicants [data-open-worker]").first().click();

    await expectActiveScreen(page, "workerProfileView");
    await expect(page.locator("#fullWorkerProfile")).toContainText("Profile strength");
    await expect(page.locator("#fullWorkerProfile")).toContainText("Safety note");
    await expect(page.locator("#workerProfileActions")).toContainText("Chat");
    await expect(page.locator("#workerProfileActions")).toContainText("Disconnect");
    await expect(page.locator("#workerProfileActions")).not.toContainText("Accept & Chat");
    await expectNoBrowserErrors(errors);
  });

  test("worker can open employer public profile without private details", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedWorker(page);
    await seedAcceptedMatch(page, "worker");
    await go(page, "jobs");
    await page.locator("[data-open-employer-profile]").first().click();

    await expectActiveScreen(page, "employerPublicProfile");
    await expect(page.locator("#publicEmployerProfile")).toContainText("QA Retail");
    await expect(page.locator("#publicEmployerProfile")).toContainText("Jobs posted");
    await expect(page.locator("#publicEmployerProfile")).toContainText("Safety note");
    await expect(page.locator("#publicEmployerProfile")).not.toContainText("9876543210");
    await expectNoBrowserErrors(errors);
  });

  test("sender sees delivered but not fake seen until receiver opens chat", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedAcceptedMatch(page, "employer");
    await go(page, "chat");
    await page.locator('[data-open-conversation="qa-chat-1"]').click();
    await page.locator("#chatText").fill("Can you start tomorrow?");
    await page.locator("#sendChat").click();
    await expect(page.locator(".msg.right").last()).toContainText("sent");
    await page.waitForTimeout(650);
    await expect(page.locator(".msg.right").last()).toContainText("delivered");
    await expect(page.locator(".msg.right").last()).not.toContainText("seen");

    await seedAcceptedMatch(page, "worker");
    await go(page, "chat");
    await page.locator('[data-open-conversation="qa-chat-1"]').click();
    await expect(page.locator(".msg.left").last()).not.toContainText("seen");
    await expectNoBrowserErrors(errors);
  });

  test("disconnect removes chat and matched application from both lists", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedAcceptedMatch(page, "employer");
    await go(page, "chat");
    await page.locator('[data-delete-chat="qa-chat-1"]').click();
    await expect(page.locator("#modalTitle")).toContainText("Disconnect this match");
    await page.locator('[data-confirm-delete-chat="qa-chat-1"]').click();

    await expect(page.locator("#chatArea")).toContainText("No conversations yet");
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.conversations.some((chat) => chat.id === "qa-chat-1")).toBe(false);
    expect(state.applications.some((app) => app.id === "qa-app-1")).toBe(false);
    expect(state.blockedPairs.some((pair) => pair.conversationId === "qa-chat-1")).toBe(true);
    await expectNoBrowserErrors(errors);
  });
});
