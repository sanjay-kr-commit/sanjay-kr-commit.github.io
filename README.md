# My Portfolio

A terminal-inspired portfolio powered by the filesystem.

> Built with plain HTML, CSS, JavaScript, and a small collection of Bash generators that turn the repository itself into the website.
> **Work in Progress**

## Why does it look like this?

I spend most of my time on Linux using KDE Plasma, Neovim, Zsh, and the terminal. I really like the look of translucent windows, blur effects, and desktop applications, so instead of building another conventional portfolio website, I wanted to build something that feels more like the environment I use every day.

It's not trying to perfectly imitate a terminal or a desktop. It's simply inspired by the tools I enjoy using.

---

## Why does it work like this?

GitHub Pages only hosts static files. There is no backend to scan directories, discover projects, or generate navigation.

I wanted the website to behave as though it had one.

Adding a new project shouldn't require editing multiple JSON files. A new page should automatically appear in navigation. Project metadata should live beside the project itself instead of inside one massive configuration file.

That led to the build system used in this repository.

Instead of maintaining metadata manually, a collection of small Bash scripts scans the repository and generates everything the frontend needs before deployment.

The website itself remains completely static.

---

## Repository Structure

```text
.
├── assets/
│   └── generated/
├── css/
├── js/
├── pages/
├── preprocessors/
├── projects/
└── index.html
```

### `pages/`

Each page lives inside its own directory.

```text
pages/
└── about/
    └── index.html
```

A page containing an `active` file becomes the default selected page.

---

### `projects/`

Every project is completely self-contained.

```text
projects/
└── example-project/
    ├── index.html
    ├── style.css
    ├── script.js
    └── meta.toml
```

The metadata generator automatically discovers every project and builds the project list.

---

## Build Pipeline

The repository contains four small Bash programs.

```text
preprocessors/
├── generate
├── generateFileSystemTree
├── generatePageMeta
└── generateProjectMeta
```

Running

```bash
./preprocessors/generate
```

generates:

```text
assets/generated/filetree-meta.json
assets/generated/pages-meta.json
assets/generated/projects-meta.json
```

These generated files are the only metadata consumed by the frontend.

If a generator produces invalid JSON, the website simply refuses to load that data instead of silently displaying incorrect information.

---

## Features

- Plain HTML, CSS, and JavaScript
- Bash-powered build pipeline
- No backend
- GitHub Pages compatible
- Automatic page discovery
- Automatic project discovery
- Project metadata stored beside each project
- Terminal-inspired interface
- Blur and glass effects inspired by KDE Plasma
- Modular JavaScript architecture

---

## Development Workflow

Adding a new project is intentionally simple.

Create a new directory.

```text
projects/
└── my-project/
    ├── index.html
    ├── style.css
    ├── script.js
    └── meta.toml
```

Run:

```bash
./preprocessors/generate
```

Commit.

Push.

The project automatically appears on the website.

No JSON files need to be edited manually.

---

## Philosophy

The filesystem is the source of truth.

The directory structure describes the website, while the Bash generators transform that structure into metadata that the frontend understands.

Rather than introducing a backend or a large build system, I chose to solve the problem with standard Unix tools (`find`, `grep`, `sed`, `awk`, and `jq`). Small programs connected together are more than capable of generating everything this site needs.

Each generator has a single responsibility, runs in its own process, and communicates only through generated files.

---

## Running Locally

I usually run the project using the Live Server plugin from Neovim:

```bash
nvim --headless +"LiveServerStart"
```

Since the website is completely static, any local web server works.

---

## Performance

The website is intentionally lightweight and optimized around static delivery.

- **No frontend frameworks** — Built entirely with plain HTML, CSS, and JavaScript.
- **No runtime dependencies** — Everything is generated before deployment.
- **Minimal JavaScript** — Only the functionality required by the interface is loaded.
- **Static deployment** — Hosted on GitHub Pages with no backend required.
- **Build-time metadata generation** — Repository metadata is generated during preprocessing rather than in the browser.
- **Small, modular assets** — Styles, scripts, pages, and projects are kept separate for maintainability and efficient loading.
- **Skeleton loading** — Improves perceived performance while content is being loaded.

---

## Reusing This Project

Although this repository is my personal portfolio, nothing about it is specific to me.

Replace the contents of `pages/` and `projects/` with your own work, run

```bash
./preprocessors/generate
```

and deploy it using GitHub Pages.

Your portfolio is ready.

---

This project started as an excuse to build a portfolio that looked like the desktop I spend most of my time in. Along the way, it became an experiment in seeing how far a static website could be pushed using nothing more than the filesystem, a few Bash scripts, and standard Unix tools.
