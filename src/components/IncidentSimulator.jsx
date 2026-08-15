import { useEffect, useState } from "react";

const INCIDENT_TYPES = [
  { key: "ACCIDENT", label: "Accident" },
  { key: "BREAKDOWN", label: "Vehicle Breakdown" },
  { key: "FLOODING", label: "Road Flooding" },
  { key: "SIGNAL_FAILURE", label: "Signal Failure" },
];

const SEVERITIES = [
  { key: "LOW", boost: 18 },
  { key: "MEDIUM", boost: 30 },
  { key: "HIGH", boost: 45 },
  { key: "CRITICAL", boost: 60 },
];

export default function IncidentSimulator({ locations, selectedId, onDeploy, onClear, activeIncident }) {
  const [open, setOpen] = useState(false);
  const [locationId, setLocationId] = useState(selectedId || locations[0]?.id || "");
  const [type, setType] = useState(INCIDENT_TYPES[0].key);
  const [severity, setSeverity] = useState(SEVERITIES[2].key);

  useEffect(() => {
    if (selectedId) {
      setLocationId(selectedId);
    }
  }, [selectedId]);

  function handleDeploy() {
    const selectedSeverity = SEVERITIES.find((s) => s.key === severity) || SEVERITIES[0];
    onDeploy({
      locationId,
      type,
      severity,
      severityBoost: selectedSeverity.boost,
    });
    setOpen(false);
  }

  return (
    <div className="incident-sim">
      <button type="button" className="action-btn" onClick={() => setOpen(true)}>Simulate Incident</button>
      {activeIncident ? (
        <button type="button" className="action-btn secondary" onClick={onClear}>Clear Incident</button>
      ) : null}

      {open ? (
        <div className="incident-modal-backdrop" role="dialog" aria-modal="true" aria-label="Incident Simulator">
          <div className="incident-modal">
            <h3>Incident Simulator</h3>

            <label>
              Location
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>

            <label>
              Incident Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {INCIDENT_TYPES.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Severity
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {SEVERITIES.map((item) => (
                  <option key={item.key} value={item.key}>{item.key}</option>
                ))}
              </select>
            </label>

            <div className="incident-modal-actions">
              <button type="button" className="action-btn secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="action-btn" onClick={handleDeploy}>Deploy</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
