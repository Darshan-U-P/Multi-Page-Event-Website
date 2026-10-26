# EventSphere — Multi-Page Event Website + Admin CMS

EventSphere is a responsive multi-page event website with GSAP motion and a local admin workspace. The public site uses HTML/CSS/JavaScript and Apache httpd. The admin API uses FastAPI and SQLite, orchestrated with Docker Compose.

> **Demo content:** Event listings and dates are examples. This project does not provide ticketing or payments. Admin sessions are intended for a single local Docker instance; harden and review before exposing it to the public internet.

## Features

- Five public pages: Home, Events, Event Details, About, and Contact.
- GSAP page entrance and ScrollTrigger reveal animations with reduced-motion support.
- Admin workspace at `/admin/` with password login, event CRUD, draft/published event status, homepage copy editor, appearance preferences, and a local draft preview.
- FastAPI backend with SQLite content persistence, password hashing, server-side session expiry, HttpOnly session cookie, CSRF token checks, and an audit log.
- Apache routes `/api/` requests to the private backend service. The backend port is not published to the host.
- Docker bind mount supports source-code live edits; SQLite database is stored in a named Docker volume.

## Requirements

- Docker Desktop on Windows/macOS, or Docker Engine + Docker Compose on Linux.
- A code editor such as VS Code.

## Configure the admin login (required)

Never commit real passwords or secrets.

**PowerShell:**
```powershell
Copy-Item .env.example .env
# Open .env and set ADMIN_PASSWORD to a strong unique password.
# Replace SESSION_SECRET with a randomly generated secret (32+ characters).
notepad .env
```

You can generate a secret using PowerShell:
```powershell
-join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

The generated value is for local development. Keep `.env` untracked; `.gitignore` excludes it.

## Start the stack

```powershell
docker compose up --build -d
docker compose ps
```

Open:
- Public site: http://localhost:8080
- Admin panel: http://localhost:8080/admin/
- Health endpoint: http://localhost:8080/api/health

Log in with the username and password configured in `.env`. Do not use a blank or example password.

## Browser-based content editing

1. Open http://localhost:8080/admin/ and sign in.
2. Use **Events** to create/update/delete events and choose Draft or Published status.
3. Use **Page content** to edit the homepage headline, text, featured event copy, and call-to-action; Preview lets you check the draft.
4. Use **Motion & appearance** to save the GSAP enable switch, motion preference, and accent color.
5. Save/publish to persist content in SQLite. Published event status controls whether it appears from the public events API.

The editor preview is an in-admin preview card, not a full DOM visual builder. Homepage content keys are stored through the API; integrating every saved field into all existing public markup is a future extension.

## Developer live edit (source code)

The Compose bind mount exposes the host project directory to Apache read-only from the container side. Editing on the host is still allowed:
1. Open the folder in VS Code.
2. Edit an HTML file, `css/style.css`, or `animations.js`.
3. Save and refresh the browser. You generally do not need to rebuild for these file edits.

## Useful commands

```powershell
docker compose logs -f website
docker compose logs -f backend
docker compose down
```

Rebuild containers after changing Dockerfiles, dependencies, or Compose configuration:
```powershell
docker compose up --build -d
```

The SQLite database is stored in the `eventsphere-data` named volume and remains available after container recreation. To intentionally remove the database volume too, use `docker compose down -v` (this permanently deletes its saved content).

## Project structure

```text
.
├── index.html, events.html, event-details.html, about.html, contact.html
├── css/style.css
├── animations.js
├── admin/ (dashboard, client code, styles)
├── backend/app/main.py
├── backend/requirements.txt
├── backend/Dockerfile
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── .gitignore
```
