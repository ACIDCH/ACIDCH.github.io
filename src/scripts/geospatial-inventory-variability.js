const D = globalThis.document;

function boot() {
  const root = D?.getElementById("geo-v4");
  const baseSd = D?.getElementById("geo4-inv-sd");
  const mean = D?.getElementById("geo4-inv-mean");
  const lead = D?.getElementById("geo4-lead-time");
  const service = D?.getElementById("geo4-service");
  const holding = D?.getElementById("geo4-holding-cost");
  if (!root || !baseSd || !mean || !lead || !service || !holding) {
    globalThis.setTimeout(boot, 80);
    return;
  }
  if (root.dataset.inventoryVariabilityReady === "true") return;
  root.dataset.inventoryVariabilityReady = "true";

  const zh = (root.dataset.locale || "zh") === "zh";
  const copy = zh
    ? {
        label: "提前期标准差（天）",
        formula: "联合提前期需求标准差",
        note: "将需求波动与提前期波动合并后，再计算安全库存、ROP 与缺货风险。",
      }
    : {
        label: "Lead-time SD (days)",
        formula: "Combined lead-time demand SD",
        note: "Demand variability and lead-time variability are combined before safety stock, ROP and stockout risk are calculated.",
      };

  // V4 reads #geo4-inv-sd dynamically. Keep the visible course input as the
  // raw demand SD, and provide an effective hidden SD that preserves the
  // 709 combined lead-time variance in the existing inventory engine:
  // sigma_D,L^2 = L * sigma_D^2 + dbar^2 * sigma_L^2.
  baseSd.id = "geo4-inv-sd-base";
  baseSd.dataset.rawDemandSd = "true";

  const effective = D.createElement("input");
  effective.id = "geo4-inv-sd";
  effective.type = "hidden";
  effective.setAttribute("aria-hidden", "true");
  baseSd.insertAdjacentElement("afterend", effective);

  const leadLabel = lead.closest("label");
  const field = D.createElement("label");
  field.className = "geo4__field inline geo4__lead-variability";
  field.innerHTML = `<span>${copy.label}</span><input id="geo4-lead-time-sd" type="number" min="0" step="0.1" value="0" />`;
  leadLabel?.insertAdjacentElement("afterend", field);

  const preview = D.createElement("div");
  preview.className = "geo4__inventory-variance-preview";
  preview.innerHTML = `<span>${copy.formula}</span><strong data-combined-sd>—</strong><small>${copy.note}</small>`;
  field.insertAdjacentElement("afterend", preview);

  const style = D.createElement("style");
  style.textContent = `
    .geo4__lead-variability input{border-color:rgba(255,204,102,.22)!important}
    .geo4__inventory-variance-preview{margin:.45rem 0 .2rem;padding:.5rem .55rem;border:1px solid rgba(255,204,102,.15);background:linear-gradient(90deg,rgba(255,204,102,.055),rgba(8,34,45,.34));display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.2rem .6rem}.geo4__inventory-variance-preview span{color:#879da5;font-size:.58rem}.geo4__inventory-variance-preview strong{color:#ffcc66;font:700 .65rem monospace}.geo4__inventory-variance-preview small{grid-column:1/-1;color:#66848f;font-size:.52rem;line-height:1.42}
  `;
  D.head.appendChild(style);

  const leadSd = field.querySelector("#geo4-lead-time-sd");
  const combined = preview.querySelector("[data-combined-sd]");

  function sync() {
    const mu = Math.max(0, Number(mean.value) || 0);
    const sigmaD = Math.max(0, Number(baseSd.value) || 0);
    const averageLead = Math.max(0.000001, Number(lead.value) || 0.000001);
    const sigmaL = Math.max(0, Number(leadSd.value) || 0);
    const combinedSd = Math.sqrt(averageLead * sigmaD ** 2 + mu ** 2 * sigmaL ** 2);
    // The existing policy computes sigma_eff * sqrt(L). This equivalent
    // sigma_eff makes that term exactly equal to the 709 combined SD.
    const effectiveSd = combinedSd / Math.sqrt(averageLead);
    effective.value = String(effectiveSd);
    effective.dataset.combinedLeadDemandSd = String(combinedSd);
    combined.textContent = `${combinedSd.toFixed(1)} units`;
    root.dataset.leadTimeVariability = sigmaL > 0 ? "variable" : "fixed";
  }

  [mean, baseSd, lead, leadSd].forEach((input) =>
    input.addEventListener("input", sync),
  );
  D.getElementById("geo4-reset")?.addEventListener("click", () => {
    mean.value = "120";
    baseSd.value = "25";
    lead.value = "2";
    leadSd.value = "0";
    service.value = "1.645";
    holding.value = "1";
    // V4 reset reaches an async solve() and yields; synchronising here ensures
    // the hidden effective SD is already restored before that solve resumes.
    sync();
  });
  sync();
}

boot();
