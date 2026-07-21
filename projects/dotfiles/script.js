// ---------------------------------------------------------------
// Dotfiles microsite — behaviour
// ---------------------------------------------------------------

/* ---------- 1. sticky path stack, mirrors the repo's own push/pop resolver ---------- */
(function pathStack(){
  const el = document.getElementById('pathStack');
  const sections = document.querySelectorAll('[data-path]');
  if(!el || !sections.length) return;

  const render = (path) => {
    const segs = path.split('/');
    el.innerHTML = segs.map(s => `<span class="seg">${s}</span>`).join('<span class="sep">/</span>') + ' $';
  };
  render('dotfiles');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        render(entry.target.getAttribute('data-path'));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
})();

/* ---------- 2. reveal on scroll ---------- */
(function reveal(){
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.08 });
  items.forEach(i => io.observe(i));
})();

/* ---------- 3. hero boot terminal typing ---------- */
(function bootTerm(){
  const body = document.getElementById('termBody');
  if(!body) return;

  const lines = [
    { t: '$ ', cls: 'user', raw: true, cmd: 'source ~/dotfiles/configureshell' },
    { t: '[DEBUG] shell type zsh', cls: 'dim' },
    { t: '[DEBUG] ~/dotfiles/', cls: 'dim' },
    { t: '[DEBUG] calling flag fucniton', cls: 'dim' },
    { t: '[DEBUG] calling module fucniton', cls: 'dim' },
    { t: '[DEBUG] calling module loader', cls: 'dim' },
    { t: '[DEBUG] preprocess order -100 tmux_terminal, -99 omz, ? z, ? gitPass …', cls: 'dim' },
    { t: '[DEBUG] Loading module : tmux_terminal', cls: 'dim' },
    { t: '[DEBUG] Loading module : omz', cls: 'dim' },
    { t: '[DEBUG] Loaded module : persistentAlias', cls: 'dim' },
    { t: '10 modules loaded, 0 failed', cls: 'ok' },
    { t: '', cls: 'dim' },
    { t: '~/dotfiles $', cls: 'user', caret: true },
  ];

  let i = 0;
  function next(){
    if(i >= lines.length) return;
    const line = lines[i];
    const div = document.createElement('div');
    div.className = 'ln ' + (line.cls || '');
    if(line.raw){
      div.innerHTML = line.t + line.cmd;
    } else {
      div.textContent = line.t;
    }
    if(line.caret){
      const c = document.createElement('span');
      c.className = 'term-caret';
      div.appendChild(c);
    }
    body.appendChild(div);
    i++;
    setTimeout(next, i <= 1 ? 500 : 90 + Math.random()*70);
  }
  // start once hero is visible
  const obs = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting){ next(); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(document.getElementById('bootTerm'));
})();

