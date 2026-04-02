import fs from 'fs';
import path from 'path';
import ee from '@google/earthengine';

let isInitialized = false;

export async function initGEE() {
  if (isInitialized) return ee;

  const keyFilePath = process.env.GEE_SERVICE_ACCOUNT_KEY || path.resolve(process.cwd(), 'gee-service-account.json');
  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`GEE service account key not found at ${keyFilePath}. Set GEE_SERVICE_ACCOUNT_KEY env var or place a key at root.`);
  }

  const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));

  await new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(keyData, (err) => {
      if (err) return reject(err);

      ee.initialize(null, null, () => {
        isInitialized = true;
        resolve();
      }, (initErr) => {
        reject(initErr);
      });
    });
  });

  return ee;
}
