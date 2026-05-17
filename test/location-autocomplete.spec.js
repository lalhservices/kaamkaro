const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  loginBypass,
  seedWorker,
  go
} = require("./helpers");

async function chooseLocation(page, inputSelector, query, expectedText) {
  await page.locator(inputSelector).fill(query);
  const option = page.locator(".location-autocomplete.show button").filter({ hasText: expectedText }).first();
  await expect(option).toBeVisible();
  await option.click();
}

test.describe("India location autocomplete", () => {
  test("worker setup requires a selected structured village/city location", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 360);
    await loginBypass(page, "9876543210");
    await expectActiveScreen(page, "role");
    await page.locator('[data-go="workerBasic"]').first().click();

    await page.locator("#workerName").fill("Aman Lalh");
    await page.locator("#workerAge").fill("25");
    await page.locator("#workerCity").fill("Random Unmatched Location");
    await page.locator("[data-worker-basic]").click();
    await expect(page.locator("#toast")).toContainText("Please select a location from the list.");
    await expectActiveScreen(page, "workerBasic");

    await chooseLocation(page, "#workerCity", "Bainsa", "Bainsa, Shaheed Bhagat Singh Nagar, Punjab");
    await page.locator("[data-worker-basic]").click();
    await expectActiveScreen(page, "workerWork");

    const saved = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      return { user: state.user, worker: state.worker };
    });
    expect(saved.worker.city).toBe("Bainsa");
    expect(saved.worker.district).toBe("Shaheed Bhagat Singh Nagar");
    expect(saved.worker.state).toBe("Punjab");
    expect(saved.worker.country).toBe("India");
    expect(saved.worker.formatted_location).toContain("Bainsa, Shaheed Bhagat Singh Nagar, Punjab");
    expect(saved.worker.place_id).toBe("in-bainsa-sbsn-pb");
    expect(saved.worker.lat).toEqual(expect.any(Number));
    expect(saved.worker.lng).toEqual(expect.any(Number));
    expect(saved.user.city).toBe("Bainsa");
    await expectNoBrowserErrors(errors);
  });

  test("employer business setup saves Delhi and Chandigarh as city=district=state", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "employerSetup");

    await page.locator("#businessName").fill("Kaam Test Store");
    await page.locator("#contactName").fill("Aman Lalh");
    await page.locator("#businessPhone").fill("9876543210");
    await chooseLocation(page, "#businessLocation", "Chandigarh", "Chandigarh");
    await page.locator("#businessType").selectOption({ label: "Retail Shop" });
    await page.locator("[data-finish-employer]").click();
    await expectActiveScreen(page, "employerDash");

    const saved = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      return state.businessProfiles[state.defaultBusinessId];
    });
    expect(saved.city).toBe("Chandigarh");
    expect(saved.district).toBe("Chandigarh");
    expect(saved.state).toBe("Chandigarh");
    expect(saved.country).toBe("India");
    expect(saved.formatted_location).toBe("Chandigarh, India");
    await expectNoBrowserErrors(errors);
  });

  test("job post and profile edit reject plain unmatched location text", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);

    await go(page, "profile");
    await page.locator('[data-edit-profile="workerLocation"]').click();
    await expectActiveScreen(page, "profileEdit");
    await page.locator("#profileEditInput").fill("Not A City");
    await page.locator("[data-save-profile-edit]").filter({ visible: true }).first().click();
    await expect(page.locator("#toast")).toContainText("Please select a location from the list.");

    await chooseLocation(page, "#profileEditInput", "Delhi", "Delhi");
    await page.locator("[data-save-profile-edit]").filter({ visible: true }).first().click();
    await expectActiveScreen(page, "profile");
    const profileLocation = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")).worker);
    expect(profileLocation.city).toBe("Delhi");
    expect(profileLocation.district).toBe("Delhi");
    expect(profileLocation.state).toBe("Delhi");
    await expectNoBrowserErrors(errors);
  });
});
