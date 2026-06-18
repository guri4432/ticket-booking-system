const express = require('express');
const router = express.Router();
const { createScreen, getAllScreens, getScreenById } = require('../models/screenModel');

/**
 * POST /api/screens
 * Body: { name, totalRows?, seatsPerRow? }
 */
router.post('/', (req, res) => {
  try {
    const { name, totalRows, seatsPerRow } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required',
      });
    }

    const screen = createScreen({
      name,
      totalRows: totalRows ? Number(totalRows) : undefined,
      seatsPerRow: seatsPerRow ? Number(seatsPerRow) : undefined,
    });
    res.status(201).json({ success: true, data: screen });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: `Screen with name "${req.body.name}" already exists`,
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/screens
 */
router.get('/', (_req, res) => {
  try {
    const screens = getAllScreens();
    res.json({ success: true, data: screens });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/screens/:id
 */
router.get('/:id', (req, res) => {
  try {
    const screen = getScreenById(req.params.id);
    if (!screen) {
      return res.status(404).json({ success: false, error: 'Screen not found' });
    }
    res.json({ success: true, data: screen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
