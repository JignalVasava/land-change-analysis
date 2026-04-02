import { useState } from "react";
import MapView from "../components/MapView";
import { analysisApi } from "../services/api";

const currentYear = new Date().getFullYear();
const latestAvailableYear = currentYear - 1;
const years = Array.from({ length: 16 }, (_, i) => latestAvailableYear - i);

export default function LandClassificationModule() {
  const [selectedYear, setSelectedYear] = useState(latestAvailableYear);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analysisApi.getLandClassification(selectedYear);
      setResult(data);
    } catch {
      setError("Unable to fetch classification map. Please check backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="module">
      <h2>Land Classification</h2>
      <p className="module-description">
        Select a year to classify agricultural land, urban areas, water bodies, and barren land.
      </p>
      <div className="controls">
        <label htmlFor="classification-year">Year</label>
        <select
          id="classification-year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Land"}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {result ? (
        <MapView
          tileUrl={result.tileUrl}
          center={result.center}
          zoom={result.zoom}
          legendItems={result.legend}
          legendTitle="Land-cover legend"
          analysisLayerLabel="Land classification (Earth Engine)"
        />
      ) : (
        <p className="placeholder">Run analysis to view classified land tiles.</p>
      )}
    </section>
  );
}
