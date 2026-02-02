// CONFIG
const API_BASE = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const EMBED_BASE = "https://www.vidking.net/embed";

// STATE
let currentSelected = null;
let currentType = "home";
let currentSearchResults = [];
let continueWatching = [];
let watchlist = [];

// ELEMENTS
const heroBg = document.getElementById("heroBg");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const heroOverview = document.getElementById("heroOverview");
const heroPlay = document.getElementById("heroPlay");
const heroTrailer = document.getElementById("heroTrailer");

const trendingMoviesEl = document.getElementById("trendingMovies");
const trendingTvEl = document.getElementById("trendingTv");
const topRatedEl = document.getElementById("topRated");

const continueWatchingEl = document.getElementById("continueWatching");
const watchlistEl = document.getElementById("watchlist");

const searchSection = document.getElementById("searchSection");
const searchGrid = document.getElementById("searchGrid");
const searchEmpty = document.getElementById("searchEmpty");
const searchTitle = document.getElementById("searchTitle");
const searchCount = document.getElementById("searchCount");
const searchInput = document.getElementById("searchInput");

// INFO MODAL
const infoModalBackdrop = document.getElementById("infoModalBackdrop");
const infoPoster = document.getElementById("infoPoster");
const infoTitle = document.getElementById("infoTitle");
const infoMeta = document.getElementById("infoMeta");
const infoChips = document.getElementById("infoChips");
const infoOverview = document.getElementById("infoOverview");
const infoRuntime = document.getElementById("infoRuntime");
const infoClose = document.getElementById("infoClose");
const openPlayer = document.getElementById("openPlayer");
const openTrailer = document.getElementById("openTrailer");
const addWatchlistBtn = document.getElementById("addWatchlist");
const seasonBox = document.getElementById("seasonBox");
const seasonSelect = document.getElementById("seasonSelect");
const episodeList = document.getElementById("episodeList");

// PLAYER MODAL
const playerModalBackdrop = document.getElementById("playerModalBackdrop");
const playerFrame = document.getElementById("playerFrame");
const playerClose = document.getElementById("playerClose");

// TRAILER MODAL
const trailerModalBackdrop = document.getElementById("trailerModalBackdrop");
const trailerFrame = document.getElementById("trailerFrame");
const trailerClose = document.getElementById("trailerClose");

// STORAGE HELPERS
function loadLocalState() {
  try {
    continueWatching = JSON.parse(localStorage.getItem("continueWatching") || "[]");
    watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
  } catch {
    continueWatching = [];
    watchlist = [];
  }
}

