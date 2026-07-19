(async function () {
  const response = await fetch("assets/icons.svg");

  if (!response.ok) {
    console.error("Couldn't load icons.svg");
    return;
  }

  const sprite = await response.text();

  const container = document.createElement("div");
  container.hidden = true;
  container.innerHTML = sprite;

  document.body.prepend(container);
})();
