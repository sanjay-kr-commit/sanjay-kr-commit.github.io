function glitch() {
    document.body.style.setProperty('--tear', (10 + Math.random() * 80) + '%');
    document.body.classList.add('crt-glitch');
    setTimeout(() => document.body.classList.remove('crt-glitch'), 140);
}
(function loop() {
    setTimeout(() => { glitch(); loop(); }, 8000 + Math.random() * 12000);
})();