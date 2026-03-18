/**
 * dem-api.js – drei Modi:
 *   API_MODE=mock   lokale Mock-Daten
 *   API_MODE=db     PostgreSQL auf Railway
 *   API_MODE=live   echte DEM-API
 */
require('dotenv').config();
const fetch = require('node-fetch');
const MODE     = process.env.API_MODE    || 'mock';
const BASE_URL = process.env.DEM_BASE_URL || '';
const DEM_USER = process.env.DEM_USERNAME || '';
const DEM_PASS = process.env.DEM_PASSWORD || '';

let _db = null;
function getDb() { if (!_db) _db = require('./db'); return _db; }

function authHeader() {
  return { 'Authorization': `Basic ${Buffer.from(`${DEM_USER}:${DEM_PASS}`).toString('base64')}`, 'Content-Type': 'application/json' };
}
async function demRequest(method, path, body = null) {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers: authHeader(), ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) throw new Error(`DEM ${res.status}: ${await res.text()}`);
  return res.json();
}

function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; }

const MOCK = {
  events: [
    { id:1, name:'AMG Driving Academy',          datum_von:daysFromNow(0),  datum_bis:daysFromNow(0),  ende_uhrzeit:'18:00', ort:'Hockenheimring' },
    { id:2, name:'Mercedes-Benz Experience Day', datum_von:daysFromNow(2),  datum_bis:daysFromNow(3),  ende_uhrzeit:'17:30', ort:'München' },
    { id:3, name:'EQ Performance Tour',          datum_von:daysFromNow(5),  datum_bis:daysFromNow(5),  ende_uhrzeit:'16:00', ort:'Frankfurt' },
    { id:4, name:'AMG GT Experience',            datum_von:daysFromNow(8),  datum_bis:daysFromNow(9),  ende_uhrzeit:'19:00', ort:'Berlin' },
    { id:5, name:'Driving Events Masterclass',   datum_von:daysFromNow(12), datum_bis:daysFromNow(12), ende_uhrzeit:'17:00', ort:'Hamburg' },
  ],
  fahrzeuge: [
    {id:1,modell:'AMG A 45 S 4MATIC+',kz:'WI-AMG 100'},{id:2,modell:'AMG C 63 S E PERFORMANCE',kz:'WI-AMG 200'},
    {id:3,modell:'AMG GT 63 S 4MATIC+',kz:'WI-AMG 300'},{id:4,modell:'AMG GLE 53 4MATIC+',kz:'WI-AMG 400'},
    {id:5,modell:'AMG SL 63 4MATIC+',kz:'WI-AMG 500'},{id:6,modell:'EQS 53 AMG 4MATIC+',kz:'WI-EQS 100'},
    {id:7,modell:'EQE 43 AMG 4MATIC',kz:'WI-EQE 200'},{id:8,modell:'Mercedes-AMG GT R Pro',kz:'WI-GTR 001'},
    {id:9,modell:'C 300 4MATIC Limousine',kz:'WI-MBZ 010'},{id:10,modell:'E 450 4MATIC T-Modell',kz:'WI-MBZ 020'},
  ],
  teilnehmer: [
    {id:'T001',vorname:'Alexander',nachname:'Becker',qr_code:'QR-T001',nfc_id:'NFC-T001'},
    {id:'T002',vorname:'Sophie',nachname:'Wagner',qr_code:'QR-T002',nfc_id:'NFC-T002'},
    {id:'T003',vorname:'Michael',nachname:'Hoffmann',qr_code:'QR-T003',nfc_id:'NFC-T003'},
    {id:'T004',vorname:'Laura',nachname:'Schneider',qr_code:'QR-T004',nfc_id:'NFC-T004'},
    {id:'T005',vorname:'Thomas',nachname:'Müller',qr_code:'QR-T005',nfc_id:'NFC-T005'},
    {id:'T006',vorname:'Julia',nachname:'Fischer',qr_code:'QR-T006',nfc_id:'NFC-T006'},
    {id:'T007',vorname:'Stefan',nachname:'Weber',qr_code:'QR-T007',nfc_id:'NFC-T007'},
    {id:'T008',vorname:'Anna',nachname:'Meyer',qr_code:'QR-T008',nfc_id:'NFC-T008'},
    {id:'T009',vorname:'Christian',nachname:'Schmidt',qr_code:'QR-T009',nfc_id:'NFC-T009'},
    {id:'T010',vorname:'Katrin',nachname:'Braun',qr_code:'QR-T010',nfc_id:'NFC-T010'},
    {id:'T011',vorname:'Markus',nachname:'Wolf',qr_code:'QR-T011',nfc_id:'NFC-T011'},
    {id:'T012',vorname:'Sabine',nachname:'Richter',qr_code:'QR-T012',nfc_id:'NFC-T012'},
  ],
  gruppen: [
    {id:1,event_id:1,name:'Gruppe Philipp',instruktor:'Philipp.explainer',status:'Geplant',fahrzeug_ids:[1,2,3,4]},
    {id:2,event_id:1,name:'Gruppe Marco',instruktor:'Marco.trainer',status:'Geplant',fahrzeug_ids:[5,6,7,8]},
  ],
  checkins: [],
};

