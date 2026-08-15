export default function TrafficPanel({ location }) {
  if (!location) {
    return (
      <section className="panel traffic-panel">
        <div className="panel-heading">Traffic</div>
        <p className="muted">Select a location to inspect traffic details.</p>
      </section>
    );
  }

  return (
    <section className="panel traffic-panel">
      <div className="panel-heading">Traffic / {location.name}</div>
      <div className="traffic-level">{location.trafficLevel}</div>
      <div className="traffic-score">{location.trafficScore} / 100</div>
      <div className="risk-chip">Traffic Contribution +{location.contributions.traffic}</div>
    </section>
  );
}
