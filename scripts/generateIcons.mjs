/* eslint-disable no-undef */

/**
 * Generates all Tauri icon assets from the source SVG (or fallback PNG)
 * and writes them to src-tauri/icons/.
 *
 * Uses `pnpm tauri icon` which handles all required sizes and formats:
 *   - PNG variants (32x32, 128x128, 128x128@2x)
 *   - .icns  (macOS)
 *   - .ico   (Windows)
 *
 * Usage:
 *   node scripts/generateIcons.mjs
 *   node scripts/generateIcons.mjs path/to/custom-icon.svg
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDir = resolve(root, "src-tauri", "icons");

// Prefer SVG for lossless scaling; fall back to the highest-resolution PNG.
const candidates = [
    resolve(root, "assets", "desktop", "icon.svg"),
    resolve(root, "assets", "desktop", "icon@2x.png"),
    resolve(root, "assets", "desktop", "icon.png"),
];

const [, , customSource] = process.argv;
const source = customSource
    ? resolve(customSource)
    : candidates.find(existsSync);

if (!source) {
    console.error(
        "No source icon found. Provide a path as the first argument, or add one of:\n" +
        candidates.map((p) => `  ${p}`).join("\n"),
    );
    process.exit(1);
}

console.info(`Generating Tauri icons from: ${source}`);
console.info(`Output directory:            ${outputDir}`);

try {
    execFileSync(
        "pnpm",
        ["tauri", "icon", "--output", outputDir, source],
        { cwd: root, stdio: "inherit" },
    );
    console.info("Icons generated successfully.");
} catch (error) {
    console.error("Icon generation failed:", error.message);
    process.exit(1);
}
