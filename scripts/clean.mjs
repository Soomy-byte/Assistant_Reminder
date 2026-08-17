import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const generatedPaths = [
  ".next",
  ".runtime-tmp",
  ".sites-runtime",
  "app/generated/prisma",
  "playwright-report",
  "test-results",
  "tsconfig.tsbuildinfo",
];

for (const relativePath of generatedPaths) {
  await rm(path.join(projectRoot, relativePath), { force: true, recursive: true });
}

console.log("Artefak generated Assistant Reminder sudah dibersihkan.");
