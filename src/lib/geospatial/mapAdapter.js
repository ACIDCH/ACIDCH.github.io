const channels = new Map();
let map = null;
let leaflet = null;

export function attachMapAdapter(nextMap, nextLeaflet) {
  map = nextMap;
  leaflet = nextLeaflet;
}

export function getMapContext() {
  return { map, leaflet };
}

export function clearMapChannel(channel) {
  for (const layer of channels.get(channel) || []) {
    try {
      layer.remove();
    } catch {
      // Presentation cleanup must never affect model state.
    }
  }
  channels.set(channel, []);
}

export function drawMapPolyline(channel, coordinates, options = {}, tooltip = "") {
  if (!map || !leaflet || !Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }
  const latLngs = coordinates.map((point) =>
    Array.isArray(point) ? point : [point.lat, point.lon],
  );
  const layer = leaflet.polyline(latLngs, options);
  if (tooltip) layer.bindTooltip(tooltip);
  layer.addTo(map);
  const list = channels.get(channel) || [];
  list.push(layer);
  channels.set(channel, list);
  return layer;
}
