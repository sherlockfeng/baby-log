import { Page, expect } from "@playwright/test";

const API_URL = "http://localhost:8787";
const TEST_TOKEN = "e2e-test-token-valid-00000000";
const FAMILY_ID = "e2e-family-001";
const BABY_A_ID = "e2e-baby-a";
const BABY_B_ID = "e2e-baby-b";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status}`);
  return res.json();
}

export async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
}

export async function resetDb() {
  await apiPost("/e2e/reset", {});
}

export async function seedFamily() {
  await resetDb();
  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
  });
}

export async function seedFamilyWithBaby() {
  await resetDb();
  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [{ id: BABY_A_ID, familyId: FAMILY_ID, name: "测试宝宝", birthDate: "2024-06-01" }],
  });
}

export async function seedTimelineFilter() {
  await resetDb();
  const now = new Date().toISOString();
  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [
      { id: BABY_A_ID, familyId: FAMILY_ID, name: "宝宝A", birthDate: "2024-06-01" },
      { id: BABY_B_ID, familyId: FAMILY_ID, name: "宝宝B", birthDate: "2024-09-15" },
    ],
    events: [
      { id: "e2e-event-feed-a", familyId: FAMILY_ID, babyId: BABY_A_ID, eventType: "feed", eventTime: now, payload: { amountMl: 150, method: "bottle" } },
      { id: "e2e-event-sleep-b", familyId: FAMILY_ID, babyId: BABY_B_ID, eventType: "sleep", eventTime: now, payload: { startTime: "2024-06-01T08:00:00", endTime: "2024-06-01T09:30:00" } },
    ],
  });
}

export { TEST_TOKEN, FAMILY_ID, BABY_A_ID, BABY_B_ID };

export async function seedBabyWithManyEvents(count = 10) {
  await resetDb();
  const now = Date.now();
  const events = Array.from({ length: count }, (_, i) => ({
    id: `e2e-event-${i}`,
    familyId: FAMILY_ID,
    babyId: BABY_A_ID,
    eventType: i % 2 === 0 ? "feed" : "sleep",
    eventTime: new Date(now - i * 3600_000).toISOString(),
    payload:
      i % 2 === 0
        ? { amountMl: 100 + i * 10, method: "bottle" }
        : { startTime: new Date(now - i * 3600_000).toISOString(), endTime: new Date(now - i * 3600_000 + 1800_000).toISOString() },
  }));
  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [{ id: BABY_A_ID, familyId: FAMILY_ID, name: "测试宝宝", birthDate: "2024-06-01" }],
    events,
  });
}

export async function seedDashboardData() {
  await resetDb();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600_000);
  const twoHoursAgo = new Date(now.getTime() - 7200_000);
  const threeHoursAgo = new Date(now.getTime() - 10800_000);

  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [{ id: BABY_A_ID, familyId: FAMILY_ID, name: "测试宝宝", birthDate: "2024-06-01" }],
    events: [
      {
        id: "e2e-dash-feed-1", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "feed", eventTime: oneHourAgo.toISOString(),
        payload: { amountMl: 120, method: "bottle" },
      },
      {
        id: "e2e-dash-feed-2", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "feed", eventTime: threeHoursAgo.toISOString(),
        payload: { amountMl: 150, method: "breast" },
      },
      {
        id: "e2e-dash-sleep-1", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "sleep", eventTime: twoHoursAgo.toISOString(),
        payload: {
          startTime: new Date(now.getTime() - 5400_000).toISOString(),
          endTime: new Date(now.getTime() - 1800_000).toISOString(),
        },
      },
      {
        id: "e2e-dash-diaper-1", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "diaper", eventTime: twoHoursAgo.toISOString(),
        payload: { type: "wet" },
      },
    ],
  });
}

export async function seedMilestoneAndPhotos() {
  await resetDb();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600_000);
  const twoHoursAgo = new Date(now.getTime() - 7200_000);
  const threeHoursAgo = new Date(now.getTime() - 10800_000);

  await apiPost("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [{ id: BABY_A_ID, familyId: FAMILY_ID, name: "测试宝宝", birthDate: "2024-06-01" }],
    events: [
      {
        id: "e2e-milestone-walk", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "milestone", eventTime: oneHourAgo.toISOString(),
        payload: { title: "第一次走路", template: "walk", note: "在客厅迈出第一步" },
      },
      {
        id: "e2e-milestone-tooth", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "milestone", eventTime: twoHoursAgo.toISOString(),
        payload: { title: "长出第一颗牙", template: "firstTooth" },
      },
      {
        id: "e2e-feed-with-photo", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "feed", eventTime: threeHoursAgo.toISOString(),
        payload: {
          amountMl: 120, method: "bottle",
          photoUrls: ["https://placehold.co/200x200/EEE/31343C?text=E2E+Photo"],
        },
      },
      {
        id: "e2e-daily-diaper", familyId: FAMILY_ID, babyId: BABY_A_ID,
        eventType: "diaper", eventTime: threeHoursAgo.toISOString(),
        payload: { type: "wet" },
      },
    ],
  });
}

export async function waitForApp(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid="welcome.screen"]', { timeout: 30_000 });
}

export async function login(page: Page) {
  await page.getByTestId("welcome.loginButton").click();
  await page.getByTestId("login.tokenInput").fill(TEST_TOKEN);
  await page.getByTestId("login.submitButton").click();
  await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
}

export async function loginWithScreenshots(
  page: Page,
  step: (name: string) => Promise<string>,
) {
  await page.getByTestId("welcome.loginButton").click();
  await expect(page.getByTestId("login.screen")).toBeVisible({ timeout: 10_000 });
  await step("login-form-empty");

  await page.getByTestId("login.tokenInput").fill(TEST_TOKEN);
  await step("login-token-filled");

  await page.getByTestId("login.submitButton").click();
  await expect(page.getByTestId("home.screen")).toBeVisible({ timeout: 15_000 });
  await step("login-success-home");
}
