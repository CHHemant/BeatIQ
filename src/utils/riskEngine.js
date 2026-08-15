export const RISK_WEIGHTS = {
  historical: 0.3,
  traffic: 0.3,
  weather: 0.15,
  incident: 0.15,
  coverage: 0.1,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function trafficLevelFromScore(score) {
  if (score >= 80) return "SEVERE";
  if (score >= 60) return "HEAVY";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

export function riskLevelFromScore(score) {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

export function tierColor(score) {
  if (score >= 85) return "#ff4c45";
  if (score >= 70) return "#ff7a25";
  if (score >= 45) return "#ffd84d";
  return "#b7ef5a";
}

export function calculateWeatherRisk(weather) {
  if (!weather) return 20;

  let risk = 8;
  risk += clamp((weather.rainfall || 0) * 4, 0, 32);

  const visibilityKm = weather.visibility ?? 10;
  risk += clamp((10 - visibilityKm) * 5, 0, 32);

  const wind = weather.windSpeed || 0;
  risk += clamp((wind - 12) * 1.4, 0, 16);

  const condition = (weather.condition || "").toLowerCase();
  if (condition.includes("thunder")) risk += 20;
  else if (condition.includes("storm")) risk += 18;
  else if (condition.includes("heavy rain") || condition.includes("rain")) risk += 12;
  else if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze")) risk += 10;

  return clamp(risk);
}

export function calculateRisk(location, context) {
  const traffic = context.trafficById[location.id];
  const weather = context.weatherById[location.id];
  const incident = context.incident;

  const trafficScore = clamp(traffic?.congestion ?? location.congestion);
  const historicalScore = clamp(location.accidents * 12 + location.violations * 0.9 + location.congestion * 0.25);
  const weatherScore = clamp(weather?.weatherRisk ?? calculateWeatherRisk(weather));

  const isIncidentLocation = incident?.locationId === location.id;
  const incidentScore = isIncidentLocation ? clamp(55 + incident.severityBoost) : 0;

  const officersAtLocation = context.currentDeployment[location.id] || 0;
  const demandBase = trafficScore * 0.5 + historicalScore * 0.3 + weatherScore * 0.2;
  const desiredCoverage = Math.max(1, Math.min(4, Math.round(demandBase / 28)));
  const coverageGap = Math.max(0, desiredCoverage - officersAtLocation);
  const coverageScore = clamp(coverageGap * 24);

  const contributions = {
    traffic: Number((trafficScore * RISK_WEIGHTS.traffic).toFixed(1)),
    historical: Number((historicalScore * RISK_WEIGHTS.historical).toFixed(1)),
    weather: Number((weatherScore * RISK_WEIGHTS.weather).toFixed(1)),
    incident: Number((incidentScore * RISK_WEIGHTS.incident).toFixed(1)),
    coverage: Number((coverageScore * RISK_WEIGHTS.coverage).toFixed(1)),
  };

  const finalRiskScore = clamp(
    contributions.traffic + contributions.historical + contributions.weather + contributions.incident + contributions.coverage
  );

  const riskLevel = riskLevelFromScore(finalRiskScore);

  return {
    ...location,
    trafficScore,
    trafficLevel: traffic?.trafficLevel ?? trafficLevelFromScore(trafficScore),
    historicalRisk: Math.round(historicalScore),
    weatherScore: Math.round(weatherScore),
    incidentRisk: Math.round(incidentScore),
    coverageRisk: Math.round(coverageScore),
    currentOfficers: officersAtLocation,
    desiredCoverage,
    finalRiskScore: Math.round(finalRiskScore),
    riskLevel,
    activeIncident: isIncidentLocation,
    contributions,
    weather,
    traffic,
  };
}

export function explainRisk(location) {
  const factors = [
    ["Traffic congestion", location.contributions.traffic, location.trafficScore],
    ["Accident history", location.contributions.historical, location.historicalRisk],
    ["Weather impact", location.contributions.weather, location.weatherScore],
    ["Incident pressure", location.contributions.incident, location.incidentRisk],
    ["Coverage gap", location.contributions.coverage, location.coverageRisk],
  ]
    .filter((item) => item[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  const topLabels = factors.slice(0, 3).map((f) => f[0].toLowerCase());
  const summary = `${location.name} is currently ${location.riskLevel.toLowerCase()} risk due to ${topLabels.join(", ")} and police coverage conditions.`;

  return {
    summary,
    factors,
  };
}
