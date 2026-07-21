/* ============================================================
   KOTLIN DSL TIC-TAC-TOE — page script
   1. reveal-on-scroll
   2. small regex-based Kotlin syntax highlighter
   3. playable board wired to a port of Bot.kt's botSpot
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

  /* ---------------- tiny Kotlin syntax highlighter ---------------- */
  const KEYWORDS = /\b(fun|val|var|if|else|return|class|object|companion|infix|private|override|when|while|do|import|null|true|false|is|as|in|out|this|it|else|throw|try|catch|finally|for|Unit|data)\b/g;
  const TYPES = /\b([A-Z][A-Za-z0-9_]*)\b/g;

  function highlight(code) {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = escaped.split("\n");
    return lines
      .map((line) => {
        // whole-line comment
        if (/^\s*\/\//.test(line)) {
          return `<span class="tok-com">${line}</span>`;
        }
        let out = line;
        out = out.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="tok-str">$1</span>');
        out = out.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
        out = out.replace(KEYWORDS, '<span class="tok-kw">$1</span>');
        out = out.replace(TYPES, '<span class="tok-type">$1</span>');
        out = out.replace(/\b([a-z][A-Za-z0-9_]*)(?=\()/g, '<span class="tok-fn">$1</span>');
        return out;
      })
      .join("\n");
  }

  document.querySelectorAll(".code-block code").forEach((el) => {
    el.innerHTML = highlight(el.textContent);
  });

  /* ---------------- board demo ---------------- */
  /* Direct port of Bot.kt: check every line for a completable
     win, then for a block, else pick an open square at random. */
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function botSpot(board, bot, player) {
    for (const [a, b, c] of LINES) {
      for (const [empty, x, y] of [[a, b, c], [b, a, c], [c, a, b]]) {
        if (board[empty] === null && board[x] === bot && board[y] === bot) return empty;
      }
    }
    for (const [a, b, c] of LINES) {
      for (const [empty, x, y] of [[a, b, c], [b, a, c], [c, a, b]]) {
        if (board[empty] === null && board[x] === player && board[y] === player) return empty;
      }
    }
    const open = board.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
    return open[Math.floor(Math.random() * open.length)];
  }

  function gameStatus(board) {
    for (const [a, b, c] of LINES) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    if (board.includes(null)) return null; // still playing
    return "draw";
  }

  function initBoardDemo() {
    const el = document.getElementById("boardDemo");
    const statusEl = document.getElementById("demoStatus");
    const resetBtn = document.getElementById("resetBtn");
    if (!el) return;

    let board = new Array(9).fill(null);
    let over = false;

    function render() {
      el.innerHTML = "";
      board.forEach((v, i) => {
        const cell = document.createElement("div");
        cell.className = "board-cell" + (v ? " filled " + v.toLowerCase() : "");
        cell.textContent = v || "";
        cell.addEventListener("click", () => onCellClick(i));
        el.appendChild(cell);
      });
    }

    function setStatus(text) {
      statusEl.textContent = text;
    }

    function onCellClick(i) {
      if (over || board[i] !== null) return;
      board[i] = "X";
      render();
      const status = gameStatus(board);
      if (status) return finish(status);

      setStatus("bot is thinking…");
      setTimeout(() => {
        const move = botSpot(board, "O", "X");
        board[move] = "O";
        render();
        const status2 = gameStatus(board);
        if (status2) return finish(status2);
        setStatus("your move — you're X");
      }, reduceMotion ? 0 : 350);
    }

    function finish(status) {
      over = true;
      if (status === "draw") setStatus("it's a draw");
      else if (status === "X") setStatus("you won");
      else setStatus("bot won");
    }

    resetBtn.addEventListener("click", () => {
      board = new Array(9).fill(null);
      over = false;
      setStatus("your move — you're X");
      render();
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", initBoardDemo);
})();
