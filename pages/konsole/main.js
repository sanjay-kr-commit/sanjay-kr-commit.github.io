const commands = {
  clear,
  echo,
  exit,
  which,
  reload,
  pwd,
  ls,
  cd,
};

let dir = "/";
const history = [];
let historyIndex = 0;
let filetree;

function pwd(args) {
  echo(dir);
}

async function fetchFileTree() {
  const response = await fetch("../../assets/generated/filetree-meta.json");
  if (!response.ok) {
    console.warn("filetree-meta.json missing");
    return false;
  }
  filetree = await response.json();
  console.log(filetree);
  return true;
}

function cd(args) {
  if (!args || args.trim() === "") {
    dir = "/";
    return;
  }
  let newdir = dir;
  if (!filetree) {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="dim">filetree Structure not found</span>
    `;
    document.body.appendChild(line);
    return;
  }
  paths = args.split("/").filter((func) => func.trim() !== "");
  for (const path of paths) {
    if (path === "..") {
      if (newdir === "/") {
        echo(`${args}: invalid Path`);
        return;
      }
      newdir = newdir.replace(/\/[^/]+$/, "") || "/";
    } else {
      const target = newdir === "/" ? `/${path}` : `${newdir}/${path}`;
      if (target in filetree.folderToFolder) {
        newdir = target;
      } else {
        echo(`${args}: invalid Path`);
        return;
      }
    }
  }
  dir = newdir;
}

function ls(args) {
  if (dir !== "/") {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="dim dir">d: ..</span>
    `;
    document.body.appendChild(line);
  }
  filetree.folderToFolder[dir].forEach((folder) => {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="dim dir">d: ${folder}</span>
    `;
    document.body.appendChild(line);
  });
  filetree.folderToFile[dir].forEach((file) => {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="dim file">f: ${file}</span>
    `;
    document.body.appendChild(line);
  });
}

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
  let sym = dir;
  if (sym === "/") sym = "~";
  const line = document.createElement("div");
  line.className = "terminal-line";
  line.innerHTML = `
    <span class="prompt">visitor@sanjay:${sym}$</span>
    <input type="text" class="terminal-input" autofocus>
  `;
  document.body.appendChild(line);
  line.querySelector(".terminal-input").focus();
}

async function init() {
  attachinputreader();
  injectprompt();
  fetchFileTree();
}

init();
