/* ============================================================
   HUFFMAN ENCODING — page script
   1. binary rain background
   2. reveal-on-scroll
   3. Huffman engine (mirrors HuffmanNode.kt / extensions.kt)
   4. live demo + tree renderer
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 1. binary rain ---------------- */
  (function bits() {
    const canvas = document.getElementById("bits");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, cols, drops;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.floor(w / 18);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener("resize", resize);

    function frame() {
      ctx.fillStyle = "rgba(10,13,11,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = "13px monospace";
      for (let i = 0; i < cols; i++) {
        const char = Math.random() > 0.5 ? "1" : "0";
        const y = drops[i] * 16;
        ctx.fillStyle = Math.random() > 0.94 ? "rgba(127,232,191,0.55)" : "rgba(93,202,165,0.14)";
        ctx.fillText(char, i * 18, y);
        if (y > h && Math.random() > 0.985) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------------- 2. reveal on scroll ---------------- */
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

  /* ---------------- 3. Huffman engine ----------------
     Mirrors extensions.kt: build a frequency table, a
     min-heap-built tree, a path table, and reproduce the
     same run-length tree serialization as HuffmanNode.kt.
     ---------------------------------------------------- */
  class Node {
    constructor(code, freq, left = null, right = null) {
      this.code = code; // -1 for a branch
      this.freq = freq;
      this.left = left;
      this.right = right;
    }
  }

  function frequencyTable(str) {
    const table = new Map();
    for (const ch of str) {
      const code = ch.codePointAt(0);
      table.set(code, (table.get(code) || 0) + 1);
    }
    return table;
  }

  function buildTree(table) {
    const nodes = [...table.entries()].map(([code, freq]) => new Node(code, freq));
    if (nodes.length === 1) {
      // single-symbol edge case: still needs a 1-bit code
      return new Node(-1, nodes[0].freq, nodes[0], new Node(nodes[0].code, 0));
    }
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.freq - b.freq);
      const a = nodes.shift();
      const b = nodes.shift();
      nodes.push(new Node(-1, a.freq + b.freq, a, b));
    }
    return nodes[0] || null;
  }

  function pathTable(node, path = "", table = new Map()) {
    if (!node) return table;
    if (node.code !== -1) {
      table.set(node.code, path || "0");
      return table;
    }
    pathTable(node.left, path + "0", table);
    pathTable(node.right, path + "1", table);
    return table;
  }

  // Reproduces HuffmanNode.serialize + deflatePath: emit 0/1-per-node
  // depth-first, then collapse each run of leading zeros before a 1
  // into a single count. Mirrors the real Kotlin bit-for-bit in shape.
  function serializedTreeBytes(node) {
    const raw = [];
    (function walk(n) {
      if (n.code !== -1) {
        raw.push(1, n.code);
        return;
      }
      raw.push(0);
      if (n.left) walk(n.left);
      if (n.right) walk(n.right);
    })(node);

    const deflated = [];
    let count = 0;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === 1) {
        deflated.push(count);
        i++;
        deflated.push(raw[i]);
        count = -1;
      }
      count++;
    }
    return deflated.length; // byte count of the serialized tree
  }

  /* ---------------- 4. tree renderer + demo wiring ---------------- */
  function layoutTree(root) {
    const leaves = [];
    (function collect(n, depth) {
      if (!n) return;
      if (n.code !== -1) {
        leaves.push({ node: n, depth });
        return;
      }
      collect(n.left, depth + 1);
      collect(n.right, depth + 1);
    })(root, 0);

    const positions = new Map();
    const W = 880, topPad = 30, rowH = 68;
    leaves.forEach((leaf, i) => {
      const x = leaves.length === 1 ? W / 2 : 30 + (i * (W - 60)) / (leaves.length - 1);
      positions.set(leaf.node, { x, y: topPad + leaf.depth * rowH });
    });

    function place(n) {
      if (!n) return null;
      if (n.code !== -1) return positions.get(n);
      const l = place(n.left);
      const r = place(n.right);
      const depth = Math.min(l ? l.depthUsed || 0 : 0, r ? r.depthUsed || 0 : 0);
      const x = l && r ? (l.x + r.x) / 2 : (l || r).x;
      const y = Math.min(l ? l.y : Infinity, r ? r.y : Infinity) - rowH;
      const pos = { x, y: Math.max(topPad, y) };
      positions.set(n, pos);
      return pos;
    }
    place(root);
    return positions;
  }

  function renderTree(root, positions) {
    const svg = document.getElementById("treeSvg");
    if (!svg) return;
    const parts = [];

    function edges(n) {
      if (!n || n.code !== -1) return;
      const p = positions.get(n);
      if (n.left) {
        const c = positions.get(n.left);
        parts.push(`<path class="tree-link" d="M${p.x},${p.y} C${p.x},${(p.y + c.y) / 2} ${c.x},${(p.y + c.y) / 2} ${c.x},${c.y}"/>`);
        parts.push(`<text class="tree-edge-label" x="${(p.x + c.x) / 2 - 6}" y="${(p.y + c.y) / 2}">0</text>`);
        edges(n.left);
      }
      if (n.right) {
        const c = positions.get(n.right);
        parts.push(`<path class="tree-link" d="M${p.x},${p.y} C${p.x},${(p.y + c.y) / 2} ${c.x},${(p.y + c.y) / 2} ${c.x},${c.y}"/>`);
        parts.push(`<text class="tree-edge-label" x="${(p.x + c.x) / 2 + 10}" y="${(p.y + c.y) / 2}">1</text>`);
        edges(n.right);
      }
    }
    edges(root);

    function nodes(n) {
      if (!n) return;
      const p = positions.get(n);
      const isLeaf = n.code !== -1;
      const label = isLeaf ? displayChar(n.code) : "";
      parts.push(
        `<g class="tree-node${isLeaf ? " leaf" : ""}"><circle cx="${p.x}" cy="${p.y}" r="${isLeaf ? 15 : 8}"/>${
          isLeaf ? `<text x="${p.x}" y="${p.y + 4}">${label}</text>` : ""
        }</g>`
      );
      if (!isLeaf) {
        nodes(n.left);
        nodes(n.right);
      }
    }
    nodes(root);

    const maxY = Math.max(...[...positions.values()].map((p) => p.y)) + 40;
    svg.setAttribute("viewBox", `0 0 900 ${Math.max(180, maxY)}`);
    svg.innerHTML = parts.join("");
  }

  function displayChar(code) {
    if (code === 32) return "␣";
    if (code === 10) return "\\n";
    const ch = String.fromCodePoint(code);
    return /[\x20-\x7e]/.test(ch) ? ch : "0x" + code.toString(16);
  }

  function runDemo() {
    const input = document.getElementById("demoInput");
    const statsEl = document.getElementById("demoStats");
    const tbody = document.getElementById("demoTableBody");
    if (!input) return;

    function update() {
      const text = input.value;
      if (!text.length) {
        statsEl.innerHTML = "";
        tbody.innerHTML = "";
        document.getElementById("treeSvg").innerHTML = "";
        return;
      }
      const table = frequencyTable(text);
      const root = buildTree(table);
      const paths = pathTable(root);
      const treeBytes = serializedTreeBytes(root);

      const originalBits = text.length * 8;
      let encodedBits = 0;
      [...table.entries()].forEach(([code, freq]) => {
        encodedBits += freq * paths.get(code).length;
      });
      const totalBytes = Math.ceil(encodedBits / 8) + treeBytes;
      const originalBytes = text.length;
      const ratio = originalBytes > 0 ? Math.round((1 - totalBytes / originalBytes) * 100) : 0;

      statsEl.innerHTML = `
        <div class="dstat"><b>${originalBytes}</b><span>input bytes</span></div>
        <div class="dstat"><b>${Math.ceil(encodedBits / 8)}</b><span>packed content bytes</span></div>
        <div class="dstat"><b>${treeBytes}</b><span>serialized tree bytes</span></div>
        <div class="dstat"><b>${ratio > 0 ? ratio + "%" : ratio + "%"}</b><span>net vs raw (incl. tree)</span></div>
      `;

      const rows = [...table.entries()].sort((a, b) => b[1] - a[1]);
      tbody.innerHTML = rows
        .map(
          ([code, freq]) =>
            `<tr><td>${displayChar(code)}</td><td>${freq}</td><td class="code-cell">${paths.get(code)}</td><td>${paths.get(code).length}</td></tr>`
        )
        .join("");

      const positions = layoutTree(root);
      renderTree(root, positions);
    }

    input.addEventListener("input", update);
    update();
  }

  document.addEventListener("DOMContentLoaded", runDemo);
})();
