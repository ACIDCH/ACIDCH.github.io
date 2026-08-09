import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const outputRoot = path.join(process.cwd(), "dist");
const sha = process.env.DEPLOY_SHA || process.env.GITHUB_SHA || "local";
const runId = process.env.DEPLOY_RUN_ID || process.env.GITHUB_RUN_ID || "local";
const runNumber =
  process.env.DEPLOY_RUN_NUMBER || process.env.GITHUB_RUN_NUMBER || "local";

const payload = {
  sha,
  runId,
  runNumber,
  builtAt: new Date().toISOString(),
};

await mkdir(outputRoot, { recursive: true });
await writeFile(
  path.join(outputRoot, "deploy-meta.json"),
  `${JSON.stringify(payload, null, 2)}\n`,
  "utf8",
);

console.log(`Deployment metadata written for ${sha}.`);