function saveLocalState() {
  localStorage.setItem("continueWatching", JSON.stringify(continueWatching));
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

function addToContinueWatching(entry) {
  const key = `${entry.type}-${entry.id}-${entry.season || 0}-${entry.episode || 0}`;
  const existingIndex = continueWatching.findIndex((e) => e.key === key);
  if (existingIndex !== -1) continueWatching.splice(existingIndex, 1);

  continueWatching.unshift({ ...entry, key });
  continueWatching = continueWatching.slice(0, 20);
  saveLocalState();
  renderContinueWatching();
}

function isInWatchlist(type, id) {
  const key = `${type}-${id}`;
  return watchlist.some((e) => e.key === key);
}

function addToWatchlist(entry) {
  const key = `${entry.type}-${entry.id}`;
  if (!watchlist.some((e) => e.key === key)) {
    watchlist.unshift({ ...entry, key });
    watchlist = watchlist.slice(0, 50);
    saveLocalState();
    renderWatchlist();
  }
}

function removeFromWatchlist(type, id) {
  const key = `${type}-${id}`;
  watchlist = watchlist.filter((e) => e.key !== key);
  saveLocalState();
  renderWatchlist();
}

// API HELPERS
async function fetchJson(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

// HERO
async function loadHero() {
  const endpoints = [
    "/trending/movie/week",
    "/trending/tv/week",
    "/movie/now_playing",
    "/movie/popular",
    "/tv/popular",
    "/movie/top_rated",
    "/tv/top_rated"
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const data = await fetchJson(randomEndpoint);
  const items = data.results || [];
  if (!items.length) return;

  const item = items[Math.floor(Math.random() * items.length)];
  const type = item.title ? "movie" : "tv";

  heroBg.style.backgroundImage = item.backdrop_path
    ? `url(${IMAGE_BASE + item.backdrop_path})`
    : "none";

  const title = type === "movie" ? item.title : item.name;
  const year = (type === "movie" ? item.release_date : item.first_air_date)?.slice(0, 4) || "";
  const rating = item.vote_average?.toFixed(1) || "-";

  heroTitle.textContent = title;
  heroMeta.textContent = `${year} • ★ ${rating}`;
  heroOverview.textContent = item.overview || "";

  heroPlay.onclick = () => openInfoModal(item, type);
  heroTrailer.onclick = () => openTrailerModalFromTmdb(item.id, type);
}

// TMDB CAROUSELS
function renderCarousel(container, items, type) {
  if (!container) return;
  container.innerHTML = "";

  (items || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = type === "movie" ? item.title : item.name;
    const poster = item.poster_path ? POSTER_BASE + item.poster_path : "";

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${poster}" alt="${title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
      </div>
    `;

    card.onclick = () => openInfoModal(item, type);
    container.appendChild(card);
  });
}

async function loadCarousels() {
  const [trendingMovies, trendingTv, topRated] = await Promise.all([
    fetchJson("/trending/movie/week"),
    fetchJson("/trending/tv/week"),
    fetchJson("/movie/top_rated?page=1"),
  ]);

  renderCarousel(trendingMoviesEl, trendingMovies.results, "movie");
  renderCarousel(trendingTvEl, trendingTv.results, "tv");
  renderCarousel(topRatedEl, topRated.results, "movie");
}

// CONTINUE WATCHING + WATCHLIST
function renderContinueWatching() {
  continueWatchingEl.innerHTML = "";

  continueWatching.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = item.title || "Untitled";
    const poster = item.poster || "";

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${poster}" alt="${title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
      </div>
    `;

    card.onclick = () => {
      if (item.type === "movie") {
        openPlayerModal(`${EMBED_BASE}/movie/${item.id}`);
      } else {
        openPlayerModal(`${EMBED_BASE}/tv/${item.id}/${item.season}/${item.episode}?nextEpisode=true`);
      }
    };

    continueWatchingEl.appendChild(card);
  });
}

function renderWatchlist() {
  watchlistEl.innerHTML = "";

  watchlist.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = item.title || "Untitled";
    const poster = item.poster || "";

    card.innerHTML = `
      <button class="card-remove" title="Remove">✕</button>
      <div class="card-img-wrap">
        <img class="card-img" src="${poster}" alt="${title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
      </div>
    `;

    // Quick remove button
    const removeBtn = card.querySelector(".card-remove");
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeFromWatchlist(item.type, item.id);
    };

    card.onclick = () => openInfoModal({ id: item.id }, item.type);

    watchlistEl.appendChild(card);
  });
}

// SEARCH
async function searchAll(query) {
  if (!query.trim()) {
    searchSection.style.display = "none";

    document.querySelectorAll("main > .row").forEach((row) => {
      if (row.id !== "searchSection") row.style.display = "block";
    });

    return;
  }

  document.querySelectorAll("main > .row").forEach((row) => {
    if (row.id !== "searchSection") row.style.display = "none";
  });

  const [movies, tv] = await Promise.all([
    fetchJson(`/search/movie?query=${encodeURIComponent(query)}`),
    fetchJson(`/search/tv?query=${encodeURIComponent(query)}`),
  ]);

  let results = [];

  if (currentType === "movie") {
    results = (movies.results || []).map((r) => ({ ...r, media_type: "movie" }));
  } else if (currentType === "tv") {
    results = (tv.results || []).map((r) => ({ ...r, media_type: "tv" }));
  } else {
    results = [
      ...(movies.results || []).map((r) => ({ ...r, media_type: "movie" })),
      ...(tv.results || []).map((r) => ({ ...r, media_type: "tv" })),
    ];
  }

  currentSearchResults = results;
  renderSearchResults(query);
}

