const { test, expect, chromium } = require("@playwright/test");
const path = require("node:path");

test("extension loads and keeps html fallback available", async () => {
  const extensionPath = path.join(__dirname, "..");
  const context = await chromium.launchPersistentContext("", {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const page = await context.newPage();
  await page.goto("https://example.com");

  // In unsupported pages the extension should no-op and leave page intact.
  await expect(page.locator("h1")).toContainText("Example Domain");

  await context.close();
});
