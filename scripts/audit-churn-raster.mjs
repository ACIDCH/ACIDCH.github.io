import { readFile } from "node:fs/promises";
import process from "node:process";

const files = [
  "src/components/RMachineLearningProject.astro",
  "src/components/RDataValidationDeepDive.astro",
  "src/components/RModelBenchmarkDeepDive.astro",
  "src/components/RModelSelectionDeepDive.astro",
  "src/components/RLogisticInterpretationDeepDive.astro",
  "src/components/RNeuralNetworkDeepDive.astro",
  "src/components/ModelEvaluation.astro",
  "src/components/ChurnEvidenceFigure.astro",
];

const nativeOnlyAssets = [
  "/projects/customer-churn/numeric-distributions.webp",
  "/projects/customer-churn/predictor-comparisons.webp",
  "/projects/customer-churn/categorical-churn-rates.webp",
  "/projects/customer-churn/service-interactions.webp",
  "/projects/customer-churn/holdout-roc.webp",
  "/projects/customer-churn/odds-ratio-ci.webp",
];

const rows = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  rows.push({
    file,
    imgTags: source.match(/<img\b/g)?.length ?? 0,
    projectImageRefs: source.match(/projectImages\./g)?.length ?? 0,
    nativeVisualRefs:
      source.match(
        /<(?:ChurnDataStory|ChurnCorrelationExplorer|ChurnOddsRatioChart|ChurnRocExplorer|ModelComparisonLab|ModelEvaluation)\b/g,
      )?.length ?? 0,
  });
}

console.log("Customer Churn raster audit");
console.table(rows);

const failures = [];
const main = rows.find((row) => row.file.endsWith("RMachineLearningProject.astro"));
if (!main || main.imgTags !== 0) {
  failures.push("Flagship page must not contain direct <img> raster rendering.");
}

const guardSource = await readFile("src/components/ChurnEvidenceFigure.astro", "utf8");
for (const asset of nativeOnlyAssets) {
  if (!guardSource.includes(asset)) {
    failures.push(`Native-only raster guard is missing ${asset}`);
  }
}
if (!guardSource.includes("shouldRenderRaster")) {
  failures.push("ChurnEvidenceFigure must keep an explicit raster-render guard.");
}

const dataSource = await readFile("src/data/r-machine-learning.ts", "utf8");
const declaredRasterAssets =
  dataSource.match(/\/projects\/customer-churn\/[a-z0-9-]+\.webp/g) ?? [];
console.log(
  `Declared archived Customer Churn raster assets: ${new Set(declaredRasterAssets).size}`,
);
console.log(
  "The audit allows archived evidence assets to remain in public/ while preventing the flagship page from directly rendering them.",
);

if (failures.length > 0) {
  console.error(`Customer Churn raster audit failed (${failures.length} issue(s)).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Customer Churn raster audit passed.");
