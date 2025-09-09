# e2e/

End-to-end tests using Playwright to test the complete application in a real browser environment.

## Structure

- **`utils/`** - Shared utilities and helpers for E2E tests
- Test files are in the root of this directory

## Purpose

E2E tests verify:

- Complete user workflows (start game, move around, interact with UI)
- Integration between React UI and canvas game world
- Game state persistence across sessions
- UI responsiveness and visual regression
- Cross-browser compatibility

## Key Concepts

**Real Browser Testing**: Tests run in actual browsers (Chromium, Firefox, Safari) to catch issues that unit tests miss.

**Visual Testing**: Tests can capture screenshots and compare against baselines to catch visual regressions.

**Game-Specific Testing**: Tests interact with both React components and the HTML5 canvas game world.

**Flakiness Minimization**: E2E tests use proper waits and assertions to minimize test flakiness.

## Running Tests

- `npm run e2e` - Run all E2E tests
- `npm run e2e:report` - View test results in browser

## Guidelines

- Focus on critical user journeys rather than exhaustive coverage
- Use page objects or utilities to reduce test maintenance
- Include visual regression tests for important UI components
- Test game functionality that crosses the React/canvas boundary
