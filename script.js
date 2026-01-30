// ===== CONFIG =====

const TMDB_BASE = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const RIVE_BASE = "https://rivestream.org";

const SOURCES = [
  { kind: "embed",   path: "embed" },
  { kind: "agg",     path: "embed/agg" },
  { kind: "torrent", path: "embed/torrent" }
];

// ===== UTIL =====

async function tmdbFetch(path, params = {}) {
  const url = new URL(TMDB_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

function createCard(item, type) {
  const card = document.createElement("div");
  card.className = "card";
  card.onclick = () => {
    const url = new URL("details.html", window.location.href);
    url.searchParams.set("id", item.id);
    url.searchParams.set("type", type);
    window.location.href = url.toString();
  };

  const img = document.createElement("img");
  img.src = item.poster_path ? TMDB_IMG + item.poster_path : "";
  img.alt = item.title || item.name || "Poster";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.name || "Untitled";

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  meta.textContent = `${year || "N/A"} • ⭐ ${item.vote_average ? item.vote_average.toFixed(1) : "N/A"}`;

  body.appendChild(title);
  body.appendChild(meta);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

// ===== PLAYER =====

const playerModal = document.getElementById("playerModal");
const playerFrame = document.getElementById("playerFrame");
const playerBackdrop = document.getElementById("playerBackdrop");
const playerClose = document.getElementById("playerClose");

let currentTmdbId = null;
let currentType = "movie";
let currentSeason = 1;
let currentEpisode = 1;

function buildStreamUrl(kind, type, tmdbId, season = 1, episode = 1) {
  const source = SOURCES.find(s => s.kind === kind) || SOURCES[0];
  const base = `${RIVE_BASE}/${source.path}`;
  const tvParams = type === "tv" ? `&season=${season}&episode=${episode}` : "";
  return `${base}?type=${type}&id=${tmdbId}${tvParams}`;
}

function buildDownloadUrl(type, tmdbId, season = 1, episode = 1) {
  const tvParams = type === "tv" ? `&season=${season}&episode=${episode}` : "";
  return `${RIVE_BASE}/download?type=${type}&id=${tmdbId}${tvParams}`;
}

function openPlayerModal() {
  if (!playerModal) return;
  playerModal.classList.add("active");
}

function closePlayerModal() {
  if (!playerModal) return;
  playerModal.classList.remove("active");
  if (playerFrame) playerFrame.src = "";
}

if (playerBackdrop) playerBackdrop.addEventListener("click", closePlayerModal);
if (playerClose) playerClose.addEventListener("click", closePlayerModal);

function openPlayer(tmdbId, type, season = 1, episode = 1) {
  if (!playerFrame) return;

  currentTmdbId = tmdbId;
  currentType = type;
  currentSeason = season;
  currentEpisode = episode;

  let index = 0;

  function tryNextSource() {
    if (index >= SOURCES.length) {
      playerFrame.src = "";
      alert("All streaming sources are currently unavailable. Please try again later.");
      return;
    }

    const current = SOURCES[index];
    playerFrame.src = buildStreamUrl(current.kind, type, tmdbId, season, episode);

    const timeout = setTimeout(() => {
      index++;
      tryNextSource();
    }, 8000);

    playerFrame.onload = () => {
      clearTimeout(timeout);
    };
  }

  const downloadButton = document.getElementById("downloadButton");
  if (downloadButton) {
    const downloadUrl = buildDownloadUrl(type, tmdbId, season, episode);
    downloadButton.style.display = "inline-block";
    downloadButton.onclick = () => window.open(downloadUrl, "_blank");
  }

  tryNextSource();
  openPlayerModal();
}

// ===== PAGE INIT: HOME =====

async function initHomePage() {
  try {
    const movies = await tmdbFetch("/trending/movie/week");
    const tv = await tmdbFetch("/trending/tv/week");

    const moviesContainer = document.getElementById("trendingMovies");
    const tvContainer = document.getElementById("trendingTv");

    if (moviesContainer && movies.results) {
      movies.results.forEach(m => moviesContainer.appendChild(createCard(m, "movie")));
    }

    if (tvContainer && tv.results) {
      tv.results.forEach(t => tvContainer.appendChild(createCard(t, "tv")));
    }
  } catch (e) {
    console.error(e);
  }
}

// ===== PAGE INIT: MOVIES =====

async function initMoviesPage() {
  const grid = document.getElementById("moviesGrid");
  const input = document.getElementById("movieSearchInput");
  const button = document.getElementById("movieSearchButton");

  async function loadPopular() {
    try {
      const data = await tmdbFetch("/movie/popular");
      grid.innerHTML = "";
      data.results.forEach(m => grid.appendChild(createCard(m, "movie")));
    } catch (e) {
      console.error(e);
    }
  }

  async function search() {
    const q = input.value.trim();
    if (!q) return loadPopular();
    try {
      const data = await tmdbFetch("/search/movie", { query: q });
      grid.innerHTML = "";
      data.results.forEach(m => grid.appendChild(createCard(m, "movie")));
    } catch (e) {
      console.error(e);
    }
  }

  if (button) button.addEventListener("click", search);
  if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") search(); });

  loadPopular();
}

// ===== PAGE INIT: TV =====

async function initTvPage() {
  const grid = document.getElementById("tvGrid");
  const input = document.getElementById("tvSearchInput");
  const button = document.getElementById("tvSearchButton");

  async function loadPopular() {
    try {
      const data = await tmdbFetch("/tv/popular");
      grid.innerHTML = "";
      data.results.forEach(t => grid.appendChild(createCard(t, "tv")));
    } catch (e) {
      console.error(e);
    }
  }

  async function search() {
    const q = input.value.trim();
    if (!q) return loadPopular();
    try {
      const data = await tmdbFetch("/search/tv", { query: q });
      grid.innerHTML = "";
      data.results.forEach(t => grid.appendChild(createCard(t, "tv")));
    } catch (e) {
      console.error(e);
    }
  }

  if (button) button.addEventListener("click", search);
  if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") search(); });

  loadPopular();
}

// ===== PAGE INIT: DETAILS =====

async function initDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type") || "movie";

  if (!id) {
    const t = document.getElementById("detailsTitle");
    if (t) t.textContent = "Not found";
    return;
  }

  currentTmdbId = id;
  currentType = type;

  const playButton = document.getElementById("playButton");
  if (playButton) {
    playButton.addEventListener("click", () => {
      openPlayer(currentTmdbId, currentType, currentSeason, currentEpisode);
    });
  }

  try {
    const data = await tmdbFetch(`/${type}/${id}`, { append_to_response: "credits" });

    const poster = document.getElementById("detailsPoster");
    const title = document.getElementById("detailsTitle");
    const overview = document.getElementById("detailsOverview");
    const year = document.getElementById("detailsYear");
    const runtime = document.getElementById("detailsRuntime");
    const rating = document.getElementById("detailsRating");
    const typeTag = document.getElementById("detailsType");

    if (poster) poster.src = data.poster_path ? TMDB_IMG + data.poster_path : "";
    if (title) title.textContent = data.title || data.name || "Untitled";
    if (overview) overview.textContent = data.overview || "No overview available.";
    if (year) year.textContent = (data.release_date || data.first_air_date || "").slice(0, 4) || "N/A";
    if (runtime) {
      if (type === "movie") {
        runtime.textContent = data.runtime ? `${data.runtime} min` : "Runtime N/A";
      } else {
        runtime.textContent = data.number_of_episodes ? `${data.number_of_episodes} episodes` : "Episodes N/A";
      }
    }
    if (rating) rating.textContent = data.vote_average ? `⭐ ${data.vote_average.toFixed(1)}` : "⭐ N/A";
    if (typeTag) typeTag.textContent = type === "movie" ? "Movie" : "TV Show";

    if (type === "tv") {
      const episodesSection = document.getElementById("episodesSection");
      const episodesGrid = document.getElementById("episodesGrid");
      if (episodesSection && episodesGrid) {
        episodesSection.style.display = "block";
        episodesGrid.innerHTML = "";

        const seasonNumber = 1;
        currentSeason = seasonNumber;

        const seasonData = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
        seasonData.episodes.forEach(ep => {
          const card = document.createElement("div");
          card.className = "episode-card";
          card.textContent = `${ep.episode_number}. ${ep.name}`;
          card.onclick = () => {
            currentEpisode = ep.episode_number;
            openPlayer(currentTmdbId, "tv", currentSeason, currentEpisode);
          };
          episodesGrid.appendChild(card);
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// expose init functions globally
window.initHomePage = initHomePage;
window.initMoviesPage = initMoviesPage;
window.initTvPage = initTvPage;
window.initDetailsPage = initDetailsPage;