// ---------------------------------------------------------------
// Tanoshi Multiplatform microsite — behaviour
// ---------------------------------------------------------------

/* ---------- reveal on scroll ---------- */
(function reveal(){
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.1 });
  items.forEach(i => io.observe(i));
})();

/* ---------- platform pill (cosmetic filter, ties to expect/actual coding) ---------- */
(function platformPill(){
  const btns = document.querySelectorAll('#platformPill button[data-p]');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  }));
})();

/* ---------- hero grid demo ---------- */
(function gridDemo(){
  const root = document.getElementById('gridDemo');
  if(!root) return;
  for(let i=0;i<12;i++){
    const c = document.createElement('div');
    c.className = 'card';
    root.appendChild(c);
  }
  const io = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting){
      [...root.children].forEach((c,i) => setTimeout(()=>c.classList.add('in'), i*45));
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(document.getElementById('mockup'));
})();

/* ---------- expect / actual explorer ---------- */
(function expectActual(){
  const tabsRoot = document.getElementById('eaTabs');
  const panelsRoot = document.getElementById('eaPanels');
  if(!tabsRoot) return;

  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const hl = (code) => esc(code)
    .replace(/\/\/.*$/gm, m => `<span class="cm">${m}</span>`)
    .replace(/\b(expect|actual|open|class|val|import|package|constructor)\b/g, '<span class="kw">$1</span>')
    .replace(/(Platform\.\w+)/g, '<span class="fn">$1</span>');

  const pairs = [
    {
      id:'ViewModel',
      note:'The common declaration is a bare marker: <code>expect open class ViewModel()</code>. Desktop\'s actual is just as empty — a shape with nothing behind it. Android\'s actual extends the real <code>androidx.lifecycle.ViewModel</code>, so only Android gets lifecycle-aware state survival for free. Everything WindowStack does by hand exists here as a one-line inheritance on the other platform.',
      android:`package tanoshi.multiplatform.shared

import androidx.lifecycle.ViewModel

actual open class ViewModel
actual constructor() : ViewModel()`,
      desktop:`package tanoshi.multiplatform.shared

actual open class ViewModel
actual constructor()

// no lifecycle to hook into —
// this class exists so common
// code compiles identically`
    },
    {
      id:'PlatformName',
      note:'The simplest possible actual: a constant. Common code that needs to branch on platform — file picker behaviour, storage permission prompts — reads <code>PLATFORM</code> instead of using <code>expect/actual</code> functions for every difference.',
      android:`package tanoshi.multiplatform.shared.util

import tanoshi.multiplatform.common.util.Platform

actual val PLATFORM: Platform =
    Platform.Android`,
      desktop:`package tanoshi.multiplatform.shared.util

import tanoshi.multiplatform.common.util.Platform

actual val PLATFORM: Platform =
    Platform.Desktop`
    },
    {
      id:'ExtensionLoader',
      note:'The declaration in commonMain just says an ExtensionLoader can load classes and reload them. Android\'s actual (not shown) uses DexClassLoader for .dex files. Desktop\'s actual, below, uses a plain URLClassLoader against a .jar — same interface, completely different class-loading mechanism underneath.',
      android:`// androidMain — DexClassLoader path
// loads a .dex-compiled extension
// through Android's own class
// loading APIs (full file elided)`,
      desktop:`actual fun loadTanoshiExtension(
    extensionPackage: ExtensionPackage,
    classNameList: List<String>
) {
    val classLoader = URLClassLoader(
        arrayOf(extensionPackage
            .jarOrDexPath.absolutePath.url),
        this.javaClass.classLoader
    )
    classNameList.forEach { className ->
        val loadedClass =
            classLoader.loadClass(className)
        val obj = loadedClass
            .getDeclaredConstructor()
            .newInstance() as Extension<*>
        loadExtensionPermission(
            className, obj,
            extensionPackage.manifest
                .extensionNamespace!!
        )
    }
}`
    },
  ];

  function render(idx){
    const p = pairs[idx];
    panelsRoot.innerHTML = `
      <div class="ea-col android">
        <div class="ea-col-head"><span class="dot"></span>androidMain / ${p.id}.android.kt</div>
        <div class="ea-code">${hl(p.android)}</div>
      </div>
      <div class="ea-col desktop">
        <div class="ea-col-head"><span class="dot"></span>desktopMain / ${p.id}.desktop.kt</div>
        <div class="ea-code">${hl(p.desktop)}</div>
      </div>
      <div class="ea-note" style="grid-column:1/-1;">${p.note}</div>
    `;
  }

  pairs.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'ea-tab' + (i===0 ? ' active' : '');
    btn.textContent = p.id;
    btn.addEventListener('click', () => {
      tabsRoot.querySelectorAll('.ea-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      render(i);
    });
    tabsRoot.appendChild(btn);
  });
  render(0);
})();

