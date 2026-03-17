const express = require('express');
const router  = express.Router();
const dem     = require('../dem-api');

// GET /api/events  (filtert auf nächste 14 Tage + zugeordnete Instruktoren)
router.get('/', async (req, res) => {
  try {
    const username = req.query.username || req.headers['x-user'] || null;
    res.json(await dem.getEvents(username));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await dem.getEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event nicht gefunden' });
    res.json(event);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/events/:id/fahrzeuge
router.get('/:id/fahrzeuge', async (req, res) => {
  try { res.json(await dem.getFahrzeugeByEvent(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/events/:id/teilnehmer
router.get('/:id/teilnehmer', async (req, res) => {
  try { res.json(await dem.getTeilnehmerByEvent(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/events/:id/fahrtenbuch
router.get('/:id/fahrtenbuch', async (req, res) => {
  try { res.json(await dem.getFahrtenbuch(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
