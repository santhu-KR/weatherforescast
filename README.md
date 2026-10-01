# SkyCast Weather

A lightweight, responsive weather forecast website built with plain HTML, CSS, and JavaScript.

## Features

- Search weather by city
- Use browser geolocation
- Current temperature and weather condition
- Feels-like temperature
- Humidity, wind speed, precipitation, and UV index
- 7-day forecast
- Responsive layout for desktop and mobile
- No API key required

## Data source

This project uses the free [Open-Meteo](https://open-meteo.com/) weather and geocoding APIs.

## Run locally

No build tools are required.

1. Clone the repository.
2. Open `index.html` in a browser.

For the best local development experience, serve the directory with a small static server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

Because this is a static site, it can be deployed directly with GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static hosting provider.

### GitHub Pages

1. Open the repository's **Settings**.
2. Go to **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose `main` and `/(root)`.
5. Save.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Open-Meteo API