/* ---------- window stack signature demo ---------- */
(function windowStack(){
  const stage = document.getElementById('stage');
  const pushBtn = document.getElementById('pushBtn');
  const popBtn = document.getElementById('popBtn');
  const log = document.getElementById('lifecycleLog');
  if(!stage) return;

  const names = ['MainActivity', 'BrowseActivity', 'DynamicActivity', 'CrashHandlingActivity'];
  let stack = [];
  let counter = 0;

  function logLine(activity, method){
    const div = document.createElement('div');
    div.className = 'll-line';
    div.innerHTML = `<span class="m">${method}()</span> — ${activity}`;
    log.prepend(div);
    while(log.children.length > 30) log.removeChild(log.lastChild);
  }

  function renderStage(){
    stage.innerHTML = '';
    stack.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'activity-card' + (i === stack.length - 1 ? ' visible' : '');
      card.style.transform = `scale(${1 - (stack.length - 1 - i) * 0.04}) translateY(${(stack.length - 1 - i) * -6}px)`;
      card.innerHTML = `<div class="a-name">${item.name}</div><div class="a-depth">depth ${i} · id #${item.id}</div>`;
      stage.appendChild(card);
    });
  }

  function push(){
    if(stack.length >= 4){ logLine('WindowStack', 'full — pop something first'); return; }
    const prevTop = stack[stack.length - 1];
    if(prevTop) logLine(prevTop.name, 'onPause');
    counter++;
    const name = names[Math.min(stack.length, names.length - 1)];
    stack.push({ name, id: counter });
    logLine(name, 'onCreate');
    renderStage();
    popBtn.disabled = stack.length <= 1;
  }

  function pop(){
    if(stack.length <= 1) return;
    const top = stack.pop();
    logLine(top.name, 'onDestroy');
    const newTop = stack[stack.length - 1];
    if(newTop) logLine(newTop.name, 'onResume');
    renderStage();
    popBtn.disabled = stack.length <= 1;
  }

  // start with MainActivity, as the real app does
  counter++;
  stack.push({ name:'MainActivity', id: counter });
  renderStage();
  popBtn.disabled = true;

  pushBtn.addEventListener('click', push);
  popBtn.addEventListener('click', pop);

  const io = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting){
      logLine('MainActivity', 'onCreate');
      io.disconnect();
    }
  }, { threshold: 0.4 });
  io.observe(stage);
})();

