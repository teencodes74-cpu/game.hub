const gameKey = 'gamehub_cycling-dash_best';
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const target = document.getElementById('target');
const arena = document.querySelector('.arena');

let score = 0;
let best = Number(localStorage.getItem(gameKey) || 0);
let moveTimer;

bestEl.textContent = best;

function clampScore(value) {
  return Math.max(0, value);
}

function updateScore(next) {
  score = clampScore(next);
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem(gameKey, String(best));
  }
}

function randomizeTarget() {
  const arenaRect = arena.getBoundingClientRect();
  const size = target.offsetWidth;
  const x = Math.random() * Math.max(1, arenaRect.width - size);
  const y = 50 + Math.random() * Math.max(1, arenaRect.height - size - 50);
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function restartGame() {
  updateScore(0);
  clearInterval(moveTimer);
  randomizeTarget();
  moveTimer = setInterval(randomizeTarget, 950);
}

target.addEventListener('click', () => {
  updateScore(score + 1);
  randomizeTarget();
});

arena.addEventListener('click', (event) => {
  if (event.target !== target) {
    updateScore(score - 1);
  }
});

restartBtn.addEventListener('click', restartGame);
fullscreenBtn.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    fullscreenBtn.textContent = 'Exit Fullscreen';
  } else {
    await document.exitFullscreen();
    fullscreenBtn.textContent = 'Fullscreen';
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenBtn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
});

restartGame();
