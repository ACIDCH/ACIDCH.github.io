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
    ? "主 Facility Location 求解器保持一层 Facility → Demand 结构；独立的 Transshipment / LP 模块负责 Factory → Warehouse → Demand 两级道路转运。两套模型共享同一地图、道路情景与自定义实体，但分别求解，避免把不同决策问题混成一个黑箱模型。"
    : "The main Facility Location solver remains a one-echelon Facility → Demand model. The separate Transshipment / LP module solves Factory → Warehouse → Demand road flow. Both share the same map, road scenario and custom entities while remaining separate optimisation problems instead of one black-box model.";

  const candidates = [...root.querySelectorAll("p, small")];
  const target = candidates.find((node) =>
    String(node.textContent || "").includes("Factory → Warehouse → Demand"),
  );
  if (target) target.textContent = replacement;
}

boot();