// ── EVENTS ────────────────────────────────────────────────────────────────
async function getEvents(username=null) {
  const now=new Date(); now.setHours(0,0,0,0);
  const in14=new Date(now); in14.setDate(in14.getDate()+14);
  if (MODE==='mock') return MOCK.events.filter(e=>{ const v=new Date(e.datum_von); return v>=now&&v<=in14; });
  if (MODE==='db') {
    const {query}=getDb();
    const {rows}=await query(`SELECT DISTINCT e.* FROM events e LEFT JOIN event_instruktoren ei ON ei.event_id=e.id WHERE e.datum_von>=$1 AND e.datum_von<=$2 AND ($3::text IS NULL OR ei.username=$3) ORDER BY e.datum_von`,[now.toISOString().split('T')[0],in14.toISOString().split('T')[0],username||null]);
    return rows;
  }
  return demRequest('GET',`/api/events${username?'?username='+encodeURIComponent(username):''}`);
}

async function getEvent(eventId) {
  if (MODE==='mock') return MOCK.events.find(e=>e.id===Number(eventId))||null;
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query('SELECT * FROM events WHERE id=$1',[eventId]); return rows[0]||null; }
  return demRequest('GET',`/api/events/${eventId}`);
}

// ── FAHRZEUGE ─────────────────────────────────────────────────────────────
async function getFahrzeugeByEvent(eventId) {
  if (MODE==='mock') return MOCK.fahrzeuge;
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query('SELECT * FROM fahrzeuge WHERE event_id=$1 ORDER BY id',[eventId]); return rows; }
  return demRequest('GET',`/api/events/${eventId}/fahrzeuge`);
}

// ── TEILNEHMER ────────────────────────────────────────────────────────────
async function getTeilnehmerByEvent(eventId) {
  if (MODE==='mock') return MOCK.teilnehmer;
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query('SELECT * FROM teilnehmer WHERE event_id=$1 ORDER BY nachname,vorname',[eventId]); return rows; }
  return demRequest('GET',`/api/events/${eventId}/teilnehmer`);
}
async function getTeilnehmerByQR(qrCode) {
  if (MODE==='mock') return MOCK.teilnehmer.find(t=>t.qr_code===qrCode)||null;
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query('SELECT * FROM teilnehmer WHERE qr_code=$1',[qrCode]); return rows[0]||null; }
  return demRequest('GET',`/api/teilnehmer/qr/${encodeURIComponent(qrCode)}`);
}
async function getTeilnehmerByNFC(nfcId) {
  if (MODE==='mock') return MOCK.teilnehmer.find(t=>t.nfc_id===nfcId)||null;
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query('SELECT * FROM teilnehmer WHERE nfc_id=$1',[nfcId]); return rows[0]||null; }
  return demRequest('GET',`/api/teilnehmer/nfc/${encodeURIComponent(nfcId)}`);
}

