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
    frames: document.getElementById("screen-frames"),
    skeleton: document.getElementById("screen-skeleton"),
    title: document.getElementById("window-title"),
    navButtons: document.querySelectorAll(".nav-btn"),
    launcherToggle: document.getElementById("launcher-toggle"),
    launcherPanel: document.getElementById("launcher-panel"),
    launcherList: document.getElementById("launcher-list"),
    launcherDetail: document.getElementById("launcher-detail"),
    detailIconUse: document
      .getElementById("detail-icon-use")
      .querySelector("use"),
    detailName: document.getElementById("detail-name"),
    detailDate: document.getElementById("detail-date"),
    detailDescription: document.getElementById("detail-description"),
    detailGithub: document.getElementById("detail-github"),
    clickCatcher: document.getElementById("click-catcher"),
    clock: document.getElementById("clock"),
    shareButton: document.getElementById("share-btn"),
    pageEntries: document.getElementById("page-entries"),
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

     Hot-cache strategy: every page that's opened gets its own
     <iframe>, created once and kept alive in the DOM (not
     reloaded) so flipping back to a recently-visited page is
     instant and keeps its scroll/JS state. Only one iframe is
     ever visible at a time — the rest just sit hidden.

     Up to FRAME_CACHE_SIZE iframes are kept "hot" like this. Past
     that, the least-recently-used one gets torn down (removed
     from the DOM) to make room for the new page. The site looks
     and behaves exactly as before; this only changes what happens
     behind the scenes.
     ---------------------------------------------------------- */
  const FRAME_CACHE_SIZE = 5;

  const frameCache = new Map(); // pagePath -> iframe element
  let frameOrder = []; // pagePath list, oldest first (LRU order)
  let activeFrame = null;
  const loadedFrames = new WeakSet(); // frames whose "load" event has already fired

  function showSkeleton() {
    els.skeleton.classList.add("visible");
  }

  function hideSkeleton() {
    els.skeleton.classList.remove("visible");
  }

  function createFrame(pagePath) {
    const frame = document.createElement("iframe");
    frame.className = "screen-frame";
    frame.title = "content";
    frame.loading = "eager";
    frame.setAttribute("allowtransparency", "true");
    frame.addEventListener("load", () => {
      loadedFrames.add(frame);
      // only clear the skeleton if this frame is still the one on screen
      // (guards against a slow background load finishing after the user
      // has already navigated elsewhere)
      if (frame === activeFrame) hideSkeleton();
    });
    frame.src = pagePath;
    els.frames.appendChild(frame);
    return frame;
  }

  // Marks pagePath as the most recently used entry in the cache.
  function touchFrame(pagePath) {
    frameOrder = frameOrder.filter((p) => p !== pagePath);
    frameOrder.push(pagePath);
  }

  // Evicts the oldest cached iframe(s) once the cache is over capacity.
  function evictOverflow() {
    while (frameOrder.length > FRAME_CACHE_SIZE) {
      const oldest = frameOrder.shift();
      const frame = frameCache.get(oldest);
      if (frame) frame.remove();
      frameCache.delete(oldest);
    }
  }

  // Shows the iframe for pagePath, hides every other cached one.
  function revealFrame(pagePath) {
    frameCache.forEach((frame, path) => {
      frame.classList.toggle("active", path === pagePath);
    });
  }

  function setPage(pagePath, titleText) {
    if (pagePath === currentPage) return; // no-op if already open, avoids reload flicker

    els.window.classList.add("closing");

    setTimeout(() => {
      let frame = frameCache.get(pagePath);
      if (!frame) {
        // cache miss — spin up a fresh iframe for this page
        frame = createFrame(pagePath);
        frameCache.set(pagePath, frame);
      }
      touchFrame(pagePath);
      evictOverflow();
      revealFrame(pagePath);

      activeFrame = frame;
      loadedFrames.has(frame) ? hideSkeleton() : showSkeleton();

      els.title.textContent = titleText;
      currentPage = pagePath;
      els.window.classList.remove("closing");
    }, TRANSITION_MS);
  }

  /* ----------------------------------------------------------
     3. NAV
     ---------------------------------------------------------- */
  function initNav() {
    els.pageEntries.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-btn");
      if (!btn) return;

      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");
      setPage(btn.dataset.page, btn.dataset.title);
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
    const response = await fetch("../assets/generated/projects-meta.json");
    if (!response.ok) {
      console.warn("manifest.json missing");
      return [];
    }
    const projects = await response.json();
    console.log(projects);
    console.log(Array.isArray(projects));
    return projects;
  }

  /* Fills the floating side panel from one project object and shows it.
     Called on hover/focus of a launch-item — see renderLauncherList(). */
  function showDetail(project) {
    els.detailIconUse.setAttribute("href", `#${project.icon}`);
    els.detailIconUse.parentElement.style.color = project.color;
    els.detailName.textContent = project.name;
    els.detailDate.textContent = project.date || "";
    els.detailDescription.textContent = project.description || "";
    els.detailGithub.href = project.github || "#";
    els.detailGithub.style.display = project.github ? "inline-flex" : "none";
    els.launcherDetail.classList.add("visible");
    els.launcherDetail.setAttribute("aria-hidden", "false");
  }

  function hideDetail() {
    els.launcherDetail.classList.remove("visible");
    els.launcherDetail.setAttribute("aria-hidden", "true");
  }

  // Hover-intent for the detail panel: leaving a launch-item doesn't hide
  // it right away — the mouse needs time to travel across the gap into
  // the panel itself. If it lands there, the pending hide is cancelled and
  // the panel stays up until the mouse actually leaves the panel.
  const DETAIL_HIDE_DELAY_MS = 500;
  let detailHideTimer = null;

  function scheduleHideDetail() {
    clearTimeout(detailHideTimer);
    detailHideTimer = setTimeout(() => {
      detailHideTimer = null;
      hideDetail();
    }, DETAIL_HIDE_DELAY_MS);
  }

  function cancelHideDetail() {
    clearTimeout(detailHideTimer);
    detailHideTimer = null;
  }

  function renderLauncherList(projects) {
    const fragment = document.createDocumentFragment();

    projects.forEach((project) => {
      const item = document.createElement("button");
      item.className = "launch-item";
      item.type = "button";
      item.innerHTML = `
        <span class="launch-item-icon">
          <svg style="color:${project.color}"><use href="#${project.icon}"></use></svg>
        </span>
        <div class="launch-item-text">
          <p class="launch-item-name">${project.name}</p>
          <p class="launch-item-meta">${project.meta}</p>
        </div>
      `;

      // hover (mouse) and focus (keyboard) both drive the detail panel,
      // so it works the same way whether you're tabbing or pointing
      item.addEventListener("mouseenter", () => {
        cancelHideDetail();
        showDetail(project);
      });
      item.addEventListener("focus", () => {
        cancelHideDetail();
        showDetail(project);
      });
      item.addEventListener("mouseleave", () => {
        if (document.activeElement !== item) scheduleHideDetail();
      });
      item.addEventListener("blur", () => {
        if (!item.matches(":hover")) scheduleHideDetail();
      });

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
    cancelHideDetail();
    hideDetail();
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

    // once the mouse reaches the panel it's committed to staying open;
    // it only closes when the mouse leaves the panel itself
    els.launcherDetail.addEventListener("mouseenter", cancelHideDetail);
    els.launcherDetail.addEventListener("mouseleave", () => {
      cancelHideDetail();
      hideDetail();
    });

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
      if (!activeFrame) return;
      window.open(activeFrame.src, "_blank");
    });
  }

  async function injectpageentries() {
    if (!els.pageEntries) {
      console.log('Element with id "page-entries" not found.');
      return;
    }
    console.log("from injectpageentries after element");
    try {
      const btnResponse = await fetch("../assets/pagebtn.html");
      if (!btnResponse.ok) {
        console.log(`Failed to load pagebtn.html (${btnResponse.status})`);
        return;
      }
      const jsonResponse = await fetch("../assets/generated/pages-meta.json");
      if (!jsonResponse.ok) {
        console.log(`Failed to load meta.json (${jsonResponse.status})`);
        return;
      }
      const html = await btnResponse.text();
      const pages = await jsonResponse.json();
      for (const page of pages) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const btnObj = doc.querySelector(".nav-btn");
        btnObj.textContent = page.text;
        btnObj.dataset.page = page["data-page"];
        btnObj.dataset.title = page["data-title"];
        btnObj.className += page["focus-class"];
        console.log(btnObj);
        els.pageEntries.appendChild(btnObj);
      }
      console.log(els.pageEntries);
    } catch (err) {
      console.log("Failed to fetch page-entries : ", err);
    }
  }

  /* ----------------------------------------------------------
     7. INIT
     ---------------------------------------------------------- */
  async function init() {
    randomizeBackground();
    await injectpageentries();
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
