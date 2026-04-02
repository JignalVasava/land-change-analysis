import { classifyYear, detectChange } from '../services/geeService.js';
import { linearRegressionPredict } from '../services/predictService.js';

export async function classifyHandler(req, res) {
  try {
    const year = Number(req.query.year);
    const latestCompleteYear = new Date().getFullYear() - 1;
    if (!year || Number.isNaN(year)) {
      return res.status(400).json({ success: false, error: 'Valid year query parameter is required.' });
    }
    if (year > latestCompleteYear) {
      return res.status(400).json({
        success: false,
        error: `Year ${year} is not available yet. Please choose ${latestCompleteYear} or earlier.`,
      });
    }

    const data = await classifyYear(year);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('classifyHandler error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function changeHandler(req, res) {
  try {
    const year1 = Number(req.query.year1);
    const year2 = Number(req.query.year2);
    const latestCompleteYear = new Date().getFullYear() - 1;
    if (!year1 || !year2 || Number.isNaN(year1) || Number.isNaN(year2)) {
      return res.status(400).json({ success: false, error: 'Valid year1 and year2 query parameters are required.' });
    }
    if (year1 > latestCompleteYear || year2 > latestCompleteYear) {
      return res.status(400).json({
        success: false,
        error: `Selected years are not available yet. Please choose ${latestCompleteYear} or earlier.`,
      });
    }

    const data = await detectChange(year1, year2);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('changeHandler error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function predictHandler(req, res) {
  try {
    const { points, targetYear = 2030 } = req.body;
    if (!points || !Array.isArray(points) || points.length < 2) {
      return res.status(400).json({ success: false, error: 'Body must contain points: [{year, value}...].' });
    }

    const prediction = linearRegressionPredict(points, Number(targetYear));
    return res.json({ success: true, data: prediction });
  } catch (err) {
    console.error('predictHandler error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
