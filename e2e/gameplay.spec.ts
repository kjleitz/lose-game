import { test, expect } from "@playwright/test";
import { startGame } from "./utils/testHelpers";

// Gameplay Test Suite
test.describe("Gameplay", () => {
  test("should start a new game session", async ({ page }) => {
    await startGame(page);
    await expect(page.locator('[data-testid="game-root"]')).toBeVisible();
  });

  test("should update HUD experience and health after player input", async ({ page }) => {
    await startGame(page);
    // Initial values
    const experiencePanel = page.locator('[data-testid="hud-experience-panel"]');
    const healthPanel = page.locator('[data-testid="hud-health-panel"]');
    const initialExperience = await experiencePanel.textContent();
    const initialHealth = await healthPanel.textContent();

    // Simulate thrust (should increase experience if visiting planet, may decrease health)
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(500); // Let game update
    await page.keyboard.up("ArrowUp");

    const newExperience = await experiencePanel.textContent();
    const newHealth = await healthPanel.textContent();
    expect(newExperience).not.toBe(initialExperience);
    expect(newHealth).not.toBe(initialHealth);
  });

  test("should visually move the ship on canvas after input (screenshot diff)", async ({
    page,
  }) => {
    await startGame(page);
    const canvas = page.locator("canvas");
    // Take screenshot before movement
    const before = await canvas.screenshot();
    // Simulate movement
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(500); // Let game update
    await page.keyboard.up("ArrowRight");
    // Take screenshot after movement
    const after = await canvas.screenshot();
    // Compare screenshots
    expect(after).not.toEqual(before);
  });
});
