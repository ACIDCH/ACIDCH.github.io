import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const notePath = join("src", "content", "notes", "descriptive-statistics.zh.md");
const note = readFileSync(notePath, "utf8");
const publicText = note.replace(/^---[\s\S]*?---\s*/u, "");
const forbidden = [
  /\bAI\b/iu,
  /人工智能/u,
  /ChatGPT/iu,
  /OpenAI/iu,
  /LLM/iu,
  /BUSINFO/iu,
  /Assignment/iu,
  /Task/iu,
  /Submission/iu,
  /样板页/u,
  /试点页/u,
];
const sourceHits = forbidden.filter((pattern) => pattern.test(publicText));

if (sourceHits.length) {
  console.error("Learning-note public source contains a restricted label.");
  process.exit(1);
}

const buildRoute = join("dist", "zh", "notes", "descriptive-statistics", "index.html");
if (!existsSync(buildRoute)) {
  console.error("Published learning note was not emitted to the production build.");
  process.exit(1);
}

const builtText = readFileSync(buildRoute, "utf8");
if (forbidden.some((pattern) => pattern.test(builtText))) {
  console.error("Published learning-note build contains a restricted label.");
  process.exit(1);
}

console.log(
  "Learning-note audit passed (published article and public build are clean).",
);
