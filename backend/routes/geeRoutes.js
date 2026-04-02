import express from 'express';
import { classifyHandler, changeHandler, predictHandler } from '../controllers/geeController.js';

const router = express.Router();

router.get('/classify', classifyHandler);
router.get('/change', changeHandler);
router.post('/predict', predictHandler);

export default router;
