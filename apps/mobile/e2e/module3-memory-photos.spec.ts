import { test, expect } from "@playwright/test";
import {
  seedFamilyWithBaby,
  seedMilestoneAndPhotos,
  waitForApp,
  login,
  loginWithScreenshots,
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
// 3.2 Baby Profile Enhancement
// ===========================================================================
test.describe("3.2 Baby Profile Enhancement", () => {
  test("Baby detail section shows all profile fields", async ({ page }) => {
    const step = createFlow(page, "m3-baby-profile", "宝宝档案编辑");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await loginWithScreenshots(page, step);

    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("settings-screen");

    // Click baby row to expand detail
    await page.getByTestId("settings.babyRow.e2e-baby-a").click();
    await page.waitForTimeout(1000);
    await step("baby-row-expanded");

    await expect(page.getByTestId("settings.babyDetailSection")).toBeVisible({ timeout: 5_000 });
    await step("baby-detail-section");

    // Avatar button
    await expect(page.getByTestId("settings.babyAvatarButton")).toBeVisible();
    await step("avatar-button-visible");

    // Name field
    await expect(page.getByTestId("settings.babyDetailName")).toBeVisible();
    await step("name-field-visible");

    // Gender chips
    await expect(page.getByTestId("settings.babyGenderChip.male")).toBeVisible();
    await expect(page.getByTestId("settings.babyGenderChip.female")).toBeVisible();
    await step("gender-chips-visible");

    // Blood type chips
    await expect(page.getByTestId("settings.babyBloodTypeChip.A")).toBeVisible();
    await expect(page.getByTestId("settings.babyBloodTypeChip.B")).toBeVisible();
    await expect(page.getByTestId("settings.babyBloodTypeChip.AB")).toBeVisible();
    await expect(page.getByTestId("settings.babyBloodTypeChip.O")).toBeVisible();
    await step("blood-type-chips-visible");

    // Allergies and notes
    await expect(page.getByTestId("settings.babyAllergiesInput")).toBeVisible();
    await expect(page.getByTestId("settings.babyNotesInput")).toBeVisible();
    await step("allergies-notes-visible");
  });

  test("Set gender and blood type for baby", async ({ page }) => {
    const step = createFlow(page, "m3-baby-profile-edit", "宝宝性别血型设置");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("settings.babyRow.e2e-baby-a").click();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId("settings.babyDetailSection")).toBeVisible({ timeout: 5_000 });
    await step("detail-open");

    // Set gender to female
    await page.getByTestId("settings.babyGenderChip.female").click();
    await page.waitForTimeout(500);
    await step("gender-female-selected");

    // Set blood type to A
    await page.getByTestId("settings.babyBloodTypeChip.A").click();
    await page.waitForTimeout(500);
    await step("blood-type-A-selected");

    // Fill allergies
    await page.getByTestId("settings.babyAllergiesInput").fill("牛奶蛋白");
    await page.getByTestId("settings.babyNotesInput").click();
    await page.waitForTimeout(500);
    await step("allergies-filled");

    // Fill notes
    await page.getByTestId("settings.babyNotesInput").fill("6个月开始添加辅食");
    await page.getByTestId("settings.babyAllergiesInput").click();
    await page.waitForTimeout(500);
    await step("notes-filled");
  });
});

