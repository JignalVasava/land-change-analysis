import { useState } from "react";
import ChangeDetectionModule from "./modules/ChangeDetectionModule";
import FuturePredictionModule from "./modules/FuturePredictionModule";
import LandClassificationModule from "./modules/LandClassificationModule";

const tabs = [
  { id: "classification", label: "Land Classification" },
  { id: "change-detection", label: "Change Detection" },
  { id: "prediction", label: "Future Prediction" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("classification");

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Cloud-Based Agricultural Land Analysis System</h1>
        <p>
          Interactive geospatial dashboard powered by Google Earth Engine and machine learning APIs.
        </p>
      </header>

      <nav className="tabs" aria-label="Analysis modules">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="content">
        {activeTab === "classification" ? <LandClassificationModule /> : null}
        {activeTab === "change-detection" ? <ChangeDetectionModule /> : null}
        {activeTab === "prediction" ? <FuturePredictionModule /> : null}
      </section>
    </main>
  );
}
