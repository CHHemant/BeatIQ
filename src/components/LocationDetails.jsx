import { explainRisk, tierColor } from "../utils/riskEngine";

export default function LocationDetails({ location, deployedMap, recommendedMap }) {
  if (!location) {
    return (
      <section className="panel details-panel">
        <div className="panel-heading">Location Details</div>
        <p className="muted">Select a location from 3D city or map.</p>
      </section>
    );
  }

  const explanation = explainRisk(location);

  return (
    <section className="panel details-panel">
      <div className="panel-heading">{location.name}</div>
      <div className="details-topline">
        <div className="score-big" style={{ color: tierColor(location.finalRiskScore) }}>{location.finalRiskScore}</div>
        <div>
          <div className="risk-level">{location.riskLevel}</div>
          <div className="muted">
            Officers: {deployedMap[location.id] || 0} / Recommended: {recommendedMap[location.id] || 0}
          </div>
        </div>
      </div>

      <div className="factor-bars">
        {explanation.factors.map((factor) => {
          const width = Math.max(8, factor[1] * 3.4);
          return (
            <div key={factor[0]} className="factor-row">
              <span>{factor[0]}</span>
              <div className="factor-track"><div className="factor-fill" style={{ width: `${width}%` }} /></div>
              <strong>+{factor[1]}</strong>
            </div>
          );
        })}
      </div>

      <p className="explain-copy">{explanation.summary}</p>
    </section>
  );
}
