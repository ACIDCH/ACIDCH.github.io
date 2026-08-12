import process from "node:process";
import { parseContentFile, validateProtectedPair } from "./lib/i18n-sync.mjs";

const [sourcePath, targetPath] = process.argv.slice(2);
if (!sourcePath || !targetPath) {
  console.error("Usage: node scripts/i18n-protected.mjs <zh-source.md> <en-target.md>");
  process.exit(2);
}
const issues = validateProtectedPair(
  parseContentFile(sourcePath),
  parseContentFile(targetPath),
);
if (issues.length) {
  console.error(JSON.stringify(issues, null, 2));
  process.exit(1);
}
console.log(`Protected-content parity passed: ${sourcePath} → ${targetPath}`);
