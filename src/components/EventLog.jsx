export default function EventLog({ events }) {
  return (
    <section className="panel event-panel">
      <div className="panel-heading">Event Timeline</div>
      <div className="event-list">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <strong>{event.time} IST</strong>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
