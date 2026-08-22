const fs = require('fs');
const path = 'src/scripts/geospatial-v4.js';
let text = fs.readFileSync(path, 'utf8');
const start = text.indexOf('  const HPOOL = [');
const end = text.indexOf('  let baseSceneIndex =', start);
if (start < 0 || end < 0) throw new Error('legacy scene block not found');
const replacement = `  const FACILITY_REGIONS = [
    { name: "North", points: [["Albany",-36.7245,174.6978],["Browns Bay",-36.7167,174.75],["Takapuna",-36.787,174.775],["Silverdale",-36.6167,174.675]] },
    { name: "West", points: [["Henderson",-36.879,174.63],["Westgate",-36.819,174.613],["Te Atatu",-36.866,174.657],["New Lynn",-36.91,174.684]] },
    { name: "Central", points: [["Auckland CBD",-36.8485,174.7633],["Mount Eden",-36.877,174.764],["Epsom",-36.889,174.797],["Onehunga",-36.921,174.785],["Newmarket",-36.869,174.777]] },
    { name: "East", points: [["Orakei",-36.8585,174.811],["Panmure",-36.896,174.855],["Pakuranga",-36.883,174.915],["Howick",-36.895,174.93]] },
    { name: "South", points: [["Manukau",-36.992,174.879],["Manurewa",-37.021,174.901],["Takanini",-37.041,174.921],["Papakura",-37.066,174.943],["Drury",-37.101,174.956]] },
  ],
    DEMAND_REGIONS = [
      { name: "North", points: [["Albany Demand",-36.735,174.698],["Rosedale Demand",-36.742,174.717],["Browns Bay Demand",-36.715,174.748],["Northcross Demand",-36.703,174.733]] },
      { name: "West", points: [["Henderson Demand",-36.879,174.63],["Massey Demand",-36.814,174.606],["New Lynn Demand",-36.909,174.681],["Glen Eden Demand",-36.923,174.65]] },
      { name: "Central", points: [["CBD Demand",-36.8485,174.7633],["Kingsland Demand",-36.882,174.719],["Epsom Demand",-36.889,174.797],["One Tree Hill Demand",-36.901,174.785]] },
      { name: "East", points: [["Orakei Demand",-36.8585,174.811],["Panmure Demand",-36.895,174.854],["Pakuranga Demand",-36.883,174.915],["Howick Demand",-36.895,174.93]] },
      { name: "South", points: [["Manukau Demand",-36.992,174.879],["Manurewa Demand",-37.021,174.901],["Takanini Demand",-37.041,174.921],["Papakura Demand",-37.066,174.943]] },
    ];

  function rng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function shuffled(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function chooseRandomScene(forceDifferent = false) {
    const stored = Number(globalThis.sessionStorage?.getItem("acidch-geo-v4-scene-seed"));
    let seed = Number.isInteger(stored) && stored > 0 ? stored : ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    if (forceDifferent || !Number.isInteger(stored) || stored <= 0) {
      seed = ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
      if (seed === stored) seed = (seed + 104729) >>> 0;
      globalThis.sessionStorage?.setItem("acidch-geo-v4-scene-seed", String(seed));
    }
    const random = rng(seed);
    const facilities = [];
    FACILITY_REGIONS.forEach((region) => {
      const p = shuffled(region.points, random)[0];
      facilities.push({ region: region.name, name: p[0], lat: p[1], lon: p[2] });
    });
    const facilityPool = FACILITY_REGIONS.flatMap((region) => region.points.map((p) => ({ region: region.name, name: p[0], lat: p[1], lon: p[2] })));
    for (const candidate of shuffled(facilityPool, random)) {
      if (facilities.length >= 10) break;
      if (!facilities.some((x) => x.name === candidate.name)) facilities.push(candidate);
    }
    const typedFacilities = shuffled(facilities, random).map((x, index) => ({ ...x, type: index < 3 ? "factory" : "warehouse" }));
    const demands = [];
    DEMAND_REGIONS.forEach((region) => {
      const p = shuffled(region.points, random)[0];
      demands.push({ region: region.name, name: p[0], lat: p[1], lon: p[2] });
    });
    const demandPool = DEMAND_REGIONS.flatMap((region) => region.points.map((p) => ({ region: region.name, name: p[0], lat: p[1], lon: p[2] })));
    for (const candidate of shuffled(demandPool, random)) {
      if (demands.length >= 12) break;
      if (!demands.some((x) => x.name === candidate.name)) demands.push(candidate);
    }
    const H = typedFacilities.map((x) => x.name);
    const HQ = typedFacilities.map((x) => `${x.name}, Auckland, New Zealand`);
    const HC = typedFacilities.map((x) => ({ lat: x.lat, lon: x.lon }));
    const HT = typedFacilities.map((x) => x.type);
    const N = demands.map((x) => x.name);
    const NQ = demands.map((x) => `${x.name}, Auckland, New Zealand`);
    const NC = demands.map((x) => ({ lat: x.lat, lon: x.lon }));
    const DM = demands.map(() => Math.round((400 + random() * 700) / 50) * 50);
    const M = HC.map((a) => NC.map((b) => {
      const lat = ((b.lat - a.lat) * Math.PI) / 180;
      const lon = ((b.lon - a.lon) * Math.PI) / 180;
      const aa = Math.sin(lat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(lon / 2) ** 2;
      return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, aa)));
    }));
    return { H, HQ, HC, HT, N, NQ, NC, DM, M, seed };
  }

  let baseScene = chooseRandomScene(false);
`;
text = text.slice(0, start) + replacement + text.slice(end);
text = text.replace('  let baseSceneIndex = chooseSceneIndex(false),\n    baseScene = sceneFromIndex(baseSceneIndex);\n', '');
text = text.replace('      baseSceneIndex = chooseSceneIndex(true);\n      baseScene = sceneFromIndex(baseSceneIndex);', '      baseScene = chooseRandomScene(true);');
text = text.replace('            { color: "#d8ff6b", weight: 2.7, opacity: 0.84 },', '            { color: "#142126", weight: 8, opacity: 0.82, lineCap: "round", lineJoin: "round" },\n          )\n            .addTo(rl);\n          L.polyline(\n            p.coordinates.map((v) => [v.lat, v.lon]),\n            { color: "#d8ff6b", weight: 4.2, opacity: 0.96, lineCap: "round", lineJoin: "round" },');
text = text.replace('            { color: "#d8ff6b", weight: 2.5, opacity: 0.82 },', '            { color: "#142126", weight: 7.5, opacity: 0.82, lineCap: "round", lineJoin: "round" },\n          )\n            .addTo(rl);\n          L.polyline(\n            cs.map(([lon, lat]) => [lat, lon]),\n            { color: "#d8ff6b", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" },');
if (text.includes('COMPACT_SCENES') || text.includes('chooseSceneIndex') || text.includes('baseSceneIndex')) throw new Error('legacy scene code remains');
fs.writeFileSync(path, text, 'utf8');
