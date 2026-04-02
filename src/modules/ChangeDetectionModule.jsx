import { useMemo, useState } from "react";
import MapView from "../components/MapView";
import { analysisApi } from "../services/api";

const currentYear = new Date().getFullYear();
const latestAvailableYear = currentYear - 1;
const years = Array.from({ length: 20 }, (_, i) => latestAvailableYear - i);

function normalizeYears(values) {
  return [...new Set(values.filter((value) => Number.isInteger(value)))].sort((a, b) => a - b);
}

export default function ChangeDetectionModule() {
  const [selectedYears, setSelectedYears] = useState([latestAvailableYear - 5, latestAvailableYear]);
  const [result, setResult] = useState(null);
  const [activeYearId, setActiveYearId] = useState(null);
  const [activeComparisonId, setActiveComparisonId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sortedYears = useMemo(() => normalizeYears(selectedYears), [selectedYears]);

  const handleChange = (event) => {
    const values = normalizeYears(Array.from(event.target.selectedOptions).map((option) => Number(option.value)));
    setSelectedYears(values);
  };

  const handleAnalyze = async () => {
    if (sortedYears.length < 2) {
      setError("Select at least two years for change detection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analysisApi.getChangeDetectionTimeline({ years: sortedYears });
      setResult(data);
      setActiveYearId(data.yearMaps[0]?.id ?? null);
      setActiveComparisonId(data.comparisons[0]?.id ?? null);
    } catch {
      setError("Unable to fetch change detection results. Please check backend API.");
      setResult(null);
      setActiveYearId(null);
      setActiveComparisonId(null);
    } finally {
      setLoading(false);
    }
  };

  const yearMaps = Array.isArray(result?.yearMaps) ? result.yearMaps : [];
  const comparisons = Array.isArray(result?.comparisons) ? result.comparisons : [];
  const activeYearMap = yearMaps.find((yearMap) => yearMap.id === activeYearId) ?? yearMaps[0] ?? null;
  const activeComparison =
    comparisons.find((comparison) => comparison.id === activeComparisonId) ?? comparisons[0] ?? null;
  const resultYears = Array.isArray(result?.selectedYears) ? result.selectedYears : [];
  const comparisonStartMap = yearMaps.find((yearMap) => yearMap.year === activeComparison?.yearFrom) ?? null;
  const comparisonEndMap = yearMaps.find((yearMap) => yearMap.year === activeComparison?.yearTo) ?? null;
  const combinedAnalysisLayers =
    activeComparison && comparisonStartMap && comparisonEndMap
      ? [
          {
            id: `classification-${comparisonStartMap.year}`,
            label: `Land Classification (${comparisonStartMap.year})`,
            subtitle: `Shows agriculture, urban, water, and barren classes for ${comparisonStartMap.year}.`,
            tileUrl: comparisonStartMap.tileUrl,
            defaultVisible: true,
            defaultOpacity: 0.45,
          },
          {
            id: `classification-${comparisonEndMap.year}`,
            label: `Land Classification (${comparisonEndMap.year})`,
            subtitle: `Shows agriculture, urban, water, and barren classes for ${comparisonEndMap.year}.`,
            tileUrl: comparisonEndMap.tileUrl,
            defaultVisible: true,
            defaultOpacity: 0.45,
          },
          {
            id: `change-${activeComparison.id}`,
            label: `Change Detection (${activeComparison.yearFrom} to ${activeComparison.yearTo})`,
            subtitle: "Highlights where the land-cover class changed between the two selected years.",
            tileUrl: activeComparison.tileUrl,
            defaultVisible: true,
            defaultOpacity: 0.8,
          },
        ]
      : [];

  return (
    <section className="module">
      <h2>Change Detection</h2>
      <p className="module-description">
        Compare multiple selected years and inspect detected land-cover change between each consecutive interval.
      </p>
      <div className="controls">
        <label htmlFor="change-years">Years</label>
        <select id="change-years" multiple value={sortedYears.map(String)} onChange={handleChange}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Detect Changes"}
        </button>
      </div>
      <p className="help-text">Use Ctrl/Cmd + click to select multiple years.</p>
      {sortedYears.length > 0 ? <p className="help-text">Selected: {sortedYears.join(", ")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {activeYearMap && activeComparison ? (
        <>
          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>1. Selected Year Land Maps</h3>
            <p className="help-text" style={{ marginTop: 0 }}>
              Review the classified land map for each selected year first, then inspect the detected change between
              them below.
            </p>
            <div className="summary-grid change-summary" style={{ marginBottom: "1rem" }}>
              {yearMaps.map((yearMap) => (
                <button
                  key={yearMap.id}
                  type="button"
                  onClick={() => setActiveYearId(yearMap.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.9rem 1rem",
                    borderRadius: "14px",
                    border: yearMap.id === activeYearMap.id ? "2px solid #166534" : "1px solid #d6d3d1",
                    background: yearMap.id === activeYearMap.id ? "#f0fdf4" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem" }}>{yearMap.label}</h3>
                  <p style={{ margin: 0, color: "#64748b" }}>Show land-cover map for this year.</p>
                </button>
              ))}
            </div>

            <MapView
              tileUrl={activeYearMap.tileUrl}
              center={activeYearMap.center}
              zoom={activeYearMap.zoom}
              legendItems={activeYearMap.legend}
              legendTitle="Land-cover legend"
              analysisLayerLabel={`Land classification (${activeYearMap.year})`}
              analysisSubtitle={`Classified land cover for ${activeYearMap.year}. Use this as the baseline before checking the detected change maps.`}
            />
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>2. Combined Classification + Change Map</h3>
            <p className="help-text" style={{ marginTop: 0 }}>
              Pick an interval below and use the layer toggles on one map to show both years of land classification
              together with the detected change overlay.
            </p>
            <div className="summary-grid change-summary" style={{ marginBottom: "1rem" }}>
              {comparisons.map((comparison) => (
                <button
                  key={comparison.id}
                  type="button"
                  onClick={() => setActiveComparisonId(comparison.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.9rem 1rem",
                    borderRadius: "14px",
                    border: comparison.id === activeComparison.id ? "2px solid #991b1b" : "1px solid #d6d3d1",
                    background: comparison.id === activeComparison.id ? "#fff7ed" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem" }}>{comparison.label}</h3>
                  <p style={{ margin: 0, color: "#64748b" }}>
                    Show both land-classification years and the change layer for this interval.
                  </p>
                </button>
              ))}
            </div>

            <MapView
              center={activeComparison.center}
              zoom={activeComparison.zoom}
              analysisLayers={combinedAnalysisLayers}
              legendSections={[
                {
                  id: "classification-legend",
                  title: "Land Classification Legend",
                  items: comparisonStartMap?.legend ?? comparisonEndMap?.legend ?? [],
                },
                {
                  id: "change-legend",
                  title: "Change Detection Legend",
                  items: activeComparison.legend,
                },
              ]}
            />

            <div className="summary-grid change-summary">
              <article>
                <h3>Selected years</h3>
                <p>{resultYears.length ? resultYears.join(", ") : "No years returned by API"}</p>
              </article>
              <article>
                <h3>Active interval</h3>
                <p>
                  {activeComparison.yearFrom} to {activeComparison.yearTo}
                </p>
              </article>
              <article>
                <h3>Combined map layers</h3>
                <p>
                  {activeComparison.yearFrom} classification, {activeComparison.yearTo} classification, and change
                  detection
                </p>
              </article>
              <article>
                <h3>Intervals analyzed</h3>
                <p>{comparisons.map((comparison) => comparison.label).join(", ")}</p>
              </article>
              <article>
                <h3>What the colors mean</h3>
                <p className="help-text" style={{ margin: 0 }}>
                  Classification layers show agriculture, urban, water, and barren land. The change layer uses red for
                  agriculture to urban, orange for agriculture to other classes, gray for stable land, and purple for
                  other transitions.
                </p>
              </article>
            </div>
          </div>
        </>
      ) : (
        <p className="placeholder">Run change detection to load yearly land maps and visible change intervals.</p>
      )}
    </section>
  );
}
