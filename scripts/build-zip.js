#!/usr/bin/env node
"use strict";

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const distDir = path.join(root, "dist");
const outputFile = path.join(distDir, "markdown-reader-extension.zip");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(outputFile)) {
  fs.rmSync(outputFile);
}

const include = [
  "manifest.json",
  "background.js",
  "content.js",
  "markdown.js"
];

execSync(`zip -q -r "${outputFile}" ${include.join(" ")}`, { stdio: "inherit" });
console.log("Created", outputFile);
