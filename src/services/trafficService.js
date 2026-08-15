import { trafficLevelFromScore } from "../utils/riskEngine";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function simulateDemoTraffic(location) {
  const t = Date.now() / 60000;
  const wave = Math.sin(t + location.x * 0.8 + location.z * 0.5) * 9;
  const congestion = clamp(location.congestion + wave);
  return {
    congestion: Math.round(congestion),
    trafficLevel: trafficLevelFromScore(congestion),
    incidents: [],
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchTomTomForLocation(location, key) {
  const url = new URL("https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json");
  url.searchParams.set("point", `${location.latitude},${location.longitude}`);
  url.searchParams.set("unit", "KMPH");
  url.searchParams.set("key", key);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Traffic API failed for ${location.name}`);
  }

  const data = await response.json();
  const segment = data.flowSegmentData;
  if (!segment) {
    throw new Error(`Missing traffic segment for ${location.name}`);
  }

  const free = Math.max(segment.freeFlowSpeed || 1, 1);
  const current = Math.max(segment.currentSpeed || free, 0);
  const congestion = clamp(100 - (current / free) * 100);

  return {
    congestion: Math.round(congestion),
    trafficLevel: trafficLevelFromScore(congestion),
    incidents: [],
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchTrafficSnapshot(locations, mode = "demo") {
  const byId = {};
  const nowIso = new Date().toISOString();

  if (mode !== "live") {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoTraffic(location);
    });

    return {
      source: "demo",
      status: "ok",
      message: "Synthetic traffic simulation active.",
      byId,
      lastUpdated: nowIso,
    };
  }

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoTraffic(location);
    });
    return {
      source: "demo-fallback",
      status: "fallback",
      message: "Traffic API key missing. Using demo traffic.",
      byId,
      lastUpdated: nowIso,
    };
  }

  try {
    const result = await Promise.all(locations.map((location) => fetchTomTomForLocation(location, apiKey)));
    locations.forEach((location, index) => {
      byId[location.id] = result[index];
    });

    return {
      source: "tomtom",
      status: "ok",
      message: "Live traffic data from TomTom.",
      byId,
      lastUpdated: nowIso,
    };
  } catch (error) {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoTraffic(location);
    });

    return {
      source: "demo-fallback",
      status: "fallback",
      message: `Traffic API unavailable (${error.message}). Using demo traffic.`,
      byId,
      lastUpdated: nowIso,
    };
  }
}
