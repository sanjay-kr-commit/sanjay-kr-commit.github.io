
(() => {
    const c = document.getElementById('crtCanvas');
    if (!c) return;
    const x = c.getContext('2d', { alpha: true });
    function resize() { c.width = 320; c.height = Math.round(320 * innerHeight / innerWidth); }
    resize(); addEventListener('resize', resize);
    let last = 0, persist = [];
    function frame(t) {
        if (document.hidden) { requestAnimationFrame(frame); return; }
        if (t - last > 140) {
            last = t;
            x.fillStyle = 'rgba(0,0,0,.18)';
            x.fillRect(0, 0, c.width, c.height);
            let img = x.getImageData(0, 0, c.width, c.height);
            let d = img.data;
            for (let i = 0; i < d.length; i += 4) {
                let n = Math.random() * 55;
                d[i] = n;
                d[i + 1] = n * .9;
                d[i + 2] = n * 1.1;
                d[i + 3] = 35;
            }
            x.putImageData(img, 0, 0);
            persist.push(x.getImageData(0, 0, c.width, c.height));
            if (persist.length > 3) persist.shift();
            persist.forEach((im, i) => { x.globalAlpha = 0.05 * (i + 1); x.putImageData(im, 0, 0); });
            x.globalAlpha = 1;
            if (Math.random() < 0.015) {
                const y = Math.random() * c.height;
                const h = 2 + Math.random() * 4;
                const dx = (Math.random() - .5) * 15;
                const strip = x.getImageData(0, y, c.width, h);
                x.putImageData(strip, dx, y);
                document.body.classList.add('crt-fault');
                setTimeout(() => document.body.classList.remove('crt-fault'), 180);
            }
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
