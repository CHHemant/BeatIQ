function priorityScore(location) {
  let score = location.finalRiskScore;
  if (location.activeIncident) score += 45;
  if (location.finalRiskScore >= 70 && location.currentOfficers === 0) score += 30;
  if (location.finalRiskScore >= 45 && location.currentOfficers === 0) score += 12;
  return score;
}

function idealOfficers(location) {
  if (location.activeIncident && location.finalRiskScore >= 85) return 3;
  if (location.finalRiskScore >= 85) return 3;
  if (location.finalRiskScore >= 70) return 2;
  if (location.finalRiskScore >= 45) return 1;
  return 0;
}

export function recommendDeployment(locations, availableOfficers) {
  const recommended = {};
  locations.forEach((l) => {
    recommended[l.id] = 0;
  });

  let remaining = availableOfficers;
  const queue = [...locations].sort((a, b) => priorityScore(b) - priorityScore(a));

  queue.forEach((location) => {
    if (remaining <= 0) return;
    const target = Math.min(idealOfficers(location), remaining);
    recommended[location.id] = target;
    remaining -= target;
  });

  if (remaining > 0 && queue.length > 0) {
    for (let i = 0; i < remaining; i += 1) {
      const location = queue[i % queue.length];
      recommended[location.id] += 1;
    }
  }

  return recommended;
}

export function computeRedeployment(currentDeployment, recommendedDeployment, locationsById) {
  const moves = [];

  Object.keys(currentDeployment).forEach((locationId) => {
    const current = currentDeployment[locationId] || 0;
    const recommended = recommendedDeployment[locationId] || 0;
    if (current === recommended) return;

    moves.push({
      locationId,
      locationName: locationsById[locationId]?.name || locationId,
      current,
      recommended,
      delta: recommended - current,
    });
  });

  const summary = moves
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .map((m) => `${m.locationName}: ${m.current} -> ${m.recommended}`)
    .join(" | ");

  return { moves, summary };
}

export function projectedRiskReduction(scoredLocations, recommendedDeployment) {
  const before = scoredLocations.reduce((sum, l) => sum + l.finalRiskScore, 0);
  const after = scoredLocations.reduce((sum, l) => {
    const officers = recommendedDeployment[l.id] || 0;
    const mitigation = Math.min(22, officers * 8 + (l.activeIncident ? officers * 3 : 0));
    return sum + Math.max(0, l.finalRiskScore - mitigation);
  }, 0);

  const reduction = before === 0 ? 0 : ((before - after) / before) * 100;
  return {
    before: Math.round(before),
    after: Math.round(after),
    reduction: Number(reduction.toFixed(1)),
  };
}
