export default function WeatherPanel({ location }) {
  const weather = location?.weather;

  if (!location || !weather) {
    return (
      <section className="panel weather-panel">
        <div className="panel-heading">Weather</div>
        <p className="muted">Select a location to view weather risk inputs.</p>
      </section>
    );
  }

  return (
    <section className="panel weather-panel">
      <div className="panel-heading">Weather / {location.name}</div>
      <div className="weather-temp">{weather.temperature}deg</div>
      <div className="weather-condition">{weather.condition}</div>
      <div className="weather-grid">
        <div><span>Rain</span><strong>{weather.rainfall} mm</strong></div>
        <div><span>Visibility</span><strong>{weather.visibility} km</strong></div>
        <div><span>Wind</span><strong>{weather.windSpeed} km/h</strong></div>
        <div><span>Humidity</span><strong>{weather.humidity}%</strong></div>
      </div>
      <div className="risk-chip">Weather Risk {location.weatherScore}</div>
    </section>
  );
}
