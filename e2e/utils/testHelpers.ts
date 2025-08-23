// Shared Playwright test utilities for Lose Game
// e2e/utils/testHelpers.ts

import { Page } from "@playwright/test";

export async function startGame(page: Page) {
  await page.goto("/");
  await page.waitForSelector('[data-testid="game-root"]');
}

export async function getHudPanel(page: Page, panelTestId: string) {
  return page.locator(`[data-testid="${panelTestId}"]`);
}

// Add more helpers as needed