/* ---------- extension anatomy ---------- */
(function annotations(){
  const listRoot = document.getElementById('annoList');
  const codeRoot = document.getElementById('annoCode');
  if(!listRoot) return;

  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

  const fullCode = `@IconName( "icon.png" )
class Gogoanime : PlayableExtension, SharedDependencies() {

    @Variable( "Sub", "enableSub" )
    var isSubEnabled = false

    override val name: String = "Gogoanime"
    override val domainsList = SelectableMenu(
        "https://ww2.gogoanimes.fi/"
    )
    override val language: String = "English"

    @VariableReciever( "searchEnabled" )
    override fun search(name: String, index: Int)
        : List<PlayableEntry> {
        // scrapes gogoanimes.fi with
        // OkHttp + Jsoup, returns entries
    }

    @VariableReciever( "enableDub", "enableSub" )
    @ExportTab( "Popular" )
    fun popular( pageIndex: Int ): List<PlayableEntry> {
        return search( "popular", pageIndex )
    }

    @ExportComposable( "Hello World Composable" )
    fun helloWorld(){
        exportComposable?.let { start ->
            (@Composable{ HelloWorld() }).start()
        } ?: showToast?.let {
            "Allow Composable Access".it( SHORT )
        }
    }
}`;

  const annotations = [
    { tag:'@IconName', desc:'points at the icon resource bundled in the extension\'s jar, shown in the extension list.', match:/@IconName\([^)]*\)/ },
    { tag:'@Variable', desc:'marks a field the host app can expose as a user-facing toggle — the public name is what a person sees, the unique name is the storage key.', match:/@Variable\([^)]*\)\s*\n\s*var isSubEnabled = false/ },
    { tag:'@VariableReciever', desc:'declares which @Variable-marked fields a function actually reads, so the settings UI knows what to show next to it.', match:/@VariableReciever\( "searchEnabled" \)/ },
    { tag:'@ExportTab', desc:'turns a function into a named, browsable tab inside the app — this is how "Popular" becomes a real screen without any app-side code.', match:/@ExportTab\( "Popular" \)/ },
    { tag:'@ExportComposable', desc:'the permission-gated escape hatch: if the app has granted it, this function can push an entire custom Compose UI into the host — used here for a demo screen, gated behind the exact toggle in the section below.', match:/@ExportComposable\( "Hello World Composable" \)[\s\S]*?\n    \}/ },
  ];

  function highlightBase(code){
    return esc(code)
      .replace(/\/\/.*$/gm, m => `<span class="cm">${m}</span>`)
      .replace(/@\w+/g, m => `<span class="an">${m}</span>`)
      .replace(/\b(class|fun|var|val|override|return)\b/g, '<span class="kw">$1</span>')
      .replace(/"(.*?)"/g, m => `<span class="ty">${m}</span>`);
  }

  codeRoot.innerHTML = highlightBase(fullCode);

  annotations.forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'anno';
    row.innerHTML = `<div class="a-tag">${a.tag}</div><div class="a-desc">${a.desc}</div>`;
    row.addEventListener('click', () => {
      listRoot.querySelectorAll('.anno').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      // simple scroll-to-annotation-in-code via highlighting the tag occurrences
      let html = highlightBase(fullCode);
      html = html.replace(new RegExp('(<span class="an">'+a.tag+'</span>)'), '<mark>$1</mark>');
      codeRoot.innerHTML = html;
    });
    listRoot.appendChild(row);
  });
})();

/* ---------- permission toggles ---------- */
(function permissions(){
  const root = document.getElementById('permList');
  const toast = document.getElementById('permToast');
  if(!root) return;

  const perms = [
    { name:'StartComposableView', desc:'lets the extension push a full custom screen (exportComposable)', on:false },
    { name:'Logger', desc:'gives the extension a handle to the app\'s Logger instance', on:false },
    { name:'ShowToast', desc:'lets the extension trigger a native toast message', on:false },
  ];

  perms.forEach(p => {
    const row = document.createElement('div');
    row.className = 'perm-row';
    row.innerHTML = `
      <div class="p-info"><div class="p-name">${p.name}</div><div class="p-desc">${p.desc}</div></div>
      <button class="toggle" aria-label="toggle ${p.name}"><span class="knob"></span></button>
    `;
    const btn = row.querySelector('.toggle');
    btn.addEventListener('click', () => {
      p.on = !p.on;
      btn.classList.toggle('on', p.on);
      toast.textContent = p.on
        ? `→ Gogoanime.${p.name} written true · reloadClass("Gogoanime", extensionPackage) called`
        : `→ Gogoanime.${p.name} written false · extension reloaded without this capability`;
    });
    root.appendChild(row);
  });
})();

/* ---------- LOC bars ---------- */
(function locBars(){
  const root = document.getElementById('locBars');
  if(!root) return;

  const data = [
    { label:'commonMain', loc:3142, files:78, cls:'shared' },
    { label:'androidMain', loc:1068, files:19, cls:'android' },
    { label:'desktopMain', loc:891, files:17, cls:'desktop' },
  ];
  const max = Math.max(...data.map(d => d.loc));

  data.forEach(d => {
    const row = document.createElement('div');
    row.className = 'locbar-row';
    row.innerHTML = `
      <div>${d.label}</div>
      <div class="locbar-track"><div class="locbar-fill ${d.cls}" data-w="${(d.loc/max*100).toFixed(0)}"></div></div>
      <div>${d.loc} loc</div>
    `;
    root.appendChild(row);
  });

  const io = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting){
      root.querySelectorAll('.locbar-fill').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.w + '%'; }, 100);
      });
      io.disconnect();
    }
  }, { threshold: 0.4 });
  io.observe(root);
})();

