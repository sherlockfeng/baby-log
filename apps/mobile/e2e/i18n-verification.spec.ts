import { test, expect } from "@playwright/test";
import {
  seedFamilyWithBaby,
  seedFamily,
  seedTimelineFilter,
  waitForApp,
  loginWithScreenshots,
  login,
  TEST_TOKEN,
} from "./helpers";
import { createFlow } from "./step";

async function switchLanguage(
  page: import("@playwright/test").Page,
  lang: "zh" | "en",
) {
  await page.getByTestId("home.settingsCard").click();
  await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId(`settings.languageSelect.${lang}`).click();
  await page.waitForTimeout(500);
  await page.goto("/");
  await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// i18n: Full flow screenshot in English
// ---------------------------------------------------------------------------
test.describe("i18n: English Full Flow", () => {
  test("All key screens render correctly in English", async ({ page }) => {
    const step = createFlow(page, "i18n-en-full", "English 全流程截图");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    await switchLanguage(page, "en");
    await step("en-home");

    await expect(page.getByTestId("home.title")).toBeVisible();
    await expect(page.getByTestId("home.quickAddCard")).toBeVisible();
    await expect(page.getByTestId("home.timelineCard")).toBeVisible();
    await expect(page.getByTestId("home.settingsCard")).toBeVisible();
    await step("en-home-cards");

    // QuickAdd
    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
    await step("en-quickadd");

    await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
    await page.getByTestId("quickAdd.typeChip.feed").click();
    await step("en-quickadd-feed-selected");

    await page.getByTestId("quickAdd.typeChip.sleep").click();
    await step("en-quickadd-sleep-selected");

    await page.getByTestId("quickAdd.typeChip.diaper").click();
    await step("en-quickadd-diaper-selected");

    // Go back home
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });

    // Timeline
    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await step("en-timeline");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });

    // Settings
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("en-settings");

    await expect(page.getByTestId("settings.sectionApp")).toBeVisible();
    await expect(page.getByTestId("settings.sectionBabies")).toBeVisible();
    await expect(page.getByTestId("settings.sectionAccount")).toBeVisible();
    await step("en-settings-sections");

    await expect(page.getByTestId("settings.tokenStatus")).toBeVisible();
    await step("en-settings-account");
  });
});

// ---------------------------------------------------------------------------
// i18n: Full flow screenshot in Chinese
// ---------------------------------------------------------------------------
test.describe("i18n: Chinese Full Flow", () => {
  test("All key screens render correctly in Chinese", async ({ page }) => {
    const step = createFlow(page, "i18n-zh-full", "中文 全流程截图");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    await switchLanguage(page, "zh");
    await step("zh-home");

    await expect(page.getByTestId("home.title")).toBeVisible();
    await expect(page.getByTestId("home.quickAddCard")).toBeVisible();
    await expect(page.getByTestId("home.timelineCard")).toBeVisible();
    await expect(page.getByTestId("home.settingsCard")).toBeVisible();
    await step("zh-home-cards");

    // QuickAdd
    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
    await step("zh-quickadd");

    await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
    await page.getByTestId("quickAdd.typeChip.feed").click();
    await step("zh-quickadd-feed-selected");

    await page.getByTestId("quickAdd.typeChip.sleep").click();
    await step("zh-quickadd-sleep-selected");

    await page.getByTestId("quickAdd.typeChip.diaper").click();
    await step("zh-quickadd-diaper-selected");

    // Go back home
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });

    // Timeline
    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await step("zh-timeline");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });

    // Settings
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("zh-settings");

    await expect(page.getByTestId("settings.sectionApp")).toBeVisible();
    await expect(page.getByTestId("settings.sectionBabies")).toBeVisible();
    await expect(page.getByTestId("settings.sectionAccount")).toBeVisible();
    await step("zh-settings-sections");

    await expect(page.getByTestId("settings.tokenStatus")).toBeVisible();
    await step("zh-settings-account");
  });
});

// ---------------------------------------------------------------------------
// i18n: Welcome + Login + Register in English
// ---------------------------------------------------------------------------
test.describe("i18n: English Auth Screens", () => {
  test("Welcome, Login, Register display in English", async ({ page }) => {
    const step = createFlow(page, "i18n-en-auth", "English 认证页截图");

    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "en");

    // Clear auth to get back to welcome
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByTestId("welcome.screen")).toBeVisible({ timeout: 15_000 });
    await step("en-welcome");

    await expect(page.getByTestId("welcome.title")).toBeVisible();
    await expect(page.getByTestId("welcome.loginButton")).toBeVisible();
    await expect(page.getByTestId("welcome.registerButton")).toBeVisible();
    await step("en-welcome-buttons");

    // Login screen
    await page.getByTestId("welcome.loginButton").click();
    await expect(page.getByTestId("login.screen")).toBeVisible({ timeout: 10_000 });
    await step("en-login");

    await expect(page.getByTestId("login.goRegisterLink")).toBeVisible();
    await step("en-login-register-link");

    // Register screen
    await page.getByTestId("login.goRegisterLink").click();
    await expect(page.getByTestId("register.screen")).toBeVisible({ timeout: 10_000 });
    await step("en-register");
  });
});

