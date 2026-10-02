// Figures from project.md and README.md as supplied on 2026-10-02. Update this file and nothing else.
const PROJECT = {
  sourceFiles: 70, runtimeFiles: 50, moduleFiles: 18,
  sourceLines: 2826, runtimeLines: 1405, moduleLines: 1421,
  modules: { total: 18, enabled: 15 }, enabledModuleLines: 1332,
  warmInitMs: 190, // measured in the author's development configuration; always show the qualifier
  links: {
    github: "https://github.com/sanjay-kr-commit/zforge",
    project: "https://sanjay-kr-commit.github.io/projects/zforge/",
    portfolio: "https://sanjay-kr-commit.github.io/"
  }
};
document.querySelectorAll("[data-k]").forEach(el => {
  const v = el.dataset.k.split(".").reduce((o, k) => o && o[k], PROJECT);
  if (v !== undefined) el.textContent = Number(v).toLocaleString("en");
});