/* ---------- commit timeline ---------- */
(function timeline(){
  const root = document.getElementById('tl');
  if(!root) return;

  const months = [
    { label:'December 2023', items:[
      { d:'26', m:'initial commit — shared navigation with a custom back-button hook', milestone:true },
      { d:'28', m:'catch uncaught exceptions app-wide' },
      { d:'29', m:'MVVM decision: desktop made ViewModel-compatible to share logic with Android', milestone:true },
      { d:'29', m:'first extension interfaces: Content, Container, Extension' },
      { d:'31', m:'class for loading extensions at runtime' },
    ]},
    { label:'January 2024', items:[
      { d:'02', m:'extension manager' },
      { d:'13', m:'custom class loader to restrict extension dependencies', milestone:true },
      { d:'14', m:'SharedApplicationData for cross-window/activity state' },
    ]},
  ];

  root.innerHTML = '';
  months.forEach(month => {
    const label = document.createElement('div');
    label.className = 'tl-month';
    label.textContent = month.label;
    root.appendChild(label);
    month.items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'tl-item' + (item.milestone ? ' milestone' : '');
      div.innerHTML = `<span class="d">${item.d}</span><span class="msg">${item.m}</span>`;
      root.appendChild(div);
    });
  });

  const gap1 = document.createElement('div');
  gap1.className = 'tl-gap';
  gap1.textContent = '↓ quiet through spring — a handful of orientation fixes land in Feb and May';
  root.appendChild(gap1);

  const summer = document.createElement('div');
  summer.className = 'tl-month';
  summer.textContent = 'July 2024';
  root.appendChild(summer);
  [{d:'06',m:'"Big changes": logger rework, extension subproject for testing, desktop back handling',milestone:true}]
    .forEach(item => {
      const div = document.createElement('div');
      div.className = 'tl-item milestone';
      div.innerHTML = `<span class="d">${item.d}</span><span class="msg">${item.m}</span>`;
      root.appendChild(div);
    });

  const sept = document.createElement('div');
  sept.className = 'tl-month';
  sept.textContent = 'September 2024 — the big push';
  root.appendChild(sept);
  [
    { d:'03', m:'android storage permission + app dir access from common code' },
    { d:'06', m:'extension manager/loader rewritten on desktop and android in the same week', milestone:true },
    { d:'07', m:'migrate to Kotlin 2, move deps into libs.versions.toml' },
    { d:'13', m:'dynamically load UI from an extension; splash screen' },
    { d:'14', m:'per-extension settings, animated back button, activity export' },
    { d:'19', m:'move to Material3; bare-bones ResultGrid' },
    { d:'21', m:'image caching; ResultGrid animated; browse screen finalized', milestone:true },
    { d:'23', m:'versioned DB using Exposed; library entries' },
  ].forEach(item => {
    const div = document.createElement('div');
    div.className = 'tl-item' + (item.milestone ? ' milestone' : '');
    div.innerHTML = `<span class="d">${item.d}</span><span class="msg">${item.m}</span>`;
    root.appendChild(div);
  });

  const octgap = document.createElement('div');
  octgap.className = 'tl-gap';
  octgap.textContent = '↓ raw SQL support and a storage migration land in early October — then four months of silence';
  root.appendChild(octgap);

  const jan = document.createElement('div');
  jan.className = 'tl-month';
  jan.textContent = 'January 2025';
  root.appendChild(jan);
  [{d:'26', m:'delegate Android activity lifecycle to a dedicated DelegatedBehaviourHandler class', milestone:true}]
    .forEach(item => {
      const div = document.createElement('div');
      div.className = 'tl-item milestone';
      div.innerHTML = `<span class="d">${item.d}</span><span class="msg">${item.m}</span>`;
      root.appendChild(div);
    });
})();
