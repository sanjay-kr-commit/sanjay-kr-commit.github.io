const commands = {
  clear,
  echo,
  exit,
  which,
  reload,
};

const history = [];
let historyIndex = 0;

function which(args) {
  args
    .split(" ")
    .filter((func) => func.trim() !== "")
    .forEach((func) => {
      const line = document.createElement("pre");
      line.className = "terminal-output";
      line.textContent = `-> ${func} definition`;
      document.body.appendChild(line);
      const fn = commands[func];
      if (!fn) {
        commandNotFound(func);
      } else {
        const line2 = document.createElement("pre");
        line2.className = "terminal-output dim";
        line2.textContent = fn.toString();
        document.body.appendChild(line2);
      }
    });
}

function exit(args) {
  parent.location.reload();
}

function reload(args) {
  window.location.reload();
}

function clear(args) {
  document.body.innerHTML = "";
}

function echo(args) {
  const line = document.createElement("div");
  line.innerHTML = `
      <span class="dim">${args}</span>
    `;
  document.body.appendChild(line);
}

function commandNotFound(func) {
  const line = document.createElement("div");
  line.innerHTML = `
      <span class="dim">function not found : ${func}</span>
    `;
  document.body.appendChild(line);
  console.log("funtion not found : ", func);
}

function processPrompt(prompt) {
  if (prompt.trim() === "") {
    return;
  }
  console.log(prompt);
  const [func, ...args] = prompt.split(" ");
  const command = commands[func];
  if (command) {
    command(args.join(" "));
  } else {
    commandNotFound(func);
  }
}

function attachinputreader() {
  document.body.addEventListener("keydown", (event) => {
    if (!event.target.classList.contains("terminal-input")) return;

    const input = event.target;

    switch (event.key) {
      case "Enter": {
        const value = input.value.trim();

        if (value !== "" && history.at(-1) !== value) {
          history.push(value);
        }
        historyIndex = history.length;

        processPrompt(value);

        const text = document.createElement("span");
        text.textContent = value;
        input.replaceWith(text);

        injectprompt();
        break;
      }

      case "ArrowUp": {
        event.preventDefault();

        if (historyIndex > 0) {
          historyIndex--;
          input.value = history[historyIndex];
        }

        break;
      }

      case "ArrowDown": {
        event.preventDefault();

        if (historyIndex < history.length - 1) {
          historyIndex++;
          input.value = history[historyIndex];
        } else {
          historyIndex = history.length;
          input.value = "";
        }

        break;
      }
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