function renderSearchResults(query) {
  searchSection.style.display = "block";
  searchGrid.innerHTML = "";

  if (!currentSearchResults.length) {
    searchEmpty.style.display = "block";
    searchTitle.textContent = `No results for "${query}"`;
    searchCount.textContent = "0 results";
    return;
  }

  searchEmpty.style.display = "none";
  searchTitle.textContent = `Results for "${query}"`;
  searchCount.textContent = `${currentSearchResults.length} titles`;

  currentSearchResults.forEach((item) => {
    const type = item.media_type;
    const title = type === "movie" ? item.title : item.name;
    const poster = item.poster_path ? POSTER_BASE + item.poster_path : "";

    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${poster}" alt="${title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
      </div>
    `;

    card.onclick = () => openInfoModal(item, type);
    searchGrid.appendChild(card);
  });
}

// TRAILERS (TMDB -> YouTube)
async function getTrailerKeyFromTmdb(id, type) {
  const data = await fetchJson(`/${type}/${id}/videos`);
  const list = data.results || [];

  const youtube = list.filter((v) => v.site === "YouTube" && v.key);
  if (!youtube.length) return null;

  const trailer =
    youtube.find((v) => (v.type || "").toLowerCase() === "trailer") ||
    youtube.find((v) => (v.name || "").toLowerCase().includes("trailer")) ||
    youtube[0];

  return trailer?.key || null;
}

async function openTrailerModalFromTmdb(id, type) {
  try {
    const key = await getTrailerKeyFromTmdb(id, type);
    if (!key) {
      alert("No trailer available.");
      return;
    }

    trailerModalBackdrop.classList.add("open");
    setTimeout(() => {
      trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1&mute=0&controls=1`;
    }, 60);
  } catch (e) {
    console.error(e);
    alert("No trailer available.");
  }
}

function closeTrailerModal() {
  trailerModalBackdrop.classList.remove("open");
  trailerFrame.src = "";
}

trailerClose.onclick = closeTrailerModal;
trailerModalBackdrop.addEventListener("click", (e) => {
  if (e.target === trailerModalBackdrop) closeTrailerModal();
});

// INFO MODAL
async function openInfoModal(item, type) {
  const id = item.id;
  currentSelected = { ...item, media_type: type };

  const details = await fetchJson(`/${type}/${id}`);

  const title = type === "movie" ? details.title : details.name;
  const year = (type === "movie" ? details.release_date : details.first_air_date)?.slice(0, 4) || "";
  const rating = details.vote_average ? details.vote_average.toFixed(1) : "-";

  infoTitle.textContent = title;
  infoMeta.textContent = `${type === "movie" ? "Movie" : "TV Show"} • ${year}`;
  infoOverview.textContent = details.overview || "No overview available.";

  if (type === "movie" && details.runtime) {
    infoRuntime.textContent = `Runtime: ${details.runtime} min`;
  } else if (type === "tv" && details.episode_run_time?.length) {
    infoRuntime.textContent = `Episode runtime: ${details.episode_run_time[0]} min`;
  } else {
    infoRuntime.textContent = "";
  }

  infoPoster.src = details.poster_path ? POSTER_BASE + details.poster_path : "";

  infoChips.innerHTML = "";
  const chips = [];
  if (rating !== "-") chips.push(`★ ${rating} / 10`);
  if (details.original_language) chips.push(details.original_language.toUpperCase());
  if (details.vote_count) chips.push(`${details.vote_count} votes`);

  chips.forEach((c) => {
    const span = document.createElement("span");
    span.className = "info-chip";
    span.textContent = c;
    infoChips.appendChild(span);
  });

  if (type === "tv") {
    seasonBox.style.display = "block";
    await loadSeasons(id);
  } else {
    seasonBox.style.display = "none";
  }

  infoModalBackdrop.classList.add("open");

  const poster = details.poster_path ? POSTER_BASE + details.poster_path : "";

  openPlayer.onclick = () => {
    if (type === "movie") {
      const url = `${EMBED_BASE}/movie/${id}`;
      addToContinueWatching({ id, type: "movie", title, poster });
      openPlayerModal(url);
    } else {
      const season = seasonSelect.value || 1;
      const episode = 1;
      const url = `${EMBED_BASE}/tv/${id}/${season}/${episode}?nextEpisode=true`;
      addToContinueWatching({ id, type: "tv", season, episode, title, poster });
      openPlayerModal(url);
    }
  };

  openTrailer.onclick = () => openTrailerModalFromTmdb(id, type);

  // WATCHLIST TOGGLE
  const inList = isInWatchlist(type, id);
  addWatchlistBtn.textContent = inList ? "Remove from Watchlist" : "Add to Watchlist";

  addWatchlistBtn.onclick = () => {
    if (isInWatchlist(type, id)) {
      removeFromWatchlist(type, id);
      addWatchlistBtn.textContent = "Add to Watchlist";
    } else {
      addToWatchlist({ id, type, title, poster });
      addWatchlistBtn.textContent = "Remove from Watchlist";
    }
  };
}

