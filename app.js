// CONFIG
const API_BASE = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const EMBED_BASE = "https://www.vidking.net";
const BRAND_COLOR = "e50914";

// STATE
let heroItem = null;
let currentType = "home"; 
let currentSearchResults = [];
let currentSelected = null;

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

const continueSection = document.getElementById("continueSection");
const continueCarousel = document.getElementById("continueCarousel");

const searchSection = document.getElementById("searchSection");
const searchGrid = document.getElementById("searchGrid");
const searchEmpty = document.getElementById("searchEmpty");
const searchTitle = document.getElementById("searchTitle");
const searchCount = document.getElementById("searchCount");
const searchInput = document.getElementById("searchInput");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalSub = document.getElementById("modalSub");
const modalChips = document.getElementById("modalChips");
const modalOverview = document.getElementById("modalOverview");
const modalRuntime = document.getElementById("modalRuntime");
const playerFrame = document.getElementById("playerFrame");
const modalClose = document.getElementById("modalClose");
const btnPlay = document.getElementById("btnPlay");
const btnTrailer = document.getElementById("btnTrailer");
const seasonBox = document.getElementById("seasonBox");
const seasonSelect = document.getElementById("seasonSelect");
const episodeList = document.getElementById("episodeList");
const trailerBox = document.getElementById("trailerBox");
const trailerFrame = document.getElementById("trailerFrame");

// API helper
async function fetchJson(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

// HERO
async function loadHero() {
  const data = await fetchJson("/movie/now_playing?page=1");
  const item = data.results?.[0];
  if (!item) return;

  heroItem = { ...item, media_type: "movie" };

  heroBg.style.backgroundImage = item.backdrop_path
    ? `url(${IMAGE_BASE + item.backdrop_path})`
    : "none";

  heroTitle.textContent = item.title;
  const year = item.release_date?.slice(0, 4) || "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "–";
  heroMeta.textContent = [year, `★ ${rating}`].filter(Boolean).join(" • ");
  heroOverview.textContent = item.overview || "";

  heroPlay.onclick = () => openModal(heroItem, "movie");
  heroTrailer.onclick = () => openModal(heroItem, "movie", { autoOpenTrailer: true });
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
        <img class="card-img" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    `;

    card.onclick = () => openModal(item, type);
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

  renderCarousel(trendingMoviesEl, trendingMovies.results || [], "movie");
  renderCarousel(trendingTvEl, trendingTv.results || [], "tv");
  renderCarousel(topRatedEl, topRated.results || [], "movie");
}

// SEARCH
async function searchAll(query) {
  if (!query.trim()) {
    searchSection.style.display = "none";
    return;
  }

  const [movies, tv] = await Promise.all([
    fetchJson(`/search/movie?query=${encodeURIComponent(query)}&include_adult=false`),
    fetchJson(`/search/tv?query=${encodeURIComponent(query)}&include_adult=false`),
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
        <img class="card-img" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    `;

    card.onclick = () => openModal(item, type);
    searchGrid.appendChild(card);
  });
}

// MODAL
async function openModal(item, type, options = {}) {
  currentSelected = { ...item, media_type: type };
  const id = item.id;

  const details = await fetchJson(`/${type}/${id}`);

  const title = type === "movie" ? details.title : details.name;
  const year = (type === "movie"
    ? details.release_date
    : details.first_air_date || ""
  )?.slice(0, 4) || "";
  const rating = details.vote_average ? details.vote_average.toFixed(1) : "–";

  modalTitle.textContent = title;
  modalSub.textContent = [type === "movie" ? "Movie" : "TV Show", year]
    .filter(Boolean)
    .join(" • ");
  modalOverview.textContent = details.overview || "No overview available.";

  if (type === "movie" && details.runtime) {
    modalRuntime.textContent = `Runtime: ${details.runtime} min`;
  } else if (type === "tv" && details.episode_run_time?.length) {
    modalRuntime.textContent = `Episode runtime: ${details.episode_run_time[0]} min`;
  } else {
    modalRuntime.textContent = "";
  }

  modalChips.innerHTML = "";
  const chips = [];
  if (rating !== "–") chips.push(`★ ${rating} / 10`);
  if (details.original_language)
    chips.push(details.original_language.toUpperCase());
  if (details.vote_count) chips.push(`${details.vote_count} votes`);

  chips.forEach((c) => {
    const span = document.createElement("span");
    span.className = "modal-chip";
    span.textContent = c;
    modalChips.appendChild(span);
  });

  if (type === "movie") {
    playerFrame.src = buildMovieEmbed(id, { autoPlay: true });
    seasonBox.style.display = "none";
  } else {
    playerFrame.src = buildTvEmbed(id, 1, 1, { autoPlay: true });
    await loadSeasons(id);
  }

  btnPlay.onclick = () => {
    if (type === "movie") {
      playerFrame.src = buildMovieEmbed(id, { autoPlay: true });
    } else {
      const season = seasonSelect.value || 1;
      playerFrame.src = buildTvEmbed(id, season, 1, { autoPlay: true });
    }
  };

  btnTrailer.onclick = () => {
    loadTrailer(id, type);
    trailerBox.scrollIntoView({ behavior: "smooth" });
  };

  trailerFrame.src = "";
  trailerBox.style.display = "none";

  modalBackdrop.classList.add("open");

  if (options.autoOpenTrailer) {
    loadTrailer(id, type);
  }
}

