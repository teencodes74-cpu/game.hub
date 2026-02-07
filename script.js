const state = {
  games: [],
  filtered: [],
  category: 'All',
  search: '',
  page: 1,
  pageSize: 24,
};

const searchInput = document.getElementById('searchInput');
const chips = document.getElementById('categoryChips');
const grid = document.getElementById('gameGrid');
const resultCount = document.getElementById('resultCount');
const cardTemplate = document.getElementById('gameCardTemplate');
const loadMoreBtn = document.getElementById('loadMoreBtn');

init();

async function init() {
  const response = await fetch('./games.json', { cache: 'no-store' });
  const { games } = await response.json();
  state.games = games;

  const categories = ['All', ...new Set(games.map((g) => g.category))];
  renderCategoryChips(categories);
  applyFilters();

  searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    state.page = 1;
    applyFilters();
  });

  loadMoreBtn.addEventListener('click', () => {
    state.page += 1;
    renderGames();
  });
}

function renderCategoryChips(categories) {
  chips.innerHTML = '';
  for (const category of categories) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip${category === state.category ? ' active' : ''}`;
    btn.textContent = category;
    btn.addEventListener('click', () => {
      state.category = category;
      state.page = 1;
      renderCategoryChips(categories);
      applyFilters();
    });
    chips.append(btn);
  }
}

function applyFilters() {
  state.filtered = state.games.filter((game) => {
    const categoryOk = state.category === 'All' || game.category === state.category;
    const query = state.search;
    const textOk =
      query.length === 0 ||
      game.name.toLowerCase().includes(query) ||
      game.category.toLowerCase().includes(query);
    return categoryOk && textOk;
  });
  renderGames(true);
}

function renderGames(reset = false) {
  if (reset) grid.innerHTML = '';
  const visibleCount = state.page * state.pageSize;
  const toRender = state.filtered.slice(0, visibleCount);

  const fragment = document.createDocumentFragment();
  for (const game of toRender) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector('.thumb');
    image.src = game.thumbnail;
    image.alt = `${game.name} thumbnail`;
    card.querySelector('h2').textContent = game.name;
    card.querySelector('.meta').textContent = `${game.category} • ${game.description}`;
    const play = card.querySelector('.play');
    play.href = `./games/${game.slug}/index.html`;
    play.setAttribute('aria-label', `Play ${game.name}`);
    fragment.append(card);
  }

  grid.replaceChildren(fragment);
  resultCount.textContent = `${state.filtered.length} game(s) found`;
  loadMoreBtn.hidden = toRender.length >= state.filtered.length;
}