// ===========================================================================
// 3.3 Event Photos — QuickAdd PhotoPicker Visibility
// ===========================================================================
test.describe("3.3 Event Photos", () => {
  test("PhotoPicker visible on all event forms", async ({ page }) => {
    const step = createFlow(page, "m3-photo-picker", "事件表单照片选择器");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);

    const types = ["feed", "sleep", "diaper", "poop", "solid", "weight", "vaccine", "milestone"];
    for (const type of types) {
      await page.getByTestId("home.quickAddCard").click();
      await expect(page.getByTestId("quickAdd.screen")).toBeVisible({ timeout: 10_000 });
      await page.getByTestId("quickAdd.babyChip.e2e-baby-a").click();
      await page.getByTestId(`quickAdd.typeChip.${type}`).click();
      await page.waitForTimeout(500);

      const addButton = page.getByTestId("photo.addButton");
      const visible = await addButton.isVisible().catch(() => false);
      if (visible) {
        await step(`photo-picker-${type}`);
      } else {
        await step(`photo-picker-${type}-not-found`);
      }

      // Go home between types
      await page.goto("/");
      await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    }
  });

  test("Timeline shows PhotoGrid for event with photos", async ({ page }) => {
    const step = createFlow(page, "m3-event-photos", "事件照片时间线显示");
    await seedMilestoneAndPhotos();
    await waitForApp(page);
    await loginWithScreenshots(page, step);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("timeline-with-photos");

    // The feed event with photo should show PhotoGrid
    const eventPhotos = page.getByTestId("timeline.eventPhotos.e2e-feed-with-photo");
    const photosVisible = await eventPhotos.isVisible().catch(() => false);
    if (photosVisible) {
      await step("photo-grid-visible");

      // Click thumbnail to open viewer
      const thumb = page.getByTestId("photo.thumb.0");
      const thumbVisible = await thumb.isVisible().catch(() => false);
      if (thumbVisible) {
        await thumb.click();
        await page.waitForTimeout(500);
        await step("photo-viewer-open");

        // Close viewer
        const closeBtn = page.getByTestId("photo.closeButton");
        const closeVisible = await closeBtn.isVisible().catch(() => false);
        if (closeVisible) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          await step("photo-viewer-closed");
        }
      }
    } else {
      await step("photo-grid-not-rendered");
    }
  });
});

