export const BASE_JUNCTIONS = [
  { id: "j01", name: "Zero Mile", latitude: 21.1458, longitude: 79.0882, x: -4, z: -3, congestion: 88, accidents: 5, violations: 61 },
  { id: "j02", name: "Sitabuldi", latitude: 21.1495, longitude: 79.0832, x: -2, z: -3, congestion: 91, accidents: 6, violations: 74 },
  { id: "j03", name: "Variety Square", latitude: 21.1538, longitude: 79.0918, x: 0, z: -3, congestion: 76, accidents: 3, violations: 48 },
  { id: "j04", name: "Dharampeth Chowk", latitude: 21.1399, longitude: 79.0638, x: 2, z: -3, congestion: 54, accidents: 1, violations: 22 },
  { id: "j05", name: "Sadar", latitude: 21.1698, longitude: 79.0838, x: 4, z: -3, congestion: 63, accidents: 2, violations: 30 },
  { id: "j06", name: "Ajni Square", latitude: 21.1228, longitude: 79.0846, x: -4, z: 0, congestion: 82, accidents: 7, violations: 55 },
  { id: "j07", name: "LIC Square", latitude: 21.1369, longitude: 79.0956, x: -2, z: 0, congestion: 49, accidents: 1, violations: 18 },
  { id: "j08", name: "MG Road", latitude: 21.1464, longitude: 79.1028, x: 0, z: 0, congestion: 71, accidents: 4, violations: 40 },
  { id: "j09", name: "Kamptee Rd Jn", latitude: 21.1684, longitude: 79.1142, x: 2, z: 0, congestion: 58, accidents: 2, violations: 26 },
  { id: "j10", name: "Chhaoni Chowk", latitude: 21.1652, longitude: 79.0712, x: 4, z: 0, congestion: 39, accidents: 0, violations: 12 },
  { id: "j11", name: "Ram Jhula", latitude: 21.1294, longitude: 79.1088, x: -2, z: 3, congestion: 44, accidents: 1, violations: 15 },
  { id: "j12", name: "Manish Nagar Chowk", latitude: 21.0944, longitude: 79.0501, x: 1, z: 3, congestion: 33, accidents: 0, violations: 9 },
];

export function createInitialDeployment(junctions, availableOfficers) {
  const deployment = {};
  junctions.forEach((j) => {
    deployment[j.id] = 0;
  });

  const sorted = [...junctions].sort((a, b) => b.congestion - a.congestion);
  for (let i = 0; i < availableOfficers; i += 1) {
    const target = sorted[i % sorted.length];
    deployment[target.id] += 1;
  }

  return deployment;
}
