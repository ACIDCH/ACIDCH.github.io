const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  if (!root) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.modelBoundaryReady === "true") return;
  root.dataset.modelBoundaryReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const replacement = zh
    ? "主 Facility Location 求解器保持一层 Facility → Demand 结构；独立的 Transshipment / LP 模块负责 Factory → Warehouse → Demand 两级道路转运，两个模型分别求解，不混作同一个优化问题。"
    : "The main Facility Location solver remains a one-echelon Facility → Demand model. The separate Transshipment / LP module solves the Factory → Warehouse → Demand two-echelon road flow, so the two optimisation problems remain explicitly separated.";

  const candidates = [...root.querySelectorAll("p, small")];
  const target = candidates.find((node) =>
    String(node.textContent || "").includes("Factory → Warehouse → Demand"),
  );
  if (target) target.textContent = replacement;
}

boot();