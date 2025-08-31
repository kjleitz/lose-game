// Shared Playwright test utilities for Lose Game
// e2e/utils/testHelpers.ts

import { type Locator, type Page } from "@playwright/test";

export async function startGame(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForSelector('[data-testid="game-root"]');
}

export function getHudPanel(page: Page, panelTestId: string): Locator {
  return page.locator(`[data-testid="${panelTestId}"]`);
}

// Add more helpers as needed
