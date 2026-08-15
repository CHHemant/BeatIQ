import { useEffect, useMemo, useState } from "react";
import HeroScreen from "./components/HeroScreen";
import ControlRoomHUD from "./components/ControlRoomHUD";
import TrafficScene from "./components/TrafficScene";
import LiveMap from "./components/LiveMap";
import RiskRanking from "./components/RiskRanking";
import LocationDetails from "./components/LocationDetails";
import WeatherPanel from "./components/WeatherPanel";
import TrafficPanel from "./components/TrafficPanel";
import DeploymentPanel from "./components/DeploymentPanel";
import IncidentSimulator from "./components/IncidentSimulator";
import EventLog from "./components/EventLog";
import { BASE_JUNCTIONS, createInitialDeployment } from "./data/junctions";
import { fetchTrafficSnapshot } from "./services/trafficService";
import { fetchWeatherSnapshot } from "./services/weatherService";
import { calculateRisk } from "./utils/riskEngine";
import { computeRedeployment, projectedRiskReduction, recommendDeployment } from "./utils/deploymentOptimizer";
import { formatIST } from "./utils/time";

const POLL_INTERVAL_MS = 60000;

function createEvent(message) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: formatIST(),
    message,
  };
}

export default function BeatIQ() {
  const initialMode = import.meta.env.VITE_DEFAULT_MODE === "live" ? "live" : "demo";
  const [showHero, setShowHero] = useState(true);
  const [mode, setMode] = useState(initialMode);
  const [view, setView] = useState("city");
  const [officers, setOfficers] = useState(6);

  const [selectedLocationId, setSelectedLocationId] = useState(BASE_JUNCTIONS[0].id);
  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([createEvent("System ready. DEMO dataset loaded for 12 Nagpur junctions.")]);

  const [currentDeployment, setCurrentDeployment] = useState(() => createInitialDeployment(BASE_JUNCTIONS, 6));
  const [trafficSnapshot, setTrafficSnapshot] = useState({ byId: {}, status: "init", source: "demo", message: "" });
  const [weatherSnapshot, setWeatherSnapshot] = useState({ byId: {}, status: "init", source: "demo", message: "" });
  const [lastRiskUpdatedAt, setLastRiskUpdatedAt] = useState(null);

  const locationsById = useMemo(() => {
    const byId = {};
    BASE_JUNCTIONS.forEach((location) => {
      byId[location.id] = location;
    });
    return byId;
  }, []);

  useEffect(() => {
    if (document.getElementById("beatiq-fonts")) return;
    const link = document.createElement("link");
    link.id = "beatiq-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function refreshData() {
      const [traffic, weather] = await Promise.all([
        fetchTrafficSnapshot(BASE_JUNCTIONS, mode),
        fetchWeatherSnapshot(BASE_JUNCTIONS, mode),
      ]);

      if (ignore) return;

      setTrafficSnapshot(traffic);
      setWeatherSnapshot(weather);
      setLastRiskUpdatedAt(new Date().toISOString());

      setEvents((prev) => [
        createEvent(`Traffic data updated (${traffic.source}).`),
        createEvent(`Weather data updated (${weather.source}).`),
        ...prev,
      ].slice(0, 18));
    }

    refreshData();
    const timer = setInterval(refreshData, POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [mode]);

  useEffect(() => {
    setCurrentDeployment(createInitialDeployment(BASE_JUNCTIONS, officers));
    setEvents((prev) => [createEvent(`Officer capacity changed to ${officers}.`), ...prev].slice(0, 18));
  }, [officers]);

  const scoredLocations = useMemo(() => {
    const scored = BASE_JUNCTIONS.map((location) =>
      calculateRisk(location, {
        trafficById: trafficSnapshot.byId,
        weatherById: weatherSnapshot.byId,
        incident,
        currentDeployment,
      })
    ).sort((a, b) => b.finalRiskScore - a.finalRiskScore);

    return scored;
  }, [trafficSnapshot.byId, weatherSnapshot.byId, incident, currentDeployment]);

  const selectedLocation = scoredLocations.find((location) => location.id === selectedLocationId) || null;

  const recommendedDeployment = useMemo(
    () => recommendDeployment(scoredLocations, officers),
    [scoredLocations, officers]
  );

  const redeployment = useMemo(
    () => computeRedeployment(currentDeployment, recommendedDeployment, locationsById),
    [currentDeployment, recommendedDeployment, locationsById]
  );

  const projection = useMemo(
    () => projectedRiskReduction(scoredLocations, recommendedDeployment),
    [scoredLocations, recommendedDeployment]
  );

  const highRiskCount = scoredLocations.filter((location) => location.finalRiskScore >= 70).length;
  const unmannedHighRisk = scoredLocations.filter(
    (location) => location.finalRiskScore >= 70 && (currentDeployment[location.id] || 0) === 0
  );

  function pushEvent(message) {
    setEvents((prev) => [createEvent(message), ...prev].slice(0, 18));
  }

  function handleIncidentDeploy(payload) {
    setIncident({
      ...payload,
      time: new Date().toISOString(),
    });
    setSelectedLocationId(payload.locationId);
    pushEvent(`${payload.severity} incident deployed at ${locationsById[payload.locationId].name}.`);
  }

  function handleIncidentClear() {
    if (!incident) return;
    pushEvent(`Incident cleared at ${locationsById[incident.locationId].name}.`);
    setIncident(null);
  }

  function handleApplyRecommendation() {
    setCurrentDeployment(recommendedDeployment);
    pushEvent(`Recommendation accepted. ${redeployment.summary || "No changes needed."}`);
  }

  function handleRejectRecommendation() {
    pushEvent("Recommendation rejected by operator.");
  }

  function handleManualAdjust(locationId, delta) {
    setCurrentDeployment((prev) => {
      const next = { ...prev };
      const current = next[locationId] || 0;

      if (delta < 0 && current === 0) {
        return prev;
      }

      if (delta > 0) {
        const totalAssigned = Object.values(next).reduce((sum, value) => sum + value, 0);
        if (totalAssigned >= officers) {
          pushEvent("Manual override blocked. No officers left to allocate.");
          return prev;
        }
      }

      next[locationId] = Math.max(0, current + delta);
      const reason = window.prompt("Optional reason for override:", "");
      pushEvent(
        `Manual override at ${locationsById[locationId].name}: ${current} -> ${next[locationId]}${
          reason ? ` (Reason: ${reason})` : ""
        }.`
      );
      return next;
    });
  }

  const selectedWeatherCondition = selectedLocation?.weather?.condition || "Clear";

  return (
    <div className="beatiq-root">
      {showHero ? (
        <div className="hero-layout">
          <div className="hero-scene-wrap" aria-hidden="true">
            <TrafficScene
              locations={scoredLocations.length ? scoredLocations : BASE_JUNCTIONS.map((j) => ({ ...j, finalRiskScore: j.congestion, trafficScore: j.congestion }))}
              selectedId={selectedLocationId}
              onSelect={setSelectedLocationId}
              deployedMap={currentDeployment}
              incident={incident}
              weatherMode={selectedWeatherCondition}
            />
          </div>
          <HeroScreen onEnter={() => setShowHero(false)} />
        </div>
      ) : (
        <div className="control-room">
          <ControlRoomHUD
            mode={mode}
            onModeChange={setMode}
            view={view}
            onViewChange={setView}
            officers={officers}
            incidentCount={incident ? 1 : 0}
            highRiskCount={highRiskCount}
            unmannedHighRiskCount={unmannedHighRisk.length}
            lastTrafficUpdate={trafficSnapshot.lastUpdated}
            lastWeatherUpdate={weatherSnapshot.lastUpdated}
            lastRiskUpdate={lastRiskUpdatedAt}
            trafficStatus={trafficSnapshot.status}
            weatherStatus={weatherSnapshot.status}
          />

          <div className="top-action-row">
            <div className="officer-range">
              <label htmlFor="officers">Officers Available</label>
              <input
                id="officers"
                type="range"
                min="3"
                max="12"
                value={officers}
                onChange={(e) => setOfficers(Number(e.target.value))}
              />
              <strong>{officers}</strong>
            </div>

            <IncidentSimulator
              locations={BASE_JUNCTIONS}
              selectedId={selectedLocationId}
              onDeploy={handleIncidentDeploy}
              onClear={handleIncidentClear}
              activeIncident={incident}
            />
          </div>

          <main className="room-grid">
            <section className="main-visual-panel">
              {view === "city" ? (
                <TrafficScene
                  locations={scoredLocations}
                  selectedId={selectedLocationId}
                  onSelect={setSelectedLocationId}
                  deployedMap={currentDeployment}
                  incident={incident}
                  weatherMode={selectedWeatherCondition}
                />
              ) : (
                <LiveMap
                  locations={scoredLocations}
                  selectedId={selectedLocationId}
                  onSelect={setSelectedLocationId}
                  deployedMap={currentDeployment}
                  incident={incident}
                />
              )}

              <div className="warning-strip">
                <div className="warning-title">High-Risk Unmanned</div>
                <div className="warning-items">
                  {unmannedHighRisk.length === 0 ? <span>All high-risk locations currently manned.</span> : null}
                  {unmannedHighRisk.map((location) => (
                    <button type="button" key={location.id} onClick={() => setSelectedLocationId(location.id)}>
                      {location.name} / {location.finalRiskScore} / 0 officers
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <aside className="side-column">
              <RiskRanking
                locations={scoredLocations}
                selectedId={selectedLocationId}
                onSelect={setSelectedLocationId}
                deployedMap={currentDeployment}
              />
              <TrafficPanel location={selectedLocation} />
              <WeatherPanel location={selectedLocation} />
            </aside>
          </main>

          <section className="bottom-grid">
            <LocationDetails
              location={selectedLocation}
              deployedMap={currentDeployment}
              recommendedMap={recommendedDeployment}
            />
            <DeploymentPanel
              selected={selectedLocation}
              deployedMap={currentDeployment}
              recommendedMap={recommendedDeployment}
              onApplyRecommendation={handleApplyRecommendation}
              onRejectRecommendation={handleRejectRecommendation}
              onManualAdjust={handleManualAdjust}
              projection={projection}
              redeployment={redeployment}
            />
            <EventLog events={events} />
          </section>
        </div>
      )}
    </div>
  );
}
