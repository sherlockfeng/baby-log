import { test, expect } from "@playwright/test";
import {
  seedFamily,
  seedFamilyWithBaby,
  seedBabyWithManyEvents,
  waitForApp,
  loginWithScreenshots,
  apiGet,
  apiDelete,
  TEST_TOKEN,
  FAMILY_ID,
  BABY_A_ID,
} from "./helpers";
import { createFlow } from "./step";

// ---------------------------------------------------------------------------
// P0-3-1: SettingsScreen DatePicker works correctly
// ---------------------------------------------------------------------------
test.describe("P0-3: Bug Fix Verification", () => {
  test("DatePicker on Settings screen works without crash", async ({ page }) => {
    const step = createFlow(page, "p0-3-datepicker", "设置页日期选择器验证");
    await seedFamily();
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.settingsCard").click();
    await expect(page.getByTestId("settings.screen")).toBeVisible({ timeout: 10_000 });
    await step("settings-screen");

    await page.getByTestId("settings.babyNameInput").fill("日期测试宝宝");
    await step("baby-name-filled");

    const birthButton = page.getByTestId("settings.babyBirthButton");
    await expect(birthButton).toBeVisible();
    await step("datepicker-button-visible");

    await birthButton.click();
    await page.waitForTimeout(500);
    await step("datepicker-opened");

    await page.getByTestId("settings.addBabyButton").click();
    await page.waitForTimeout(3000);
    await step("baby-added-with-date");

    await page.goto("/");
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("home.babyInfo")).toBeVisible({ timeout: 10_000 });
    await step("home-baby-visible");
  });

  // ---------------------------------------------------------------------------
  // P0-3-2: Timeline pagination loads correctly (cursor-based)
  // ---------------------------------------------------------------------------
  test("Timeline pagination loads events and API cursor works", async ({ page }) => {
    const step = createFlow(page, "p0-3-pagination", "时间线分页验证");

    await seedBabyWithManyEvents(10);
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await step("timeline-loaded");

    await page.waitForTimeout(2000);
    await step("timeline-events-displayed");

    const firstPage = (await apiGet("/events?limit=3", TEST_TOKEN)) as {
      events: Array<{ id: string }>;
      nextCursor?: string;
    };
    expect(firstPage.events.length).toBe(3);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = (await apiGet(
      `/events?limit=3&cursor=${firstPage.nextCursor}`,
      TEST_TOKEN,
    )) as { events: Array<{ id: string }>; nextCursor?: string };
    expect(secondPage.events.length).toBe(3);

    const firstIds = firstPage.events.map((e) => e.id);
    const secondIds = secondPage.events.map((e) => e.id);
    const overlap = firstIds.filter((id) => secondIds.includes(id));
    expect(overlap.length).toBe(0);

    await step("pagination-api-verified");
  });

  // ---------------------------------------------------------------------------
  // P0-3-3: Deleting a baby cascades and removes associated events
  // ---------------------------------------------------------------------------
  test("Deleting a baby also removes its events", async ({ page }) => {
    const step = createFlow(page, "p0-3-cascade-delete", "删除宝宝级联验证");

    await seedBabyWithManyEvents(5);
    await waitForApp(page);
    await step("welcome-screen");

    await loginWithScreenshots(page, step);

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("timeline-events-before-delete");

    const beforeEvents = (await apiGet("/events", TEST_TOKEN)) as {
      events: Array<{ id: string }>;
    };
    expect(beforeEvents.events.length).toBeGreaterThan(0);
    await step("timeline-has-events");

    const deleteRes = await apiDelete(`/babies/${BABY_A_ID}`, TEST_TOKEN);
    expect(deleteRes.ok).toBeTruthy();
    await step("baby-deleted-via-api");

    const afterEvents = (await apiGet("/events", TEST_TOKEN)) as {
      events: Array<{ id: string }>;
    };
    expect(afterEvents.events.length).toBe(0);

    await page.reload();
    await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
    await step("home-after-delete");

    await page.getByTestId("home.timelineCard").click();
    await expect(page.getByTestId("timeline.screen")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
    await step("timeline-empty-after-cascade");
  });
});
