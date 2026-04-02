import { useState } from "react";
import PredictionChart from "../components/PredictionChart";
import { analysisApi } from "../services/api";

const currentYear = new Date().getFullYear();

export default function FuturePredictionModule() {
  const [targetYear, setTargetYear] = useState(currentYear + 5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sample historical data for agricultural land prediction
      const historicalData = [
        { year: 2015, value: 12500 },
        { year: 2017, value: 12200 },
        { year: 2019, value: 11800 },
        { year: 2021, value: 11400 },
        { year: 2023, value: 11000 },
      ];
      const data = await analysisApi.getFuturePrediction({
        points: historicalData,
        targetYear: parseInt(targetYear),
      });
      setResult(data);
    } catch {
      setError("Unable to fetch prediction data. Please check backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="module">
      <h2>Future Prediction</h2>
      <p className="module-description">
        Generate future agricultural land forecasts using historical data and regression models.
      </p>
      <div className="controls">
        <label htmlFor="target-year">Predict Year</label>
        <input
          id="target-year"
          type="number"
          value={targetYear}
          onChange={(e) => setTargetYear(e.target.value)}
          min={currentYear + 1}
          max={currentYear + 20}
        />
        <button onClick={handlePredict} disabled={loading}>
          {loading ? "Predicting..." : "Run Prediction"}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {result ? (
        <>
          <PredictionChart data={result.points} />
          <div className="summary-grid">
            <article>
              <h3>Predicted Year</h3>
              <p>{result.targetYear}</p>
            </article>
            <article>
              <h3>Predicted Area (ha)</h3>
              <p>{Math.round(result.prediction).toLocaleString()}</p>
            </article>
          </div>
          <p className="help-text">Dashed line indicates predicted agricultural land trend.</p>
        </>
      ) : (
        <p className="placeholder">Run prediction to display future trend graphs.</p>
      )}
    </section>
  );
}
