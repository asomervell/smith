#!/usr/bin/env node
"use strict";

const path = require("node:path");
const { chromium } = require("@playwright/test");

const DEFAULT_RUNS = 5;
const DEFAULT_URL = "https://example.com";

function parseArgs(argv) {
  const args = { url: DEFAULT_URL, runs: DEFAULT_RUNS };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--url" && argv[i + 1]) {
      args.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--runs" && argv[i + 1]) {
      const runs = Number(argv[i + 1]);
      if (Number.isInteger(runs) && runs > 0) {
        args.runs = runs;
      }
      i += 1;
    }
  }
  return args;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

async function measureHtml(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(200);
  const result = await page.evaluate(() => {
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint");
    return {
      fcp: fcp ? fcp.startTime : null
    };
  });
  await context.close();
  await browser.close();
  return result;
}

async function measureExtension(url, extensionPath) {
  const context = await chromium.launchPersistentContext("", {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint");
    return {
      fcp: fcp ? fcp.startTime : null,
      readerMode: !!document.querySelector(".mdr-shell")
    };
  });
  await context.close();
  return result;
}

async function main() {
  const { url, runs } = parseArgs(process.argv.slice(2));
  const extensionPath = path.join(__dirname, "..");
  const htmlFcps = [];
  const markdownFcps = [];
  let readerHits = 0;

  for (let run = 1; run <= runs; run += 1) {
    const html = await measureHtml(url);
    const markdown = await measureExtension(url, extensionPath);

    if (typeof html.fcp === "number") {
      htmlFcps.push(html.fcp);
    }
    if (typeof markdown.fcp === "number") {
      markdownFcps.push(markdown.fcp);
    }
    if (markdown.readerMode) {
      readerHits += 1;
    }

    console.log(
      `run ${run}/${runs}: html_fcp=${html.fcp?.toFixed?.(1) ?? "n/a"}ms, extension_fcp=${markdown.fcp?.toFixed?.(1) ?? "n/a"}ms, reader_mode=${markdown.readerMode}`
    );
  }

  if (htmlFcps.length === 0 || markdownFcps.length === 0) {
    console.error("Could not compute metrics. FCP was unavailable in one or both modes.");
    process.exit(1);
  }

  const htmlMedian = median(htmlFcps);
  const markdownMedian = median(markdownFcps);
  const ratio = markdownMedian / htmlMedian;
  const deltaPct = ((htmlMedian - markdownMedian) / htmlMedian) * 100;

  console.log("\n--- Median summary ---");
  console.log(`URL: ${url}`);
  console.log(`Runs: ${runs}`);
  console.log(`HTML median FCP: ${htmlMedian.toFixed(1)} ms`);
  console.log(`Extension median FCP: ${markdownMedian.toFixed(1)} ms`);
  console.log(`Relative ratio (extension/html): ${ratio.toFixed(3)}`);
  console.log(`Improvement: ${deltaPct.toFixed(1)}%`);
  console.log(`Reader mode activated: ${readerHits}/${runs} runs`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
