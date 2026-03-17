const express = require('express');
const router  = express.Router();
const dem     = require('../dem-api');

// GET /api/gruppen?eventId=1
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId fehlt' });
    res.json(await dem.getGruppenByEvent(eventId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gruppen  { eventId, name, fahrzeugIds }
router.post('/', async (req, res) => {
  try {
    const { eventId, name, fahrzeugIds } = req.body;
    if (!eventId || !name || !fahrzeugIds?.length)
      return res.status(400).json({ error: 'eventId, name und fahrzeugIds erforderlich' });
    res.status(201).json(await dem.createGruppe(eventId, name, fahrzeugIds));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/gruppen/:id  { name, fahrzeugIds, status }
router.put('/:id', async (req, res) => {
  try {
    res.json(await dem.updateGruppe(req.params.id, req.body));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/gruppen/:id/checkins/aktiv
router.get('/:id/checkins/aktiv', async (req, res) => {
  try { res.json(await dem.getAktiveCheckins(Number(req.params.id))); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/gruppen/:id/checkout-alle
router.post('/:id/checkout-alle', async (req, res) => {
  try { res.json(await dem.checkoutAlle(Number(req.params.id))); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
