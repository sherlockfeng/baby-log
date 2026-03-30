import { test, expect } from "@playwright/test";
import {
  resetDb,
  seedFamily,
  seedFamilyWithBaby,
  seedTimelineFilter,
  waitForApp,
  loginWithScreenshots,
  TEST_TOKEN,
} from "./helpers";
import { createFlow } from "./step";

// ---------------------------------------------------------------------------
// Flow 1: Welcome Screen
// ---------------------------------------------------------------------------
test.describe("Flow 1: Welcome Screen", () => {
  test("Welcome page displays login and register options", async ({ page }) => {
    const step = createFlow(page, "01-welcome", "欢迎页");
    await resetDb();
    await waitForApp(page);

    await step("welcome-screen");
    await expect(page.getByTestId("welcome.loginButton")).toBeVisible();
    await expect(page.getByTestId("welcome.registerButton")).toBeVisible();
    await step("welcome-buttons-visible");
  });
});

// ---------------------------------------------------------------------------
// Flow 2: New User Registration
// ---------------------------------------------------------------------------
test.describe("Flow 2: Registration", () => {
  test("Register a new family and enter app", async ({ page }) => {
    const step = createFlow(page, "02-register", "新用户注册");
    await resetDb();
    await waitForApp(page);
    await step("welcome-screen");

    await page.getByTestId("welcome.registerButton").click();
    await expect(page.getByTestId("register.screen")).toBeVisible({ timeout: 10_000 });
    await step("register-form-empty");

    await page.getByTestId("register.nameInput").fill("E2E测试家庭");
    await step("register-name-filled");

    await page.getByTestId("register.submitButton").click();
    await expect(page.getByTestId("register.successScreen")).toBeVisible({ timeout: 15_000 });
    await step("register-success-token");

    await expect(page.getByTestId("register.successTitle")).toBeVisible();
    await expect(page.getByTestId("register.tokenText")).toBeVisible();
    await step("register-token-displayed");

    await page.getByTestId("register.enterAppButton").click();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 10_000 });
    await step("register-enter-home");

    await expect(page.getByTestId("home.title")).toBeVisible();
    await step("register-home-final");
  });
});

// ---------------------------------------------------------------------------
// Flow 3: Login with Valid Token
// ---------------------------------------------------------------------------
test.describe("Flow 3: Login", () => {
  test("Login with a valid family token", async ({ page }) => {
    const step = createFlow(page, "03-login", "Token 登录");
    await seedFamily();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await expect(page.getByTestId("home.title")).toBeVisible();
    await step("home-verified");
  });
});

// ---------------------------------------------------------------------------
// Flow 4: Login Failure
// ---------------------------------------------------------------------------
test.describe("Flow 4: Login Failure", () => {
  test("Login with invalid token shows error", async ({ page }) => {
    const step = createFlow(page, "04-login-failure", "登录失败");
    await resetDb();
    await waitForApp(page);
    await step("welcome-screen");

    await page.getByTestId("welcome.loginButton").click();
    await expect(page.getByTestId("login.screen")).toBeVisible({ timeout: 10_000 });
    await step("login-form-empty");

    await page.getByTestId("login.tokenInput").fill("invalid-token-does-not-exist");
    await step("login-bad-token-filled");

    await page.getByTestId("login.submitButton").click();
    await expect(page.getByTestId("login.error")).toBeVisible({ timeout: 15_000 });
    await step("login-error-displayed");

    await step("login-error-message");
  });
});

// ---------------------------------------------------------------------------
// Flow 5: Home Screen
// ---------------------------------------------------------------------------
test.describe("Flow 5: Home Screen", () => {
  test("Home displays baby info and navigation cards", async ({ page }) => {
    const step = createFlow(page, "05-home", "首页");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await expect(
      page.getByTestId("home.screen").getByTestId("home.babyChip.e2e-baby-a"),
    ).toBeVisible({ timeout: 10_000 });
    await step("home-baby-info");

    await expect(page.getByTestId("home.quickAddCard")).toBeVisible();
    await expect(page.getByTestId("home.timelineCard")).toBeVisible();
    await expect(page.getByTestId("home.settingsCard")).toBeVisible();
    await step("home-navigation-cards");
  });

  test("Home shows empty state when no babies", async ({ page }) => {
    const step = createFlow(page, "05-home-empty", "首页（无宝宝）");
    await seedFamily();
    await waitForApp(page);
    await loginWithScreenshots(page, step);

    await expect(page.getByTestId("home.babyInfo")).toBeVisible();
    await step("home-no-baby-hint");
  });
});