// ── GRUPPEN ───────────────────────────────────────────────────────────────
async function getGruppenByEvent(eventId) {
  if (MODE==='mock') return MOCK.gruppen.filter(g=>g.event_id===Number(eventId));
  if (MODE==='db') {
    const {query}=getDb();
    const {rows}=await query(`SELECT g.*,COALESCE(array_agg(gf.fahrzeug_id) FILTER (WHERE gf.fahrzeug_id IS NOT NULL),'{}') AS fahrzeug_ids FROM gruppen g LEFT JOIN gruppe_fahrzeuge gf ON gf.gruppe_id=g.id WHERE g.event_id=$1 GROUP BY g.id ORDER BY g.id`,[eventId]);
    return rows;
  }
  return demRequest('GET',`/api/events/${eventId}/gruppen`);
}
async function createGruppe(eventId,name,fahrzeugIds) {
  if (MODE==='mock') { const id=Date.now(); const g={id,event_id:Number(eventId),name,instruktor:'',status:'Geplant',fahrzeug_ids:fahrzeugIds}; MOCK.gruppen.push(g); return g; }
  if (MODE==='db') {
    const {query}=getDb();
    const r=await query(`INSERT INTO gruppen(event_id,name,status) VALUES($1,$2,'Geplant') RETURNING *`,[eventId,name]);
    const g=r.rows[0]; g.fahrzeug_ids=fahrzeugIds;
    for (const fid of fahrzeugIds) await query(`INSERT INTO gruppe_fahrzeuge VALUES($1,$2) ON CONFLICT DO NOTHING`,[g.id,fid]);
    return g;
  }
  return demRequest('POST',`/api/events/${eventId}/gruppen`,{name,fahrzeug_ids:fahrzeugIds});
}
async function updateGruppe(gruppeId,data) {
  if (MODE==='mock') { const g=MOCK.gruppen.find(x=>x.id===Number(gruppeId)); if(!g) throw new Error('nicht gefunden'); Object.assign(g,data); return g; }
  if (MODE==='db') {
    const {query}=getDb();
    const f=[],v=[]; let i=1;
    if(data.name){f.push(`name=$${i++}`);v.push(data.name);}
    if(data.status){f.push(`status=$${i++}`);v.push(data.status);}
    if(f.length){v.push(gruppeId);await query(`UPDATE gruppen SET ${f.join(',')} WHERE id=$${i}`,v);}
    if(data.fahrzeug_ids){
      await query(`DELETE FROM gruppe_fahrzeuge WHERE gruppe_id=$1`,[gruppeId]);
      for(const fid of data.fahrzeug_ids) await query(`INSERT INTO gruppe_fahrzeuge VALUES($1,$2)`,[gruppeId,fid]);
    }
    const {rows}=await query(`SELECT g.*,COALESCE(array_agg(gf.fahrzeug_id) FILTER (WHERE gf.fahrzeug_id IS NOT NULL),'{}') AS fahrzeug_ids FROM gruppen g LEFT JOIN gruppe_fahrzeuge gf ON gf.gruppe_id=g.id WHERE g.id=$1 GROUP BY g.id`,[gruppeId]);
    return rows[0];
  }
  return demRequest('PUT',`/api/gruppen/${gruppeId}`,data);
}

