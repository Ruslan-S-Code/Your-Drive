# Your Drive - Autovermietungsanwendung

Moderne Webanwendung zur Autovermietung mit vollständigem Backend auf Node.js und Frontend auf React.

> 🇷🇺 [Русская версия / Russian Version](./README.md) | 🇬🇧 [English Version](./README_EN.md)

## 🚀 Schnellstart

### Anforderungen

- Node.js 18+
- PostgreSQL 12+
- npm oder yarn

### Installation und Start

1. **Abhängigkeiten installieren:**

```bash
# Frontend Abhängigkeiten
npm install

# Backend Abhängigkeiten
cd server
npm install
cd ..
```

2. **Datenbank einrichten:**

```bash
cd server

# Erstellen Sie eine .env Datei basierend auf .env.example
cp .env.example .env

# Bearbeiten Sie .env und geben Sie Ihre Einstellungen an:
# DATABASE_URL=postgresql://username:password@localhost:5432/yourdrive
# JWT_SECRET=your-super-secret-jwt-key-change-this
# PORT=3001
# FRONTEND_URL=http://localhost:5173

# Erstellen Sie die PostgreSQL Datenbank
createdb yourdrive

# Führen Sie Migrationen aus, um Tabellen zu erstellen
npm run db:migrate

# Füllen Sie mit Testdaten (optional)
npm run db:seed

cd ..
```

3. **Frontend konfigurieren:**

```bash
# Erstellen Sie eine .env Datei im Projektstammverzeichnis
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

4. **Projekt starten:**

```bash
# Backend und Frontend gleichzeitig starten (aus dem Stammverzeichnis)
npm run dev:all
```

Oder separat:

```bash
# Backend (im server Ordner)
cd server
npm run dev

# Frontend (im Stammverzeichnis)
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## 📁 Projektstruktur

```
Your_Drive/
├── server/              # Backend API (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── db/         # Datenbank und Migrationen
│   │   ├── routes/     # API Routen
│   │   ├── middleware/ # Middleware (Authentifizierung usw.)
│   │   └── utils/      # Utilities
│   └── package.json
├── src/                # Frontend (React + TypeScript + Vite)
│   ├── components/    # React Komponenten
│   ├── pages/         # Anwendungsseiten
│   ├── contexts/      # React Kontexte
│   ├── lib/           # API Client und Utilities
│   └── main.tsx       # Einstiegspunkt
├── public/            # Statische Dateien
└── package.json
```

## 🛠 Technologien

### Backend
- Node.js + Express - eigenes Backend-Server
- PostgreSQL - lokale oder entfernte Datenbank
- TypeScript - typisierter JavaScript
- JWT Authentifizierung - eigene Implementierung
- bcryptjs für Passwort-Hashing
- multer für Datei-Uploads
- nodemailer für E-Mails

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Context API
- i18next für Internationalisierung

## 📋 Hauptfunktionen

- 🔐 Benutzerauthentifizierung und -registrierung
- 🚗 Suche und Filterung von Fahrzeugen
- 📅 Fahrzeugbuchungen
- 👤 Benutzerprofilverwaltung
- ⭐ Bewertungssystem
- 🔔 Benachrichtigungen über neue Events, Artikel und Podcasts
- 🌍 Mehrsprachigkeit (Deutsch/Englisch)
- 🌓 Dunkles/Helles Theme
- 📱 Responsives Design

## 🔑 Testdaten

Nach Ausführung von `npm run db:seed`:
- E-Mail: `test@example.com`
- Passwort: `password123`

## 📚 API Dokumentation

Vollständige API-Dokumentation finden Sie in [server/README.md](./server/README.md)

### Hauptendpunkte:

- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/vehicles` - Fahrzeugliste
- `GET /api/vehicles/:id` - Fahrzeugdetails
- `POST /api/bookings` - Buchung erstellen
- `GET /api/bookings/user/:userId` - Benutzerbuchungen
- `GET /api/reviews/vehicle/:vehicleId` - Bewertungen für ein Fahrzeug

## 🚀 Production Build

```bash
# Backend
cd server
npm run build
npm start

# Frontend
npm run build
npm run preview
```

## 📝 Umgebungsvariablen

### Backend (.env im server/ Ordner)
- `DATABASE_URL` - PostgreSQL Verbindungszeichenfolge
- `JWT_SECRET` - Geheimer Schlüssel für JWT
- `PORT` - Serverport (Standard: 3001)
- `FRONTEND_URL` - Frontend URL
- `SMTP_*` - E-Mail-Einstellungen für Passwort-Wiederherstellung

### Frontend (.env im Stammverzeichnis)
- `VITE_API_URL` - Backend API URL (Standard: http://localhost:3001/api)

## 🐛 Fehlerbehebung

### Backend startet nicht
- Überprüfen Sie, ob PostgreSQL läuft
- Stellen Sie sicher, dass DATABASE_URL korrekt ist
- Überprüfen Sie, ob Port 3001 frei ist

### Frontend verbindet sich nicht mit Backend
- Stellen Sie sicher, dass Backend auf Port 3001 läuft
- Überprüfen Sie VITE_API_URL in der .env Datei
- Überprüfen Sie CORS-Einstellungen im Backend

### Datenbankfehler
- Stellen Sie sicher, dass Migrationen ausgeführt wurden: `npm run db:migrate`
- Überprüfen Sie Datenbankzugriffsrechte

## 📄 Lizenz

ISC

## 👨‍💻 Entwicklung

Made by [RSLN](https://www.madebyrsln.com/)