// PLAYER MODAL
function openPlayerModal(url) {
  playerModalBackdrop.classList.add("open");
  setTimeout(() => {
    playerFrame.src = url;
  }, 60);
}

function closePlayerModal() {
  playerModalBackdrop.classList.remove("open");
  playerFrame.src = "";
}

infoClose.onclick = () => {
  infoModalBackdrop.classList.remove("open");
};

playerClose.onclick = closePlayerModal;
playerModalBackdrop.addEventListener("click", (e) => {
  if (e.target === playerModalBackdrop) closePlayerModal();
});

// SEASONS + EPISODES
async function loadSeasons(id) {
  const data = await fetchJson(`/tv/${id}`);
  seasonSelect.innerHTML = "";

  (data.seasons || []).forEach((s) => {
    if (s.season_number === 0) return;
    const opt = document.createElement("option");
    opt.value = s.season_number;
    opt.textContent = `Season ${s.season_number}`;
    seasonSelect.appendChild(opt);
  });

  loadEpisodes(id, seasonSelect.value);
  seasonSelect.onchange = () => loadEpisodes(id, seasonSelect.value);
}

async function loadEpisodes(id, season) {
  const data = await fetchJson(`/tv/${id}/season/${season}`);
  episodeList.innerHTML = "";

  (data.episodes || []).forEach((ep) => {
    const div = document.createElement("div");
    div.className = "episode-item";
    div.textContent = `E${ep.episode_number} ${ep.name}`;

    div.onclick = () => {
      const url = `${EMBED_BASE}/tv/${id}/${season}/${ep.episode_number}?nextEpisode=true`;
      const poster = data.poster_path ? POSTER_BASE + data.poster_path : "";

      addToContinueWatching({
        id,
        type: "tv",
        season,
        episode: ep.episode_number,
        title: ep.name,
        poster
      });

      openPlayerModal(url);
    };

    episodeList.appendChild(div);
  });
}

// SEARCH INPUT LISTENER
let searchTimeout = null;
searchInput.addEventListener("input", (e) => {
  const value = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchAll(value), 350);
});

// NAV TABS
document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.getAttribute("data-type");

    if (!searchInput.value.trim()) {
      searchSection.style.display = "none";
      document.querySelectorAll("main > .row").forEach((row) => {
        if (row.id !== "searchSection") row.style.display = "block";
      });
    } else {
      searchAll(searchInput.value);
    }
  });
});

// PLAYER PROGRESS EVENTS
window.addEventListener("message", function (event) {
  try {
    const data = JSON.parse(event.data);

    if (data.type === "PLAYER_EVENT") {
      const ev = data.data;

      addToContinueWatching({
        id: ev.id,
        type: ev.mediaType,
        season: ev.season,
        episode: ev.episode,
        progress: ev.progress,
        timestamp: ev.currentTime
      });
    }
  } catch (e) {}
});

// INIT
(async function init() {
  try {
    loadLocalState();
    renderContinueWatching();
    renderWatchlist();

    await loadHero();
    await loadCarousels();
  } catch (e) {
    console.error(e);
  }
})();
