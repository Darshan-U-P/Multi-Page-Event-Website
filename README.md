# EventSphere — Multi-Page Event Website

A responsive event-discovery website built with **HTML5, CSS3, Apache httpd, and Docker Compose**. This project demonstrates how a multi-page static site can be served from a Docker container and edited live through a bind mount.

> **Project note:** Event listings, dates, venues, and schedules are sample demonstration content. The site does not provide real registrations, tickets, payments, or event management.

## Pages

- **Home** — introduction, featured event, benefits, and upcoming event cards.
- **Events** — sample events across technology, workshops, and startups.
- **Event details** — featured event overview and illustrative schedule.
- **About** — project purpose, features, and technology stack.
- **Contact** — repository link and explanation of the static demo's limitations.

## Prerequisites

- Windows 10/11, macOS, or Linux
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows/macOS, or Docker Engine with the Compose plugin on Linux
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

On Windows, start Docker Desktop and wait until its engine is running before using the commands below.

## Run locally with Docker

1. Clone this repository and open the project folder:

   ```powershell
   git clone https://github.com/Darshan-U-P/Multi-Page-Event-Website.git
   cd Multi-Page-Event-Website
   ```

2. Start the site:

   ```powershell
   docker compose up --build -d
   ```

3. Open **http://localhost:8080** in your browser.

4. To stop the container:

   ```powershell
   docker compose down
   ```

## Live editing

The Compose configuration bind-mounts the project directory into Apache's document root as read-only from the container's perspective. This means you can edit files on your computer while Apache serves the updated files immediately.

1. Open the project folder in VS Code.
2. Edit any HTML file or `css/style.css` and save it.
3. Refresh the browser at http://localhost:8080 (use `Ctrl + F5` for a hard refresh if cached CSS remains).

**You do not need to rebuild or restart the container for normal HTML/CSS edits.** The `:ro` mount protects the host files from being changed by the container; your editor can still update those files on the host.

## Project structure

```text
Multi-Page-Event-Website/
├── index.html
├── events.html
├── event-details.html
├── about.html
├── contact.html
├── css/
│   └── style.css
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Useful Docker commands

Check the running container:

```powershell
docker compose ps
```

View Apache/container logs:

```powershell
docker compose logs -f website
```

Rebuild only when changing the Dockerfile or container build configuration:

```powershell
docker compose up --build -d
```

## Technology overview

- **HTML5** provides the multi-page structure and content.
- **CSS3** provides layout, responsive design, and visual styling.
- **Apache httpd 2.4** serves the static website.
- **Docker** packages the web server environment.
- **Docker Compose** configures the port mapping and live-edit bind mount.

## License

This is an educational mini project. Add a license file if you intend to distribute or reuse the project under specific terms.
