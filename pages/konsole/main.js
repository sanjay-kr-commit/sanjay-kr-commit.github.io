function clear(arg) {
  document.body.innerHTML = "";
}

function echo(args) {
  const line = document.createElement("div");
  line.innerHTML = `
      <span class="dim">${args}</span>
    `;
  document.body.appendChild(line);
}

function processPrompt(prompt) {
  console.log(prompt);
  const parts = prompt.split(" ");
  const func = parts[0];
  const args = parts.slice(1).join(" ");
  try {
    window[func](args);
  } catch (_) {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="dim">function not found : ${func}</span>
    `;
    document.body.appendChild(line);
    console.log("funtion not found : ", func);
  }
}

function attachinputreader() {
  document.body.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      event.target.classList.contains("terminal-input")
    ) {
      const input = event.target;
      const value = input.value;

      processPrompt(value);

      // Replace the input with plain text
      const text = document.createElement("span");
      text.textContent = value;
      input.replaceWith(text);

      // Add the next prompt
      injectprompt();
    }
  });
}

function injectprompt() {
  const line = document.createElement("div");
  line.className = "terminal-line";
  line.innerHTML = `
    <span class="prompt">visitor@sanjay:~$</span>
    <input type="text" class="terminal-input" autofocus>
  `;
  document.body.appendChild(line);
  line.querySelector(".terminal-input").focus();
}

function init() {
  attachinputreader();
  injectprompt();
}

init();
