/* ============================================================
   DEFLATE-JAR — page script
   1. reveal-on-scroll
   2. illustrative reachability-walk demo (dependencyList)
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

  /* ---------------- reachability walk demo ----------------
     A small illustrative jar: Main references Logger and
     JsonParser by name inside its own bytes. JsonParser
     references Helper. UnusedUtil and DeadCode aren't
     mentioned anywhere and never get visited — exactly the
     shape of ZipFile.dependencyList in deflate.kt.
     ---------------------------------------------------- */
  const classes = {
    Main: { mentions: ["Logger", "JsonParser"], x: 90, y: 60 },
    Logger: { mentions: [], x: 320, y: 30 },
    JsonParser: { mentions: ["Helper"], x: 320, y: 130 },
    Helper: { mentions: [], x: 540, y: 100 },
    UnusedUtil: { mentions: [], x: 320, y: 220 },
    DeadCode: { mentions: [], x: 540, y: 220 },
  };

  function buildSvg() {
    const svg = document.getElementById("depGraph");
    if (!svg) return;
    const parts = [];

    // edges: draw every "mentions" relationship as a faint edge first
    Object.entries(classes).forEach(([name, c]) => {
      c.mentions.forEach((target) => {
        const t = classes[target];
        parts.push(
          `<line class="graph-edge" id="edge-${name}-${target}" x1="${c.x}" y1="${c.y}" x2="${t.x}" y2="${t.y}"/>`
        );
      });
    });

    Object.entries(classes).forEach(([name, c]) => {
      parts.push(
        `<g class="graph-node" id="node-${name}"><circle cx="${c.x}" cy="${c.y}" r="30"/><text x="${c.x}" y="${c.y + 4}">${name}</text></g>`
      );
    });

    svg.innerHTML = parts.join("");
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, reduceMotion ? 0 : ms));
  }

  async function runWalk() {
    const logEl = document.getElementById("graphLog");
    const replayBtn = document.getElementById("graphReplay");
    if (!logEl) return;

    // reset visuals
    Object.keys(classes).forEach((name) => {
      const n = document.getElementById("node-" + name);
      if (n) n.classList.remove("visited", "excluded");
    });
    document.querySelectorAll(".graph-edge").forEach((e) => e.classList.remove("active"));
    logEl.innerHTML = "";

    function log(text, cls) {
      const div = document.createElement("div");
      if (cls) div.className = cls;
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }

    log("$ deflate MyApp.jar --skip kotlin.Metadata", "dim");
    await sleep(400);
    log("Main Class Name : Main.class");
    await sleep(300);

    const visited = new Set();
    const allowed = [];

    async function walk(name) {
      if (visited.has(name)) return;
      visited.add(name);
      allowed.push(name);
      const node = document.getElementById("node-" + name);
      if (node) node.classList.add("visited");
      log(`Inspecting Class : ${name}.class`, "hl");
      await sleep(500);

      const mentions = classes[name].mentions;
      log(`  Depends on : ${mentions.length} file${mentions.length === 1 ? "" : "s"}`);
      for (const target of mentions) {
        const edge = document.getElementById(`edge-${name}-${target}`);
        if (edge) edge.classList.add("active");
        await sleep(300);
        await walk(target);
      }
    }

    await walk("Main");
    await sleep(200);

    const excluded = Object.keys(classes).filter((n) => !visited.has(n));
    excluded.forEach((name) => {
      const node = document.getElementById("node-" + name);
      if (node) node.classList.add("excluded");
    });

    log("");
    log(`Class In Use : ${allowed.length}`);
    log(`Class Not In Use : ${excluded.length}  (${excluded.join(", ")})`, "dim");
    log(`Class List Decreased From ${Object.keys(classes).length} -> ${allowed.length}`);

    if (replayBtn) replayBtn.disabled = false;
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildSvg();
    runWalk();
    const replayBtn = document.getElementById("graphReplay");
    if (replayBtn) {
      replayBtn.addEventListener("click", () => {
        replayBtn.disabled = true;
        runWalk();
      });
    }
  });
})();
