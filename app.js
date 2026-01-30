// CONFIG
const API_BASE = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const EMBED_BASE = "https://www.vidking.net";
const BRAND_COLOR = "e50914";

// STATE
let currentSelected = null;
let currentType = "home";
let currentSearchResults = [];

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
const seasonBox = document.getElementById("seasonBox");
const seasonSelect = document.getElementById("seasonSelect");
const episodeList = document.getElementById("episodeList");

// PLAYER MODAL
const playerModalBackdrop = document.getElementById("playerModalBackdrop");
const playerFrame = document.getElementById("playerFrame");
const playerClose = document.getElementById("playerClose");

// API helper
async function fetchJson(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

// RANDOM HERO (from many endpoints)
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
  const rating = item.vote_average?.toFixed(1) || "–";

  heroTitle.textContent = title;
  heroMeta.textContent = `${year} • ★ ${rating}`;
  heroOverview.textContent = item.overview || "";

  heroPlay.onclick = () => openInfoModal(item, type);
  heroTrailer.onclick = () => openInfoModal(item, type);
}

// CAROUSEL RENDER
function renderCarousel(container, items, type) {
  container.innerHTML = "";
  items.forEach((item) => {
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

// LOAD CAROUSELS
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

// SEARCH
async function searchAll(query) {
  if (!query.trim()) {
    searchSection.style.display = "none";
    return;
  }

  const [movies, tv] = await Promise.all([
    fetchJson(`/search/movie?query=${encodeURIComponent(query)}`),
    fetchJson(`/search/tv?query=${encodeURIComponent(query)}`),
  ]);

  let results = [];

  if (currentType === "movie") {
    results = movies.results.map((r) => ({ ...r, media_type: "movie" }));
  } else if (currentType === "tv") {
    results = tv.results.map((r) => ({ ...r, media_type: "tv" }));
  } else {
    results = [
      ...movies.results.map((r) => ({ ...r, media_type: "movie" })),
      ...tv.results.map((r) => ({ ...r, media_type: "tv" })),
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

// INFO MODAL (FIRST POPUP)
async function openInfoModal(item, type) {
  currentSelected = { ...item, media_type: type };
  const id = item.id;

  const details = await fetchJson(`/${type}/${id}`);

  const title = type === "movie" ? details.title : details.name;
  const year = (type === "movie" ? details.release_date : details.first_air_date)?.slice(0, 4) || "";
  const rating = details.vote_average ? details.vote_average.toFixed(1) : "–";

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
  if (rating !== "–") chips.push(`★ ${rating} / 10`);
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

  // PLAY BUTTON → VidKing full player
  openPlayer.onclick = () => {
    const url =
      type === "movie"
        ? buildMovieEmbed(id)
        : buildTvEmbed(id, seasonSelect.value || 1, 1);

    openPlayerModal(url);
  };

  // TRAILER BUTTON → VidSrc.to trailer only
  openTrailer.onclick = () => {
    const url = `https://vidsrc.to/embed/trailer/${id}`;
    openPlayerModal(url);
  };
}

// VIDKING EMBEDS
function buildMovieEmbed(id) {
  const params = new URLSearchParams();
  params.set("color", BRAND_COLOR);
  params.set("autoPlay", "true");
  return `${EMBED_BASE}/embed/movie/${id}?${params.toString()}`;
}

function buildTvEmbed(id, season, episode) {
  const params = new URLSearchParams();
  params.set("color", BRAND_COLOR);
  params.set("nextEpisode", "true");
  params.set("episodeSelector", "true");
  params.set("autoPlay", "true");
  return `${EMBED_BASE}/embed/tv/${id}/${season}/${episode}?${params.toString()}`;
}

// PLAYER MODAL
function openPlayerModal(url) {
  playerModalBackdrop.classList.add("open");
  setTimeout(() => {
    playerFrame.src = url;
  }, 60);
}

infoClose.onclick = () => {
  infoModalBackdrop.classList.remove("open");
};

playerClose.onclick = () => {
  playerModalBackdrop.classList.remove("open");
  playerFrame.src = "";
};

playerModalBackdrop.addEventListener("click", (e) => {
  if (e.target === playerModalBackdrop) {
    playerModalBackdrop.classList.remove("open");
    playerFrame.src = "";
  }
});

// SEASONS + EPISODES
async function loadSeasons(id) {
  const data = await fetchJson(`/tv/${id}`);
  seasonSelect.innerHTML = "";

  data.seasons.forEach((s) => {
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

  data.episodes?.forEach((ep) => {
    const div = document.createElement("div");
    div.className = "episode-item";
    div.textContent = `E${ep.episode_number} — ${ep.name}`;

    div.onclick = () => {
      const url = buildTvEmbed(id, season, ep.episode_number);
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
    } else {
      searchAll(searchInput.value);
    }
  });
});

// INIT
(async function init() {
  try {
    await loadHero();       // Random hero
    await loadCarousels();  // Trending + Top Rated
  } catch (e) {
    console.error(e);
  }
})();