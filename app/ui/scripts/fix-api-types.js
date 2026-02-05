#!/usr/bin/env node

/**
 * Post-processor for Orval-generated API code.
 *
 * This script modifies the generated response types to exclude error variants.
 * Since our customFetch throws on errors, the response types should only include
 * success responses, eliminating the need for type assertions at call sites.
 *
 * Transforms:
 *   export type fooResponse = (fooResponseSuccess | fooResponseError)
 * To:
 *   export type fooResponse = fooResponseSuccess
 */

const fs = require("fs");
const path = require("path");

const GENERATED_DIR = path.join(__dirname, "../src/lib/api/generated");

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Match: export type xxxResponse = (xxxResponseSuccess | xxxResponseError)
  // Replace with: export type xxxResponse = xxxResponseSuccess
  const pattern =
    /export type (\w+Response) = \((\w+ResponseSuccess) \| \w+ResponseError\)/g;

  const newContent = content.replace(pattern, "export type $1 = $2");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed: ${path.relative(GENERATED_DIR, filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith(".ts")) {
      callback(filePath);
    }
  }
}

let fixedCount = 0;
walkDir(GENERATED_DIR, (filePath) => {
  if (processFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} file(s)`);
