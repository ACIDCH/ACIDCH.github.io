import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "dist");
const destination = join(root, "dist-cloudflare-preview");
assert(existsSync(join(source, "index.html")), "Run npm run build before preparing a preview.");
assert(existsSync(join(source, "zh", "index.html")), "Chinese homepage missing from build.");
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
// Prevent preview URLs from being indexed as copies of the GitHub Pages portfolio.
writeFileSync(join(destination, "_headers"), "/*\n  X-Robots-Tag: noindex, nofollow\n", "utf8");
assert(existsSync(join(destination, "index.html")));
assert(existsSync(join(destination, "zh", "index.html")));
console.log("Cloudflare preview ready (noindex). GitHub Pages deployment remains unchanged.");
