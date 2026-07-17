// ===== HERO TITLE CRT GLITCH (home page only) =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const titleEl = document.getElementById('glitchTitle');
const heroEl = document.querySelector('.hero');

// one quick screen-tear / RGB-split burst
function glitchBurst(duration = 260) {
  titleEl.classList.add('is-glitching');
  heroEl.classList.add('is-glitching');
  setTimeout(() => {
    titleEl.classList.remove('is-glitching');
    heroEl.classList.remove('is-glitching');
  }, duration);
}

// real CRT interference rarely fires as one clean pulse — do a short double-tap
function glitchSequence() {
  glitchBurst(220);
  setTimeout(() => glitchBurst(180), 320);
}

function scheduleNextGlitch() {
  // fires every 4-7 seconds, randomized so it doesn't feel mechanical
  const delay = 4000 + Math.random() * 3000;
  setTimeout(() => {
    glitchSequence();
    scheduleNextGlitch();
  }, delay);
}

if (reduceMotion) {
  // static, no flicker/glitch for users who've asked for reduced motion
} else {
  titleEl.classList.add('power-on');
  titleEl.addEventListener('animationend', () => titleEl.classList.remove('power-on'), { once: true });
  scheduleNextGlitch();
}
