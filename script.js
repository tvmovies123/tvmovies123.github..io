/* ============================
   CONFIG
============================ */

const TMDB = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const IMG = "https://image.tmdb.org/t/p/original";
const IMG_W500 = "https://image.tmdb.org/t/p/w500";

const RIVE = "https://rivestream.org";

const STREAM_SOURCES = [
  { kind: "embed", path: "embed" },
  { kind: "agg", path: "embed/agg" },
  { kind: "torrent", path: "embed/torrent" }
];

/* ============================
   TMDB FETCH WRAPPER
============================ */

async function tmdb(path, params = {}) {
  const url = new URL(TMDB + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

/* ============================
   NAVBAR SCROLL EFFECT
============================ */

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  if (window.scrollY > 50) nav.classList.add("scrolled");
  else nav.classList.remove("scrolled");
});

/* ============================
   HERO SECTION (HA2)
   #1 trending movie OR TV
============================ */

async function loadHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  try {
    const trending = await tmdb("/trending/all/day");
    const item = trending.results[0];

    const backdrop = item.backdrop_path
      ? IMG + item.backdrop_path
      : "";

    hero.style.backgroundImage = `url('${backdrop}')`;

    document.querySelector(".hero-title").textContent =
      item.title || item.name;

    document.querySelector(".hero-overview").textContent =
      item.overview || "No overview available.";

    const playBtn = document.querySelector(".btn-play");
    playBtn.onclick = () => openPlayer(item.id, item.media_type);

    const infoBtn = document.querySelector(".btn-info");
    infoBtn.onclick = () => {
      window.location.href = `details.html?id=${item.id}&type=${item.media_type}`;
    };

  } catch (err) {
    console.error("Hero load failed:", err);
  }
}

/* ============================
   ROW BUILDER (Netflix style)
============================ */

async function buildRow(containerId, title, path) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const row = document.createElement("div");
  row.className = "row";

  const h = document.createElement("h2");
  h.className = "row-title";
  h.textContent = title;

  const cards = document.createElement("div");
  cards.className = "row-cards";

  row.appendChild(h);
  row.appendChild(cards);
  container.appendChild(row);

  try {
    const data = await tmdb(path);
    data.results.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.backgroundImage = `url('${IMG_W500 + item.poster_path}')`;

      card.onclick = () => {
        window.location.href = `details.html?id=${item.id}&type=${item.media_type || "movie"}`;
      };

      cards.appendChild(card);
    });
  } catch (err) {
    console.error("Row load failed:", err);
  }
}

/* ============================
   HOMEPAGE INIT
============================ */

async function initHome() {
  await loadHero();

  await buildRow("homeRows", "Trending Now", "/trending/all/day");
  await buildRow("homeRows", "Popular Movies", "/movie/popular");
  await buildRow("homeRows", "Popular TV Shows", "/tv/popular");
  await buildRow("homeRows", "Top Rated", "/movie/top_rated");
}

/* ============================
   MOVIES PAGE INIT
============================ */

async function initMovies() {
  await buildRow("moviesRows", "Popular Movies", "/movie/popular");
  await buildRow("moviesRows", "Top Rated Movies", "/movie/top_rated");
  await buildRow("moviesRows", "Now Playing", "/movie/now_playing");

  const input = document.getElementById("movieSearchInput");
  const btn = document.getElementById("movieSearchButton");
  const results = document.getElementById("movieSearchResults");

  async function search() {
    const q = input.value.trim();
    if (!q) return;

    results.innerHTML = "";
    const data = await tmdb("/search/movie", { query: q });

    data.results.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.backgroundImage = `url('${IMG_W500 + item.poster_path}')`;
      card.onclick = () => {
        window.location.href = `details.html?id=${item.id}&type=movie`;
      };
      results.appendChild(card);
    });
  }

  btn.onclick = search;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") search();
  });
}

/* ============================
   TV PAGE INIT
============================ */

