123WatchMovies (static site)

Files:
- index.html
- styles.css
- app.js

Notes:
- Uses your Cloudflare Worker TMDB proxy:
  https://ancient-lab-55d7.thomasnz.workers.dev/3
- Player uses vidking embed.
- Trailer uses TMDB videos, opens a YouTube iframe modal.
- Watchlist supports add and remove, it is saved to localStorage.
- Mobile: hamburger menu drawer, plus fixed modal scrolling fixes.