function buildMovieEmbed(id, opts = {}) {
  const params = new URLSearchParams();
  params.set("color", BRAND_COLOR);
  if (opts.autoPlay) params.set("autoPlay", "true");
  return `${EMBED_BASE}/embed/movie/${id}?${params.toString()}`;
}

function buildTvEmbed(id, season, episode, opts = {}) {
  const params = new URLSearchParams();
  params.set("color", BRAND_COLOR);
  params.set("nextEpisode", "true");
  params.set("episodeSelector", "true");
  if (opts.autoPlay) params.set("autoPlay", "true");
  return `${EMBED_BASE}/embed/tv/${id}/${season}/${episode}?${params.toString()}`;
}

// Trailer
async function loadTrailer(id, type) {
  try {
    const data = await fetchJson(`/${type}/${id}/videos`);
    const trailer = data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    if (trailer) {
      trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}`;
      trailerBox.style.display = "block";
    } else {
      trailerFrame.src = "";
      trailerBox.style.display = "none";
    }
  } catch {
    trailerFrame.src = "";
    trailerBox.style.display = "none";
  }
}

// Seasons / episodes
async function loadSeasons(id) {
  const data = await fetchJson(`/tv/${id}`);
  if (!data.seasons?.length) {
    seasonBox.style.display = "none";
    return;
  }

  seasonBox.style.display = "block";
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
      playerFrame.src = buildTvEmbed(id, season, ep.episode_number, {
        autoPlay: true,
      });
      if (ep.runtime) {
        modalRuntime.textContent = `Episode runtime: ${ep.runtime} min`;
      }
    };

    episodeList.appendChild(div);
  });
}

// Close modal
function closeModal() {
  modalBackdrop.classList.remove("open");
  playerFrame.src = "";
  trailerFrame.src = "";
  currentSelected = null;
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
    closeModal();
  }
});

// Tabs
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

// Search input
let searchTimeout = null;
searchInput.addEventListener("input", (e) => {
  const value = e.target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchAll(value), 350);
});

// Continue Watching (Vidking postMessage)
window.addEventListener("message", (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data?.type === "PLAYER_EVENT") {
      const d = data.data;
      const key = `cw:${d.mediaType}:${d.id}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          id: d.id,
          mediaType: d.mediaType,
          progress: d.progress,
          currentTime: d.currentTime,
          duration: d.duration,
          season: d.season,
          episode: d.episode,
        })
      );
      renderContinueWatching();
    }
  } catch {}
});

async function renderContinueWatching() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("cw:"));
  if (!keys.length) {
    continueSection.style.display = "none";
    return;
  }

  continueSection.style.display = "block";
  continueCarousel.innerHTML = "";

  for (const key of keys) {
    const item = JSON.parse(localStorage.getItem(key));
    const type = item.mediaType;
    const id = item.id;

    const details = await fetchJson(`/${type}/${id}`);
    const title = type === "movie" ? details.title : details.name;
    const poster = details.poster_path ? POSTER_BASE + details.poster_path : "";

    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>
      </div>
    `;

    card.onclick = () => openModal(details, type);
    continueCarousel.appendChild(card);
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// INIT
(async function init() {
  try {
    await Promise.all([loadHero(), loadCarousels()]);
    renderContinueWatching();
  } catch (e) {
    console.error(e);
  }
})();