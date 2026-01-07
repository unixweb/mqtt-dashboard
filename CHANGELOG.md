# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.10] - 2026-01-07

### Added
- **Automatische JSON-Formatierung**: MQTT-Nachrichten die valid JSON enthalten werden jetzt automatisch erkannt und formatiert angezeigt ([#4](https://github.com/unixweb/mqtt-dashboard/pull/4))
  - Automatische Erkennung mit `JSON.parse()` in try-catch Block
  - Formatierte Anzeige mit 2 Spaces Einrückung (`JSON.stringify(parsed, null, 2)`)
  - Visuelle Unterscheidung durch CSS (grauer Hintergrund, lila Border, Monospace Font)
  - XSS-Schutz durch `escapeHtml()` nach JSON-Formatierung
  - Graceful Fallback zu normalem Text bei invalid JSON

### Changed
- `public/app.js`: JSON-Erkennung in `addMessage()` Funktion
- `public/styles.css`: Neue `.json-content` CSS-Klasse für formatierte Anzeige

### Technical
- Keine Breaking Changes - bestehende Text-Nachrichten funktionieren unverändert
- Alle Tests passing (6/6)
- Design-Dokument: `docs/plans/2026-01-07-json-message-formatting-design.md`
- Implementierungsplan: `docs/plans/2026-01-07-json-formatting-implementation.md`

## [1.0.0] - 2026-01-05

### Added
- **Graceful Shutdown**: Server fährt sauber herunter bei SIGINT/SIGTERM ([#3](https://github.com/unixweb/mqtt-dashboard/pull/3))
  - WebSocket Verbindungen werden sauber geschlossen
  - MQTT Client trennt Verbindung korrekt
  - HTTP Server wartet auf offene Connections
  - Timeout-basierte Fehlerbehandlung
- **Dotenv Configuration**: Umgebungsvariablen via `.env` Datei ([#2](https://github.com/unixweb/mqtt-dashboard/pull/2))
  - `MQTT_BROKER`, `MQTT_BROKER_PORT`, `PORT` konfigurierbar
  - `.env.example` Template für Entwickler
- **MQTT Dashboard**: Initiales Release
  - WebSocket-basierte Kommunikation zwischen Browser und Server
  - MQTT Client Wrapper mit Promise-basierter API
  - Subscribe/Unsubscribe/Publish Funktionalität
  - Monitor-Tab für `$SYS/#` System-Metriken
  - Dashboard-Tab für reguläre MQTT-Nachrichten
  - Auto-Reconnect nach WebSocket-Disconnect

### Technical
- Node.js mit Express
- WebSocket Server (ws package)
- MQTT.js Client
- Vanilla JavaScript Frontend
- Jest Test Suite (6 Tests)
- Comprehensive Documentation (README, CLAUDE.md)

---

[1.0.10]: https://github.com/unixweb/mqtt-dashboard/compare/v1.0.0...v1.0.10
[1.0.0]: https://github.com/unixweb/mqtt-dashboard/releases/tag/v1.0.0
