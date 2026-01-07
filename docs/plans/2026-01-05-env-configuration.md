# Environment Configuration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Erstelle eine .env.example Datei für MQTT-Konfiguration und stelle sicher, dass .env nicht zu GitHub committed wird.

**Architecture:** Konfigurationsvariablen werden in .env Datei ausgelagert und via dotenv geladen. Die .env.example dient als Template für Entwickler.

**Tech Stack:** Node.js, dotenv package

---

## Task 1: .env.example Datei erstellen

**Files:**
- Create: `.env.example`
- Verify: `.gitignore` (should already have .env)

**Step 1: Verifiziere .gitignore**

Check: Prüfe ob `.env` bereits in `.gitignore` steht

Run: `grep "^\.env$" .gitignore`
Expected: `.env` sollte bereits vorhanden sein (aus Task 1 des ursprünglichen Plans)

Falls NICHT vorhanden:
```bash
echo ".env" >> .gitignore
```

**Step 2: Erstelle .env.example**

Create `.env.example`:

```bash
# MQTT Broker Configuration
MQTT_BROKER=localhost
MQTT_BROKER_PORT=1883

# Server Configuration
PORT=3000
```

**Step 3: Verifiziere dass .env.example committable ist**

Check: `.env.example` sollte NICHT in `.gitignore` sein (nur `.env` ist drin)

Run: `git status .env.example`
Expected: `.env.example` wird als "Untracked file" oder zum Staging vorgeschlagen

**Step 4: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example template for environment configuration"
```

---

## Task 2: dotenv Package installieren und integrieren (Optional)

**Hinweis:** Das aktuelle Projekt nutzt bereits `process.env.MQTT_BROKER` und `process.env.PORT` direkt. Für eine sauberere Lösung mit .env-Datei sollte dotenv verwendet werden.

**Files:**
- Modify: `package.json`
- Modify: `server.js:1-10`
- Create: `.env` (lokal, nicht committen!)

**Step 1: Installiere dotenv**

Run: `npm install dotenv`
Expected: dotenv wird zu dependencies hinzugefügt

**Step 2: Integriere dotenv in server.js**

Modify `server.js` - füge am Anfang hinzu (vor allen anderen imports):

```javascript
require('dotenv').config();
```

Kompletter Anfang von `server.js` sollte dann sein:

```javascript
require('dotenv').config();

const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
const MqttClient = require('./src/mqtt-client');
```

**Step 3: Update MQTT_BROKER Konstruktion**

Modify `server.js` - ersetze Zeile 8-9:

Von:
```javascript
const PORT = process.env.PORT || 3000;
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
```

Zu:
```javascript
const PORT = process.env.PORT || 3000;
const MQTT_BROKER_HOST = process.env.MQTT_BROKER || 'localhost';
const MQTT_BROKER_PORT = process.env.MQTT_BROKER_PORT || '1883';
const MQTT_BROKER = `mqtt://${MQTT_BROKER_HOST}:${MQTT_BROKER_PORT}`;
```

**Step 4: Erstelle lokale .env Datei (für lokales Testen)**

Create `.env` (lokal):

```bash
# MQTT Broker Configuration
MQTT_BROKER=localhost
MQTT_BROKER_PORT=1883

# Server Configuration
PORT=3000
```

**Wichtig:** Diese Datei NICHT committen! Sie ist bereits in `.gitignore`.

**Step 5: Teste die Konfiguration**

Run: `npm start`
Expected: Server startet und liest Konfiguration aus .env Datei

Verify:
```bash
# Server sollte ausgeben:
# "Connecting to MQTT broker: mqtt://localhost:1883"
```

**Step 6: Update README.md mit .env Hinweis**

Modify `README.md` - füge nach "Installation" Sektion hinzu:

```markdown
## Konfiguration

### Umgebungsvariablen

Kopieren Sie `.env.example` zu `.env` und passen Sie die Werte an:

```bash
cp .env.example .env
```

Verfügbare Umgebungsvariablen:
- `MQTT_BROKER`: MQTT Broker Hostname (Standard: localhost)
- `MQTT_BROKER_PORT`: MQTT Broker Port (Standard: 1883)
- `PORT`: HTTP Server Port (Standard: 3000)

**Hinweis:** Die `.env` Datei wird nicht zu Git committed und ist nur für lokale Entwicklung.
```

**Step 7: Commit**

```bash
git add package.json package-lock.json server.js README.md
git commit -m "feat: add dotenv support for environment configuration"
```

---

## Completion Checklist

- [ ] `.env` ist in `.gitignore` eingetragen
- [ ] `.env.example` erstellt mit Template-Werten
- [ ] `.env.example` ist zu GitHub committed
- [ ] dotenv installiert und integriert (optional)
- [ ] server.js nutzt MQTT_BROKER und MQTT_BROKER_PORT separat
- [ ] README.md dokumentiert .env Verwendung
- [ ] Lokale .env Datei erstellt aber NICHT committed

## Notes

**Warum zwei Variablen?**
- Originalversion hatte `MQTT_BROKER=mqtt://localhost:1883` (vollständige URL)
- Neue Version trennt Host und Port: `MQTT_BROKER=localhost` und `MQTT_BROKER_PORT=1883`
- Das ermöglicht flexiblere Konfiguration

**Backward Compatibility:**
Falls Sie die alte Methode (`MQTT_BROKER=mqtt://localhost:1883`) beibehalten möchten, nutzen Sie nur Task 1 und überspringen Task 2.

**Security Hinweis:**
- .env Dateien sollten niemals Credentials enthalten, die zu Git committed werden
- .env.example sollte nur Beispielwerte/Platzhalter enthalten
- Echte Credentials gehören nur in die lokale .env Datei