async function initTV() {
  await buildRow("tvRows", "Popular TV Shows", "/tv/popular");
  await buildRow("tvRows", "Top Rated TV", "/tv/top_rated");
  await buildRow("tvRows", "Airing Today", "/tv/airing_today");

  const input = document.getElementById("tvSearchInput");
  const btn = document.getElementById("tvSearchButton");
  const results = document.getElementById("tvSearchResults");

  async function search() {
    const q = input.value.trim();
    if (!q) return;

    results.innerHTML = "";
    const data = await tmdb("/search/tv", { query: q });

    data.results.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.backgroundImage = `url('${IMG_W500 + item.poster_path}')`;
      card.onclick = () => {
        window.location.href = `details.html?id=${item.id}&type=tv`;
      };
      results.appendChild(card);
    });
  }

  btn.onclick = search;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") search();
  });
}

/* ============================
   DETAILS PAGE
============================ */

async function initDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type") || "movie";

  if (!id) return;

  try {
    const data = await tmdb(`/${type}/${id}`);

    const hero = document.querySelector(".details-hero");
    hero.style.backgroundImage = `url('${IMG + data.backdrop_path}')`;

    document.querySelector(".details-title").textContent =
      data.title || data.name;

    document.querySelector(".details-meta").textContent =
      `${(data.release_date || data.first_air_date || "").slice(0, 4)} • ⭐ ${data.vote_average.toFixed(1)}`;

    document.querySelector(".details-overview").textContent =
      data.overview || "No overview available.";

    document.querySelector(".btn-play").onclick = () =>
      openPlayer(id, type);

    document.querySelector(".btn-info").onclick = () =>
      window.open(`https://www.themoviedb.org/${type}/${id}`, "_blank");

    if (type === "tv") loadEpisodes(id);

  } catch (err) {
    console.error("Details load failed:", err);
  }
}

/* ============================
   EPISODES FOR TV
============================ */

async function loadEpisodes(id) {
  const container = document.getElementById("episodes");
  if (!container) return;

  try {
    const season = await tmdb(`/tv/${id}/season/1`);
    season.episodes.forEach(ep => {
      const div = document.createElement("div");
      div.className = "episode-card";
      div.textContent = `${ep.episode_number}. ${ep.name}`;
      div.onclick = () => openPlayer(id, "tv", 1, ep.episode_number);
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Episode load failed:", err);
  }
}

/* ============================
   PLAYER (Rive fallback)
============================ */

function buildStreamUrl(kind, type, id, season = 1, episode = 1) {
  const src = STREAM_SOURCES.find(s => s.kind === kind);
  const base = `${RIVE}/${src.path}`;
  const tv = type === "tv" ? `&season=${season}&episode=${episode}` : "";
  return `${base}?type=${type}&id=${id}${tv}`;
}

function buildDownloadUrl(type, id, season = 1, episode = 1) {
  const tv = type === "tv" ? `&season=${season}&episode=${episode}` : "";
  return `${RIVE}/download?type=${type}&id=${id}${tv}`;
}

function openPlayer(id, type, season = 1, episode = 1) {
  const modal = document.querySelector(".player-modal");
  const frame = document.getElementById("playerFrame");
  const closeBtn = document.querySelector(".player-close");

  let index = 0;

  function tryNext() {
    if (index >= STREAM_SOURCES.length) {
      frame.src = "";
      alert("All streaming sources failed.");
      return;
    }

    const src = STREAM_SOURCES[index];
    frame.src = buildStreamUrl(src.kind, type, id, season, episode);

    const timeout = setTimeout(() => {
      index++;
      tryNext();
    }, 8000);

    frame.onload = () => clearTimeout(timeout);
  }

  tryNext();

  modal.classList.add("active");

  closeBtn.onclick = () => {
    modal.classList.remove("active");
    frame.src = "";
  };
}

/* ============================
   PAGE ROUTER
============================ */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") initHome();
  if (page === "movies") initMovies();
  if (page === "tv") initTV();
  if (page === "details") initDetails();
});