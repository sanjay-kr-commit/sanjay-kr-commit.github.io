(() => {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG — fill these in with the real repo details.
     ------------------------------------------------------------------ */
  const CONFIG = {
    githubRepo: "#", // e.g. "https://github.com/yourname/script-and-small-program"
    license: "—",    // e.g. "MIT"
  };

  document.querySelectorAll("[data-github-link]").forEach(a => { a.href = CONFIG.githubRepo; });
  document.querySelectorAll("[data-license-placeholder]").forEach(el => { el.textContent = CONFIG.license; });

  /* ------------------------------------------------------------------
     Routing
     ------------------------------------------------------------------ */
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll("[data-nav]");
  const validRoutes = new Set(["home", "bf", "brute", "expr", "inject"]);

  function routeFromHash() {
    const raw = (location.hash || "#home").replace("#", "");
    return validRoutes.has(raw) ? raw : "home";
  }

  function render(route) {
    views.forEach(v => v.classList.toggle("active", v.dataset.view === route));
    navButtons.forEach(btn => {
      const match = btn.dataset.nav === route;
      if (match) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    document.querySelectorAll(".view.active .reveal").forEach(el => observer.observe(el));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  window.addEventListener("hashchange", () => render(routeFromHash()));

  navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (btn.tagName === "A") return; // anchors use native hash navigation
      location.hash = `#${btn.dataset.nav}`;
    });
  });

  /* keyboard shortcuts 1-5 */
  const order = ["home", "bf", "brute", "expr", "inject"];
  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 5) location.hash = `#${order[n - 1]}`;
  });

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  render(routeFromHash());

  /* ==================================================================
     bfInterpreter demo — a real (small) Brainfuck interpreter
     ================================================================== */
  (() => {
    const SOURCE = ">++++++++[<+++++++++>-]<.>++++[<+++++++>-]<+.+++++++..+++.>>++++++[<+++++++>-]<+" +
                   "+.------------.>++++++[<+++++++++>-]<+.<.+++.------.--------.>>>++++[<++++++++>-" +
                   "]<+.";
    const panel = document.querySelector('[data-demo="bf"]');
    if (!panel) return;

    const sourceEl = panel.querySelector("[data-bf-source]");
    const tapeEl = panel.querySelector("[data-bf-tape]");
    const outputEl = panel.querySelector("[data-bf-output]");
    const stepBtn = panel.querySelector('[data-bf-action="step"]');
    const runBtn = panel.querySelector('[data-bf-action="run"]');
    const resetBtn = panel.querySelector('[data-bf-action="reset"]');

    let mem, pointer, index, stack, output, runTimer;

    function reset() {
      clearInterval(runTimer);
      mem = [0];
      pointer = 0;
      index = 0;
      stack = [];
      output = "";
      renderState();
    }

    function step() {
      if (index >= SOURCE.length) { clearInterval(runTimer); return false; }
      const c = SOURCE[index];
      switch (c) {
        case "+": mem[pointer]++; break;
        case "-": mem[pointer]--; break;
        case ">":
          if (mem.length === pointer + 1) mem.push(0);
          pointer++;
          break;
        case "<":
          pointer = Math.max(0, pointer - 1); // real code doesn't clamp; demo does, to stay alive
          break;
        case ".": output += String.fromCharCode(mem[pointer]); break;
        case "[":
          if (mem[pointer] !== 0) stack.push(index);
          else index += SOURCE.slice(index).indexOf("]");
          break;
        case "]": {
          const loopStart = stack.pop();
          if (mem[pointer] !== 0) index = loopStart - 1;
          break;
        }
      }
      index++;
      renderState();
      return index < SOURCE.length;
    }

    function renderState() {
      // source with current instruction highlighted
      const before = SOURCE.slice(0, index);
      const cur = SOURCE[index] || "";
      const after = SOURCE.slice(index + 1);
      sourceEl.innerHTML = `${escapeHtml(before)}<span class="cur">${escapeHtml(cur || " ")}</span>${escapeHtml(after)}`;

      // tape (cap visible cells so it stays readable)
      tapeEl.innerHTML = "";
      const maxCells = Math.max(mem.length, pointer + 3, 8);
      for (let i = 0; i < Math.min(maxCells, 20); i++) {
        const cell = document.createElement("span");
        cell.className = "bf-cell" + (i === pointer ? " active" : "");
        cell.textContent = mem[i] !== undefined ? mem[i] : 0;
        tapeEl.appendChild(cell);
      }

      outputEl.textContent = output;
    }

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    stepBtn.addEventListener("click", () => { clearInterval(runTimer); step(); });
    runBtn.addEventListener("click", () => {
      clearInterval(runTimer);
      runTimer = setInterval(() => { if (!step()) clearInterval(runTimer); }, 45);
    });
    resetBtn.addEventListener("click", reset);

    reset();
  })();

  /* ==================================================================
     bruteForceHelloWorld demo — mirrors the real char-range behavior
     ================================================================== */
  (() => {
    const panel = document.querySelector('[data-demo="brute"]');
    if (!panel) return;

    const input = panel.querySelector("#brute-input");
    const pointerCheckbox = panel.querySelector("#brute-pointer");
    const runBtn = panel.querySelector('[data-brute-action="run"]');
    const outputEl = panel.querySelector("[data-brute-output]");

    let timer;
    const A = "a".charCodeAt(0);

    function run() {
      clearTimeout(timer);
      const text = input.value || "Hello World";
      const showPointer = pointerCheckbox.checked;
      let buffer = "";
      let ci = 0;

      outputEl.textContent = "";

      function nextChar() {
        if (ci >= text.length) return;
        const target = text[ci];
        const code = target.charCodeAt(0);

        if (code < A) {
          // mirrors the Kotlin 'a'..i empty-range case: resolves instantly
          buffer += target;
          outputEl.textContent = buffer;
          ci++;
          timer = setTimeout(nextChar, 10);
          return;
        }

        let j = A;
        function attempt() {
          if (j > code) {
            buffer += target;
            outputEl.textContent = buffer;
            ci++;
            timer = setTimeout(nextChar, 10);
            return;
          }
          const guess = String.fromCharCode(j);
          outputEl.textContent = buffer + guess + (showPointer ? " <-" : "");
          j++;
          timer = setTimeout(attempt, 22);
        }
        attempt();
      }
      nextChar();
    }

    runBtn.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  })();

  /* ==================================================================
     expressionEvaluator demo — string-rewriting evaluator, ported to JS
     ================================================================== */
  (() => {
    const panel = document.querySelector('[data-demo="expr"]');
    if (!panel) return;

    const input = panel.querySelector("#expr-input");
    const runBtn = panel.querySelector('[data-expr-action="run"]');
    const traceEl = panel.querySelector("[data-expr-trace]");

    const DECIMAL = new Set("0123456789.".split(""));
    const OPEN = new Set(["(", "[", "{"]);
    const CLOSE = new Set([")", "]", "}"]);
    const OPERATORS = new Set(["+", "-", "*", "/", "%", "^"]);
    const MATCH = { "(": ")", "[": "]", "{": "}" };

    class EvalError extends Error {}

    function validate(str) {
      for (const ch of str) {
        if (!DECIMAL.has(ch) && !OPERATORS.has(ch) && !OPEN.has(ch) && !CLOSE.has(ch)) {
          throw new EvalError(`Token Not Allowed "${ch}"`);
        }
      }
      const stack = [];
      for (const ch of str) {
        if (OPEN.has(ch)) stack.push(ch);
        else if (CLOSE.has(ch)) {
          const top = stack.pop();
          if (!top || MATCH[top] !== ch) throw new EvalError("Please Check Bracket Placement");
        }
      }
      if (stack.length) throw new EvalError("Please Check Bracket Placement");
    }

    function removeEmptyBrackets(str) {
      let out = "";
      for (let i = 0; i < str.length; i++) {
        if ((str[i] === "(" && str[i + 1] === ")") ||
            (str[i] === "[" && str[i + 1] === "]") ||
            (str[i] === "{" && str[i + 1] === "}")) { i++; continue; }
        out += str[i];
      }
      return out;
    }

    function addImplicitMultiplication(str) {
      const arr = str.split("");
      for (let i = 1; i < arr.length; i++) {
        if (OPEN.has(arr[i]) && !OPERATORS.has(arr[i - 1]) && !OPEN.has(arr[i - 1])) {
          arr[i] = "*" + arr[i];
        }
      }
      return arr.join("");
    }

    function operateOn(str, operator, fn) {
      const opIndex = str.indexOf(operator);
      let a = "", i = opIndex - 1;
      while (i > -1 && (str[i] === "-" || DECIMAL.has(str[i]))) { a = str[i] + a; i--; }
      let b = "", j = opIndex + 1;
      while (j < str.length && (str[j] === "-" || DECIMAL.has(str[j]))) { b += str[j]; j++; }
      const prefix = str.slice(0, i + 1);
      const suffix = str.slice(j);
      const value = fn(parseFloat(a), parseFloat(b));
      return { result: `${prefix}${value}${suffix}`, a: parseFloat(a), b: parseFloat(b), value };
    }

    function evaluateExpression(str, trace, depth) {
      if (depth > 200) throw new EvalError("Expression too complex");

      if (str.includes("^")) {
        const opIndex = str.indexOf("^");
        let a = "", i = opIndex - 1;
        while (i > -1 && (str[i] === "-" || DECIMAL.has(str[i]))) { a = str[i] + a; i--; }
        let b = "", j = opIndex + 1;
        while (j < str.length && (str[j] === "-" || DECIMAL.has(str[j]))) { b += str[j]; j++; }
        const bNum = parseInt(b, 10);
        let expanded = a;
        if (bNum === 0) expanded = "1";
        else for (let k = 0; k < bNum - 1; k++) expanded += `*${a}`;
        const next = `${str.slice(0, i + 1)}${expanded}${str.slice(j)}`;
        trace.push(`${str}  ⇒  expand ${a}^${b} into repeated multiplication`);
        return evaluateExpression(next, trace, depth + 1);
      }
      if (str.includes("/")) {
        const { result } = operateOn(str, "/", (a, b) => a / b);
        trace.push(`${str}  →  ${result}`);
        return evaluateExpression(result, trace, depth + 1);
      }
      if (str.includes("*")) {
        const { result } = operateOn(str, "*", (a, b) => a * b);
        trace.push(`${str}  →  ${result}`);
        return evaluateExpression(result, trace, depth + 1);
      }
      if (str.includes("+")) {
        const { result } = operateOn(str, "+", (a, b) => a + b);
        trace.push(`${str}  →  ${result}`);
        return evaluateExpression(result, trace, depth + 1);
      }
      if (str.includes("-") && str.indexOf("-") > 0) {
        const { result } = operateOn(str, "-", (a, b) => a - b);
        trace.push(`${str}  →  ${result}`);
        return evaluateExpression(result, trace, depth + 1);
      }
      if (str.includes("%")) {
        const { result } = operateOn(str, "%", (a, b) => a % b);
        trace.push(`${str}  →  ${result}`);
        return evaluateExpression(result, trace, depth + 1);
      }
      return str;
    }

    function parseExpression(raw, trace) {
      validate(raw);
      let str = addImplicitMultiplication(removeEmptyBrackets(raw));
      if (str !== raw) trace.push(`${raw}  ⇒  normalize: ${str}`);

      function lastOpen() {
        return Math.max(str.lastIndexOf("("), str.lastIndexOf("["), str.lastIndexOf("{"));
      }

      let guard = 0;
      while (lastOpen() > -1 && guard < 200) {
        guard++;
        const openIdx = lastOpen();
        const openCh = str[openIdx];
        const closeCh = MATCH[openCh];
        const closeIdx = openIdx + 1 + str.slice(openIdx + 1).indexOf(closeCh);
        const inner = str.slice(openIdx + 1, closeIdx);
        const innerTrace = [];
        const innerResult = evaluateExpression(inner, innerTrace, 0);
        innerTrace.forEach(t => trace.push("  " + t));
        str = str.slice(0, openIdx) + innerResult + str.slice(closeIdx + 1);
        trace.push(`${openCh}${inner}${closeCh}  →  ${innerResult}   ⇒   ${str}`);
      }

      return evaluateExpression(str, trace, 0);
    }

    function run() {
      const raw = input.value.trim();
      traceEl.innerHTML = "";
      if (!raw) return;
      const trace = [];
      try {
        const result = parseExpression(raw, trace);
        trace.forEach(line => {
          const div = document.createElement("div");
          div.className = "step";
          div.textContent = line;
          traceEl.appendChild(div);
        });
        const resultLine = document.createElement("div");
        resultLine.className = "result";
        resultLine.textContent = `= ${result}`;
        traceEl.appendChild(resultLine);
      } catch (e) {
        const err = document.createElement("div");
        err.className = "err";
        err.textContent = e.message || "Could not evaluate that expression.";
        traceEl.appendChild(err);
      }
    }

    runBtn.addEventListener("click", run);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
    run();
  })();

  /* ==================================================================
     injectBashStartup — diagram walkthrough (no bash sandbox available)
     ================================================================== */
  (() => {
    const panel = document.querySelector('[data-demo="inject"]');
    if (!panel) return;

    const btn = panel.querySelector("[data-inject-action]");
    const stepsEl = panel.querySelector("[data-inject-steps]");

    const STEPS = [
      "You run ./injectBashStartup Main.kt — the script checks the extension and finds a supported .kt file.",
      "It looks for kotlinc on your machine. No compiler, no wrapping.",
      "It compiles Main.kt into a scratch directory, preferring /dev/shm so it lives in memory.",
      "It builds a bash header as a heredoc string and finds the compiled output file.",
      "It concatenates header + compiled bytecode with cat, writes the result as ./Main, and chmod +x's it.",
      "Next time you run ./Main directly, the header runs first: it splits itself from the trailing bytecode using sed/head, executes the payload with kotlin or java, then exits.",
    ];

    btn.addEventListener("click", () => {
      const hidden = stepsEl.hasAttribute("hidden");
      if (hidden) {
        stepsEl.innerHTML = "";
        STEPS.forEach(s => {
          const li = document.createElement("li");
          li.textContent = s;
          stepsEl.appendChild(li);
        });
        stepsEl.removeAttribute("hidden");
        btn.textContent = "hide the walkthrough";
      } else {
        stepsEl.setAttribute("hidden", "");
        btn.textContent = "walk through what happens when you run it";
      }
    });
  })();

})();
