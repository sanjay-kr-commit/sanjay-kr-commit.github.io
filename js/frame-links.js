document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    const inShell = window.parent && window.parent !== window && typeof window.parent.navigateTo === 'function';
    if (inShell) {
      e.preventDefault();
      window.parent.navigateTo(el.dataset.page);
    }
    // else: not inside the shell (page opened directly) — let the normal href navigation happen
  });
});