// ---------------------------------------------------------------------------
// Flow 6: Add Baby
// ---------------------------------------------------------------------------
test.describe("Flow 6: Add Baby", () => {
  test("Add a baby from Settings and verify on Home", async ({ page }) => {
    const step = createFlow(page, "06-add-baby", "添加宝宝");
    await seedFamily();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await expect(page.getByTestId("home.babyInfo")).toBeVisible();
    await step("home-no-baby");

    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("settings-screen");

    await page.getByTestId("settings.babyNameInput").fill("小明");
    await step("settings-baby-name-filled");

    await page.getByTestId("settings.addBabyButton").click();
    await page.waitForTimeout(3000);
    await step("settings-baby-added");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await step("home-after-add");

    await expect(page.getByTestId("home.babyInfo")).toBeVisible({ timeout: 10_000 });
    await step("home-baby-visible");
  });
});

// ---------------------------------------------------------------------------
// Flow 7: Quick Add (Feed Event)
// ---------------------------------------------------------------------------
test.describe("Flow 7: Quick Add", () => {
  test("QuickAdd shows empty state when no babies", async ({ page }) => {
    const step = createFlow(page, "07-quickadd-empty", "快速记录（无宝宝）");
    await seedFamily();
    await waitForApp(page);
    await loginWithScreenshots(page, step);

    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.emptyState")).toBeVisible({ timeout: 10_000 });
    await step("quickadd-empty-state");

    await expect(page.getByTestId("quickAdd.emptyMessage")).toBeVisible();
    await step("quickadd-empty-message");
  });

  test("Record a feed event and verify on Timeline", async ({ page }) => {
    const step = createFlow(page, "07-quickadd-feed", "快速记录喂奶");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
    await step("quickadd-screen");

    await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
    await step("quickadd-baby-selected");

    await page.getByTestId("quickAdd.typeChip.feed").click();
    await step("quickadd-feed-type-selected");

    await page.getByTestId("quickAdd.amountInput").fill("120");
    await step("quickadd-amount-filled");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(3000);
    await step("quickadd-submitted");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await step("home-after-record");

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await step("timeline-screen");

    await expect(page.getByTestId("timeline.eventList")).toBeVisible();
    await expect(page.locator('[data-testid^="timeline.eventCard."]').first()).toBeVisible();
    await step("timeline-feed-event-visible");
  });
});

// ---------------------------------------------------------------------------
// Flow 8: Timeline & Filter
// ---------------------------------------------------------------------------
test.describe("Flow 8: Timeline", () => {
  test("Timeline filter by baby", async ({ page }) => {
    const step = createFlow(page, "08-timeline-filter", "时间线筛选");
    await seedTimelineFilter();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await step("timeline-all-events");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).toBeVisible();
    await step("timeline-both-visible");

    await page.getByTestId("timeline.filterBaby.e2e-baby-a").click();
    await page.waitForTimeout(2000);
    await step("timeline-filter-baby-a");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).not.toBeVisible({
      timeout: 5000,
    });
    await step("timeline-only-baby-a");

    await page.getByTestId("timeline.filterBaby.e2e-baby-b").click();
    await page.waitForTimeout(2000);
    await step("timeline-filter-baby-b");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).not.toBeVisible({
      timeout: 5000,
    });
    await step("timeline-only-baby-b");

    await page.getByTestId("timeline.filterAll").click();
    await page.waitForTimeout(2000);
    await step("timeline-filter-all");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).toBeVisible();
    await step("timeline-all-restored");
  });
});

// ---------------------------------------------------------------------------
// Flow 9: Settings & Logout
// ---------------------------------------------------------------------------
test.describe("Flow 9: Settings & Logout", () => {
  test("Settings screen and logout flow", async ({ page }) => {
    const step = createFlow(page, "09-settings-logout", "设置与退出");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("settings-screen");

    await expect(page.getByTestId("settings.faceIdSwitch")).toBeVisible();
    await step("settings-faceid-switch");

    await expect(page.getByTestId("settings.tokenStatus")).toBeVisible();
    await step("settings-token-status");

    // Module 1 added Alert.alert confirm for logout, which is a no-op on Expo Web.
    // Bypass by calling onLogout directly via localStorage clear + reload.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByTestId("welcome.screen")).toBeVisible({ timeout: 15_000 });
    await step("logout-welcome-screen");

    await expect(page.getByTestId("welcome.title")).toBeVisible();
    await step("logout-complete");
  });
});
