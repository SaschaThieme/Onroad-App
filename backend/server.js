/**
 * Onroad – Backend Server
 * ─────────────────────────────────────────────────────────────────────────
 * Start:  npm install && npm start
 * Dev:    npm run dev
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authRoute    = require('./routes/auth');
const eventsRoute  = require('./routes/events');
const gruppenRoute = require('./routes/gruppen');
const checkinRoute = require('./routes/checkin');

const app  = express();
const PORT = process.env.PORT || 3000;
const MODE = process.env.API_MODE || 'mock'; // Railway: Umgebungsvariablen im Dashboard setzen

app.use(cors());
app.use(express.json());

// ── API-Routen ────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoute);
app.use('/api/events',  eventsRoute);
app.use('/api/gruppen', gruppenRoute);
app.use('/api/checkin', checkinRoute);

// ── Frontend statisch ausliefern ──────────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Auto-Checkout Job ─────────────────────────────────────────────────────
// Prüft alle 5 Minuten ob Events abgelaufen sind und checkt alle Fahrer aus
const dem = require('./dem-api');
setInterval(async () => {
  try {
    const events = await dem.getEvents();
    const now    = new Date();
    for (const event of events) {
      const endeDatum = new Date(`${event.datum_bis}T${event.ende_uhrzeit || '23:59'}`);
      const autoCheckoutZeit = new Date(endeDatum.getTime() + 2 * 60 * 60 * 1000); // +2h
      if (now >= autoCheckoutZeit) {
        const gruppen = await dem.getGruppenByEvent(event.id);
        for (const g of gruppen) {
          if (g.status !== 'Beendet') {
            await dem.checkoutAlle(g.id);
            console.log(`[AUTO-CHECKOUT] Gruppe ${g.name} (Event: ${event.name})`);
          }
        }
      }
    }
  } catch (e) {
    console.error('[AUTO-CHECKOUT] Fehler:', e.message);
  }
}, 5 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────────────
// DB initialisieren wenn API_MODE=db und DATABASE_URL vorhanden
async function startServer() {
  if (process.env.API_MODE === 'db') {
    if (!process.env.DATABASE_URL) {
      console.warn('[SERVER] API_MODE=db aber DATABASE_URL fehlt → Fallback auf mock');
      process.env.API_MODE = 'mock';
    } else {
      try {
        const { initDb } = require('./schema');
        await initDb();
        console.log('[SERVER] ✓ Datenbank bereit');
      } catch (err) {
        console.error('[SERVER] DB-Init fehlgeschlagen → Fallback auf mock:', err.message);
        process.env.API_MODE = 'mock';
      }
    }
  }

  app.listen(PORT, () => {
  console.log(`\n✅ Onroad Backend läuft auf http://localhost:${PORT}`);
  console.log(`   Modus: ${MODE.toUpperCase()}`);
  console.log(`   DEM:   ${process.env.DEM_BASE_URL || '(noch nicht konfiguriert)'}\n`);
  });
}

startServer();
