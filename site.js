// SideStack website. Add storeUrl once the Store listing is live.
const SITE = {
  // e.g. "https://apps.microsoft.com/detail/9XXXXXXXXXXX" (Partner Center shows it once the app is published).
  storeUrl: "",
  supportEmail: "karthik2006.dev@gmail.com",
};

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Store and support links ----------
  for (const a of $$(".store-link")) {
    if (SITE.storeUrl) {
      a.href = SITE.storeUrl;
      a.target = "_blank";
      a.rel = "noopener";
    } else if (a.classList.contains("btn")) {
      a.setAttribute("aria-disabled", "true");
      const small = $(".store-small", a), label = $(".store-label", a);
      if (small) small.textContent = "Coming soon to the";
      if (label) label.textContent = "Microsoft Store";
    }
  }
  for (const n of $$(".store-note")) n.textContent = SITE.storeUrl
    ? "On the Microsoft Store, with updates delivered automatically."
    : "Coming soon to the Microsoft Store, with updates delivered automatically.";
  if (SITE.supportEmail) for (const a of $$(".support-link")) { a.href = `mailto:${SITE.supportEmail}`; a.hidden = false; }
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();

  // ---------- Privacy policy popup (#privacy-policy opens it, so the address can be shared) ----------
  const policy = $("#privacy-policy");
  const openPolicy = (push = true) => {
    if (!policy || policy.open) return;
    policy.showModal();
    document.body.classList.add("modal-open");
    if (push && location.hash !== "#privacy-policy") history.pushState(null, "", "#privacy-policy");
  };
  const closePolicy = () => policy?.open && policy.close();
  policy?.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (location.hash === "#privacy-policy") history.replaceState(null, "", location.pathname + location.search);
  });
  policy?.addEventListener("click", e => { if (e.target === policy) closePolicy(); }); // a click on the dimmed backdrop
  for (const b of $$("[data-close-policy]")) b.addEventListener("click", closePolicy);
  for (const a of $$("[data-open-policy]")) a.addEventListener("click", e => { e.preventDefault(); openPolicy(); });
  const syncPolicy = () => (location.hash === "#privacy-policy" ? openPolicy(false) : closePolicy());
  addEventListener("hashchange", syncPolicy);
  addEventListener("popstate", syncPolicy);
  syncPolicy();

  // ---------- Light / dark switch (remembered on this device) ----------
  const root = document.documentElement;
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : prefersDark.matches;
  $("#mode")?.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("ss-theme", root.dataset.theme); } catch (e) { /* private mode: just this visit */ }
    applyTheme(current);
  });

  // ---------- Apps (offered in the app's Discover) ----------
  const APPS = [
    ["WhatsApp", "#25D366"], ["Telegram", "#229ED9"], ["Discord", "#5865F2"], ["Messenger", "#0866FF"],
    ["Google Messages", "#1A73E8"], ["Google Chat", "#00AC47"], ["Slack", "#E01E5A"], ["Google Meet", "#00AC47"],
    ["Zoom", "#0B5CFF"], ["Gmail", "#EA4335"], ["Outlook", "#0F6CBD"], ["Proton Mail", "#6D4AFF"],
    ["Instagram", "#E1306C"], ["Facebook", "#0866FF"], ["X", "#8899A6"], ["LinkedIn", "#0A66C2"],
    ["Spotify", "#1DB954"], ["YouTube Music", "#FF0033"], ["ChatGPT", "#10A37F"], ["Claude", "#D97757"],
    ["Gemini", "#4E7BF6"], ["Copilot", "#2B88D8"], ["Perplexity", "#20808D"],
  ];
  const apps = $("#apps");
  if (apps) for (const [name, colour] of APPS) {
    const s = document.createElement("span");
    s.innerHTML = `<i style="background:${colour}"></i>${name}`;
    apps.append(s);
  }
  const side = $("#side");
  if (side) APPS.slice(0, 6).concat([APPS[16], APPS[18]]).forEach(([, colour], i) => {
    const b = document.createElement("b");
    b.style.background = `linear-gradient(135deg, ${colour}, color-mix(in srgb, ${colour} 70%, #000))`;
    if (i === 0) b.className = "on";
    side.append(b);
  });

  // ---------- Themes (the same ones as the app) ----------
  const THEMES = [
    { name: "Dynamic", dynamic: true },
    { name: "Light", dark: false, a: "#f3f3f6", b: "#e9e9ef", accent: "#0a64d8" },
    { name: "Dark", dark: true, a: "#202024", b: "#16161a", accent: "#4c9aff" },
    { name: "Midnight", dark: true, a: "#0E1733", b: "#1A1240", accent: "#5B8CFF" },
    { name: "Plum", dark: true, a: "#1E1030", b: "#2C0F2A", accent: "#C084FC" },
    { name: "Forest", dark: true, a: "#0C1F18", b: "#122417", accent: "#34D399" },
    { name: "Ember", dark: true, a: "#24120C", b: "#2A0E16", accent: "#FB923C" },
    { name: "Ocean", dark: false, a: "#E3EEFF", b: "#E8F7FB", accent: "#0A64D8" },
    { name: "Rose", dark: false, a: "#FDE8EF", b: "#FBEAF6", accent: "#C22D6B" },
    { name: "Sage", dark: false, a: "#E5F2E8", b: "#EEF5E1", accent: "#237A4B" },
    { name: "Sand", dark: false, a: "#F7EEDF", b: "#F9E9E1", accent: "#A3561A" },
  ];
  // "Album art" for the Dynamic demo: each song's colours glow out behind the title bar and sidebar.
  const SONGS = [
    { title: "Midnight City", colours: ["#ff4fa3", "#7c5cff", "#ffb347"] },
    { title: "Blinding Lights", colours: ["#ff3b30", "#ff9500", "#5856d6"] },
    { title: "Ocean Eyes", colours: ["#22d3ee", "#2563eb", "#a78bfa"] },
    { title: "Electric Feel", colours: ["#a3e635", "#10b981", "#facc15"] },
  ];

  const win = $("#window");
  const picker = $("#picker");
  let current = THEMES[0];
  let song = 0;
  let timer = null;

  const darkOf = (hex, t) => `color-mix(in srgb, ${hex} ${Math.round((1 - t) * 100)}%, #08080c)`;
  const lightOf = (hex, t) => `color-mix(in srgb, ${hex} ${Math.round((1 - t) * 100)}%, #fafafc)`;

  function paintSong() {
    const s = SONGS[song % SONGS.length];
    const dark = isDark();
    win.style.setProperty("--glow-1", s.colours[0]);
    win.style.setProperty("--glow-2", s.colours[1]);
    win.style.setProperty("--glow-3", s.colours[2]);
    win.style.setProperty("--tint-a", dark ? darkOf(s.colours[0], .78) : lightOf(s.colours[0], .86));
    win.style.setProperty("--tint-b", dark ? darkOf(s.colours[1], .78) : lightOf(s.colours[1], .86));
    win.style.setProperty("--accent", s.colours[1]);
    win.classList.toggle("light-ui", !dark);
    const note = $("#nowPlaying"); if (note) note.textContent = `· ♪ ${s.title}`;
  }

  function applyTheme(theme) {
    current = theme;
    clearInterval(timer);
    win.classList.toggle("dynamic", !!theme.dynamic);
    if (theme.dynamic) {
      paintSong();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => { song++; paintSong(); }, 4200);
    } else {
      const t = theme;
      win.style.setProperty("--tint-a", t.a);
      win.style.setProperty("--tint-b", t.b);
      win.style.setProperty("--accent", t.accent);
      win.classList.toggle("light-ui", !t.dark);
      const note = $("#nowPlaying"); if (note) note.textContent = "";
    }
    for (const b of $$(".swatch", picker)) b.setAttribute("aria-pressed", String(b.dataset.name === theme.name));
  }

  if (win && picker) {
    for (const t of THEMES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.name = t.name;
      const fill = t.dynamic ? "linear-gradient(135deg,#7c5cff,#ff4fa3,#1db954)" : `linear-gradient(135deg,${t.a},${t.b})`;
      b.innerHTML = `<i style="background:${fill}"></i>${t.name}`;
      b.addEventListener("click", () => applyTheme(t));
      picker.append(b);
    }
    prefersDark.addEventListener?.("change", () => applyTheme(current));
    applyTheme(current);
  }
})();
