/**
 * Maestro runScript helper for e2e data setup.
 * Uses Maestro's built-in http object (not Node.js fetch).
 *
 * Pass ACTION via env to choose what to do:
 *   reset | seed-family | seed-family-with-baby | seed-timeline-filter
 */

var API_URL = "http://localhost:8787";
var TEST_TOKEN = "e2e-test-token-valid-00000000";
var FAMILY_ID = "e2e-family-001";
var BABY_A_ID = "e2e-baby-a";
var BABY_B_ID = "e2e-baby-b";

function post(path, body) {
  var response = http.post(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw "POST " + path + " failed: " + response.status + " " + response.body;
  }
  return response;
}

function reset() {
  post("/e2e/reset", {});
}

function seedFamily() {
  reset();
  post("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
  });
}

function seedFamilyWithBaby() {
  reset();
  post("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [
      { id: BABY_A_ID, familyId: FAMILY_ID, name: "测试宝宝", birthDate: "2024-06-01" },
    ],
  });
}

function seedTimelineFilter() {
  reset();
  var now = new Date().toISOString();
  post("/e2e/seed", {
    families: [{ id: FAMILY_ID, name: "E2E测试家庭", token: TEST_TOKEN }],
    babies: [
      { id: BABY_A_ID, familyId: FAMILY_ID, name: "宝宝A", birthDate: "2024-06-01" },
      { id: BABY_B_ID, familyId: FAMILY_ID, name: "宝宝B", birthDate: "2024-09-15" },
    ],
    events: [
      {
        id: "e2e-event-feed-a",
        familyId: FAMILY_ID,
        babyId: BABY_A_ID,
        eventType: "feed",
        eventTime: now,
        payload: { amountMl: 150, method: "bottle" },
      },
      {
        id: "e2e-event-sleep-b",
        familyId: FAMILY_ID,
        babyId: BABY_B_ID,
        eventType: "sleep",
        eventTime: now,
        payload: {
          startTime: "2024-06-01T08:00:00",
          endTime: "2024-06-01T09:30:00",
        },
      },
    ],
  });
}

var ACTION = ACTION || "reset";

if (ACTION === "reset") {
  reset();
} else if (ACTION === "seed-family") {
  seedFamily();
} else if (ACTION === "seed-family-with-baby") {
  seedFamilyWithBaby();
} else if (ACTION === "seed-timeline-filter") {
  seedTimelineFilter();
} else {
  throw "Unknown ACTION: " + ACTION;
}
