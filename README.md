# DogTracker

DogTracker ist ein mobiler SvelteKit-Prototyp für Hundebesitzer:innen. Die App unterstützt einen klaren End-to-End-Workflow: Aktivitäten erfassen, speichern und direkt im Dashboard wiederfinden.

## Links

- Live-Demo: https://dog-tracker-kristian.netlify.app/
- Figma/Mockup: https://www.figma.com/site/oeVTCmei0b0H6m29yesxzv/DogTracker?node-id=0-3&t=sD8JXcT3QnVaDrEd-1

## Hauptworkflow

1. Der Nutzer startet im Dashboard und sieht die letzten Aktivitäten.
2. Über die Schnellerfassung wählt der Nutzer zuerst den Hund aus.
3. Danach wird die Aktivität gewählt, zum Beispiel Gassi, Futter oder Pflege.
4. Im letzten Schritt werden Dauer/Menge, Uhrzeit und eine optionale Notiz erfasst.
5. Die Aktivität wird gespeichert.
6. Eine Erfolgsmeldung bestätigt die Speicherung.
7. Das Dashboard und der Verlauf zeigen die aktualisierten Daten.

## Funktionen

- Mobile Tagesübersicht für Milo
- Kennzahlen für Gassi-Minuten, Fütterungen und letzte Aktivität
- Dreistufige Schnellerfassung
- Aktivitätstypen: Gassi, Futter und Pflege
- Verlauf der letzten Einträge
- Persistenz über MongoDB mit Netlify Function `/api/activities`
- Lokaler Fallback über `localStorage`, falls die API nicht erreichbar ist
- Sichtbares Feedback beim Speichern und bei Offline-Fallback
- Demo-Daten lokal zurücksetzen und Verlauf leeren

## Technische Umsetzung

- SvelteKit mit Svelte-Komponenten
- Komponentenstruktur:
  - `Dashboard.svelte`
  - `EntryForm.svelte`
  - `Timeline.svelte`
  - `BottomNav.svelte`
- Netlify Deployment mit statischem Build
- Netlify Function für API-Zugriffe
- MongoDB Collection: `activities`

## Datenmodell

Eine Aktivität enthält:

- `dogName`
- `type`
- `amount`
- `time`
- `note`
- `createdAt`

## Designentscheidungen

Die Anwendung wurde als mobile App konzipiert, weil die Nutzung hauptsächlich unterwegs erfolgt, zum Beispiel beim Gassi gehen oder Füttern. Das Design ist bewusst einfach und reduziert gehalten, damit neue Aktivitäten schnell erfasst werden können.

Die Navigation ist linear aufgebaut, da der Fokus auf einem klaren Hauptprozess liegt. Komplexe Menüs wurden vermieden. Die wichtigsten Informationen stehen direkt auf dem Startscreen, damit der aktuelle Status und die letzten Aktivitäten schnell sichtbar sind.

## Setup

```bash
npm install
```

Für lokale Entwicklung mit MongoDB wird eine Umgebungsvariable benötigt:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/
```

Der echte Connection String wird nicht in den Code geschrieben, sondern lokal als `.env` und in Netlify als geheime Environment Variable gespeichert.

## Entwicklung

```bash
npm run dev
```

Danach öffnen:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## Deployment

Das Projekt ist für Netlify vorbereitet:

- Build Command: `npm run build`
- Publish Directory: `build`
- Function Directory: `netlify/functions`
- Benötigte Environment Variable: `MONGODB_URI`

## Bekannte Limitationen

- Es gibt noch kein Login und keine Benutzerrollen.
- Der Fokus liegt auf einem funktionierenden Hauptworkflow.
- Wenn MongoDB nicht erreichbar ist, nutzt die App bewusst einen lokalen Fallback im Browser.

## KI-Deklaration

KI wurde unterstützend für Konzeptschärfung, UI-Struktur, Svelte-Implementierung, Komponentenaufteilung, Netlify/MongoDB-Anbindung und README-Formulierung eingesetzt. Die Inhalte wurden auf den DogTracker-Kontext und das vorhandene Mockup angepasst.