/* ---------- 4. directory tree ---------- */
(function tree(){
  const root = document.getElementById('tree');
  if(!root) return;

  const data = [
    { name:'configureshell', type:'file', desc:'the only line .zshrc ever sources' },
    { name:'TODO', type:'file', desc:'19 lines, 3 checked off' },
    { name:'config/', type:'dir', desc:'the ON/OFF state — safe to edit by hand', children:[
      { name:'LOAD_MODULE', type:'file', desc:'one enabled module name per line' },
      { name:'FLAGS', type:'file', desc:'one enabled behaviour flag per line' },
      { name:'public/', type:'dir', desc:'committed, non-secret', children:[
        { name:'env_flags/ENV_FLAGS', type:'file', desc:'EDITOR=nvim, and anything else exported by :env-flags' },
        { name:'persistentAlias/STORED_ALIASES', type:'file', desc:'52 aliases, rewritten in place by alias --save' },
        { name:'omz_helper/plugins', type:'file', desc:'the oh-my-zsh plugins() array, managed outside oh-my-zsh' },
      ]},
      { name:'private/', type:'dir', desc:'gitignored, per-machine only', children:[
        { name:'gitPass/userconfigs', type:'file', desc:'host username → email + token, read by the git wrapper' },
      ]},
    ]},
    { name:'module/', type:'dir', desc:'13 files, 10 currently enabled', children:[
      { name:'tmux_terminal', type:'file', desc:'p→-100 · auto-attach or create a session on shell start' },
      { name:'omz', type:'file', desc:'p→-99 · installs oh-my-zsh + powerlevel10k if missing' },
      { name:'z', type:'file', desc:'zoxide-backed cd replacement' },
      { name:'gitPass', type:'file', desc:'per-remote git identity + credential injection' },
      { name:'fzfForPreviousCmd', type:'file', desc:'rebinds Ctrl+R and ↑ to deduped, bat-previewed fzf history' },
      { name:'sdkman', type:'file', desc:'installs sdkman if missing' },
      { name:'sudo_systemd_ask_pass', type:'file', desc:'sudo / sudoedit through systemd-ask-password' },
      { name:'env_flags', type:'file', desc:'f→USE_RAM_FOR_TEMP_ENV_FILE · sources public + private env files' },
      { name:'fastFetch', type:'file', desc:'p→1001 · pokemon-colorscripts piped into fastfetch' },
      { name:'persistentAlias', type:'file', desc:'p→1002, f→USE_RAM_FOR_TEMP_ALIAS_FILE · the alias override' },
      { name:'activateVenv', type:'file', desc:'off · finds and activates the nearest Python venv' },
      { name:'homebrew', type:'file', desc:'off · installs linuxbrew, wires PATH + completions' },
      { name:'omz_helper', type:'file', desc:'off · fzf browser for oh-my-zsh plugins with README preview' },
    ]},
    { name:'runtime/', type:'dir', desc:'the engine — never edited to add a feature', children:[
      { name:'initscript', type:'file', desc:'routes to setup (--init) or initialize (every later shell)' },
      { name:'setup', type:'file', desc:'writes the self-cloning stanza into ~/.zshrc, once' },
      { name:'initialize', type:'file', desc:'flagFunctions → moduleFunction → moduleloader, in order' },
      { name:'moduleloader', type:'file', desc:'parses p-> / d-> / f-> comments, resolves order, sources' },
      { name:'moduleFunction', type:'file', desc:'exposes :module, the fzf module toggler' },
      { name:'loadFlags', type:'file', desc:'reads config/FLAGS into the environment' },
      { name:'flagFunctions', type:'file', desc:'exposes :flag, the fzf flag toggler' },
      { name:'logger', type:'file', desc:'debug / warn / error, all gated behind flags' },
      { name:'LIST_OF_FLAGS', type:'file', desc:'the fixed set every module can rely on' },
    ]},
    { name:'static_config/', type:'dir', desc:'generated files, committed anyway for reproducibility', children:[
      { name:'public/omz/p10k.zsh', type:'file', desc:'the powerlevel10k prompt config' },
      { name:'public/tmux_terminal/tmux.conf', type:'file', desc:'the tmux config, copied to ~/.tmux.conf on first run' },
    ]},
  ];

  function buildNode(item){
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'node ' + (item.type === 'dir' ? 'dir' : 'file');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▸';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;
    const desc = document.createElement('span');
    desc.className = 'desc';
    desc.textContent = item.desc || '';
    row.append(caret, name, desc);
    li.appendChild(row);

    if(item.type === 'dir' && item.children){
      row.setAttribute('role','button');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-expanded','false');
      const ul = document.createElement('ul');
      ul.hidden = true;
      item.children.forEach(c => ul.appendChild(buildNode(c)));
      li.appendChild(ul);
      const toggle = () => {
        const expanded = row.getAttribute('aria-expanded') === 'true';
        row.setAttribute('aria-expanded', String(!expanded));
        ul.hidden = expanded;
      };
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
    }
    return li;
  }

  const ul = document.createElement('ul');
  data.forEach(item => ul.appendChild(buildNode(item)));
  root.appendChild(ul);

  // auto-expand module/ as an example
  const firstDir = root.querySelector('.node.dir');
})();

/* ---------- 5. priority ladder ---------- */
(function ladder(){
  const root = document.getElementById('ladder');
  const btn = document.getElementById('resolveBtn');
  if(!root || !btn) return;

  // real config/LOAD_MODULE order, with real priorities where declared
  const modules = [
    { name:'tmux_terminal', p:-100 },
    { name:'omz', p:-99 },
    { name:'z', p:null },
    { name:'gitPass', p:null },
    { name:'fzfForPreviousCmd', p:null },
    { name:'sdkman', p:null },
    { name:'sudo_systemd_ask_pass', p:null },
    { name:'env_flags', p:null },
    { name:'fastFetch', p:1001 },
    { name:'persistentAlias', p:1002 },
  ];

  function render(list){
    root.innerHTML = '';
    list.forEach(m => {
      const row = document.createElement('div');
      row.className = 'rung';
      row.innerHTML = `<span class="num ${m.p===null ? 'unnamed' : ''}">${m.p===null ? '?' : m.p}</span><span class="mod">${m.name}</span>`;
      root.appendChild(row);
    });
  }

  render(modules);

  btn.addEventListener('click', () => {
    // simplified: named priorities anchor position, unnamed modules fill the gap
    // between them in file order — mirrors the real awk packing behaviour closely
    // enough to be an honest illustration, not an exact re-implementation.
    const named = modules.filter(m => m.p !== null).sort((a,b) => a.p - b.p);
    const unnamed = modules.filter(m => m.p === null);
    const resolved = [];
    let ui = 0;
    named.forEach((m, idx) => {
      if(idx === 1){ // slot unnamed modules between omz and fastFetch
        resolved.push(...unnamed);
      }
      resolved.push(m);
    });
    if(unnamed.length && resolved.length === named.length){ resolved.push(...unnamed); }

    render(resolved);
    [...root.children].forEach((el, i) => {
      setTimeout(() => el.classList.add('settled'), i * 60);
    });
    btn.textContent = 'resolved ✓';
    btn.disabled = true;
  });
})();

