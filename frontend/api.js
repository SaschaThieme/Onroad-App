/**
 * api.js – Frontend API-Layer
 * ─────────────────────────────────────────────────────────────────────────
 * Alle Calls zum Backend laufen hier durch.
 * Im Offline-Modus werden Daten aus dem lokalen Cache (localStorage) genutzt.
 * ─────────────────────────────────────────────────────────────────────────
 */

const API_BASE = '/api';

// ── Offline-Cache ─────────────────────────────────────────────────────────

const cache = {
  set(key, data) {
    try { localStorage.setItem('onroad_' + key, JSON.stringify(data)); } catch(e) {}
  },
  get(key) {
    try { const d = localStorage.getItem('onroad_' + key); return d ? JSON.parse(d) : null; } catch(e) { return null; }
  },
};

// Offline-Queue: speichert Aktionen die noch nicht gesynct wurden
const offlineQueue = {
  add(action) {
    const q = this.getAll();
    q.push({ ...action, ts: Date.now() });
    try { localStorage.setItem('onroad_offline_queue', JSON.stringify(q)); } catch(e) {}
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem('onroad_offline_queue') || '[]'); } catch(e) { return []; }
  },
  clear() {
    try { localStorage.removeItem('onroad_offline_queue'); } catch(e) {}
  },
};

// ── HTTP-Wrapper ──────────────────────────────────────────────────────────

async function request(method, path, body = null) {
  const token = sessionStorage.getItem('onroad_token');
  const opts  = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Netzwerk-Status ───────────────────────────────────────────────────────

function isOnline() { return navigator.onLine; }

// Versucht Offline-Queue zu synchronisieren
async function syncOfflineQueue() {
  const q = offlineQueue.getAll();
  if (!q.length) return;
  console.log(`[SYNC] ${q.length} Offline-Aktionen werden synchronisiert...`);
  const synced = [];
  for (const action of q) {
    try {
      await request(action.method, action.path, action.body);
      synced.push(action);
      console.log(`[SYNC] ✓ ${action.method} ${action.path}`);
    } catch (e) {
      console.warn(`[SYNC] ✗ ${action.method} ${action.path}: ${e.message}`);
    }
  }
  // Nur erfolgreiche entfernen
  const remaining = q.filter(a => !synced.includes(a));
  try { localStorage.setItem('onroad_offline_queue', JSON.stringify(remaining)); } catch(e) {}
  console.log(`[SYNC] Fertig. ${synced.length}/${q.length} synchronisiert.`);
}

window.addEventListener('online', syncOfflineQueue);

// ── AUTH ──────────────────────────────────────────────────────────────────

async function login(username, password) {
  const res = await request('POST', '/auth/login', { username, password });
  sessionStorage.setItem('onroad_token', res.token);
  sessionStorage.setItem('onroad_user', res.user);
  return res;
}

function logout() {
  sessionStorage.removeItem('onroad_token');
  sessionStorage.removeItem('onroad_user');
}

function getCurrentUser() {
  return sessionStorage.getItem('onroad_user');
}

// ── EVENTS ────────────────────────────────────────────────────────────────

async function getEvents() {
  const user = getCurrentUser() || '';
  try {
    const data = await request('GET', '/events?username=' + encodeURIComponent(user));
    cache.set('events', data);
    return data;
  } catch (e) {
    if (!isOnline()) return cache.get('events') || [];
    throw e;
  }
}

async function getFahrzeuge(eventId) {
  try {
    const data = await request('GET', `/events/${eventId}/fahrzeuge`);
    cache.set(`fahrzeuge_${eventId}`, data);
    return data;
  } catch (e) {
    if (!isOnline()) return cache.get(`fahrzeuge_${eventId}`) || [];
    throw e;
  }
}

// ── GRUPPEN ───────────────────────────────────────────────────────────────

async function getGruppen(eventId) {
  try {
    const data = await request('GET', `/gruppen?eventId=${eventId}`);
    cache.set(`gruppen_${eventId}`, data);
    return data;
  } catch (e) {
    if (!isOnline()) return cache.get(`gruppen_${eventId}`) || [];
    throw e;
  }
}

async function createGruppe(eventId, name, fahrzeugIds) {
  const body = { eventId, name, fahrzeugIds };
  try {
    const data = await request('POST', '/gruppen', body);
    return data;
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'POST', path: '/gruppen', body });
      // Lokales Objekt zurückgeben
      return { id: 'offline_' + Date.now(), event_id: eventId, name, status: 'Geplant', fahrzeug_ids: fahrzeugIds };
    }
    throw e;
  }
}

async function updateGruppe(gruppeId, data) {
  try {
    return await request('PUT', `/gruppen/${gruppeId}`, data);
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'PUT', path: `/gruppen/${gruppeId}`, body: data });
      return { id: gruppeId, ...data };
    }
    throw e;
  }
}

// ── CHECK-IN ──────────────────────────────────────────────────────────────

async function checkinQR(qrCode, fahrzeugId, gruppeId) {
  const body = { qrCode, fahrzeugId, gruppeId };
  try {
    return await request('POST', '/checkin/qr', body);
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'POST', path: '/checkin/qr', body });
      throw new Error('OFFLINE: Check-in wird gespeichert und später synchronisiert.');
    }
    throw e;
  }
}

async function checkinNFC(nfcId, fahrzeugId, gruppeId) {
  const body = { nfcId, fahrzeugId, gruppeId };
  try {
    return await request('POST', '/checkin/nfc', body);
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'POST', path: '/checkin/nfc', body });
      throw new Error('OFFLINE');
    }
    throw e;
  }
}

async function checkout(fahrzeugId) {
  const body = { fahrzeugId };
  try {
    return await request('POST', '/checkin/checkout', body);
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'POST', path: '/checkin/checkout', body });
      return { ok: true };
    }
    throw e;
  }
}

async function checkoutAlle(gruppeId) {
  try {
    return await request('POST', `/gruppen/${gruppeId}/checkout-alle`);
  } catch (e) {
    if (!isOnline()) {
      offlineQueue.add({ method: 'POST', path: `/gruppen/${gruppeId}/checkout-alle`, body: {} });
      return { ok: true };
    }
    throw e;
  }
}

async function getAktiveCheckins(gruppeId) {
  try {
    const data = await request('GET', `/gruppen/${gruppeId}/checkins/aktiv`);
    cache.set(`checkins_${gruppeId}`, data);
    return data;
  } catch (e) {
    if (!isOnline()) return cache.get(`checkins_${gruppeId}`) || [];
    throw e;
  }
}

// Öffentliche API
window.API = {
  login, logout, getCurrentUser, isOnline, syncOfflineQueue,
  getEvents, getFahrzeuge,
  getGruppen, createGruppe, updateGruppe,
  checkinQR, checkinNFC, checkout, checkoutAlle, getAktiveCheckins,
  offlineQueue,
};
