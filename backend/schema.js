/**
 * schema.js – Datenbankschema erstellen
 * ─────────────────────────────────────────────────────────────────────────
 * Wird beim Serverstart automatisch ausgeführt (CREATE TABLE IF NOT EXISTS)
 * Kann auch manuell aufgerufen werden: node backend/schema.js
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { query } = require('./db');

async function createSchema() {
  console.log('[SCHEMA] Erstelle Tabellen...');

  // ── Events ──────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      datum_von     DATE NOT NULL,
      datum_bis     DATE NOT NULL,
      ende_uhrzeit  TEXT DEFAULT '18:00',
      ort           TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Fahrzeuge ────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS fahrzeuge (
      id       SERIAL PRIMARY KEY,
      modell   TEXT NOT NULL,
      kz       TEXT NOT NULL UNIQUE,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // ── Teilnehmer ───────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS teilnehmer (
      id        TEXT PRIMARY KEY,
      vorname   TEXT NOT NULL,
      nachname  TEXT NOT NULL,
      qr_code   TEXT UNIQUE,
      nfc_id    TEXT UNIQUE,
      event_id  INTEGER REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // ── Instruktoren (Event-Zuordnung) ────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS event_instruktoren (
      event_id    INTEGER REFERENCES events(id) ON DELETE CASCADE,
      username    TEXT NOT NULL,
      PRIMARY KEY (event_id, username)
    )
  `);

  // ── Gruppen ──────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS gruppen (
      id          SERIAL PRIMARY KEY,
      event_id    INTEGER REFERENCES events(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      instruktor  TEXT,
      status      TEXT DEFAULT 'Geplant',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Gruppe ↔ Fahrzeug (n:m) ───────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS gruppe_fahrzeuge (
      gruppe_id   INTEGER REFERENCES gruppen(id) ON DELETE CASCADE,
      fahrzeug_id INTEGER REFERENCES fahrzeuge(id) ON DELETE CASCADE,
      PRIMARY KEY (gruppe_id, fahrzeug_id)
    )
  `);

  // ── Fahrtenbuch (Check-ins) ───────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS fahrtenbuch (
      id            SERIAL PRIMARY KEY,
      fahrzeug_id   INTEGER REFERENCES fahrzeuge(id),
      teilnehmer_id TEXT REFERENCES teilnehmer(id),
      gruppe_id     INTEGER REFERENCES gruppen(id),
      ein           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      aus           TIMESTAMPTZ,
      erstellt_von  TEXT
    )
  `);

  // ── Index für schnelle Abfragen ───────────────────────────────────────────
  await query(`CREATE INDEX IF NOT EXISTS idx_fahrtenbuch_fahrzeug ON fahrtenbuch(fahrzeug_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_fahrtenbuch_gruppe   ON fahrtenbuch(gruppe_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_fahrtenbuch_offen    ON fahrtenbuch(fahrzeug_id) WHERE aus IS NULL`);

  console.log('[SCHEMA] ✓ Alle Tabellen bereit');
}

// Testdaten einspielen (nur wenn Tabellen leer)
async function seedTestdaten() {
  const { rows } = await query('SELECT COUNT(*) FROM events');
  if (parseInt(rows[0].count) > 0) {
    console.log('[SEED] Tabellen bereits befüllt – überspringe');
    return;
  }

  console.log('[SEED] Füge Testdaten ein...');

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  // Events
  const events = [
    { name: 'AMG Driving Academy',            von: daysFromNow(0),  bis: daysFromNow(0),  ort: 'Hockenheimring', ende: '18:00' },
    { name: 'Mercedes-Benz Experience Day',   von: daysFromNow(2),  bis: daysFromNow(3),  ort: 'München',        ende: '17:30' },
    { name: 'EQ Performance Tour',            von: daysFromNow(5),  bis: daysFromNow(5),  ort: 'Frankfurt',      ende: '16:00' },
    { name: 'AMG GT Experience',              von: daysFromNow(8),  bis: daysFromNow(9),  ort: 'Berlin',         ende: '19:00' },
    { name: 'Driving Events Masterclass',     von: daysFromNow(12), bis: daysFromNow(12), ort: 'Hamburg',        ende: '17:00' },
  ];

  const eventIds = [];
  for (const e of events) {
    const r = await query(
      `INSERT INTO events (name, datum_von, datum_bis, ende_uhrzeit, ort) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [e.name, e.von, e.bis, e.ende, e.ort]
    );
    eventIds.push(r.rows[0].id);
    // Alle Events Philipp zuordnen
    await query(`INSERT INTO event_instruktoren VALUES ($1,'Philipp.explainer')`, [r.rows[0].id]);
  }

  // Fahrzeuge (für Event 1)
  const fahrzeuge = [
    ['AMG A 45 S 4MATIC+',        'WI-AMG 100'],
    ['AMG C 63 S E PERFORMANCE',  'WI-AMG 200'],
    ['AMG GT 63 S 4MATIC+',       'WI-AMG 300'],
    ['AMG GLE 53 4MATIC+',        'WI-AMG 400'],
    ['AMG SL 63 4MATIC+',         'WI-AMG 500'],
    ['EQS 53 AMG 4MATIC+',        'WI-EQS 100'],
    ['EQE 43 AMG 4MATIC',         'WI-EQE 200'],
    ['Mercedes-AMG GT R Pro',      'WI-GTR 001'],
    ['C 300 4MATIC Limousine',     'WI-MBZ 010'],
    ['E 450 4MATIC T-Modell',      'WI-MBZ 020'],
  ];

  const fahrzeugIds = [];
  for (const [modell, kz] of fahrzeuge) {
    const r = await query(
      `INSERT INTO fahrzeuge (modell, kz, event_id) VALUES ($1,$2,$3) RETURNING id`,
      [modell, kz, eventIds[0]]
    );
    fahrzeugIds.push(r.rows[0].id);
  }

  // Teilnehmer (für Event 1)
  const teilnehmer = [
    ['T001','Alexander','Becker'],   ['T002','Sophie','Wagner'],
    ['T003','Michael','Hoffmann'],   ['T004','Laura','Schneider'],
    ['T005','Thomas','Müller'],      ['T006','Julia','Fischer'],
    ['T007','Stefan','Weber'],       ['T008','Anna','Meyer'],
    ['T009','Christian','Schmidt'],  ['T010','Katrin','Braun'],
    ['T011','Markus','Wolf'],        ['T012','Sabine','Richter'],
  ];

  for (const [id, vorname, nachname] of teilnehmer) {
    await query(
      `INSERT INTO teilnehmer (id, vorname, nachname, qr_code, nfc_id, event_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, vorname, nachname, `QR-${id}`, `NFC-${id}`, eventIds[0]]
    );
  }

  // Gruppen für Event 1
  const g1 = await query(
    `INSERT INTO gruppen (event_id, name, instruktor, status) VALUES ($1,'Gruppe Philipp','Philipp.explainer','Geplant') RETURNING id`,
    [eventIds[0]]
  );
  const g2 = await query(
    `INSERT INTO gruppen (event_id, name, instruktor, status) VALUES ($1,'Gruppe Marco','Marco.trainer','Geplant') RETURNING id`,
    [eventIds[0]]
  );

  // Fahrzeuge den Gruppen zuordnen
  for (const fid of fahrzeugIds.slice(0, 4)) {
    await query(`INSERT INTO gruppe_fahrzeuge VALUES ($1,$2)`, [g1.rows[0].id, fid]);
  }
  for (const fid of fahrzeugIds.slice(4, 8)) {
    await query(`INSERT INTO gruppe_fahrzeuge VALUES ($1,$2)`, [g2.rows[0].id, fid]);
  }

  console.log('[SEED] ✓ Testdaten eingespielt');
}

async function initDb() {
  try {
    await createSchema();
    await seedTestdaten();
  } catch (err) {
    console.error('[DB] Fehler beim Init:', err.message);
    throw err;
  }
}

module.exports = { initDb };

// Direktaufruf: node backend/schema.js
if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