/* ---------- 6. module toggle list ---------- */
(function modlist(){
  const root = document.getElementById('modlist');
  if(!root) return;

  const mods = [
    { name:'tmux_terminal', on:true, note:'p→-100' },
    { name:'omz', on:true, note:'p→-99' },
    { name:'fastFetch', on:true, note:'p→1001' },
    { name:'z', on:true, note:'' },
    { name:'gitPass', on:true, note:'' },
    { name:'persistentAlias', on:true, note:'p→1002' },
    { name:'fzfForPreviousCmd', on:true, note:'' },
    { name:'sdkman', on:true, note:'' },
    { name:'sudo_systemd_ask_pass', on:true, note:'' },
    { name:'env_flags', on:true, note:'' },
    { name:'activateVenv', on:false, note:'' },
    { name:'homebrew', on:false, note:'' },
    { name:'omz_helper', on:false, note:'' },
  ];

  mods.forEach(m => {
    const row = document.createElement('button');
    row.className = 'modrow ' + (m.on ? 'on' : 'off');
    row.innerHTML = `<span class="mark">${m.on ? '✓' : '✗'}</span><span class="mname">${m.name}</span><span class="mnote">${m.note}</span>`;
    row.addEventListener('click', () => {
      const isOn = row.classList.contains('on');
      row.classList.toggle('on', !isOn);
      row.classList.toggle('off', isOn);
      row.querySelector('.mark').textContent = isOn ? '✗' : '✓';
    });
    root.appendChild(row);
  });
})();

/* ---------- 7. alias browser ---------- */
(function aliases(){
  const grid = document.getElementById('aliasGrid');
  const search = document.getElementById('aliasSearch');
  const count = document.getElementById('aliasCount');
  if(!grid) return;

  const list = [
    { n:':q', d:'exit' },
    { n:':s', d:'poweroff' },
    { n:':r', d:'reboot' },
    { n:':c', d:'clear' },
    { n:':v', d:'nvim' },
    { n:':i', d:'nvim .' },
    { n:':si', d:'sudo nvim .' },
    { n:':sv', d:'sudoedit' },
    { n:':t', d:"today → nvim into today's Obsidian daily log" },
    { n:':o', d:'nvim into the Obsidian homepage note' },
    { n:':l', d:'nvim leetcode.nvim' },
    { n:':p', d:'git pull' },
    { n:'push', d:'git push' },
    { n:'pull', d:'git pull' },
    { n:'dotpush', d:'cd into ~/dotfiles, push, cd back — without losing your place' },
    { n:'gitRemove', d:'git rm --cached' },
    { n:'prettier / pretify', d:'headless nvim + conform.nvim, formats a file with no editor window' },
    { n:'searchwiki', d:'prompts for a query, greps the Arch wiki, opens the result in nvim' },
    { n:'send', d:'picks a KDE Connect device (or fzf-picks one) and shares a file to it' },
    { n:'rebuildKwinPlugin', d:'reinstalls whichever kwin effect package owns the active plugin files' },
    { n:'toggleNightColor', d:'flips the KWin "Toggle Night Color" shortcut over qdbus' },
    { n:'ratemirror', d:'re-ranks Arch + EndeavourOS mirrors with rate-mirrors' },
    { n:'updateMirror', d:'reflector-based mirror refresh, then a full yay sync' },
    { n:'removeOrphanPackages', d:'pacman -Rns on every orphaned dependency' },
    { n:'removePackageCache', d:'paccache -r && paccache -ruk0' },
    { n:'removeAndroidStudioLock', d:'deletes the stale Android Studio config lockfile' },
    { n:'pythonPackageRebuild', d:'rebuilds the yay package owning the active python binary' },
    { n:'packageSearch / updatePackageContentDatabase', d:'yay -F / yay -Fy' },
    { n:'downmp3', d:'yt-dlp, extracted straight to mp3' },
    { n:'aiLab', d:'cd\'s into the AI coursework folder, activates a venv, opens today\'s script in idle' },
    { n:'lastCommand', d:'pulls the previous command back out of .zsh_history' },
    { n:'lsm', d:'ls -la with file sizes rendered in MB' },
    { n:'kill-session', d:'tmux kill-session -t' },
    { n:'btop', d:'btop --force-utf' },
    { n:'xclip', d:'xclip -selection c' },
    { n:'open', d:'xdg-open' },
    { n:'c / c+', d:'zig cc / zig c++ as a drop-in cc replacement' },
    { n:'update-initramfs', d:'dracut --force --hostonly, targeted at the running kernel' },
    { n:'removeOldJournalEntries', d:'journalctl --vacuum-time=4weeks' },
    { n:'signer', d:'shortcut straight to a pinned apksigner binary' },
    { n:'rsf', d:'faillock --user $USER --reset' },
    { n:'qdbusviewer', d:'the qt6 build, not whatever\'s on PATH' },
    { n:'globurl', d:'noglob urlglobber — paste a URL without zsh mangling the query string' },
    { n:'pretifyPWD', d:'runs the prettier alias over every file under the current directory' },
  ];

  function render(items){
    grid.innerHTML = '';
    items.forEach(a => {
      const row = document.createElement('div');
      row.className = 'alias-row';
      row.innerHTML = `<span class="a-name">${a.n}</span><span class="a-desc">${a.d}</span>`;
      grid.appendChild(row);
    });
    count.textContent = `${items.length} of ${list.length} aliases · 52 total live in STORED_ALIASES`;
  }
  render(list);

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    if(!q){ render(list); return; }
    render(list.filter(a => a.n.toLowerCase().includes(q) || a.d.toLowerCase().includes(q)));
  });
})();

