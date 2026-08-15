export default function DeploymentPanel({
  selected,
  deployedMap,
  recommendedMap,
  onApplyRecommendation,
  onRejectRecommendation,
  onManualAdjust,
  projection,
  redeployment,
}) {
  if (!selected) {
    return (
      <section className="panel deployment-panel">
        <div className="panel-heading">Deployment</div>
        <p className="muted">Select a location to manage deployment.</p>
      </section>
    );
  }

  const current = deployedMap[selected.id] || 0;
  const recommended = recommendedMap[selected.id] || 0;

  return (
    <section className="panel deployment-panel">
      <div className="panel-heading">Deployment Optimizer</div>
      <div className="deploy-focus">
        <h3>{selected.name}</h3>
        <p>Current: {current} officers</p>
        <p>Recommended: {recommended} officers</p>
        <div className="delta-line">{current}{" -> "}{recommended}</div>
      </div>

      <div className="manual-override">
        <button type="button" onClick={() => onManualAdjust(selected.id, -1)}>-</button>
        <strong>{current}</strong>
        <button type="button" onClick={() => onManualAdjust(selected.id, 1)}>+</button>
      </div>

      <div className="deploy-actions">
        <button type="button" className="action-btn" onClick={onApplyRecommendation}>Accept Recommendation</button>
        <button type="button" className="action-btn secondary" onClick={onRejectRecommendation}>Reject</button>
      </div>

      <div className="projection-grid">
        <div><span>Risk Before</span><strong>{projection.before}</strong></div>
        <div><span>Risk After</span><strong>{projection.after}</strong></div>
        <div><span>Expected Reduction</span><strong>{projection.reduction}%</strong></div>
      </div>

      <div className="redeploy-list">
        <div className="mini-title">Dynamic Redeployment</div>
        {redeployment.moves.slice(0, 5).map((move) => (
          <div key={move.locationId} className="redeploy-item">
            <span>{move.locationName}</span>
              <strong>{move.current}{" -> "}{move.recommended}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
