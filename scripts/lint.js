#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "markdown.js"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length > 0) {
  console.error("Missing required extension files:", missing.join(", "));
  process.exit(1);
}

console.log("Lint checks passed.");
