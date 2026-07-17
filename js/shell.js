const frameWrap = document.getElementById('frameWrap');
const pageFrame = document.getElementById('pageFrame');
const navLinks = document.querySelectorAll('#navLinks a,.logo[data-page]');
const PAGES = { home: 'pages/home.html', about: 'pages/about.html', projects: 'pages/projects.html', protocols: 'pages/protocols.html', contact: 'pages/contact.html' };
let busy = false, current = 'home';
function active(k) { navLinks.forEach(a => a.classList.toggle('active', a.dataset.page === k)); }
function goto(k) {
  if (busy || !PAGES[k] || k === current) return;
  busy = true; current = k; active(k);
  document.body.classList.add('crt-fault');
  frameWrap.classList.add('transitioning');
  pageFrame.onload = () => {
    document.body.classList.remove('crt-fault');
    frameWrap.classList.remove('transitioning');
    busy = false;
  };
  requestAnimationFrame(() => pageFrame.src = PAGES[k]);
}
navLinks.forEach(a => a.onclick = e => { e.preventDefault(); goto(a.dataset.page); });
