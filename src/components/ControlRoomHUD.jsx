import { formatIST } from "../utils/time";

export default function ControlRoomHUD({
  mode,
  onModeChange,
  view,
  onViewChange,
  officers,
  incidentCount,
  highRiskCount,
  unmannedHighRiskCount,
  lastTrafficUpdate,
  lastWeatherUpdate,
  lastRiskUpdate,
  trafficStatus,
  weatherStatus,
}) {
  return (
    <header className="hud-wrap" aria-label="Control Room HUD">
      <div className="hud-brand">
        <p className="hud-kicker">BEATIQ</p>
        <h1>Traffic Intelligence Command</h1>
      </div>

      <div className="hud-stats">
        <div className="hud-chip">
          <strong>{mode.toUpperCase()}</strong>
          <span className={`live-pill ${mode === "live" ? "live" : "demo"}`}>{mode === "live" ? "LIVE" : "DEMO"}</span>
        </div>
        <div className="hud-chip"><strong>{officers}</strong><span>Officers</span></div>
        <div className="hud-chip"><strong>{incidentCount}</strong><span>Active Incidents</span></div>
        <div className="hud-chip"><strong>{highRiskCount}</strong><span>High Risk</span></div>
        <div className="hud-chip"><strong>{unmannedHighRiskCount}</strong><span>High-Risk Unmanned</span></div>
      </div>

      <div className="hud-controls">
        <div className="toggle-row" role="group" aria-label="Data mode">
          <button type="button" onClick={() => onModeChange("live")} className={mode === "live" ? "active" : ""}>Live Mode</button>
          <button type="button" onClick={() => onModeChange("demo")} className={mode === "demo" ? "active" : ""}>Demo Mode</button>
        </div>
        <div className="toggle-row" role="group" aria-label="View mode">
          <button type="button" onClick={() => onViewChange("city")} className={view === "city" ? "active" : ""}>3D City</button>
          <button type="button" onClick={() => onViewChange("map")} className={view === "map" ? "active" : ""}>Live Map</button>
        </div>

        <div className="status-lines">
          <span>Traffic updated: {lastTrafficUpdate ? formatIST(new Date(lastTrafficUpdate)) : "--:--:--"} IST ({trafficStatus})</span>
          <span>Weather updated: {lastWeatherUpdate ? formatIST(new Date(lastWeatherUpdate)) : "--:--:--"} IST ({weatherStatus})</span>
          <span>Risk calculated: {lastRiskUpdate ? formatIST(new Date(lastRiskUpdate)) : "--:--:--"} IST</span>
        </div>
      </div>
    </header>
  );
}