/* ---------- 8. roadmap ---------- */
(function roadmap(){
  const root = document.getElementById('roadmap');
  if(!root) return;

  const items = [
    { done:true, t:'custom order plugin loading' },
    { done:true, t:'custom order based on priority (automatic loading based on priority)' },
    { done:true, t:'add dynamic flag loading' },
    { done:false, t:'module for backing up config which symlinks' },
    { done:false, t:'cryptfs module for backing up sensitive information' },
    { done:false, t:'dependency advertisement and resolving' },
    { done:false, t:'flag conflict management between modules' },
    { done:false, t:'resource conflict handling — stop two modules touching the same resource at once' },
    { done:false, t:'priority resolution when modules disagree on precedence' },
    { done:false, t:'disable/enable conflict checks at toggle-time, not runtime' },
    { done:false, t:'package manager abstraction across distros' },
    { done:false, t:'private git repo for encrypted secrets inside config/private' },
    { done:false, t:'Dockerfile for reproducing the whole environment elsewhere' },
    { done:false, t:'rewrite the runtime for static + lazy loading' },
  ];

  items.forEach(i => {
    const row = document.createElement('div');
    row.className = 'rmap-row ' + (i.done ? 'done' : 'pending');
    row.innerHTML = `<span class="box">${i.done ? '[✓]' : '[ ]'}</span><span class="rtext">${i.t}</span>`;
    root.appendChild(row);
  });
})();

/* ---------- 9. commit timeline ---------- */
(function timeline(){
  const root = document.getElementById('timeline');
  if(!root) return;

  const months = [
    { label:'March 2026', commits:[
      { d:'15', h:'it works for now', milestone:true },
      { d:'16', h:'dynamic module loader with dependency loading', milestone:true },
      { d:'16', h:'add fzf for enabling and disabling flag' },
      { d:'17', h:'made gitPass reliable — GIT_ASKPASS instead of an expect script' },
      { d:'18', h:'add priority based plugin loading' },
      { d:'18', h:'custom order completed', milestone:true },
      { d:'18', h:'smartly handle setup so next time it could reclone itself', milestone:true },
      { d:'20', h:'plan to implement a custom order based on priority' },
      { d:'21', h:'add the module loader to be the last process' },
    ]},
    { label:'April 2026', commits:[
      { d:'08', h:'alias for rebuilding kwin plugins' },
      { d:'23', h:'update theme' },
    ]},
    { label:'May 2026', commits:[
      { d:'18', h:'a simple sudo wrapper for systemd-ask-password' },
      { d:'20', h:'add a module for managing dynamic flags', milestone:true },
      { d:'20', h:'fix formatting issue when building dynamic flag string' },
    ]},
    { label:'July 2026', commits:[
      { d:'20', h:'add prettier as alias to neovim for formatting files without opening an editor' },
    ]},
  ];

  months.forEach(month => {
    const label = document.createElement('div');
    label.className = 'tl-month';
    label.textContent = month.label;
    root.appendChild(label);
    month.commits.forEach(c => {
      const row = document.createElement('div');
      row.className = 'tl-commit' + (c.milestone ? ' milestone' : '');
      row.innerHTML = `<span class="hash">${c.d}</span><span class="msg">${c.h}</span>`;
      root.appendChild(row);
    });
  });
})();
