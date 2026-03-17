const express = require('express');
const router  = express.Router();
const dem     = require('../dem-api');

// POST /api/checkin/qr  { qrCode, fahrzeugId, gruppeId }
router.post('/qr', async (req, res) => {
  try {
    const { qrCode, fahrzeugId, gruppeId } = req.body;
    if (!qrCode || !fahrzeugId || !gruppeId)
      return res.status(400).json({ error: 'qrCode, fahrzeugId und gruppeId erforderlich' });

    const teilnehmer = await dem.getTeilnehmerByQR(qrCode);
    if (!teilnehmer) return res.status(404).json({ error: 'Teilnehmer nicht gefunden' });

    const eintrag = await dem.checkin(fahrzeugId, teilnehmer.id, gruppeId);
    res.status(201).json({ teilnehmer, eintrag });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/checkin/nfc  { nfcId, fahrzeugId, gruppeId }
router.post('/nfc', async (req, res) => {
  try {
    const { nfcId, fahrzeugId, gruppeId } = req.body;
    if (!nfcId || !fahrzeugId || !gruppeId)
      return res.status(400).json({ error: 'nfcId, fahrzeugId und gruppeId erforderlich' });

    const teilnehmer = await dem.getTeilnehmerByNFC(nfcId);
    if (!teilnehmer) return res.status(404).json({ error: 'Teilnehmer nicht gefunden' });

    const eintrag = await dem.checkin(fahrzeugId, teilnehmer.id, gruppeId);
    res.status(201).json({ teilnehmer, eintrag });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/checkin/checkout  { fahrzeugId }
router.post('/checkout', async (req, res) => {
  try {
    const { fahrzeugId } = req.body;
    if (!fahrzeugId) return res.status(400).json({ error: 'fahrzeugId erforderlich' });
    res.json(await dem.checkout(fahrzeugId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/checkin/resolve-qr/:code  (Vorschau ohne Check-in)
router.get('/resolve-qr/:code', async (req, res) => {
  try {
    const teilnehmer = await dem.getTeilnehmerByQR(req.params.code);
    if (!teilnehmer) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(teilnehmer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
