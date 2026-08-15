import { calculateWeatherRisk } from "../utils/riskEngine";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function demoCondition(index) {
  const conditions = ["Clear", "Partly Cloudy", "Light Rain", "Heavy Rain", "Haze"];
  return conditions[index % conditions.length];
}

function simulateDemoWeather(location) {
  const t = Date.now() / 70000;
  const rainfall = Math.max(0, Math.sin(t + location.z) * 3 + 2);
  const visibility = clamp(8 - rainfall * 1.1 + Math.cos(t + location.x), 1.2, 10);
  const windSpeed = clamp(8 + Math.sin(t + location.x * 0.7) * 9, 4, 26);
  const condition = demoCondition(Math.round((rainfall + windSpeed) % 5));

  const normalized = {
    temperature: Math.round(25 + Math.sin(t + location.x) * 4),
    condition,
    rainfall: Number(rainfall.toFixed(1)),
    visibility: Number(visibility.toFixed(1)),
    windSpeed: Number(windSpeed.toFixed(1)),
    humidity: Math.round(clamp(55 + rainfall * 8 + Math.cos(t) * 9, 35, 98)),
    lastUpdated: new Date().toISOString(),
  };

  return {
    ...normalized,
    weatherRisk: Math.round(calculateWeatherRisk(normalized)),
  };
}

function normalizeOpenWeather(raw) {
  const weatherMain = raw.weather?.[0]?.main || "Clear";
  const weatherDescription = raw.weather?.[0]?.description || weatherMain;

  const normalized = {
    temperature: Math.round(raw.main?.temp ?? 28),
    condition: weatherDescription,
    rainfall: Number((raw.rain?.["1h"] || 0).toFixed(1)),
    visibility: Number(((raw.visibility ?? 10000) / 1000).toFixed(1)),
    windSpeed: Number(((raw.wind?.speed ?? 0) * 3.6).toFixed(1)),
    humidity: Math.round(raw.main?.humidity ?? 50),
    lastUpdated: new Date((raw.dt || Date.now() / 1000) * 1000).toISOString(),
  };

  if (weatherMain.toLowerCase().includes("thunder")) {
    normalized.condition = "Thunderstorm";
  }

  return {
    ...normalized,
    weatherRisk: Math.round(calculateWeatherRisk(normalized)),
  };
}

async function fetchOpenWeatherForLocation(location, apiKey) {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", location.latitude);
  url.searchParams.set("lon", location.longitude);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API failed for ${location.name}`);
  }

  return normalizeOpenWeather(await response.json());
}

export async function fetchWeatherSnapshot(locations, mode = "demo") {
  const byId = {};
  const nowIso = new Date().toISOString();

  if (mode !== "live") {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoWeather(location);
    });

    return {
      source: "demo",
      status: "ok",
      message: "Synthetic weather simulation active.",
      byId,
      lastUpdated: nowIso,
    };
  }

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoWeather(location);
    });

    return {
      source: "demo-fallback",
      status: "fallback",
      message: "Weather API key missing. Using demo weather.",
      byId,
      lastUpdated: nowIso,
    };
  }

  try {
    const result = await Promise.all(locations.map((location) => fetchOpenWeatherForLocation(location, apiKey)));

    locations.forEach((location, index) => {
      byId[location.id] = result[index];
    });

    return {
      source: "openweather",
      status: "ok",
      message: "Live weather data from OpenWeather.",
      byId,
      lastUpdated: nowIso,
    };
  } catch (error) {
    locations.forEach((location) => {
      byId[location.id] = simulateDemoWeather(location);
    });

    return {
      source: "demo-fallback",
      status: "fallback",
      message: `Weather API unavailable (${error.message}). Using demo weather.`,
      byId,
      lastUpdated: nowIso,
    };
  }
}
