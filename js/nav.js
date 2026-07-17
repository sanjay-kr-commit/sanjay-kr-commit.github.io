document.getElementById('year').textContent = new Date().getFullYear();

// mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navMenu.classList.remove('open');
  navToggle.setAttribute('aria-expanded', false);
}));
