const path = require("path");
const { expect } = require("@playwright/test");

const APP_URL = "file:///" + path.resolve(__dirname, "..", "kaam-karo-app", "index.html").replace(/\\/g, "/");
const PHONE_WIDTHS = [320, 360, 375, 390, 414, 430];
const PHONE_PROFILES = [
  { name: "small-android-320", width: 320, height: 760 },
  { name: "vivo-budget-360", width: 360, height: 800 },
  { name: "samsung-am-360", width: 360, height: 844 },
  { name: "iphone-se-375", width: 375, height: 667 },
  { name: "iphone-13-390", width: 390, height: 844 },
  { name: "oppo-realme-390", width: 390, height: 820 },
  { name: "xiaomi-redmi-393", width: 393, height: 873 },
  { name: "iphone-pro-max-430", width: 430, height: 932 }
];
const DEFAULT_HEIGHT = 844;

function attachErrorGuards(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/net::ERR_NETWORK_ACCESS_DENIED/i.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

async function openFresh(page, width = 390, height = DEFAULT_HEIGHT) {
  await page.setViewportSize({ width, height });
  await page.goto(APP_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator("#landing")).toHaveClass(/active/);
}

async function expectNoBrowserErrors(errors) {
  expect(errors, "No console/page errors").toEqual([]);
}

async function expectActiveScreen(page, screenId) {
  await expect(page.locator(`#${screenId}`)).toHaveClass(/active/);
}

async function go(page, screenId) {
  await page.evaluate((id) => window.kkGo && window.kkGo(id), screenId);
  await page.waitForFunction(() => {
    const screen = document.querySelector(".screen.active");
    if (!screen) return false;
    const transform = window.getComputedStyle(screen).transform;
    if (!transform || transform === "none") return true;
    const matrix = new DOMMatrixReadOnly(transform);
    return Math.abs(matrix.m41) < 1;
  });
}

async function clickUnique(locator) {
  const visibleLocator = locator.filter({ visible: true });
  await expect(visibleLocator).toHaveCount(1);
  await visibleLocator.click();
}

async function loginBypass(page, phone = "9876543210") {
  await clickUnique(page.locator('[data-go="otp"]').first());
  await page.locator("#phoneInput").fill(phone);
  await clickUnique(page.locator("[data-send-otp]"));
}

async function completeWorkerSetup(page) {
  await expectActiveScreen(page, "role");
  await clickUnique(page.locator('[data-go="workerBasic"]'));
  await page.locator("#workerName").fill("Aman Lalh");
  await page.locator("#workerAge").fill("25");
  await page.locator("#workerCity").fill("Delhi, India");
  await clickUnique(page.locator("[data-worker-basic]"));
  await expectActiveScreen(page, "workerWork");
  await clickUnique(page.locator('[data-go="workerSkills"]'));
  await expectActiveScreen(page, "workerSkills");
  await clickUnique(page.locator('[data-go="workerLocation"]'));
  await expectActiveScreen(page, "workerLocation");
  await clickUnique(page.locator('[data-go="workerTrust"]'));
  await expectActiveScreen(page, "workerTrust");
  await clickUnique(page.locator("[data-finish-worker]").first());
  await expectActiveScreen(page, "jobs");
}

async function seedWorker(page) {
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kkState") || "null") || {};
    state.user = {
      id: "qa-user-worker",
      displayName: "Aman Lalh",
      phone: "9876543210",
      city: "Delhi",
      location: "Delhi, India",
      phoneVerified: true,
      photoVerificationStatus: "not_uploaded",
      photoVerified: false,
      authenticated: true
    };
    state.workerComplete = true;
    state.defaultWorkerId = "qa-worker";
    state.workerProfiles = {
      "qa-worker": {
        workerId: "qa-worker",
        userId: "qa-user-worker",
        name: "Aman Lalh",
        city: "Delhi",
        skills: ["Cleaning"],
        photo_verified: false
      }
    };
    state.worker = {
      id: "qa-worker",
      name: "Aman Lalh",
      gender: "",
      age: "25",
      city: "Delhi",
      experience: "Fresher",
      skills: ["Cleaning"],
      jobTypes: [],
      availability: "Open to any day and any time",
      preferredJob: "Any Job",
      preferredType: "Full-time",
      phoneVerified: true,
      photoVerified: false,
      startAvailability: "Immediate",
      availableDays: ["Monday"],
      shiftPreference: "Morning",
      flexibleAvailability: false
    };
    state.employerComplete = false;
    state.defaultBusinessId = "";
    state.businessProfiles = {};
    localStorage.setItem("kkState", JSON.stringify(state));
    localStorage.setItem("kkRole", "worker");
  });
  await page.reload();
}

