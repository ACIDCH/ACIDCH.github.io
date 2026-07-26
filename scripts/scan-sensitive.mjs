import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import process from "node:process";

const tracked = spawnSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  {
    encoding: "utf8",
    cwd: process.cwd(),
  },
);

if (tracked.status !== 0) {
  console.error("Sensitive-data scan could not list tracked files.");
  process.exit(1);
}

const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-[A-Za-z0-9]{32,}\b/,
];
const matches = [];
const files = tracked.stdout.split("\0").filter(Boolean);

for (const file of files) {
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch {
    continue;
  }

  if (patterns.some((pattern) => pattern.test(content))) {
    matches.push(file);
  }
}

if (matches.length) {
  console.error(`Sensitive-data scan failed in ${matches.length} tracked file(s).`);
  matches.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Sensitive-data scan passed (${files.length} tracked files checked).`);
