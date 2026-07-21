/* ============================================================
   PANEL TRANSPARENCY TOGGLE — page script
   1. reveal-on-scroll
   2. config demo wired to a mock desktop panel
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- reveal on scroll ---------------- */
  (function reveal() {
    const els = document.querySelectorAll(".reveal");
    if (reduceMotion) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
  })();

  /* ---------------- config demo ----------------
     Mirrors main.qml's applyBackgroundHint()/applyOpacity():
     isBackgroundDisabled toggles NoBackground vs the default
     panel background, opacityOverride sets containment.opacity.
     hideInEditModeEnabled mirrors Plasmoid.status, simulated
     here with hover standing in for Plasma's real edit mode.
     ---------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const hideEdit = document.getElementById("cfgHideEdit");
    const disableBg = document.getElementById("cfgDisableBg");
    const opacity = document.getElementById("cfgOpacity");
    const opacityVal = document.getElementById("cfgOpacityVal");
    const panel = document.getElementById("mockPanel");
    const transBtn = document.getElementById("mockTransBtn");
    const desktopMock = document.querySelector(".desktop-mock");

    if (!panel) return;

    let hovering = false;

    function applyBackgroundHint() {
      if (disableBg.checked) {
        panel.style.background = "rgba(28, 34, 40, 0.08)";
        panel.style.backdropFilter = "blur(18px)";
        panel.style.webkitBackdropFilter = "blur(18px)";
      } else {
        panel.style.background = "rgba(28, 34, 40, 0.92)";
        panel.style.backdropFilter = "none";
        panel.style.webkitBackdropFilter = "none";
      }
    }

    function applyOpacity() {
      const v = parseFloat(opacity.value);
      opacityVal.textContent = v.toFixed(2);
      panel.style.opacity = v;
    }

    function applyVisibility() {
      const editMode = hovering; // stands in for Plasma's real edit mode
      const visible = !hideEdit.checked || editMode;
      transBtn.style.opacity = visible ? "1" : "0";
    }

    disableBg.addEventListener("change", applyBackgroundHint);
    opacity.addEventListener("input", applyOpacity);
    hideEdit.addEventListener("change", applyVisibility);
    desktopMock.addEventListener("mouseenter", () => {
      hovering = true;
      applyVisibility();
    });
    desktopMock.addEventListener("mouseleave", () => {
      hovering = false;
      applyVisibility();
    });

    applyBackgroundHint();
    applyOpacity();
    applyVisibility();
  });
})();