// ---------------------------------------------------------------------------
// i18n: Welcome + Login + Register in Chinese
// ---------------------------------------------------------------------------
test.describe("i18n: Chinese Auth Screens", () => {
  test("Welcome, Login, Register display in Chinese", async ({ page }) => {
    const step = createFlow(page, "i18n-zh-auth", "中文 认证页截图");

    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "zh");

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByTestId("welcome.screen")).toBeVisible({ timeout: 15_000 });
    await step("zh-welcome");

    await expect(page.getByTestId("welcome.title")).toBeVisible();
    await expect(page.getByTestId("welcome.loginButton")).toBeVisible();
    await expect(page.getByTestId("welcome.registerButton")).toBeVisible();
    await step("zh-welcome-buttons");

    await page.getByTestId("welcome.loginButton").click();
    await expect(page.getByTestId("login.screen")).toBeVisible({ timeout: 10_000 });
    await step("zh-login");

    await expect(page.getByTestId("login.goRegisterLink")).toBeVisible();
    await step("zh-login-register-link");

    await page.getByTestId("login.goRegisterLink").click();
    await expect(page.getByTestId("register.screen")).toBeVisible({ timeout: 10_000 });
    await step("zh-register");
  });
});

// ---------------------------------------------------------------------------
// i18n: QuickAdd empty state in both languages
// ---------------------------------------------------------------------------
test.describe("i18n: Empty State Both Languages", () => {
  test("QuickAdd empty state in English", async ({ page }) => {
    const step = createFlow(page, "i18n-en-empty", "English 空状态截图");
    await seedFamily();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "en");

    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.emptyState")).toBeVisible({ timeout: 10_000 });
    await step("en-quickadd-empty");

    await expect(page.getByTestId("quickAdd.emptyMessage")).toBeVisible();
    await expect(page.getByTestId("quickAdd.goAddBabyButton")).toBeVisible();
    await step("en-quickadd-empty-detail");
  });

  test("QuickAdd empty state in Chinese", async ({ page }) => {
    const step = createFlow(page, "i18n-zh-empty", "中文 空状态截图");
    await seedFamily();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "zh");

    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.emptyState")).toBeVisible({ timeout: 10_000 });
    await step("zh-quickadd-empty");

    await expect(page.getByTestId("quickAdd.emptyMessage")).toBeVisible();
    await expect(page.getByTestId("quickAdd.goAddBabyButton")).toBeVisible();
    await step("zh-quickadd-empty-detail");
  });
});

// ---------------------------------------------------------------------------
// i18n: Timeline with events in both languages
// ---------------------------------------------------------------------------
test.describe("i18n: Timeline Both Languages", () => {
  test("Timeline events display in English", async ({ page }) => {
    const step = createFlow(page, "i18n-en-timeline", "English 时间线截图");
    await seedTimelineFilter();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "en");

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("en-timeline-events");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).toBeVisible();
    await step("en-timeline-details");

    await page.getByTestId("timeline.filterBaby.e2e-baby-a").click();
    await page.waitForTimeout(1000);
    await step("en-timeline-filtered");
  });

  test("Timeline events display in Chinese", async ({ page }) => {
    const step = createFlow(page, "i18n-zh-timeline", "中文 时间线截图");
    await seedTimelineFilter();
    await waitForApp(page);
    await login(page);
    await switchLanguage(page, "zh");

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("zh-timeline-events");

    await expect(page.getByTestId("timeline.eventDetail.e2e-event-feed-a")).toBeVisible();
    await expect(page.getByTestId("timeline.eventDetail.e2e-event-sleep-b")).toBeVisible();
    await step("zh-timeline-details");

    await page.getByTestId("timeline.filterBaby.e2e-baby-a").click();
    await page.waitForTimeout(1000);
    await step("zh-timeline-filtered");
  });
});

// ---------------------------------------------------------------------------
// i18n: Language switch persists across page reload
// ---------------------------------------------------------------------------
test.describe("i18n: Persistence", () => {
  test("Language preference persists after reload", async ({ page }) => {
    const step = createFlow(page, "i18n-persist", "语言持久化验证");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    // Switch to English
    await switchLanguage(page, "en");
    await step("switched-to-en");

    // Reload and verify still English
    await page.reload();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await step("after-reload-still-en");

    // Switch to Chinese
    await switchLanguage(page, "zh");
    await step("switched-to-zh");

    // Reload and verify still Chinese
    await page.reload();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await step("after-reload-still-zh");
  });
});
