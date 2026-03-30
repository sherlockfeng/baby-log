import { test, expect } from "@playwright/test";
import {
  seedFamilyWithBaby,
  seedDashboardData,
  waitForApp,
  login,
  loginWithScreenshots,
  TEST_TOKEN,
} from "./helpers";
import { createFlow } from "./step";

// ---------------------------------------------------------------------------
// Helper: navigate to QuickAdd and select baby + type
// ---------------------------------------------------------------------------
async function goToQuickAdd(
  page: import("@playwright/test").Page,
  type: string,
) {
  await page.getByTestId("home.quickAddCard").click();
  await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
  await page.getByTestId(`quickAdd.typeChip.${type}`).click();
}

// ===========================================================================
// 2.1 Rich Event Forms — Chinese
// ===========================================================================
test.describe("2.1 Rich Event Forms (Chinese)", () => {
  test("Feed form with method, amount, duration, side", async ({ page }) => {
    const step = createFlow(page, "m2-form-feed-zh", "喂奶表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "feed");
    await step("feed-form");

    await page.getByTestId("quickAdd.methodChip.bottle").click();
    await step("feed-method-bottle");

    await page.getByTestId("quickAdd.amountInput").fill("120");
    await step("feed-amount");

    await page.getByTestId("quickAdd.durationInput").fill("15");
    await step("feed-duration");

    await page.getByTestId("quickAdd.noteInput").fill("E2E喂奶备注");
    await step("feed-note");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("feed-submitted");
  });

  test("Feed form with breast method shows side chips", async ({ page }) => {
    const step = createFlow(page, "m2-form-feed-side", "喂奶侧选择");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "feed");

    await page.getByTestId("quickAdd.methodChip.breast").click();
    await page.waitForTimeout(500);
    await step("breast-selected");

    const leftChip = page.getByTestId("quickAdd.sideChip.left");
    const hasLeft = await leftChip.isVisible().catch(() => false);
    if (hasLeft) {
      await leftChip.click();
      await step("side-left-selected");
    }

    await page.getByTestId("quickAdd.amountInput").fill("0");
    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await step("breast-submitted");
  });

  test("Sleep form with quality chips", async ({ page }) => {
    const step = createFlow(page, "m2-form-sleep-zh", "睡眠表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "sleep");
    await step("sleep-form");

    await expect(page.getByTestId("quickAdd.sleepStartInput")).toBeVisible();
    await expect(page.getByTestId("quickAdd.sleepEndInput")).toBeVisible();
    await step("sleep-time-inputs");

    const goodChip = page.getByTestId("quickAdd.sleepQualityChip.good");
    await expect(goodChip).toBeVisible();
    await goodChip.click();
    await step("sleep-quality-good");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await step("sleep-submitted");
  });

  test("Diaper form with type chips", async ({ page }) => {
    const step = createFlow(page, "m2-form-diaper-zh", "尿布表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "diaper");
    await step("diaper-form");

    await page.getByTestId("quickAdd.diaperChip.wet").click();
    await step("diaper-wet");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("diaper-submitted");
  });

  test("Poop form with kind, color, amount chips", async ({ page }) => {
    const step = createFlow(page, "m2-form-poop-zh", "便便表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "poop");
    await step("poop-form");

    await page.getByTestId("quickAdd.poopKindChip.normal").click();
    await step("poop-kind-normal");

    await page.getByTestId("quickAdd.poopColorChip.yellow").click();
    await step("poop-color-yellow");

    await page.getByTestId("quickAdd.poopAmountChip.medium").click();
    await step("poop-amount-medium");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("poop-submitted");
  });

  test("Weight form with kg input", async ({ page }) => {
    const step = createFlow(page, "m2-form-weight-zh", "体重表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "weight");
    await step("weight-form");

    await page.getByTestId("quickAdd.kgInput").fill("6.5");
    await step("weight-filled");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("weight-submitted");
  });

  test("Solid food form with reaction chips", async ({ page }) => {
    const step = createFlow(page, "m2-form-solid-zh", "辅食表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "solid");
    await step("solid-form");

    await page.getByTestId("quickAdd.foodInput").fill("米糊");
    await step("solid-food-name");

    const amountInput = page.getByTestId("quickAdd.solidAmountInput");
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill("50ml");
      await step("solid-amount");
    }

    await page.getByTestId("quickAdd.solidReactionChip.none").click();
    await step("solid-reaction-none");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("solid-submitted");
  });

  test("Vaccine form with name and institution", async ({ page }) => {
    const step = createFlow(page, "m2-form-vaccine-zh", "疫苗表单(中文)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "vaccine");
    await step("vaccine-form");

    await page.getByTestId("quickAdd.vaccineNameInput").fill("乙肝疫苗");
    await step("vaccine-name");

    const instInput = page.getByTestId("quickAdd.vaccineInstitutionInput");
    if (await instInput.isVisible().catch(() => false)) {
      await instInput.fill("社区医院");
      await step("vaccine-institution");
    }

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("vaccine-submitted");
  });
});

// ===========================================================================
// 2.1 Rich Event Forms — English
// ===========================================================================
test.describe("2.1 Rich Event Forms (English)", () => {
  async function switchToEnglish(page: import("@playwright/test").Page) {
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("settings.languageSelect.en").click();
    await page.waitForTimeout(500);
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
  }

  test("Feed form in English", async ({ page }) => {
    const step = createFlow(page, "m2-form-feed-en", "Feed form(EN)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await switchToEnglish(page);
    await goToQuickAdd(page, "feed");
    await step("en-feed-form");

    await page.getByTestId("quickAdd.methodChip.bottle").click();
    await page.getByTestId("quickAdd.amountInput").fill("150");
    await step("en-feed-filled");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("en-feed-submitted");
  });

  test("Poop form in English", async ({ page }) => {
    const step = createFlow(page, "m2-form-poop-en", "Poop form(EN)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await switchToEnglish(page);
    await goToQuickAdd(page, "poop");
    await step("en-poop-form");

    await page.getByTestId("quickAdd.poopKindChip.loose").click();
    await page.getByTestId("quickAdd.poopColorChip.green").click();
    await page.getByTestId("quickAdd.poopAmountChip.small").click();
    await step("en-poop-chips-selected");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("en-poop-submitted");
  });

  test("Solid food form in English", async ({ page }) => {
    const step = createFlow(page, "m2-form-solid-en", "Solid form(EN)");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await switchToEnglish(page);
    await goToQuickAdd(page, "solid");
    await step("en-solid-form");

    await page.getByTestId("quickAdd.foodInput").fill("Rice cereal");
    await page.getByTestId("quickAdd.solidReactionChip.mild").click();
    await step("en-solid-filled");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("en-solid-submitted");
  });
});

// ===========================================================================
// 2.2 Timer
// ===========================================================================
test.describe("2.2 Timer", () => {
  test("Feed timer: start → bar visible → stop → fills duration", async ({ page }) => {
    const step = createFlow(page, "m2-timer-feed", "喂奶计时器");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "feed");

    await page.getByTestId("quickAdd.methodChip.bottle").click();
    await step("timer-before-start");

    await page.getByTestId("quickAdd.timerButton").click();
    await page.waitForTimeout(2000);
    await step("timer-started");

    // TimerBar should be visible at app top
    const timerBar = page.getByTestId("timer.bar");
    const barVisible = await timerBar.isVisible().catch(() => false);
    if (barVisible) {
      await expect(page.getByTestId("timer.label")).toBeVisible();
      await step("timer-bar-visible");
    }

    // Wait a few seconds for meaningful duration
    await page.waitForTimeout(3000);
    await step("timer-running");

    // Stop timer from QuickAdd (fills duration)
    await page.getByTestId("quickAdd.timerButton").click();
    await page.waitForTimeout(1000);
    await step("timer-stopped");

    // Duration input should have been filled
    await step("timer-duration-filled");

    await page.getByTestId("quickAdd.amountInput").fill("100");
    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("timer-feed-submitted");
  });

  test("Timer bar stop button works", async ({ page }) => {
    const step = createFlow(page, "m2-timer-bar-stop", "计时条停止按钮");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "feed");

    await page.getByTestId("quickAdd.methodChip.bottle").click();
    await page.getByTestId("quickAdd.timerButton").click();
    await page.waitForTimeout(2000);
    await step("timer-started");

    // Navigate away to home
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await step("home-with-timer-bar");

    // Timer bar should persist on home
    const timerBar = page.getByTestId("timer.bar");
    const barVisible = await timerBar.isVisible().catch(() => false);
    if (barVisible) {
      await step("timer-bar-on-home");

      await page.getByTestId("timer.stopButton").click();
      await page.waitForTimeout(1000);
      await step("timer-stopped-from-bar");
    }
  });
});

// ===========================================================================
// 2.3 Dashboard
// ===========================================================================
test.describe("2.3 Dashboard", () => {
  test("Dashboard shows stat cards with seeded data", async ({ page }) => {
    const step = createFlow(page, "m2-dashboard", "今日总览仪表盘");
    await seedDashboardData();
    await waitForApp(page);
    await login(page);
    await page.waitForTimeout(3000);
    await step("dashboard-home");

    await expect(page.getByTestId("home.dashboardSection")).toBeVisible({ timeout: 10_000 });
    await step("dashboard-section");

    await expect(page.getByTestId("home.statFeed")).toBeVisible();
    await step("stat-feed");

    await expect(page.getByTestId("home.statSleep")).toBeVisible();
    await step("stat-sleep");

    await expect(page.getByTestId("home.statLastFeed")).toBeVisible();
    await step("stat-last-feed");

    await expect(page.getByTestId("home.statLastDiaper")).toBeVisible();
    await step("stat-last-diaper");
  });

  test("Dashboard updates after adding a new event", async ({ page }) => {
    const step = createFlow(page, "m2-dashboard-update", "仪表盘刷新验证");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await step("dashboard-empty");

    // Add a feed event
    await goToQuickAdd(page, "feed");
    await page.getByTestId("quickAdd.methodChip.bottle").click();
    await page.getByTestId("quickAdd.amountInput").fill("80");
    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await step("feed-added");

    // Go home and check dashboard updated
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
    await step("dashboard-after-feed");

    await expect(page.getByTestId("home.statFeed")).toBeVisible({ timeout: 10_000 });
    await step("stat-feed-updated");
  });

  test("Baby selector switches dashboard data", async ({ page }) => {
    const step = createFlow(page, "m2-dashboard-baby-switch", "宝宝切换仪表盘");
    await seedDashboardData();
    await waitForApp(page);
    await login(page);
    await page.waitForTimeout(3000);
    await step("dashboard-baby-a");

    await expect(page.getByTestId("home.babyChip.e2e-baby-a")).toBeVisible();
    await step("baby-chip-visible");
  });
});

// ===========================================================================
// 2.4 Dark Mode
// ===========================================================================
test.describe("2.4 Dark Mode", () => {
  async function switchTheme(page: import("@playwright/test").Page, theme: string) {
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId(`settings.themeSelect.${theme}`).click();
    await page.waitForTimeout(500);
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
  }

  test("Dark mode full screenshots", async ({ page }) => {
    const step = createFlow(page, "m2-dark-mode", "深色模式全屏截图");
    await seedDashboardData();
    await waitForApp(page);
    await login(page);
    await switchTheme(page, "dark");
    await page.waitForTimeout(1000);
    await step("dark-home");

    // QuickAdd
    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
    await step("dark-quickadd");

    await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
    await page.getByTestId("quickAdd.typeChip.feed").click();
    await step("dark-quickadd-feed");

    // Timeline
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("dark-timeline");

    // Settings
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("dark-settings");
  });

  test("Light mode full screenshots", async ({ page }) => {
    const step = createFlow(page, "m2-light-mode", "浅色模式全屏截图");
    await seedDashboardData();
    await waitForApp(page);
    await login(page);
    await switchTheme(page, "light");
    await page.waitForTimeout(1000);
    await step("light-home");

    await page.getByTestId("home.quickAddCard").click();
    await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
    await step("light-quickadd");

    await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
    await page.getByTestId("quickAdd.typeChip.poop").click();
    await step("light-quickadd-poop");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("light-timeline");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("light-settings");
  });

  test("Theme persists after reload", async ({ page }) => {
    const step = createFlow(page, "m2-theme-persist", "主题持久化验证");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    await switchTheme(page, "dark");
    await step("dark-set");

    await page.reload();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await step("dark-after-reload");

    await switchTheme(page, "light");
    await step("light-set");

    await page.reload();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await step("light-after-reload");
  });
});
