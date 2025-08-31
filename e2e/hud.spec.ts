import { test, expect } from "@playwright/test";
import { startGame, getHudPanel } from "./utils/testHelpers";

// HUD Test Suite
test.describe("HUD", () => {
  test("should render HUD on game start", async ({ page }) => {
    await startGame(page);
    await expect(page.locator('[data-testid="hud-root"]')).toBeVisible();
  });

  test("should display score panel", async ({ page }) => {
    await startGame(page);
    const scorePanel = getHudPanel(page, "hud-score-panel");
    await expect(scorePanel).toBeVisible();
  });

  test("should display health panel", async ({ page }) => {
    await startGame(page);
    const healthPanel = getHudPanel(page, "hud-health-panel");
    await expect(healthPanel).toBeVisible();
  });

  test("should open settings modal from HUD", async ({ page }) => {
    await startGame(page);
    await page.click('[data-testid="hud-settings-button"]');
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
  });

  test("should update HUD score after gameplay event", async ({ page }) => {
    await startGame(page);
    // Simulate a gameplay event that changes score
    // Example: await page.keyboard.press('Space');
    // Replace with actual event for your game
    // Wait for score to update
    await page.waitForTimeout(500); // Adjust as needed
    const scorePanel = getHudPanel(page, "hud-score-panel");
    await expect(scorePanel).not.toHaveText("0");
  });
});
