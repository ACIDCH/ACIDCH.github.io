export function flattenLatLngs(input) {
  const out = [];
  const walk = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      if (
        value.length >= 2 &&
        Number.isFinite(Number(value[0])) &&
        Number.isFinite(Number(value[1]))
      ) {
        out.push({ lat: Number(value[0]), lng: Number(value[1]) });
        return;
      }
      value.forEach(walk);
      return;
    }
    if (Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng ?? value.lon))) {
      out.push({ lat: Number(value.lat), lng: Number(value.lng ?? value.lon) });
    }
  };
  walk(input);
  return out;
}

export function buildPolylineMetrics(points) {
  const clean = (points || []).filter(
    (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y),
  );
  const cumulative = [0];
  let total = 0;
  for (let i = 1; i < clean.length; i += 1) {
    const dx = clean[i].x - clean[i - 1].x;
    const dy = clean[i].y - clean[i - 1].y;
    total += Math.hypot(dx, dy);
    cumulative.push(total);
  }
  return { points: clean, cumulative, total };
}

export function pointAlongPolyline(metrics, distance) {
  if (!metrics?.points?.length) return null;
  if (metrics.points.length === 1 || metrics.total <= 0) {
    return { ...metrics.points[0], angle: 0 };
  }
  const target = ((Number(distance) % metrics.total) + metrics.total) % metrics.total;
  let high = 1;
  while (high < metrics.cumulative.length && metrics.cumulative[high] < target) {
    high += 1;
  }
  high = Math.min(high, metrics.points.length - 1);
  const low = Math.max(0, high - 1);
  const startDistance = metrics.cumulative[low];
  const endDistance = metrics.cumulative[high];
  const span = Math.max(1e-9, endDistance - startDistance);
  const t = Math.max(0, Math.min(1, (target - startDistance) / span));
  const a = metrics.points[low];
  const b = metrics.points[high];
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

export function particleCountForFlow(flow, maxFlow, density = 4) {
  const safeFlow = Math.max(0, Number(flow) || 0);
  const safeMax = Math.max(1, Number(maxFlow) || 1);
  const safeDensity = Math.max(1, Math.min(12, Number(density) || 1));
  return Math.max(1, Math.min(36, Math.round((safeFlow / safeMax) * safeDensity * 5)));
}
