# EventSphere — Multi-Page Event Website + Admin CMS

A responsive multi-page event website built with HTML, CSS, JavaScript, GSAP, Apache httpd, FastAPI, SQLite, and Docker Compose.

> **Demo content:** Event listings and schedules are sample content. Booking, ticketing, and payments are not implemented. Admin sessions are intended for one local Docker instance; do not expose the admin publicly without HTTPS, production session storage, rate limiting, and a security review.

## Features

- Five public pages with responsive blue/violet styling.
- GSAP entrance and ScrollTrigger reveals with reduced-motion support.
- Admin workspace at `/admin/` for login, event management, homepage copy, appearance settings, and a draft preview.
- FastAPI API with Argon2 password hashing, session expiry, HttpOnly session cookie, CSRF checks, SQLite persistence, and audit logging.
- Apache proxies `/api/` to the backend; port 8000 is private to the Docker network.
- Host-file live edits remain available in VS Code. Only web assets are mounted into Apache; local secrets and backend source are not placed in the public document root.

## Configure the admin login

From PowerShell in the project root:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `ADMIN_PASSWORD` to a strong unique password and `SESSION_SECRET` to a random secret at least 32 characters long. Never commit `.env`. Only `.env.example` is tracked.

You can generate a random-looking local secret in PowerShell:

```powershell
-join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

## Start the stack

```powershell
docker compose up --build -d
docker compose ps
```

- Public website: http://localhost:8080
- Admin panel: http://localhost:8080/admin/
- API health: http://localhost:8080/api/health

Sign in with the username and password from `.env`.

## Browser-based editing

- **Events:** add/edit/delete event records, and set each event to Draft or Published.
- **Page content:** edit homepage hero, featured event copy, and call-to-action; Preview shows your current draft.
- **Motion & appearance:** enable or disable GSAP, select motion intensity, and change the accent colour token.
- Published page copy and published events are served by the API. Content is stored in the `eventsphere-data` Docker volume.

The current page preview is a safe preview card inside the admin panel, not a full drag-and-drop visual builder.

## Developer live edit

The Compose setup mounts only HTML pages, `css/`, `admin/`, `animations.js`, and `site-content.js` into Apache read-only. The host files are still editable.

1. Open the folder in VS Code.
2. Edit an HTML/CSS/JavaScript file and save.
3. Refresh http://localhost:8080; normal frontend edits do not require a rebuild.

This explicit mount list prevents files such as `.env`, the backend source, Git metadata, and database files from being served by Apache.

## Commands

```powershell
docker compose logs -f website
docker compose logs -f backend
docker compose down
```

Rebuild after changing Dockerfiles, dependencies, or Compose configuration:

```powershell
docker compose up --build -d
```

The database survives container recreation in a named volume. To remove the database and all saved content, run `docker compose down -v`.

## Project structure

```text
.
├── index.html, events.html, event-details.html, about.html, contact.html
├── css/style.css
├── animations.js
├── site-content.js
├── admin/                 # Dashboard UI and client logic
├── backend/app/main.py    # Content API and authentication
├── backend/requirements.txt
├── backend/Dockerfile
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── .dockerignore
```
