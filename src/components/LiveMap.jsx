import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { tierColor } from "../utils/riskEngine";

function MapRecenter({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom(), { animate: true, duration: 0.8 });
  return null;
}

export default function LiveMap({ locations, selectedId, onSelect, deployedMap, incident }) {
  const selected = locations.find((location) => location.id === selectedId) || locations[0];
  const center = selected ? [selected.latitude, selected.longitude] : [21.1458, 79.0882];

  return (
    <section className="map-wrap" aria-label="Live Map View">
      <MapContainer center={center} zoom={13} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />

        {locations.map((location) => {
          const officers = deployedMap[location.id] || 0;
          const highUnmanned = location.finalRiskScore >= 70 && officers === 0;
          const isIncident = incident?.locationId === location.id;
          const isSelected = selectedId === location.id;

          return (
            <CircleMarker
              key={location.id}
              center={[location.latitude, location.longitude]}
              radius={highUnmanned ? 14 : isSelected ? 12 : 10}
              pathOptions={{
                color: isIncident ? "#ff2b2b" : tierColor(location.finalRiskScore),
                fillColor: tierColor(location.finalRiskScore),
                fillOpacity: highUnmanned ? 0.95 : 0.8,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{ click: () => onSelect(location.id) }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="map-tooltip">
                  <strong>{location.name}</strong>
                  <div>Risk: {location.finalRiskScore} ({location.riskLevel})</div>
                  <div>Officers: {officers}</div>
                  {highUnmanned ? <div>High-Risk Unmanned</div> : null}
                  {isIncident ? <div>Active Incident</div> : null}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </section>
  );
}
