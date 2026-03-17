/**
 * dem-api.js
 * ─────────────────────────────────────────────────────────────────────────
 * ZENTRALE SCHNITTSTELLE ZUR DEM-DATENBANK
 *
 * Alle Calls zur DEM-API laufen hier durch.
 * Wenn die DEM-Dokumentation vorliegt:
 *   1. DEM_BASE_URL in .env setzen
 *   2. API_MODE=live in .env setzen
 *   3. Nur die Endpunkt-URLs in den Funktionen unten anpassen
 *   → Der Rest der App bleibt unverändert
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fetch = require('node-fetch');

const MODE      = process.env.API_MODE    || 'mock';
const BASE_URL  = process.env.DEM_BASE_URL || '';
const DEM_USER  = process.env.DEM_USERNAME || '';
const DEM_PASS  = process.env.DEM_PASSWORD || '';

// Basic-Auth Header für alle DEM-Requests
function authHeader() {
  const token = Buffer.from(`${DEM_USER}:${DEM_PASS}`).toString('base64');
  return { 'Authorization': `Basic ${token}`, 'Content-Type': 'application/json' };
}

// Hilfsfunktion für DEM-Requests
async function demRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: authHeader() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`DEM-Fehler ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── TESTDATEN ─────────────────────────────────────────────────────────────
// ⚠️  NUR FÜR DEMO – werden entfernt sobald DEM Live-API angebunden ist
// Um auf Live umzuschalten: API_MODE=live in .env (Railway Variables)
// ─────────────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const MOCK = {

  // ── VERANSTALTUNGEN ──────────────────────────────────────────────────────
  events: [
    {
      id: 1,
      name: 'AMG Driving Academy',
      datum_von: daysFromNow(0),
      datum_bis: daysFromNow(0),
      ende_uhrzeit: '18:00',
      ort: 'Hockenheimring',
      instruktoren: ['Philipp.explainer', 'Marco.trainer'],
    },
    {
      id: 2,
      name: 'Mercedes-Benz Experience Day',
      datum_von: daysFromNow(2),
      datum_bis: daysFromNow(3),
      ende_uhrzeit: '17:30',
      ort: 'München',
      instruktoren: ['Philipp.explainer', 'Anna.instructor'],
    },
    {
      id: 3,
      name: 'EQ Performance Tour',
      datum_von: daysFromNow(5),
      datum_bis: daysFromNow(5),
      ende_uhrzeit: '16:00',
      ort: 'Frankfurt',
      instruktoren: ['Philipp.explainer'],
    },
    {
      id: 4,
      name: 'AMG GT Experience',
      datum_von: daysFromNow(8),
      datum_bis: daysFromNow(9),
      ende_uhrzeit: '19:00',
      ort: 'Berlin',
      instruktoren: ['Philipp.explainer', 'Marco.trainer'],
    },
    {
      id: 5,
      name: 'Driving Events Masterclass',
      datum_von: daysFromNow(12),
      datum_bis: daysFromNow(12),
      ende_uhrzeit: '17:00',
      ort: 'Hamburg',
      instruktoren: ['Philipp.explainer'],
    },
    // Außerhalb 14-Tage-Fenster → wird nicht angezeigt
    {
      id: 6,
      name: 'C-Klasse Händler-Event',
      datum_von: daysFromNow(20),
      datum_bis: daysFromNow(20),
      ende_uhrzeit: '16:00',
      ort: 'Köln',
      instruktoren: ['Philipp.explainer'],
    },
  ],

  // ── FAHRZEUGE ────────────────────────────────────────────────────────────
  fahrzeuge: [
    { id: 1,  modell: 'AMG A 45 S 4MATIC+',          kz: 'WI-AMG 100' },
    { id: 2,  modell: 'AMG C 63 S E PERFORMANCE',    kz: 'WI-AMG 200' },
    { id: 3,  modell: 'AMG GT 63 S 4MATIC+',         kz: 'WI-AMG 300' },
    { id: 4,  modell: 'AMG GLE 53 4MATIC+',          kz: 'WI-AMG 400' },
    { id: 5,  modell: 'AMG SL 63 4MATIC+',           kz: 'WI-AMG 500' },
    { id: 6,  modell: 'EQS 53 AMG 4MATIC+',          kz: 'WI-EQS 100' },
    { id: 7,  modell: 'EQE 43 AMG 4MATIC',           kz: 'WI-EQE 200' },
    { id: 8,  modell: 'Mercedes-AMG GT R Pro',        kz: 'WI-GTR 001' },
    { id: 9,  modell: 'C 300 4MATIC Limousine',       kz: 'WI-MBZ 010' },
    { id: 10, modell: 'E 450 4MATIC T-Modell',        kz: 'WI-MBZ 020' },
  ],

  // ── TEILNEHMER (TESTKUNDEN) ───────────────────────────────────────────────
  teilnehmer: [
    { id: 'T001', vorname: 'Alexander', nachname: 'Becker',     qr_code: 'QR-T001', nfc_id: 'NFC-T001' },
    { id: 'T002', vorname: 'Sophie',    nachname: 'Wagner',     qr_code: 'QR-T002', nfc_id: 'NFC-T002' },
    { id: 'T003', vorname: 'Michael',   nachname: 'Hoffmann',   qr_code: 'QR-T003', nfc_id: 'NFC-T003' },
    { id: 'T004', vorname: 'Laura',     nachname: 'Schneider',  qr_code: 'QR-T004', nfc_id: 'NFC-T004' },
    { id: 'T005', vorname: 'Thomas',    nachname: 'Müller',     qr_code: 'QR-T005', nfc_id: 'NFC-T005' },
    { id: 'T006', vorname: 'Julia',     nachname: 'Fischer',    qr_code: 'QR-T006', nfc_id: 'NFC-T006' },
    { id: 'T007', vorname: 'Stefan',    nachname: 'Weber',      qr_code: 'QR-T007', nfc_id: 'NFC-T007' },
    { id: 'T008', vorname: 'Anna',      nachname: 'Meyer',      qr_code: 'QR-T008', nfc_id: 'NFC-T008' },
    { id: 'T009', vorname: 'Christian', nachname: 'Schmidt',    qr_code: 'QR-T009', nfc_id: 'NFC-T009' },
    { id: 'T010', vorname: 'Katrin',    nachname: 'Braun',      qr_code: 'QR-T010', nfc_id: 'NFC-T010' },
    { id: 'T011', vorname: 'Markus',    nachname: 'Wolf',       qr_code: 'QR-T011', nfc_id: 'NFC-T011' },
    { id: 'T012', vorname: 'Sabine',    nachname: 'Richter',    qr_code: 'QR-T012', nfc_id: 'NFC-T012' },
  ],

  // ── GRUPPEN (Testgruppen für Event 1) ────────────────────────────────────
  gruppen: [
    {
      id: 1,
      event_id: 1,
      name: 'Gruppe Philipp',
      instruktor: 'Philipp.explainer',
      status: 'Geplant',
      fahrzeug_ids: [1, 2, 3, 4],
    },
    {
      id: 2,
      event_id: 1,
      name: 'Gruppe Marco',
      instruktor: 'Marco.trainer',
      status: 'Geplant',
      fahrzeug_ids: [5, 6, 7, 8],
    },
  ],

  checkins: [],
};


async function getEvents(username = null) {
  if (MODE === 'mock') {
    // DEMO-MODUS: alle Events der nächsten 14 Tage anzeigen
    // Im Live-Modus wird nach username gefiltert
    const now  = new Date(); now.setHours(0,0,0,0);
    const in14 = new Date(now); in14.setDate(in14.getDate() + 14);
    return MOCK.events.filter(e => {
      const von = new Date(e.datum_von);
      return von >= now && von <= in14;
    });
  }
  // TODO: Endpunkt anpassen wenn DEM-Doku vorliegt
  const params = username ? '?username=' + encodeURIComponent(username) : '';
  return demRequest('GET', '/api/events' + params);
}

async function getEvent(eventId) {
  if (MODE === 'mock') return MOCK.events.find(e => e.id === Number(eventId)) || null;
  return demRequest('GET', `/api/events/${eventId}`);
}

// ── FAHRZEUGE ─────────────────────────────────────────────────────────────

async function getFahrzeugeByEvent(eventId) {
  if (MODE === 'mock') return MOCK.fahrzeuge;
  return demRequest('GET', `/api/events/${eventId}/fahrzeuge`);
}

// ── TEILNEHMER ────────────────────────────────────────────────────────────

async function getTeilnehmerByEvent(eventId) {
  if (MODE === 'mock') return MOCK.teilnehmer;
  return demRequest('GET', `/api/events/${eventId}/teilnehmer`);
}

async function getTeilnehmerByQR(qrCode) {
  if (MODE === 'mock') {
    return MOCK.teilnehmer.find(t => t.qr_code === qrCode) || null;
  }
  return demRequest('GET', `/api/teilnehmer/qr/${encodeURIComponent(qrCode)}`);
}

async function getTeilnehmerByNFC(nfcId) {
  if (MODE === 'mock') {
    return MOCK.teilnehmer.find(t => t.nfc_id === nfcId) || null;
  }
  return demRequest('GET', `/api/teilnehmer/nfc/${encodeURIComponent(nfcId)}`);
}

// ── GRUPPEN ───────────────────────────────────────────────────────────────

async function getGruppenByEvent(eventId) {
  if (MODE === 'mock') return MOCK.gruppen.filter(g => g.event_id === Number(eventId));
  return demRequest('GET', `/api/events/${eventId}/gruppen`);
}

async function createGruppe(eventId, name, fahrzeugIds) {
  if (MODE === 'mock') {
    const id = Date.now();
    const g = { id, event_id: Number(eventId), name, instruktor: 'Philipp.explainer', status: 'Geplant', fahrzeug_ids: fahrzeugIds };
    MOCK.gruppen.push(g);
    return g;
  }
  return demRequest('POST', `/api/events/${eventId}/gruppen`, { name, fahrzeug_ids: fahrzeugIds });
}

async function updateGruppe(gruppeId, data) {
  if (MODE === 'mock') {
    const g = MOCK.gruppen.find(x => x.id === Number(gruppeId));
    if (!g) throw new Error('Gruppe nicht gefunden');
    Object.assign(g, data);
    return g;
  }
  return demRequest('PUT', `/api/gruppen/${gruppeId}`, data);
}

// ── CHECK-IN / CHECK-OUT ──────────────────────────────────────────────────

async function checkin(fahrzeugId, teilnehmerId, gruppeId) {
  const ts = new Date().toISOString();
  if (MODE === 'mock') {
    const eintrag = { id: Date.now(), fahrzeug_id: fahrzeugId, teilnehmer_id: teilnehmerId, gruppe_id: gruppeId, ein: ts, aus: null };
    MOCK.checkins.push(eintrag);
    return eintrag;
  }
  return demRequest('POST', '/api/fahrtenbuch/checkin', { fahrzeug_id: fahrzeugId, teilnehmer_id: teilnehmerId, gruppe_id: gruppeId, ein: ts });
}

async function checkout(fahrzeugId) {
  const ts = new Date().toISOString();
  if (MODE === 'mock') {
    const eintrag = MOCK.checkins.find(c => c.fahrzeug_id === fahrzeugId && c.aus === null);
    if (eintrag) eintrag.aus = ts;
    return eintrag || null;
  }
  return demRequest('POST', '/api/fahrtenbuch/checkout', { fahrzeug_id: fahrzeugId, aus: ts });
}

async function checkoutAlle(gruppeId) {
  const ts = new Date().toISOString();
  if (MODE === 'mock') {
    MOCK.checkins.filter(c => c.gruppe_id === gruppeId && c.aus === null).forEach(c => c.aus = ts);
    return { ok: true, ts };
  }
  return demRequest('POST', `/api/gruppen/${gruppeId}/checkout-alle`, { aus: ts });
}

async function getAktiveCheckins(gruppeId) {
  if (MODE === 'mock') {
    return MOCK.checkins.filter(c => c.gruppe_id === gruppeId && c.aus === null);
  }
  return demRequest('GET', `/api/gruppen/${gruppeId}/checkins/aktiv`);
}

async function getFahrtenbuch(eventId) {
  if (MODE === 'mock') return MOCK.checkins;
  return demRequest('GET', `/api/events/${eventId}/fahrtenbuch`);
}

// ── AUTH (Login gegen DEM) ────────────────────────────────────────────────

async function login(username, password) {
  if (MODE === 'mock') {
    // Im Mock-Modus: jeder Login funktioniert
    return { success: true, user: username, token: 'mock-token-' + Date.now() };
  }
  // TODO: Endpunkt anpassen wenn DEM-Auth-Mechanismus bekannt
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return { success: false };
  const data = await res.json();
  return { success: true, ...data };
}

module.exports = {
  getEvents, getEvent,
  getFahrzeugeByEvent,
  getTeilnehmerByEvent, getTeilnehmerByQR, getTeilnehmerByNFC,
  getGruppenByEvent, createGruppe, updateGruppe,
  checkin, checkout, checkoutAlle, getAktiveCheckins, getFahrtenbuch,
  login,
};
