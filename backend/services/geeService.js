import { initGEE } from '../gee.js';

const ANNUAL_START = '-04-01';
const ANNUAL_END = '-10-31';
const DW_LABELS = {
  WATER: 0,
  TREES: 1,
  GRASS: 2,
  FLOODED_VEGETATION: 3,
  CROPS: 4,
  SHRUB_AND_SCRUB: 5,
  BUILT: 6,
  BARE: 7,
  SNOW_AND_ICE: 8,
};

function getDynamicWorldComposite(ee, year) {
  const probabilityBands = [
    'water',
    'trees',
    'grass',
    'flooded_vegetation',
    'crops',
    'shrub_and_scrub',
    'built',
    'bare',
    'snow_and_ice',
  ];

  const collection = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
    .filterDate(`${year}${ANNUAL_START}`, `${year}${ANNUAL_END}`)
    .select(probabilityBands);

  const meanProbabilities = collection.mean();
  const label = meanProbabilities.toArray().arrayArgmax().arrayGet([0]).rename('label');

  return meanProbabilities.addBands(label);
}

function classifyLandCover(ee, dynamicWorldComposite) {
  const label = dynamicWorldComposite.select('label');

  const water = label.eq(DW_LABELS.WATER).or(label.eq(DW_LABELS.FLOODED_VEGETATION));
  const agriculture = label.eq(DW_LABELS.CROPS).or(label.eq(DW_LABELS.GRASS));
  const urban = label.eq(DW_LABELS.BUILT);
  const barren = label
    .eq(DW_LABELS.BARE)
    .or(label.eq(DW_LABELS.SHRUB_AND_SCRUB))
    .or(label.eq(DW_LABELS.TREES))
    .or(label.eq(DW_LABELS.SNOW_AND_ICE));

  return ee.Image(0)
    .where(water, 1)
    .where(agriculture, 2)
    .where(urban, 3)
    .where(barren, 4)
    .rename('landcover');
}

function smoothClassification(classifiedImage) {
  return classifiedImage
    .focalMode({ radius: 1, units: 'pixels' })
    .focalMode({ radius: 1, units: 'pixels' })
    .rename('landcover');
}

export async function classifyYear(year) {
  const ee = await initGEE();
  const image = getDynamicWorldComposite(ee, year);
  const classified = smoothClassification(classifyLandCover(ee, image));

  // Visualization parameters with distinct colors for each class
  const vizParams = {
    min: 0,
    max: 4,
    palette: [
      '#FFFFFF', // 0: Unclassified (white)
      '#4ECDC4', // 1: Water (cyan)
      '#90EE90', // 2: Agriculture (light green)
      '#FF6B6B', // 3: Urban (red)
      '#95A5A6'  // 4: Barren (gray)
    ]
  };

  return new Promise((resolve, reject) => {
    classified.getMapId(vizParams, (mapConfig, error) => {
      if (error) {
        console.error('GEE getMapId error:', error);
        return reject(new Error(error));
      }
      if (!mapConfig || !mapConfig.mapid) {
        console.error('GEE getMapId response invalid:', mapConfig);
        return reject(new Error('Invalid mapConfig from Earth Engine.'));
      }

      // Use urlFormat provided by GEE, append token if available
      let url = mapConfig.urlFormat;
      if (mapConfig.token) {
        url += `?token=${mapConfig.token}`;
      }

      resolve({ mapid: mapConfig.mapid, token: mapConfig.token || '', url });
    });
  });
}

export async function detectChange(year1, year2) {
  const ee = await initGEE();
  const img1 = getDynamicWorldComposite(ee, year1);
  const img2 = getDynamicWorldComposite(ee, year2);
  const c1 = smoothClassification(classifyLandCover(ee, img1));
  const c2 = smoothClassification(classifyLandCover(ee, img2));

  const agri = 2;
  const urban = 3;

  const agriY1 = c1.eq(agri);
  const urbanY2 = c2.eq(urban);
  const agriToUrban = agriY1.and(urbanY2);
  const agriToNonAgri = agriY1.and(c2.neq(agri));
  const agriToOther = agriToNonAgri.and(urbanY2.not());
  const stable = c1.eq(c2);

  // Priority: specific transitions first, then stable, then other transitions
  const changeClassified = ee.Image(0)
    .where(agriToUrban, 1)
    .where(agriToOther, 2)
    .where(stable, 3)
    .where(agriToUrban.or(agriToOther).or(stable).not(), 4);

  const vizParams = {
    min: 0,
    max: 4,
    palette: [
      '#FFFFFF', // 0: Unclassified / no data
      '#FF6B6B', // 1: Agriculture → Urban (loss / expansion onto farmland)
      '#F39C12', // 2: Agriculture → Other (water, barren, non-urban)
      '#BDBDBD', // 3: No land-cover change (stable)
      '#9B59B6', // 4: Other transitions (e.g. urban ↔ water)
    ],
  };

  return new Promise((resolve, reject) => {
    changeClassified.getMapId(vizParams, (mapConfig, error) => {
      if (error) {
        console.error('GEE getMapId error (detectChange):', error);
        return reject(new Error(error));
      }
      if (!mapConfig || !mapConfig.mapid) {
        console.error('GEE getMapId response invalid (detectChange):', mapConfig);
        return reject(new Error('Failed to get mapId for change detection.'));
      }
      // Use urlFormat provided by GEE, append token if available
      let url = mapConfig.urlFormat;
      if (mapConfig.token) {
        url += `?token=${mapConfig.token}`;
      }
      resolve({ mapid: mapConfig.mapid, token: mapConfig.token || '', url });
    });
  });
}
