import { tierColor } from "../utils/riskEngine";

export default function RiskRanking({ locations, selectedId, onSelect, deployedMap }) {
  return (
    <section className="panel ranking-panel">
      <div className="panel-heading">Risk Ranking</div>
      <div className="ranking-list">
        {locations.map((location, index) => {
          const deployed = (deployedMap[location.id] || 0) > 0;
          const highUnmanned = location.finalRiskScore >= 70 && !deployed;
          return (
            <button
              key={location.id}
              type="button"
              className={`ranking-item ${selectedId === location.id ? "active" : ""}`}
              onClick={() => onSelect(location.id)}
            >
              <span className="ranking-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="ranking-name">{location.name}</span>
              <span className="ranking-score" style={{ color: tierColor(location.finalRiskScore) }}>{location.finalRiskScore}</span>
              {deployed ? <span className="tag tag-live">Deployed {deployedMap[location.id]}</span> : null}
              {highUnmanned ? <span className="tag tag-alert">High-Risk Unmanned</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