async function seedEmployer(page) {
  await page.evaluate(() => {
    const baseJobs = [
      {
        id: "qa-job-1",
        businessId: "qa-biz",
        employerId: "qa-worker",
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
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 86400000
      }
    ];
    const state = JSON.parse(localStorage.getItem("kkState") || "null") || {};
    state.user = {
      id: "qa-user-employer",
      displayName: "Rick Sharma",
      phone: "9876543210",
      city: "Delhi",
      location: "Delhi, India",
      phoneVerified: true,
      photoVerificationStatus: "not_uploaded",
      photoVerified: false,
      authenticated: true
    };
    state.workerComplete = false;
    state.defaultWorkerId = "";
    state.workerProfiles = {};
    state.worker = { id: "qa-worker", name: "", city: "", skills: [], jobTypes: [], phoneVerified: true };
    state.employerComplete = true;
    state.defaultBusinessId = "qa-biz";
    state.businessProfiles = {
      "qa-biz": {
        businessId: "qa-biz",
        ownerId: "qa-user-employer",
        businessName: "QA Retail",
        contactPersonName: "Rick Sharma",
        city: "Delhi",
        phone: "9876543210",
        type: "Retail Shop",
        createdAt: Date.now()
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
    state.jobs = baseJobs;
    state.applications = [];
    state.conversations = [];
    state.messages = [];
    localStorage.setItem("kkState", JSON.stringify(state));
    localStorage.setItem("kkRole", "employer");
  });
  await page.reload();
}

async function expectNoHorizontalScroll(page) {
  const metrics = await page.evaluate(() => ({
    bodyScroll: document.body.scrollWidth,
    docScroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    phoneScroll: document.querySelector(".phone") ? document.querySelector(".phone").scrollWidth : 0,
    phoneWidth: document.querySelector(".phone") ? document.querySelector(".phone").clientWidth : 0
  }));
  expect(metrics.bodyScroll, "body should not horizontally scroll").toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.docScroll, "document should not horizontally scroll").toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.phoneScroll, "phone container should not overflow").toBeLessThanOrEqual(metrics.phoneWidth + 1);
}

async function expectResponsiveIntegrity(page) {
  const issues = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const phone = document.querySelector(".phone") || document.body;
    const phoneRect = phone.getBoundingClientRect();
    const active = document.querySelector(".screen.active") || document.body;
    const selectors = [
      ".screen.active button",
      ".screen.active .btn",
      ".screen.active .chip",
      ".screen.active .card",
      ".screen.active .panel",
      ".screen.active .list-row",
      ".screen.active input",
      ".screen.active textarea",
      ".screen.active select",
      "#bottomNav:not([hidden]) button"
    ];
    const bad = [];
    const seen = new Set();
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const label = (el.textContent || el.getAttribute("aria-label") || el.className || el.tagName).trim().replace(/\s+/g, " ").slice(0, 80);
      if (rect.left < phoneRect.left - 1 || rect.right > phoneRect.right + 1 || rect.left < -1 || rect.right > viewportWidth + 1) {
        bad.push(`overflow: ${label}`);
      }
      if (el.matches(".btn") && rect.height > 68) {
        bad.push(`double-line CTA: ${label}`);
      }
      if (el.matches(".btn, .circle, .icon, #bottomNav button") && rect.height < 34) {
        bad.push(`small tap target: ${label}`);
      }
      if (el.scrollWidth > el.clientWidth + 2 && style.overflowX === "visible") {
        bad.push(`text clipped: ${label}`);
      }
    });
    if (active.scrollWidth > active.clientWidth + 1) bad.push("active screen horizontal overflow");
    return bad;
  });
  expect(issues, "No clipped text, overflowing cards/buttons, or unsafe tap targets").toEqual([]);
}

module.exports = {
  APP_URL,
  PHONE_WIDTHS,
  PHONE_PROFILES,
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  go,
  loginBypass,
  completeWorkerSetup,
  seedWorker,
  seedEmployer,
  expectNoHorizontalScroll,
  expectResponsiveIntegrity
};
