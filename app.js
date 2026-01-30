// CONFIG
const API = "https://ancient-lab-55d7.thomasnz.workers.dev/3";
const IMG = "https://image.tmdb.org/t/p/w342";
const EMBED = "https://www.vidking.net";
const BRAND = "e50914";

// STATE
let type = "movie";
let items = [];
let selected = null;

// ELEMENTS
const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalSub = document.getElementById("modalSub");
const modalOverview = document.getElementById("modalOverview");
const modalClose = document.getElementById("modalClose");
const playerFrame = document.getElementById("playerFrame");
const trailerFrame = document.getElementById("trailerFrame");
const seasonBox = document.getElementById("seasonBox");
const seasonSelect = document.getElementById("seasonSelect");
const episodeList = document.getElementById("episodeList");

// FETCH HELPER
async function api(path) {
  const res = await fetch(API + path);
  return res.json();
}

// LOAD POPULAR
async function loadPopular() {
  const data = await api(`/${type}/popular`);
  items = data.results;
  renderGrid();
}

// SEARCH
async function search(q) {
  if (!q.trim()) return loadPopular();
  const data = await api(`/search/${type}?query=${encodeURIComponent(q)}`);
  items = data.results;
  renderGrid();
}

// RENDER GRID
function renderGrid() {
  grid.innerHTML = "";
  if (!items.length) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => openModal(item);

    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" src="${IMG + item.poster_path}" />
      </div>
      <div class="card-body">
        <div class="card-title">${item.title || item.name}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// OPEN MODAL
async function openModal(item) {
  selected = item;
  modalTitle.textContent = item.title || item.name;
  modalSub.textContent = type === "movie" ? "Movie" : "TV Show";
  modalOverview.textContent = item.overview;

  // Load trailer
  loadTrailer(item.id);

  // Load player
  if (type === "movie") {
    playerFrame.src = `${EMBED}/embed/movie/${item.id}?color=${BRAND}&autoPlay=true`;
    seasonBox.style.display = "none";
  } else {
    playerFrame.src = `${EMBED}/embed/tv/${item.id}/1/1?color=${BRAND}&autoPlay=true`;
    loadSeasons(item.id);
  }

  modalBackdrop.classList.add("open");
}

// LOAD TRAILER
async function loadTrailer(id) {
  const data = await api(`/${type}/${id}/videos`);
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");

  if (trailer) {
    trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}`;
  } else {
    trailerFrame.src = "";
  }
}

// LOAD SEASONS
async function loadSeasons(id) {
  const data = await api(`/tv/${id}`);
  seasonBox.style.display = "block";

  seasonSelect.innerHTML = "";
  data.seasons.forEach(s => {
    if (s.season_number === 0) return;
    const opt = document.createElement("option");
    opt.value = s.season_number;
    opt.textContent = `Season ${s.season_number}`;
    seasonSelect.appendChild(opt);
  });

  loadEpisodes(id, seasonSelect.value);

  seasonSelect.onchange = () => loadEpisodes(id, seasonSelect.value);
}

// LOAD EPISODES
async function loadEpisodes(id, season) {
  const data = await api(`/tv/${id}/season/${season}`);
  episodeList.innerHTML = "";

  data.episodes.forEach(ep => {
    const div = document.createElement("div");
    div.className = "episode-item";
    div.textContent = `E${ep.episode_number} — ${ep.name}`;
    div.onclick = () => {
      playerFrame.src = `${EMBED}/embed/tv/${id}/${season}/${ep.episode_number}?color=${BRAND}&autoPlay=true`;
    };
    episodeList.appendChild(div);
  });
}

// CLOSE MODAL
modalClose.onclick = () => {
  modalBackdrop.classList.remove("open");
  playerFrame.src = "";
  trailerFrame.src = "";
};

// SEARCH INPUT
searchInput.oninput = e => {
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(() => search(e.target.value), 300);
};

// TAB SWITCH
document.querySelectorAll(".nav-tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    type = btn.dataset.type;
    searchInput.value = "";
    loadPopular();
  };
});

// INIT
loadPopular();