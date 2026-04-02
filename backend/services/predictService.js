export function linearRegressionPredict(dataPoints = [], targetYear = 2030) {
  if (!Array.isArray(dataPoints) || dataPoints.length < 2) {
    throw new Error('Input must be an array of {year, value} and contain at least 2 points.');
  }

  const points = dataPoints
    .map((p) => ({ year: Number(p.year), value: Number(p.value) }))
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value));

  if (points.length < 2) {
    throw new Error('Insufficient valid data points for regression.');
  }

  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.year, 0);
  const sumY = points.reduce((acc, p) => acc + p.value, 0);
  const sumXY = points.reduce((acc, p) => acc + p.year * p.value, 0);
  const sumX2 = points.reduce((acc, p) => acc + p.year * p.year, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const prediction = slope * targetYear + intercept;

  return {
    slope,
    intercept,
    targetYear,
    prediction,
    points
  };
}
