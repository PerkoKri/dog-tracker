# Projektdokumentation - DogTracker

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen [Optional]](#4-erweiterungen-optional)
5. [Projektorganisation [Optional]](#5-projektorganisation-optional)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang [Optional]](#7-anhang-optional)

> **Hinweis:** Massgeblich sind die im **Unterricht** und auf **Moodle** kommunizierten Anforderungen.

## 1. Ausgangslage

- **Problem:** Hundebesitzer:innen oder Personen, die regelmässig auf einen Hund aufpassen, müssen alltägliche Aktivitäten wie Gassi gehen, Füttern, Pflege, Medikamente oder Arzttermine oft im Kopf behalten oder über mehrere Kanäle absprechen. Dadurch ist nicht immer klar, was bereits erledigt wurde.
- **Ziele:** Ziel ist eine mobile Web-App, mit der Nutzer:innen nach dem Login zuerst ihren Hund erfassen und danach unterschiedliche Aktivitäten mit passenden Eingabefeldern dokumentieren können. Die wichtigsten Daten sollen übersichtlich angezeigt, gespeichert und bei Bedarf wieder gelöscht werden können.
- **Primäre Zielgruppe:** Hundebesitzer:innen und Betreuungspersonen, die den Alltag eines oder mehrerer Hunde einfach dokumentieren möchten.
- **Weitere Stakeholder [Optional]:** Dozierende, Mitstudierende im Usability-Test und Personen, die den Prototyp im Rahmen der Abgabe prüfen.

## 2. Lösungsidee

- **Kernfunktionalität:** DogTracker unterstützt zwei zusammenhängende Workflows: Aktivitäten nachträglich erfassen und zukünftige Aufgaben planen. Nutzer:innen können sich registrieren, Hunde erfassen, Aktivitäten speichern, Erinnerungen planen, fällige Aufgaben abhaken und erledigte Erinnerungen automatisch im Verlauf dokumentieren.
- **Mindestumfang:** Der Prototyp ist eine interaktive Web-App mit mehreren Bereichen, Login/Registrierung, Datenbankanbindung, persönlicher Hunde-Verwaltung, Erstellen und Löschen von Aktivitäten, Verlauf, Netlify-Deployment, GitHub-Repository und dokumentierter Usability Evaluation.
- **Erweiterung:** Die Erfassung unterscheidet zwischen Gassi, Futter, Pflege, Medikamenten und Arztterminen. Zusätzlich gibt es Anhänge für Fotos und Dokumente, einen Planer mit Kalender- und Tagesansicht, allgemeine Aufgaben, Erledigt-Funktion für kommende Aufgaben und Cloud-Speicher für die Hundeakte.
- **Annahmen [Optional]:** Nutzer:innen möchten die App vor allem mobil und schnell bedienen. Der Ablauf muss deshalb kurz, verständlich und ohne komplexe Menüs funktionieren.
- **Abgrenzung [Optional]:** Nicht Bestandteil des Prototyps sind Rollen wie Admin/User, native Push-Benachrichtigungen im Hintergrund, Synchronisation mit externen Kalendern, OCR-Auswertung von Dokumenten oder produktive Freigabe- und Rechteprozesse für einen realen Betrieb.

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Die Zielgruppe braucht eine einfache Möglichkeit, Hunde und wiederkehrende Aktivitäten zu dokumentieren. Besonders wichtig ist, dass neue Nutzer:innen nicht mit vorhandenen Beispieldaten verwechselt werden, sondern zuerst ihren eigenen Hund erfassen.
- **Wesentliche Erkenntnisse:**
  - Der Hauptworkflow muss ohne Erklärung verständlich sein.
  - Login und persönliche Daten müssen getrennt pro Nutzer:in funktionieren.
  - Die Navigation soll klar zwischen Übersicht, Aktivität, Planer und Verlauf unterscheiden.
  - Ein neuer Account soll leer starten und zuerst zur Hunde-Erfassung auffordern.

### 3.2 Sketch

- **Variantenüberblick:** Zu Beginn wurde ein mobiler Ein-Screen-Prototyp angedacht. Danach wurde die Struktur in vier Hauptbereiche aufgeteilt: `Home`, `Aktivität`, `Planer` und `Verlauf`.
- **Skizzen:** Das Figma-Mockup diente als Ausgangspunkt für die mobile Gestaltung und den linearen Workflow. Die Umsetzung wurde im Prototyp weiterentwickelt, damit Login, Hunde-Erfassung und Aktivitätserfassung getrennt testbar sind.

### 3.3 Decide

- **Gewählte Variante & Begründung:** Gewählt wurde eine mobile App-Struktur mit Bottom-Navigation. Diese Variante passt zur Nutzung unterwegs und macht den Workflow klarer: Home für Konto und fällige Aufgaben, Aktivität für vergangene Einträge, Planer für kommende Aufgaben und Verlauf für gespeicherte Aktivitäten.
- **End-to-End-Ablauf:** Registrierung/Login -> erster Hund erfassen -> Aktivität erfassen -> Aktivität im Dashboard/Verlauf prüfen -> Aktivität löschen.
- **Mockup:** Figma-Mockup: https://www.figma.com/site/oeVTCmei0b0H6m29yesxzv/DogTracker?node-id=0-3&t=sD8JXcT3QnVaDrEd-1

### 3.4 Prototype

#### 3.4.1. Entwurf (Design)

- **Informationsarchitektur:** Die App besteht aus einem Login-/Registrierungsbereich und drei Hauptbereichen nach dem Login:
  - `Home`: persönliches Dashboard, fällige Erinnerungen, Kontoanzeige, Hunde verwalten
  - `Aktivität`: Aktivität für einen ausgewählten Hund speichern, optional mit Foto oder Dokument als Anhang
  - `Planer`: Kalender, Tagesansicht, To-dos und wiederkehrende Erinnerungen
  - `Verlauf`: Gesamtübersicht der gespeicherten Aktivitäten mit Löschfunktion
- **User Interface Design:** Die Oberfläche ist als mobile App gestaltet. Wiederkehrende Karten, klare Buttons und kurze Labels sollen die Bedienung erleichtern.
- **Designentscheidungen:** Neue Nutzer:innen sehen keine automatisch angelegten Hunde mehr. Dadurch ist klar, dass zuerst ein eigener Hund erfasst werden muss. Der Bereich `Aktivität` führt direkt zum Formular für Aktivitäten, damit der zentrale Workflow nicht mit Hunde-Verwaltung vermischt wird.
- **Screenshots der fertigen App:**

  ![Login und Registrierung](docs/screenshots/01-login.png)
  Login und Registrierung als Einstieg in den persönlichen Bereich.

  ![Ersten Hund erfassen](docs/screenshots/02-erster-hund.png)
  Neue Nutzer:innen starten ohne Beispielhunde und werden zuerst zur Hunde-Erfassung geführt.

  ![Hunde verwalten und Routinen](docs/screenshots/03-hund-verwalten.png)
  Im Home-Bereich können Hunde hinzugefügt, ausgewählt und mit Routinen verwaltet werden.

  ![Aktivität erfassen](docs/screenshots/04-aktivitaet-erfassen.png)
  Über `Aktivität` wird eine Aktivität Schritt für Schritt eingetragen.

  ![Verlauf nach dem Speichern](docs/screenshots/05-verlauf-nach-speichern.png)
  Gespeicherte Aktivitäten erscheinen direkt in der Tagesübersicht und im Verlauf.

  ![Planer mit Kalender](docs/screenshots/06-planer-kalender.png)
  Der Planer bündelt Kalender, Tagesansicht, Routinen und offene Aufgaben.

  ![Verlauf](docs/screenshots/07-verlauf.png)
  Der Verlauf zeigt alle gespeicherten Einträge des eingeloggten Accounts.

#### 3.4.2. Umsetzung (Technik)

- **Technologie-Stack:** SvelteKit, Svelte, JavaScript/TypeScript, MongoDB, Netlify Functions, Netlify Blobs, Netlify Deployment.
- **Tooling:** Visual Studio Code, GitHub, Netlify, MongoDB Atlas und KI-Unterstützung durch ChatGPT/Codex.
- **Struktur & Komponenten:**
  - `AuthPanel.svelte`: Login und Registrierung
  - `DogManager.svelte`: Hunde anzeigen, hinzufügen und löschen
  - `Dashboard.svelte`: Tagesübersicht und Kennzahlen
  - `EntryForm.svelte`: dreistufiges Formular für Aktivitäten
  - `PlannerPanel.svelte`: Kalender, Erinnerungen und Erledigt-Funktion
  - `Timeline.svelte`: Verlauf mit Löschfunktion
  - `BottomNav.svelte`: Navigation zwischen Home, Aktivität, Planer und Verlauf
- **Daten & Schnittstellen:** Die strukturierten Daten werden in MongoDB in der Datenbank `dog-tracker` gespeichert. Verwendete Collections sind `users`, `dogs`, `activities` und `reminders`. Hunde speichern mehrere Futterzeiten, mehrere Medikamente und ein Dossier mit Dokumenten. Dateien wie Fotos, PDFs oder Word-Dokumente werden über die eigene Datei-API `/api/files` hochgeladen und getrennt davon in Netlify Blobs gespeichert. API-Endpunkte werden über Netlify Functions bereitgestellt:
  - `/api/auth`
  - `/api/dogs`
  - `/api/activities`
  - `/api/reminders`
  - `/api/files`
- **Externe Daten:** Für die finale Version wird keine zusätzliche Dritt-Daten-API im Kernworkflow benötigt. Stattdessen nutzt der Prototyp eigene API-Endpunkte für Authentifizierung, Datenpersistenz und Datei-Uploads.
- **Anhänge:** Aktivitäten können mit einem Foto oder Dokument gespeichert werden, z. B. Impfausweis, Tierarztrechnung, Medikamentenplan oder Foto. Die App lädt Anhänge über die API `/api/files` in den Cloud-Speicher Netlify Blobs hoch und speichert in MongoDB nur den Dateiverweis mit signierter Datei-URL. Anhänge werden direkt im Verlauf angezeigt beziehungsweise als Datei geöffnet.
- **Deployment:** https://dog-tracker-kristian.netlify.app/
- **Besondere Entscheidungen:** Passwörter werden serverseitig gehasht. Aktivitäten und Hunde werden über `userId` dem eingeloggten Account zugeordnet. Als Fallback werden Aktivitäten im Browser gespeichert, falls die API kurzfristig nicht erreichbar ist.

### 3.5 Validate

- **URL der getesteten Version:** https://dog-tracker-kristian.netlify.app/
- **Ziele der Prüfung:** Ziel der Usability Evaluation war zu prüfen, ob Testpersonen den Hauptworkflow ohne Hilfe verstehen: Login/Registrierung, Hund hinzufügen, Aktivität über `Aktivität` speichern, Eintrag wiederfinden und Eintrag löschen.
- **Vorgehen:** Die Evaluation wurde als moderierter, szenario-basierter Usability-Test vor Ort durchgeführt. Die Testpersonen erhielten die Aufgabe schriftlich und wurden während der Durchführung beobachtet. Rückfragen und Beobachtungen wurden protokolliert.
- **Stichprobe:** Getestet wurde mit zwei Mitstudierenden, die den Prototyp nicht im Detail kannten.
- **Aufgaben/Szenarien:**  
  **Testaufgabe DogTracker:** Sie passen regelmässig auf Ihren Hund auf und möchten den Alltag besser dokumentieren. Heute möchten Sie die App zum ersten Mal verwenden, Ihren Hund erfassen und danach eine Aktivität speichern. Erstellen Sie ein Konto oder loggen Sie sich ein. Fügen Sie anschliessend Ihren Hund hinzu. Erfassen Sie danach eine Aktivität für diesen Hund, zum Beispiel einen Spaziergang mit Uhrzeit, Dauer und einer kurzen Notiz. Kontrollieren Sie anschliessend, ob die Aktivität in der Übersicht oder im Verlauf sichtbar ist. Löschen Sie danach den erfassten Eintrag wieder.
- **Kennzahlen & Beobachtungen:**
  - Erfolgsquote: 2 von 2 Testpersonen konnten die Aufgabe abschliessen.
  - Login/Registrierung wurde gefunden und erfolgreich verwendet.
  - Das Hinzufügen eines Hundes war grundsätzlich verständlich.
  - Der Button `Aktivität` wurde als Einstieg für neue Aktivitäten verstanden.
  - Die gespeicherte Aktivität wurde im Verlauf wiedergefunden.
  - Die Löschfunktion wurde gefunden und erfolgreich genutzt.
  - In der ersten getesteten Version war unklar, warum neue Nutzer:innen bereits Hunde sahen. Dies wurde als wichtiges Usability-Problem identifiziert.
- **Zusammenfassung der Resultate:** Die Evaluation zeigte, dass der zentrale Workflow grundsätzlich verständlich ist. Besonders wichtig war aber, dass neue Nutzer:innen nicht automatisch Beispielhunde sehen dürfen. Die Navigation mit `Home`, `Aktivität`, `Planer` und `Verlauf` wurde als sinnvoll bestätigt, da sie die Aufgabenbereiche klar trennt.
- **Abgeleitete Verbesserungen:**
  - Neue Accounts starten ohne automatisch angelegte Hunde.
  - Nach dem Login wird zuerst zur Erfassung des ersten Hundes aufgefordert.
  - Die Hunde-Verwaltung wurde auf `Home` platziert.
  - Die Aktivitätserfassung wurde klar in den Bereich `Aktivität` verschoben.
  - Der vollständige Verlauf wurde in einen eigenen Bereich `Verlauf` ausgelagert.

## 4. Erweiterungen [Optional]

### 4.1 Login und persönliche Daten

- **Beschreibung & Nutzen:** Nutzer:innen können sich registrieren und einloggen. Hunde und Aktivitäten werden pro Account gespeichert.
- **Wo umgesetzt:** Frontend in `AuthPanel.svelte`, Backend in `netlify/functions/auth.mts`, Datenbank in der Collection `users`.
- **Referenz:** Beschrieben in Kapitel 3.4.2.
- **Aus Evaluation abgeleitet?:** Teilweise. Die Trennung der Daten pro Nutzer:in wurde durch die Evaluation als wichtig bestätigt.

### 4.2 Hunde-Verwaltung

- **Beschreibung & Nutzen:** Nutzer:innen können mehrere Hunde hinzufügen und löschen. Neue Accounts starten ohne Hunde und müssen zuerst einen eigenen Hund erfassen. Beim Anlegen können bereits Futterzeiten, Medikamente, Gassi-Zeit und Dossier-Dateien ergänzt werden.
- **Wo umgesetzt:** Frontend in `DogManager.svelte`, Backend in `netlify/functions/dogs.mts`, Datenbank in der Collection `dogs`.
- **Referenz:** Beschrieben in Kapitel 3.4.1 und 3.5.
- **Aus Evaluation abgeleitet?:** Ja. Die automatische Anzeige von Beispielhunden wurde entfernt.

### 4.3 Verlauf

- **Beschreibung & Nutzen:** Der Bereich `Verlauf` zeigt die gespeicherten Aktivitäten. Einzelne Einträge können gelöscht werden. Der Verlauf unterstützt auch das Wiederfinden von Anhängen.
- **Wo umgesetzt:** Frontend in `Timeline.svelte`, Backend in `netlify/functions/activities.mts`.
- **Referenz:** Beschrieben in Kapitel 3.4.2.
- **Aus Evaluation abgeleitet?:** Teilweise. Der Verlauf unterstützt das Wiederfinden und Löschen gespeicherter Aktivitäten.

### 4.4 Planer, Erinnerungen und Kalender

- **Beschreibung & Nutzen:** Nutzer:innen können zukünftige Aufgaben wie Futter, Medikamente, Arzttermine oder allgemeine To-dos planen. Fällige Erinnerungen erscheinen in der App, können als erledigt markiert werden und werden danach im Verlauf dokumentiert. Der Planer trennt Kalender, Tagesansicht und offene Aufgaben. Bei der Hunde-Erfassung können Routinewerte wie mehrere Futterzeiten, Medikamente oder Gassi-Zeit direkt angegeben werden.
- **Wo umgesetzt:** Frontend in `PlannerPanel.svelte` und `+page.svelte`, Backend in `netlify/functions/reminders.mts`, Datenbank in der Collection `reminders`.
- **Externe Daten:** Der Planer arbeitet direkt mit den gespeicherten Aufgaben und Erinnerungen. Zusätzliche Dritt-APIs sind dafür nicht nötig.
- **Aus Evaluation abgeleitet?:** Teilweise. Die App wurde damit von einer reinen Nach-Erfassung zu einer Kombination aus Dokumentation und vorausschauender Planung erweitert.

### 4.5 Anhänge und Hundeakte

- **Beschreibung & Nutzen:** Aktivitäten können mit einem Anhang gespeichert werden. Dadurch lassen sich Tierarztberichte, Rechnungen, Medikamentenpläne, Impfausweis-Ausschnitte oder Fotos direkt beim Ereignis ablegen. Zusätzlich lassen sich bereits beim Erstellen eines Hundes Dossier-Dateien speichern.
- **Wo umgesetzt:** Frontend in `EntryForm.svelte` und `Timeline.svelte`, Backend in `netlify/functions/activities.mts` und `netlify/functions/files.mts`, Cloud-Speicher über Netlify Blobs.
- **Aus Evaluation abgeleitet?:** Als fachliche Erweiterung ergänzt, damit die App stärker wie eine echte Hundeakte funktioniert.

## 5. Projektorganisation [Optional]

- **Autor:** Kristian Perkovic
- **Repository & Struktur:** https://github.com/PerkoKri/dog-tracker
- **Issue-Management:** Die Weiterentwicklung erfolgte iterativ anhand der Anforderungen aus den Übungen und der Usability-Beobachtungen. Probleme wurden direkt im Prototyp priorisiert und umgesetzt.
- **Commit-Praxis:** Änderungen wurden mit sprechenden Commit-Messages versioniert, z. B. Login, Löschaktionen und Anpassungen am Workflow.

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:** ChatGPT/Codex von OpenAI.
- **Zweck & Umfang:** KI wurde für Konzeptschärfung, Strukturierung der README, Formulierung der Usability-Testaufgabe, Code-Vorschläge, Debugging, Svelte-Komponenten, Netlify/MongoDB-Anbindung und Refactoring eingesetzt.
- **Eigene Leistung (Abgrenzung):** Die Projektidee, die fachliche Ausrichtung auf DogTracker, die Auswahl des Funktionsumfangs, das Testfeedback und finale Entscheidungen wurden durch den Projektverfasser bestimmt. KI-Vorschläge wurden geprüft, angepasst und in den Projektkontext übertragen.

### 6.2 Prompt-Vorgehen

Die Arbeit mit KI erfolgte iterativ. Zuerst wurden Anforderungen und bestehende Projektdateien analysiert. Danach wurden einzelne Aufgaben formuliert, z. B. Login ergänzen, MongoDB anbinden, Navigation trennen oder README nach Vorlage strukturieren. Generierte Vorschläge wurden getestet, überarbeitet und anhand der Projektanforderungen angepasst.

### 6.3 Reflexion

Der KI-Einsatz half besonders bei der schnellen technischen Umsetzung und beim Strukturieren der Dokumentation. Gleichzeitig mussten Vorschläge kritisch geprüft werden, da nicht jede erste Lösung zur Aufgabenstellung oder zum gewünschten Workflow passte. Besonders bei Login, Datenpersistenz und Usability war manuelle Kontrolle wichtig.

## 7. Anhang [Optional]

- **Live-App:** https://dog-tracker-kristian.netlify.app/
- **GitHub:** https://github.com/PerkoKri/dog-tracker
- **Figma-Mockup:** https://www.figma.com/site/oeVTCmei0b0H6m29yesxzv/DogTracker?node-id=0-3&t=sD8JXcT3QnVaDrEd-1
- **Zugangsdaten:** Kein fixer Testaccount notwendig. Neue Nutzer:innen können direkt einen Account registrieren und danach ihren ersten Hund erfassen.
