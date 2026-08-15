import { useEffect, useState } from "react";

const BOOT_STEPS = [
  "Road network",
  "Traffic data",
  "Weather stream",
  "Risk engine",
  "Deployment optimizer",
];

export default function HeroScreen({ onEnter }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= BOOT_STEPS.length - 1) {
          clearInterval(timer);
          setReady(true);
          return prev;
        }
        return prev + 1;
      });
    }, 520);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-screen" aria-label="BeatIQ Launch Screen">
      <div className="hero-content">
        <p className="hero-kicker">AI-Assisted Traffic Risk Scoring and Police Deployment Optimization</p>
        <h1 className="hero-title">BEATIQ</h1>
        <h2 className="hero-subtitle">TRAFFIC RISK COMMAND CENTER</h2>
        <p className="hero-description">AI-assisted traffic-risk intelligence and police deployment optimization.</p>

        <div className="boot-sequence" role="status" aria-live="polite">
          {BOOT_STEPS.map((step, index) => (
            <div key={step} className={`boot-row ${index <= stepIndex ? "active" : ""}`}>
              <span className="boot-dot" />
              <span>{step}</span>
            </div>
          ))}
        </div>

        <button type="button" className="enter-btn" onClick={onEnter} disabled={!ready}>
          {ready ? "Enter Control Room" : "Initializing..."}
        </button>
      </div>
      <div className="hero-poster-shape" aria-hidden="true" />
      <div className="hero-poster-shape shape-2" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
    </section>
  );
}
