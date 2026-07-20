/* ============================================================
   PORTFOLIO APP — vanilla JS, no dependencies, no build step.

   Structure:
     1. Config
     2. Screen  (the single iframe window all nav sources target)
     3. Nav     (header buttons)
     4. Launcher (fab + scrollable project list)
     5. Clock
     6. Init
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     1. CONFIG
     ---------------------------------------------------------- */
  const TRANSITION_MS = 220; // must match --transition-fast in CSS
  const PANEL_TRANSITION_MS = 180; // must match --transition-panel in CSS

  const els = {
    window: document.getElementById("terminal-window"),
    frame: document.getElementById("screen-frame"),
    title: document.getElementById("window-title"),
    navButtons: document.querySelectorAll(".nav-btn"),
    launcherToggle: document.getElementById("launcher-toggle"),
    launcherPanel: document.getElementById("launcher-panel"),
    launcherList: document.getElementById("launcher-list"),
    clickCatcher: document.getElementById("click-catcher"),
    clock: document.getElementById("clock"),
    shareButton: document.getElementById("share-btn"),
  };

  const gradients = [
    "linear-gradient(145deg, #1b1b1b, #2d171b, #52262d, #1f1f1f)",
    "linear-gradient(155deg, #181818, #30171b, #5a2c33, #222222)",
    "linear-gradient(150deg, #202020, #3a1b20, #65323a, #252525)",
    "linear-gradient(135deg, #1a1a1a, #3a241d, #6a3b2d, #242424)",
    "linear-gradient(160deg, #191919, #382018, #6c3923, #1f1f1f)",
    "linear-gradient(145deg, #181818, #172333, #294768, #202020)",
    "linear-gradient(135deg, #1b1b1b, #1d2d42, #375e82, #232323)",
    "linear-gradient(150deg, #181818, #1b3228, #2f6148, #212121)",
    "linear-gradient(145deg, #1b1b1b, #19352b, #3f7358, #242424)",
    "linear-gradient(150deg, #1c1c1c, #2d1d42, #58407a, #252525)",
    "linear-gradient(145deg, #1a1a1a, #362344, #654d81, #202020)",
    "linear-gradient(160deg, #232323, #2d2d2d, #474747, #202020)",
  ];

  let currentPage = null;

  function randomizeBackground() {
    document.body.style.background =
      gradients[Math.floor(Math.random() * gradients.length)];
  }

  /* ----------------------------------------------------------
     2. SCREEN
     Single source of truth for "what's on screen". Both the
     header nav and the launcher call this same function —
     that's what keeps the two UIs decoupled but consistent.

     Lazy by design: the iframe's src is only ever set to the
     page actually requested. Nothing preloads in the background.
     ---------------------------------------------------------- */
  function setPage(pagePath, titleText) {
    if (pagePath === currentPage) return; // no-op if already open, avoids reload flicker

    els.window.classList.add("closing");

    setTimeout(() => {
      els.frame.src = pagePath;
      els.title.textContent = titleText;
      currentPage = pagePath;
      els.window.classList.remove("closing");
    }, TRANSITION_MS);
  }

  /* ----------------------------------------------------------
     3. NAV
     ---------------------------------------------------------- */
  function initNav() {
    els.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        els.navButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        setPage(btn.dataset.page, btn.dataset.title);
      });
    });
  }

  /* ----------------------------------------------------------
     4. LAUNCHER
     Reads project data from the inline <script type="application/json">
     block in index.html — no fetch(), so no CORS issues when the
     file is opened directly (file://) with no local server.

     To add a project: add one object to that JSON block and drop
     the corresponding html file in pages/projects/. Nothing here
     needs to change.
     ---------------------------------------------------------- 
  function loadProjects() {
    const raw = document.getElementById("projects-data").textContent;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("projects-data JSON is invalid:", err);
      return [];
    }
  }
*/
  async function loadProjects() {
    const response = await fetch("../projects/meta.json");
    if (!response.ok) {
      console.warn("manifest.json missing");
      return [];
    }
    const projects = await response.json();
    console.log(projects);
    console.log(Array.isArray(projects));
    return projects;
  }

  function renderLauncherList(projects) {
    const fragment = document.createDocumentFragment();

    projects.forEach((project) => {
      const item = document.createElement("button");
      item.className = "launch-item";
      item.type = "button";
      item.innerHTML = `
        <svg style="color:${project.color}"><use href="#${project.icon}"></use></svg>
        <div>
          <p class="launch-item-name">${project.name}</p>
          <p class="launch-item-meta">${project.meta}</p>
        </div>
      `;
      item.addEventListener("click", () => {
        els.navButtons.forEach((b) => b.classList.remove("active")); // launcher pages aren't in the top nav
        setPage(project.page, `~/projects/${project.id}`);
        closeLauncher();
      });
      fragment.appendChild(item);
    });

    els.launcherList.appendChild(fragment);
  }

  let launcherOpen = false;

  function openLauncher() {
    launcherOpen = true;
    els.launcherPanel.classList.add("open");
    els.clickCatcher.classList.add("open");
    els.launcherToggle.setAttribute("aria-expanded", "true");
    // rAF so the 'open' class (display:block) applies before the
    // 'visible' class triggers the transition — otherwise no animation
    requestAnimationFrame(() => {
      els.launcherPanel.classList.add("visible");
    });
  }

  function closeLauncher() {
    launcherOpen = false;
    els.launcherPanel.classList.remove("visible");
    els.launcherToggle.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      els.launcherPanel.classList.remove("open");
      els.clickCatcher.classList.remove("open");
    }, PANEL_TRANSITION_MS);
  }
  async function initLauncher() {
    const projects = await loadProjects();
    if (projects.length > 0) {
      renderLauncherList(projects);
    }

    els.launcherToggle.addEventListener("click", () => {
      launcherOpen ? closeLauncher() : openLauncher();
    });

    els.clickCatcher.addEventListener("click", closeLauncher);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && launcherOpen) closeLauncher();
    });
  }

  /* ----------------------------------------------------------
     5. CLOCK
     One setInterval, one DOM write per second — negligible cost.
     ---------------------------------------------------------- */
  function initClock() {
    function tick() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      els.clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------
   6. SHARE
   ---------------------------------------------------------- */
  function initShare() {
    els.shareButton.addEventListener("click", () => {
      window.open(els.frame.src, "_blank");
    });
  }

  /* ----------------------------------------------------------
     7. INIT
     ---------------------------------------------------------- */
  async function init() {
    randomizeBackground();
    initNav();
    await initLauncher();
    initClock();
    initShare();

    const defaultBtn = document.querySelector(".nav-btn.active");
    if (defaultBtn) {
      setPage(defaultBtn.dataset.page, defaultBtn.dataset.title);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