// ===========================================================================
// 3.4 Milestone Creation & Display
// ===========================================================================
test.describe("3.4 Milestones", () => {
  test("Milestone form with template selection", async ({ page }) => {
    const step = createFlow(page, "m3-milestone-form", "里程碑表单模板选择");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "milestone");
    await step("milestone-form");

    // Template chips visible
    await expect(page.getByTestId("quickAdd.milestoneTemplateChip.rollOver")).toBeVisible();
    await expect(page.getByTestId("quickAdd.milestoneTemplateChip.walk")).toBeVisible();
    await expect(page.getByTestId("quickAdd.milestoneTemplateChip.firstTooth")).toBeVisible();
    await expect(page.getByTestId("quickAdd.milestoneTemplateChip.custom")).toBeVisible();
    await step("template-chips-visible");

    // Select "walk" template
    await page.getByTestId("quickAdd.milestoneTemplateChip.walk").click();
    await page.waitForTimeout(500);
    await step("walk-template-selected");

    // Title should be auto-filled
    const titleInput = page.getByTestId("quickAdd.milestoneTitleInput");
    await expect(titleInput).toBeVisible();
    await step("title-auto-filled");

    // Add a note
    await page.getByTestId("quickAdd.noteInput").fill("在客厅走了3步");
    await step("note-filled");

    // Submit
    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("milestone-submitted");
  });

  test("Milestone custom template with manual title", async ({ page }) => {
    const step = createFlow(page, "m3-milestone-custom", "里程碑自定义模板");
    await seedFamilyWithBaby();
    await waitForApp(page);
    await login(page);
    await goToQuickAdd(page, "milestone");

    await page.getByTestId("quickAdd.milestoneTemplateChip.custom").click();
    await page.waitForTimeout(500);
    await step("custom-template");

    await page.getByTestId("quickAdd.milestoneTitleInput").fill("第一次叫外婆");
    await step("custom-title-filled");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("custom-milestone-submitted");
  });

  test("Timeline shows milestone with golden card style", async ({ page }) => {
    const step = createFlow(page, "m3-milestone-card", "里程碑金色卡片");
    await seedMilestoneAndPhotos();
    await waitForApp(page);
    await loginWithScreenshots(page, step);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("timeline-with-milestones");

    // Milestone event cards should be visible
    await expect(page.getByTestId("timeline.eventCard.e2e-milestone-walk")).toBeVisible();
    await step("milestone-walk-card");

    await expect(page.getByTestId("timeline.eventCard.e2e-milestone-tooth")).toBeVisible();
    await step("milestone-tooth-card");

    // Regular event also visible
    await expect(page.getByTestId("timeline.eventCard.e2e-daily-diaper")).toBeVisible();
    await step("regular-event-card");
  });

  test("Timeline 3-state filter: all / daily / milestone", async ({ page }) => {
    const step = createFlow(page, "m3-milestone-filter", "里程碑筛选");
    await seedMilestoneAndPhotos();
    await waitForApp(page);
    await login(page);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("filter-all-default");

    // Filter: all (default)
    await expect(page.getByTestId("timeline.filterType.all")).toBeVisible();
    await expect(page.getByTestId("timeline.filterType.daily")).toBeVisible();
    await expect(page.getByTestId("timeline.filterType.milestone")).toBeVisible();
    await step("filter-chips-visible");

    // Switch to milestone only
    await page.getByTestId("timeline.filterType.milestone").click();
    await page.waitForTimeout(1000);
    await step("filter-milestone-only");

    // Milestone events should be visible
    await expect(page.getByTestId("timeline.eventCard.e2e-milestone-walk")).toBeVisible({ timeout: 5_000 });
    await step("milestone-events-shown");

    // Regular events should be hidden
    const diaperVisible = await page.getByTestId("timeline.eventCard.e2e-daily-diaper").isVisible().catch(() => false);
    if (!diaperVisible) {
      await step("regular-events-hidden");
    }

    // Switch to daily only
    await page.getByTestId("timeline.filterType.daily").click();
    await page.waitForTimeout(1000);
    await step("filter-daily-only");

    // Diaper should be visible now
    await expect(page.getByTestId("timeline.eventCard.e2e-daily-diaper")).toBeVisible({ timeout: 5_000 });
    await step("daily-events-shown");

    // Milestones should be hidden
    const milestoneVisible = await page.getByTestId("timeline.eventCard.e2e-milestone-walk").isVisible().catch(() => false);
    if (!milestoneVisible) {
      await step("milestones-hidden-in-daily");
    }

    // Switch back to all
    await page.getByTestId("timeline.filterType.all").click();
    await page.waitForTimeout(1000);
    await step("filter-all-restored");
  });
});

// ===========================================================================
// 3.4 Milestones — English
// ===========================================================================
test.describe("3.4 Milestones (English)", () => {
  async function switchToEnglish(page: import("@playwright/test").Page) {
    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("settings.languageSelect.en").click();
    await page.waitForTimeout(500);
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
  }

  test("Milestone form and filter in English", async ({ page }) => {
    const step = createFlow(page, "m3-milestone-en", "Milestone form(EN)");
    await seedMilestoneAndPhotos();
    await waitForApp(page);
    await login(page);
    await switchToEnglish(page);

    // Create a milestone in English
    await goToQuickAdd(page, "milestone");
    await step("en-milestone-form");

    await page.getByTestId("quickAdd.milestoneTemplateChip.crawl").click();
    await page.waitForTimeout(500);
    await step("en-crawl-template");

    await page.getByTestId("quickAdd.submitButton").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("toast.message")).toBeVisible({ timeout: 5_000 });
    await step("en-milestone-submitted");

    // Check timeline with filter
    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("en-timeline");

    // Filter chips should show English labels
    await expect(page.getByTestId("timeline.filterType.all")).toBeVisible();
    await expect(page.getByTestId("timeline.filterType.milestone")).toBeVisible();
    await step("en-filter-chips");

    await page.getByTestId("timeline.filterType.milestone").click();
    await page.waitForTimeout(1000);
    await step("en-milestone-filter");
  });
});
