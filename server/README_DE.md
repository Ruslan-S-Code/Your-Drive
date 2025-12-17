# Your Drive Backend API

Backend API für die Autovermietungsanwendung Your Drive, erstellt mit Node.js, Express und PostgreSQL.

> 🇷🇺 [Русская версия / Russian Version](./README.md) | 🇬🇧 [English Version](./README_EN.md)

## Anforderungen

- Node.js 18+ 
- PostgreSQL 12+
- npm oder yarn

## Installation

1. Installieren Sie Abhängigkeiten:
```bash
npm install
```

2. Erstellen Sie eine `.env` Datei basierend auf `.env.example`:
```bash
cp .env.example .env
```

3. Konfigurieren Sie Umgebungsvariablen in `.env`:
   - `DATABASE_URL` - PostgreSQL Verbindungszeichenfolge
   - `JWT_SECRET` - Geheimer Schlüssel für JWT-Token
   - `FRONTEND_URL` - URL der Frontend-Anwendung
   - `PORT` - Serverport (Standard: 3001)
   - `SMTP_*` - E-Mail-Einstellungen für Passwort-Wiederherstellung (optional)

4. Erstellen Sie die PostgreSQL Datenbank:
```sql
CREATE DATABASE yourdrive;
```

5. Führen Sie Migrationen aus:
```bash
npm run db:migrate
```

6. (Optional) Füllen Sie die Datenbank mit Testdaten:
```bash
npm run db:seed
```

## Start

### Entwicklungsmodus
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

Der Server ist unter `http://localhost:3001` erreichbar (oder dem in `.env` angegebenen Port).

## API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/auth/me` - Aktuellen Benutzer abrufen
- `POST /api/auth/reset-password-request` - Passwort-Reset anfordern
- `POST /api/auth/reset-password` - Passwort zurücksetzen
- `POST /api/auth/update-password` - Passwort aktualisieren

### Fahrzeuge
- `GET /api/vehicles` - Fahrzeugliste (mit Filtern)
- `GET /api/vehicles/:id` - Fahrzeugdetails

### Standorte
- `GET /api/locations` - Standortliste
- `GET /api/locations/:id` - Standortdetails

### Bewertungen
- `GET /api/reviews/vehicle/:vehicleId` - Bewertungen für ein Fahrzeug

### Buchungen
- `POST /api/bookings` - Buchung erstellen (erfordert Authentifizierung)
- `GET /api/bookings/user/:userId` - Benutzerbuchungen
- `GET /api/bookings/:id` - Buchungsdetails
- `PATCH /api/bookings/:id` - Buchungsstatus aktualisieren

### Profile
- `GET /api/profiles/:userId` - Profil abrufen
- `PUT /api/profiles/:userId` - Profil aktualisieren

### Dateien
- `POST /api/storage/upload/avatar` - Avatar hochladen (erfordert Authentifizierung)
- `GET /uploads/avatars/:filename` - Avatar abrufen

## Datenbankstruktur

- `users` - Benutzer (Authentifizierung)
- `profiles` - Benutzerprofile
- `vehicles` - Fahrzeuge
- `locations` - Standorte
- `reviews` - Bewertungen
- `bookings` - Buchungen
- `password_reset_tokens` - Token für Passwort-Reset

## Testdaten

Nach Ausführung von `npm run db:seed`:
- E-Mail: `test@example.com`
- Passwort: `password123`

## Sicherheit

- Passwörter werden mit bcrypt gehasht
- JWT-Token für Authentifizierung
- CORS für Frontend-Zusammenarbeit konfiguriert
- Eingabevalidierung
- Routenschutz durch Authentifizierungs-Middleware

## 👨‍💻 Entwicklung

Designed and developed by **RSLN**  
Portfolio: https://www.madebyrsln.com