// ── CHECK-IN / CHECK-OUT ──────────────────────────────────────────────────
async function checkin(fahrzeugId,teilnehmerId,gruppeId) {
  const ts=new Date().toISOString();
  if (MODE==='mock') { const e={id:Date.now(),fahrzeug_id:fahrzeugId,teilnehmer_id:teilnehmerId,gruppe_id:gruppeId,ein:ts,aus:null}; MOCK.checkins.push(e); return e; }
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query(`INSERT INTO fahrtenbuch(fahrzeug_id,teilnehmer_id,gruppe_id,ein) VALUES($1,$2,$3,$4) RETURNING *`,[fahrzeugId,teilnehmerId,gruppeId,ts]); return rows[0]; }
  return demRequest('POST','/api/fahrtenbuch/checkin',{fahrzeug_id:fahrzeugId,teilnehmer_id:teilnehmerId,gruppe_id:gruppeId,ein:ts});
}
async function checkout(fahrzeugId) {
  const ts=new Date().toISOString();
  if (MODE==='mock') { const e=MOCK.checkins.find(c=>c.fahrzeug_id===fahrzeugId&&!c.aus); if(e)e.aus=ts; return e||null; }
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query(`UPDATE fahrtenbuch SET aus=$1 WHERE fahrzeug_id=$2 AND aus IS NULL RETURNING *`,[ts,fahrzeugId]); return rows[0]||null; }
  return demRequest('POST','/api/fahrtenbuch/checkout',{fahrzeug_id:fahrzeugId,aus:ts});
}
async function checkoutAlle(gruppeId) {
  const ts=new Date().toISOString();
  if (MODE==='mock') { MOCK.checkins.filter(c=>c.gruppe_id===gruppeId&&!c.aus).forEach(c=>c.aus=ts); return {ok:true,ts}; }
  if (MODE==='db') { const {query}=getDb(); await query(`UPDATE fahrtenbuch SET aus=$1 WHERE gruppe_id=$2 AND aus IS NULL`,[ts,gruppeId]); return {ok:true,ts}; }
  return demRequest('POST',`/api/gruppen/${gruppeId}/checkout-alle`,{aus:ts});
}
async function getAktiveCheckins(gruppeId) {
  if (MODE==='mock') return MOCK.checkins.filter(c=>c.gruppe_id===gruppeId&&!c.aus).map(c=>{ const t=MOCK.teilnehmer.find(x=>x.id===c.teilnehmer_id); return {...c,teilnehmer_name:t?`${t.vorname} ${t.nachname}`:c.teilnehmer_id}; });
  if (MODE==='db') { const {query}=getDb(); const {rows}=await query(`SELECT f.*,t.vorname,t.nachname,CONCAT(t.vorname,' ',t.nachname) AS teilnehmer_name FROM fahrtenbuch f JOIN teilnehmer t ON t.id=f.teilnehmer_id WHERE f.gruppe_id=$1 AND f.aus IS NULL`,[gruppeId]); return rows; }
  return demRequest('GET',`/api/gruppen/${gruppeId}/checkins/aktiv`);
}
async function getFahrtenbuch(eventId) {
  if (MODE==='mock') {
    // Checkins mit Namen und Fahrzeugdaten anreichern
    return MOCK.checkins.map(c => {
      const tn  = MOCK.teilnehmer.find(t => t.id === c.teilnehmer_id) || {};
      const fzg = MOCK.fahrzeuge.find(f => f.id === c.fahrzeug_id)    || {};
      const grp = MOCK.gruppen.find(g => g.id === c.gruppe_id)        || {};
      const dauerMin = c.aus
        ? Math.round((new Date(c.aus) - new Date(c.ein)) / 60000)
        : null;
      return {
        id:            c.id,
        vorname:       tn.vorname   || '–',
        nachname:      tn.nachname  || '–',
        fahrzeug:      fzg.modell   || '–',
        kennzeichen:   fzg.kz       || '–',
        gruppe:        grp.name     || '–',
        ein:           c.ein,
        aus:           c.aus,
        dauer_minuten: dauerMin,
      };
    });
  }
  if (MODE==='db') {
    const {query}=getDb();
    const {rows}=await query(`
      SELECT f.id, fzg.modell AS fahrzeug, fzg.kz AS kennzeichen,
             t.vorname, t.nachname, g.name AS gruppe,
             f.ein, f.aus,
             CASE WHEN f.aus IS NOT NULL THEN ROUND(EXTRACT(EPOCH FROM (f.aus-f.ein))/60) ELSE NULL END AS dauer_minuten
      FROM fahrtenbuch f
      JOIN fahrzeuge fzg ON fzg.id=f.fahrzeug_id
      JOIN teilnehmer t ON t.id=f.teilnehmer_id
      JOIN gruppen g ON g.id=f.gruppe_id
      WHERE g.event_id=$1 ORDER BY f.ein
    `,[eventId]);
    return rows;
  }
  return demRequest('GET',`/api/events/${eventId}/fahrtenbuch`);
}

async function login(username,password) {
  if (MODE==='mock'||MODE==='db') return {success:true,user:username,token:'demo-'+Date.now()};
  const res=await fetch(`${BASE_URL}/api/auth/login`,{method:'POST',headers:authHeader(),body:JSON.stringify({username,password})});
  if(!res.ok) return {success:false};
  return {success:true,...(await res.json())};
}

module.exports = {
  getEvents,getEvent,getFahrzeugeByEvent,
  getTeilnehmerByEvent,getTeilnehmerByQR,getTeilnehmerByNFC,
  getGruppenByEvent,createGruppe,updateGruppe,
  checkin,checkout,checkoutAlle,getAktiveCheckins,getFahrtenbuch,
  login,
};
