import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000",
  timeout: 20000,
});

const DEFAULT_MAP_CENTER = [20.5937, 78.9629];
const DEFAULT_MAP_ZOOM = 5;

function normalizeYears(years) {
  if (!Array.isArray(years)) {
    return [];
  }

  return [...new Set(years.map((year) => Number(year)).filter((year) => Number.isInteger(year)))].sort((a, b) => a - b);
}

function buildYearPairs(years) {
  const pairs = [];

  for (let i = 0; i < years.length - 1; i += 1) {
    for (let j = i + 1; j < years.length; j += 1) {
      pairs.push([years[i], years[j]]);
    }
  }

  return pairs;
}

export const analysisApi = {
  async getLandClassification(year, regionId = "default") {
    const { data } = await api.get("/classify", {
      params: { year },
    });
    // Transform backend response to match frontend expectations
    return {
      tileUrl: data.data.url,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      legend: [
        { label: "Agriculture/Vegetation", color: "#90EE90" },
        { label: "Urban/Built-up", color: "#FF6B6B" },
        { label: "Water Bodies", color: "#4ECDC4" },
        { label: "Barren Land", color: "#95A5A6" },
      ],
    };
  },

  async getChangeDetection(payload) {
    const sorted = normalizeYears(payload?.years);
    if (sorted.length < 2) {
      throw new Error("Select at least two years.");
    }
    // Compare earliest vs latest selected year (multi-year window)
    const year1 = sorted[0];
    const year2 = sorted[sorted.length - 1];

    const { data } = await api.get("/change", {
      params: { year1, year2 },
    });

    if (!data?.success || !data?.data?.url) {
      throw new Error(data?.error || "Invalid change detection response.");
    }

    return {
      tileUrl: data.data.url,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      yearFrom: year1,
      yearTo: year2,
      selectedYears: sorted,
      legend: [
        { label: "Agriculture → Urban", color: "#FF6B6B" },
        { label: "Agriculture → Other (water, barren, …)", color: "#F39C12" },
        { label: "No land-cover change (stable)", color: "#BDBDBD" },
        { label: "Other land transitions", color: "#9B59B6" },
        { label: "Unclassified / no data", color: "#FFFFFF" },
      ],
      summary: {
        agricultureLossHectares: null,
        urbanGainHectares: null,
        convertedPixels: null,
      },
    };
  },

  async getChangeDetectionSeries(payload) {
    const sorted = normalizeYears(payload?.years);
    if (sorted.length < 2) {
      throw new Error("Select at least two years.");
    }

    const comparisons = await Promise.all(
      sorted.slice(0, -1).map(async (year, index) => {
        const nextYear = sorted[index + 1];
        const comparison = await this.getChangeDetection({ years: [year, nextYear] });

        return {
          ...comparison,
          id: `${year}-${nextYear}`,
          label: `${year} -> ${nextYear}`,
        };
      }),
    );

    return {
      selectedYears: sorted,
      comparisons,
    };
  },

  async getChangeDetectionTimeline(payload) {
    const sorted = normalizeYears(payload?.years);
    if (sorted.length < 2) {
      throw new Error("Select at least two years.");
    }

    const [yearMaps, comparisonSeries] = await Promise.all([
      Promise.all(
        sorted.map(async (year) => {
          const yearMap = await this.getLandClassification(year);

          return {
            ...yearMap,
            id: `year-${year}`,
            year,
            label: `${year}`,
          };
        }),
      ),
      this.getChangeDetectionSeries({ years: sorted }),
    ]);

    return {
      selectedYears: sorted,
      yearMaps,
      comparisons: comparisonSeries.comparisons,
    };
  },

  async getAllYearDifferences(payload) {
    const sorted = normalizeYears(payload?.years);
    if (sorted.length < 2) {
      throw new Error("Select at least two years.");
    }

    const comparisons = await Promise.all(
      buildYearPairs(sorted).map(async ([yearFrom, yearTo]) => {
        const comparison = await this.getChangeDetection({ years: [yearFrom, yearTo] });

        return {
          ...comparison,
          id: `${yearFrom}-${yearTo}`,
          label: `${yearFrom} vs ${yearTo}`,
          span: yearTo - yearFrom,
        };
      }),
    );

    return {
      selectedYears: sorted,
      comparisons,
      totalComparisons: comparisons.length,
    };
  },

  async getFuturePrediction(payload) {
    // payload contains { points: [{year, value}, ...], targetYear }
    const { data } = await api.post("/predict", payload);
    // Transform points to include both actual and predicted values
    const chartData = data.data.points.map(point => ({
      year: point.year,
      actual: point.value
    }));
    // Add the predicted point
    chartData.push({
      year: data.data.targetYear,
      predicted: data.data.prediction
    });
    
    return {
      points: chartData,
      prediction: data.data.prediction,
      targetYear: data.data.targetYear,
    };
  },
};
