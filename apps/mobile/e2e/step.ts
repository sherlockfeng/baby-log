import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

export interface FlowStepper {
  (stepName: string): Promise<string>;
}

/**
 * Creates a step-screenshot function bound to a specific user flow.
 * Each call captures a PNG and returns the file path.
 */
export function createFlow(page: Page, flowId: string, flowLabel: string): FlowStepper {
  const dir = path.join(SCREENSHOT_DIR, flowId);
  fs.mkdirSync(dir, { recursive: true });

  const manifestPath = path.join(dir, "_manifest.json");
  const steps: { index: number; name: string; file: string }[] = [];
  let index = 0;

  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ flowId, flowLabel, steps }, null, 2),
  );

  return async function step(stepName: string): Promise<string> {
    await page.waitForTimeout(400);

    index += 1;
    const fileName = `${String(index).padStart(2, "0")}-${stepName}.png`;
    const filePath = path.join(dir, fileName);

    await page.screenshot({ path: filePath, fullPage: false });

    steps.push({ index, name: stepName, file: fileName });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ flowId, flowLabel, steps }, null, 2),
    );

    return filePath;
  };
}
