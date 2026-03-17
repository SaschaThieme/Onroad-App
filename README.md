# Onroad – Digitales Fahrtenbuch

## Projektstruktur

```
onroad-mvp/
├── backend/
│   ├── server.js          ← Express-Server (Einstiegspunkt)
│   ├── dem-api.js         ← ALLE DEM-Calls zentral hier
│   ├── .env               ← Konfiguration (API-URL, Credentials)
│   ├── routes/
│   │   ├── auth.js        ← Login
│   │   ├── events.js      ← Events + Fahrzeuge + Teilnehmer
│   │   ├── gruppen.js     ← Gruppen + Checkins
│   │   └── checkin.js     ← QR / NFC Check-in & Check-out
│   └── package.json
└── frontend/
    ├── index.html         ← PWA (iOS-optimiert)
    ├── api.js             ← Frontend API-Layer + Offline-Queue
    └── manifest.json      ← PWA-Manifest
```

---

## Setup & Start

### 1. Backend starten

```bash
cd backend
npm install
npm start
# Dev-Modus (auto-reload):
npm run dev
```

Der Server läuft dann auf http://localhost:3000
Das Frontend wird automatisch mitgeliefert.

### 2. Im Browser öffnen

```
http://localhost:3000
```

Auf iPhone: Safari → Teilen → „Zum Home-Bildschirm" für echte PWA-Installation.

---

## DEM-Anbindung konfigurieren

### Aktuell: Mock-Modus (kein DEM nötig)

In `backend/.env`:
```
API_MODE=mock
```

### Wenn DEM-Doku vorliegt: Live-Modus

1. `.env` anpassen:
```
API_MODE=live
DEM_BASE_URL=https://ihre-dem-api.example.com
DEM_USERNAME=ihr-benutzername
DEM_PASSWORD=ihr-passwort
```

2. Endpunkte in `backend/dem-api.js` anpassen:
   - Suche nach `TODO:` Kommentaren
   - Nur die URL-Pfade ändern – Logik bleibt gleich

---

## API-Endpunkte (Onroad Backend)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| POST | /api/auth/login | Login |
| GET | /api/events | Alle Events |
| GET | /api/events/:id/fahrzeuge | Fahrzeuge eines Events |
| GET | /api/events/:id/teilnehmer | Teilnehmer eines Events |
| GET | /api/gruppen?eventId=X | Gruppen eines Events |
| POST | /api/gruppen | Neue Gruppe erstellen |
| PUT | /api/gruppen/:id | Gruppe bearbeiten |
| POST | /api/checkin/qr | Fahrer per QR einchecken |
| POST | /api/checkin/nfc | Fahrer per NFC einchecken |
| POST | /api/checkin/checkout | Einzelnen Fahrer auschecken |
| POST | /api/gruppen/:id/checkout-alle | Alle Fahrer auschecken |
| GET | /api/gruppen/:id/checkins/aktiv | Aktive Checkins einer Gruppe |
| GET | /api/events/:id/fahrtenbuch | Komplettes Fahrtenbuch |

---

## Offline-Funktionalität

- Alle geladenen Daten werden im Browser-Cache gespeichert
- Aktionen ohne Internet landen in der Offline-Queue
- Bei Wiederverbindung sync automatisch (window `online`-Event)
- Offline-Banner wird automatisch angezeigt

## Auto-Checkout

Der Server prüft alle 5 Minuten ob Events abgelaufen sind.
2 Stunden nach `datum_bis + ende_uhrzeit` werden alle Fahrer automatisch ausgecheckt.
