
/* =========================================================
   MADHI STUDIO — SITE PREFERENCES
========================================================= */
(() => {
  'use strict';
  const root = document.documentElement;
  const THEME_KEY = 'madhi-theme';
  const MOTION_KEY = 'madhi-motion';

  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };

  const readWindowTheme = () => {
    try {
      const match = String(window.name || '').match(/(?:^|\|)madhi-theme:(dark|light)(?:\||$)/);
      return match ? match[1] : null;
    } catch (_) { return null; }
  };

  const writeWindowTheme = value => {
    try {
      const current = String(window.name || '')
        .split('|')
        .filter(part => part && !part.startsWith('madhi-theme:'));
      current.push(`madhi-theme:${value}`);
      window.name = current.join('|');
    } catch (_) {}
  };

  const readUrlTheme = () => {
    try {
      const value = new URL(window.location.href).searchParams.get('theme');
      return value === 'dark' || value === 'light' ? value : null;
    } catch (_) { return null; }
  };

  const savedTheme = readUrlTheme() || read(THEME_KEY) || readWindowTheme();
  const savedMotion = read(MOTION_KEY);
  root.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
  write(THEME_KEY, root.dataset.theme);
  writeWindowTheme(root.dataset.theme);
  root.dataset.motion = savedMotion === 'off' ? 'off' : (savedMotion === 'on' ? 'on' : (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on'));

  function isThemeCarryLink(anchor) {
    const raw = anchor?.getAttribute?.('href');
    if (!raw || raw.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(raw)) return false;
    try {
      const url = new URL(raw, window.location.href);
      if (url.protocol === 'file:') return window.location.protocol === 'file:';
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === window.location.origin;
    } catch (_) { return false; }
  }

  function syncThemeToInternalLinks() {
    const currentTheme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    document.querySelectorAll('a[href]').forEach(anchor => {
      if (!isThemeCarryLink(anchor)) return;
      try {
        const url = new URL(anchor.getAttribute('href'), window.location.href);
        url.searchParams.set('theme', currentTheme);
        anchor.href = url.href;
      } catch (_) {}
    });
  }

  const motionEnabled = () => root.dataset.motion !== 'off';

  function embeddedDocument(node) {
    try { return node.contentDocument || node.getSVGDocument?.() || null; } catch (_) { return null; }
  }

  function syncEmbeddedMotion(node) {
    const doc = embeddedDocument(node);
    if (!doc?.documentElement) return;
    doc.documentElement.dataset.motion = root.dataset.motion;
    let style = doc.getElementById('madhi-parent-motion-policy');
    if (!motionEnabled()) {
      if (!style) {
        style = doc.createElement('style');
        style.id = 'madhi-parent-motion-policy';
        style.textContent = '*,:before,:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
        (doc.head || doc.documentElement).appendChild(style);
      }
      try { doc.getAnimations?.().forEach(animation => animation.pause()); } catch (_) {}
      try { doc.querySelectorAll('video,audio').forEach(media => media.pause()); } catch (_) {}
    } else {
      style?.remove();
      try { doc.getAnimations?.().forEach(animation => animation.play()); } catch (_) {}
    }
  }

  function syncAllEmbeddedMotion() {
    document.querySelectorAll('iframe, object').forEach(node => syncEmbeddedMotion(node));
  }

  function updatePreferenceControls() {
    const themeButton = document.getElementById('themeToggle');
    const motionButton = document.getElementById('motionToggle');
    const dark = root.dataset.theme === 'dark';
    const moving = motionEnabled();
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark mode');
      themeButton.title = dark ? 'Light mode' : 'Dark mode';
    }
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(moving));
      motionButton.setAttribute('aria-label', moving ? 'Turn motion off' : 'Turn motion on');
      motionButton.title = moving ? 'Motion on' : 'Motion off';
    }
  }

  function applyTheme(theme, persist = true) {
    root.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    if (persist) write(THEME_KEY, root.dataset.theme);
    writeWindowTheme(root.dataset.theme);
    updatePreferenceControls();
    syncThemeToInternalLinks();
    window.dispatchEvent(new CustomEvent('madhi:themechange', { detail: { theme: root.dataset.theme } }));
  }

  function applyMotion(mode, persist = true) {
    root.dataset.motion = mode === 'off' ? 'off' : 'on';
    if (persist) write(MOTION_KEY, root.dataset.motion);
    updatePreferenceControls();
    syncAllEmbeddedMotion();
    window.dispatchEvent(new CustomEvent('madhi:motionchange', { detail: { enabled: motionEnabled() } }));
  }

  function setupPreferenceControls() {
    updatePreferenceControls();
    document.getElementById('themeToggle')?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
    document.getElementById('motionToggle')?.addEventListener('click', () => applyMotion(motionEnabled() ? 'off' : 'on'));
    document.querySelectorAll('iframe, object').forEach(node => node.addEventListener('load', () => syncEmbeddedMotion(node)));
    syncAllEmbeddedMotion();
    syncThemeToInternalLinks();
  }

  window.addEventListener('madhi:shellready', syncThemeToInternalLinks);

  window.addEventListener('pageshow', () => {
    const persisted = readUrlTheme() || read(THEME_KEY) || readWindowTheme();
    if (persisted === 'dark' || persisted === 'light') {
      applyTheme(persisted, false);
    }
  });

  window.MadhiPreferences = { motionEnabled, applyTheme, applyMotion, syncAllEmbeddedMotion, syncThemeToInternalLinks, setupPreferenceControls };
})();



function ensureAltHeaderColorLock() {
  if (document.documentElement.dataset.headerStyle !== 'alt') return;
  if (document.getElementById('madhi-alt-header-color-lock')) return;
  const style = document.createElement('style');
  style.id = 'madhi-alt-header-color-lock';
  style.textContent = `
    html[data-header-style="alt"] nav.site-nav-global,
    html[data-header-style="alt"] nav.site-nav-global .nav-inner {
      background: var(--madhi-alt-header-bg) !important;
      background-color: var(--madhi-alt-header-bg) !important;
    }
    html[data-header-style="alt"][data-theme="dark"] nav.site-nav-global,
    html[data-header-style="alt"][data-theme="dark"] nav.site-nav-global .nav-inner {
      background: #3b424c !important;
      background-color: #3b424c !important;
    }
    html[data-header-style="alt"] nav.site-nav-global,
    html[data-header-style="alt"][data-theme="dark"] nav.site-nav-global {
      border-top: 0 !important;
      border-bottom: 0 !important;
      border-bottom-width: 0 !important;
      border-bottom-style: none !important;
      border-bottom-color: transparent !important;
      box-shadow: none !important;
      outline: 0 !important;
    }
    html[data-header-style="alt"] nav.site-nav-global::before,
    html[data-header-style="alt"][data-theme="dark"] nav.site-nav-global::before {
      content: none !important;
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    html[data-header-style="alt"] nav.site-nav-global::after,
    html[data-header-style="alt"][data-theme="dark"] nav.site-nav-global::after {
      content: none !important;
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    html[data-header-style="alt"] .site-nav-global .logo img,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .logo img {
      filter: none !important;
      opacity: 1 !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-links > a,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a {
      color: #fff !important;
      background: transparent !important;
      border-color: transparent !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-links > a:hover,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a:hover {
      color: #fff !important;
      background: transparent !important;
      border: 2px solid #fff !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-links > a.section-current:not(.active),
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a.section-current:not(.active) {
      color: #fff !important;
      background: transparent !important;
      border: 2px solid #fff !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-links > a.active,
    html[data-header-style="alt"] .site-nav-global .nav-links > a.active:hover,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a.active,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a.active:hover {
      color: #fff !important;
      background: var(--accent) !important;
      border: 2px solid transparent !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-divider,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-divider {
      width: 2px !important;
      flex: 0 0 2px !important;
      background: rgba(255,255,255,.40) !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-toggle,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-toggle {
      color: #fff !important;
      background: transparent !important;
      border-color: #fff !important;
    }
    html[data-header-style="alt"] .site-nav-global .nav-toggle span,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-toggle span {
      background: #fff !important;
    }
    html[data-header-style="alt"] body > main,
    html[data-header-style="alt"] body > main > :first-child {
      border-top: 0 !important;
      box-shadow: none !important;
      outline: none !important;
    }
    @media (max-width: 1100px) {
      html[data-header-style="alt"] .site-nav-global .nav-links {
        background: var(--madhi-alt-header-bg) !important;
        background-color: var(--madhi-alt-header-bg) !important;
        border-bottom-color: rgba(255,255,255,.40) !important;
      }
      html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links {
        background: #3b424c !important;
        background-color: #3b424c !important;
        border-bottom-color: rgba(255,255,255,.40) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureGlobalDisplayPolishLock() {
  if (document.getElementById('madhi-global-display-polish-lock')) return;
  const style = document.createElement('style');
  style.id = 'madhi-global-display-polish-lock';
  style.textContent = `
    /* Motion setting remains implemented, but its control is intentionally hidden/disabled. */
    #motionToggle { display: none !important; }

    /* Exact half-black / half-white theme disc; black border in light, white border in dark. */
    #themeToggle,
    html[data-theme="dark"] #themeToggle {
      position: relative !important;
      overflow: hidden !important;
      padding: 0 !important;
      border-width: 2px !important;
      border-style: solid !important;
      border-color: #111111 !important;
      border-radius: 999px !important;
      background: linear-gradient(90deg, #111111 0%, #111111 50%, #ffffff 50%, #ffffff 100%) !important;
      background-image: linear-gradient(90deg, #111111 0%, #111111 50%, #ffffff 50%, #ffffff 100%) !important;
      color: transparent !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.14) !important;
    }
    #themeToggle::before,
    #themeToggle::after { content: none !important; display: none !important; }
    #themeToggle .preference-glyph { display: none !important; }
    #themeToggle:hover,
    #themeToggle:focus-visible { border-color: #111111 !important; }
    html[data-theme="dark"] #themeToggle,
    html[data-theme="dark"] #themeToggle:hover,
    html[data-theme="dark"] #themeToggle:focus-visible { border-color: #ffffff !important; }

    /* Hero service links use a subtle visual-bold hover without moving. */
    html[data-header-style="alt"] .hero-service-pills a {
      font-weight: 400 !important;
      transform: none !important;
      filter: none !important;
      text-shadow: 0 0 transparent !important;
      transition: color .16s ease, text-shadow .16s ease !important;
    }
    html[data-header-style="alt"] .hero-service-pills a:hover,
    html[data-header-style="alt"] .hero-service-pills a:focus-visible,
    html[data-header-style="alt"][data-theme="dark"] .hero-service-pills a:hover,
    html[data-header-style="alt"][data-theme="dark"] .hero-service-pills a:focus-visible {
      color: var(--accent) !important;
      font-weight: 400 !important;
      transform: none !important;
      filter: none !important;
      text-shadow: .35px 0 currentColor, -.35px 0 currentColor !important;
    }

    /* Contact current viewport is indicated only by the nav pill on blue-header pages. */
    html[data-header-style="alt"] .site-nav-global a[data-nav="contact"].section-current::after,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global a[data-nav="contact"].section-current::after,
    html[data-header-style="alt"] .site-nav-global a[data-nav="contact"].active.section-current::after,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global a[data-nav="contact"].active.section-current::after {
      content: none !important;
      display: none !important;
    }

    /* Active blue-header nav pill has no visible border. */
    html[data-header-style="alt"] .site-nav-global .nav-links > a.active,
    html[data-header-style="alt"] .site-nav-global .nav-links > a.active:hover,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a.active,
    html[data-header-style="alt"][data-theme="dark"] .site-nav-global .nav-links > a.active:hover {
      color: #ffffff !important;
      background: var(--accent) !important;
      border-color: transparent !important;
    }

    /* Dark mode: visible site buttons are white with black labels until hovered. */
    html[data-theme="dark"] :is(
      a.btn,
      .btn.primary,
      .section-action,
      .landing-feature-explore,
      .sitemap-main-link,
      .hub-main-link,
      .card-main-link,
      .aviation-main-link,
      .contact-submit,
      .cta-contact-button,
      .preview-popout,
      .popout-action,
      .aerowordsmith-fullscreen,
      .aoe-learning-replay,
      button:not(#themeToggle):not(#motionToggle):not(.nav-toggle):not(.attachment-browse)
    ) {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #111111 !important;
      border-color: transparent !important;
    }
    html[data-theme="dark"] :is(
      a.btn,
      .btn.primary,
      .section-action,
      .landing-feature-explore,
      .sitemap-main-link,
      .hub-main-link,
      .card-main-link,
      .aviation-main-link,
      .contact-submit,
      .cta-contact-button,
      .preview-popout,
      .popout-action,
      .aerowordsmith-fullscreen,
      .aoe-learning-replay,
      button:not(#themeToggle):not(#motionToggle):not(.nav-toggle):not(.attachment-browse)
    ):is(:hover, :focus-visible) {
      background: var(--accent) !important;
      background-color: var(--accent) !important;
      color: #ffffff !important;
      border-color: transparent !important;
    }

    /* UI demo button follows the same rule in dark mode. */
    html[data-theme="dark"] .soccer-demo button:not(.is-active) {
      background: #ffffff !important;
      color: #111111 !important;
      border-color: transparent !important;
    }
    html[data-theme="dark"] .soccer-demo button:not(.is-active):hover,
    html[data-theme="dark"] .soccer-demo button:not(.is-active):focus-visible {
      background: var(--accent) !important;
      color: #ffffff !important;
      border-color: transparent !important;
    }

    /* Service-number badges use the same face as the service title and stay optically centered. */
    .sitemap-card-top .sitemap-number,
    .hub-card-top .hub-number,
    .card-top .card-number {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
      font-size: 24px !important;
      font-weight: 500 !important;
      line-height: 1 !important;
      text-align: center !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
    }

    /* Pop-out arrows stay black on the white resting button, white on green hover. */
    html[data-theme="dark"] .preview-popout,
    html[data-theme="dark"] .popout-action,
    html[data-theme="dark"] .preview-popout svg,
    html[data-theme="dark"] .popout-action svg,
    html[data-theme="dark"] .preview-popout .btn-arrow,
    html[data-theme="dark"] .popout-action .btn-arrow {
      color: #111111 !important;
      border-color: transparent !important;
    }
    html[data-theme="dark"] .preview-popout:hover,
    html[data-theme="dark"] .preview-popout:focus-visible,
    html[data-theme="dark"] .popout-action:hover,
    html[data-theme="dark"] .popout-action:focus-visible,
    html[data-theme="dark"] .preview-popout:hover svg,
    html[data-theme="dark"] .preview-popout:focus-visible svg,
    html[data-theme="dark"] .popout-action:hover svg,
    html[data-theme="dark"] .popout-action:focus-visible svg {
      color: #ffffff !important;
      border-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

function mountSiteShell() {
  const currentFile = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";
  const headerStyle = document.documentElement.dataset.headerStyle || "alt";
  const isOriginalStyle = headerStyle === "default";
  const landingFile = isOriginalStyle ? "index-alt.html" : "index.html";
  const navLabels = { branding: "Branding, Logos &amp; Icons", ui: "User Interfaces", motion: "Motion Graphics", web: "Websites &amp; Landing Pages" };

  if (!document.documentElement.dataset.headerStyle) {
    document.documentElement.dataset.headerStyle = "alt";
  }
  ensureAltHeaderColorLock();
  ensureGlobalDisplayPolishLock();
  const navMount = document.getElementById("site-nav");
  const footerMount = document.getElementById("site-footer");

  const shellScript = document.currentScript || document.querySelector('script[src$="site.js"]');
  const shellUrl = new URL(shellScript ? shellScript.src : "../js/site.js", window.location.href);
  const studioRootUrl = new URL("../", shellUrl);
  const siteUrl = (path = "") => new URL(path, studioRootUrl).href;
  
  if (navMount) {
    navMount.innerHTML = `
      <nav class="site-nav-global" aria-label="Primary navigation">
        <div class="nav-inner">
          <div class="logo">
            <a href="${siteUrl(`${landingFile}#home`)}" aria-label="Madhi Studio home">
              <img
                src="${siteUrl(document.documentElement.dataset.headerStyle === "alt"
                  ? (document.documentElement.dataset.theme === "dark" ? "assets/madhi-studio-logo-inverse.svg" : "assets/madhi-studio-logo-inverse-light.svg")
                  : "assets/madhi-studio-logo-alt.svg")}"
                ${document.documentElement.dataset.headerStyle === "alt"
                  ? `data-theme-logo="true" data-light-src="${siteUrl("assets/madhi-studio-logo-inverse-light.svg")}" data-dark-src="${siteUrl("assets/madhi-studio-logo-inverse.svg")}"`
                  : ""}
                alt="Madhi Studio">
            </a>
          </div>
          <div class="nav-links" id="primaryNavLinks">
            <a href="${siteUrl(`${landingFile}#home`)}" data-nav="home">Home</a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl("design/branding-logos.html")}" data-nav="branding-logos" data-section-target="branding-logos"><span class="service-nav-label">${navLabels.branding}</span></a>
            <a href="${siteUrl("design/ui-icons.html")}" data-nav="ui-icons" data-section-target="ui-icons"><span class="service-nav-label">${navLabels.ui}</span></a>
            <a href="${siteUrl("design/motion-graphics.html")}" data-nav="motion-graphics" data-section-target="motion-graphics"><span class="service-nav-label">${navLabels.motion}</span></a>
            <a href="${siteUrl("design/web-design.html")}" data-nav="web-design" data-section-target="web-design"><span class="service-nav-label">${navLabels.web}</span></a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl(`${landingFile}#contact`)}" data-nav="contact">Contact</a>
          </div>
          <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="primaryNavLinks">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
      <div class="site-preferences" aria-label="Display settings">
        <button class="preference-toggle" id="themeToggle" type="button" aria-pressed="false" aria-label="Use dark mode" title="Dark mode"><span class="preference-glyph" aria-hidden="true"></span></button>
        <button class="preference-toggle back-to-top-toggle" id="backToTop" type="button" aria-label="Go back to top of page"><span class="back-to-top-arrow" aria-hidden="true">↑</span><span class="back-to-top-tooltip" role="tooltip">Go back to top of page</span></button>
        <button class="preference-toggle" id="motionToggle" type="button" aria-pressed="true" aria-label="Turn motion off" title="Motion on" hidden disabled tabindex="-1" aria-hidden="true"><span class="preference-glyph" aria-hidden="true"></span></button>
      </div>`;
  }

  if (footerMount) {
    footerMount.innerHTML = `
      <footer>
        <div class="footer-inner">
          <div class="footer-main">© 2026 Madhi Studio | Crafted with Intention</div>
        </div>
      </footer>`;
  }

  const pageToNav = {
    "index.html": "home",
    "index-alt.html": "home",
    "contact.html": "contact",
    "ui-icons.html": "ui-icons",
    "branding-logos.html": "branding-logos",
    "motion-graphics.html": "motion-graphics",
    "web-design.html": "web-design"
  };
  const activeNav = pageToNav[currentFile];
  if (activeNav) document.querySelector(`#site-nav [data-nav="${activeNav}"]`)?.classList.add("active");

  window.MadhiPreferences?.setupPreferenceControls();
  window.dispatchEvent(new CustomEvent('madhi:shellready'));
}

function syncHeaderLogoForTheme() {
  const logo = document.querySelector('.site-nav-global .logo img[data-theme-logo="true"]');
  if (!logo) return;
  const nextSrc = document.documentElement.dataset.theme === 'dark'
    ? logo.dataset.darkSrc
    : logo.dataset.lightSrc;
  if (nextSrc && logo.src !== nextSrc) logo.src = nextSrc;
}

function syncThemeArtworkForTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.querySelectorAll('img[data-theme-light-src][data-theme-dark-src]').forEach((image) => {
    const nextSrc = isDark ? image.dataset.themeDarkSrc : image.dataset.themeLightSrc;
    if (!nextSrc) return;
    const resolved = new URL(nextSrc, image.baseURI).href;
    if (image.src !== resolved) image.src = resolved;
  });
}

window.addEventListener('madhi:themechange', syncHeaderLogoForTheme);
window.addEventListener('madhi:themechange', syncThemeArtworkForTheme);

if (document.getElementById("site-nav") || document.getElementById("site-footer")) {
  mountSiteShell();
  syncHeaderLogoForTheme();
  syncThemeArtworkForTheme();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    mountSiteShell();
    syncHeaderLogoForTheme();
    syncThemeArtworkForTheme();
  }, { once: true });
}



(() => {
  const setupMobileNav = () => {
    const nav = document.querySelector('nav');
    if (!nav || nav.dataset.mobileReady === 'true') return;
    nav.dataset.mobileReady = 'true';
    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelector('.nav-links');
    if (!toggle || !links) return;

    const closeMenu = () => {
      nav.classList.remove('mobile-open');
      document.body.classList.remove('mobile-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };
    toggle.addEventListener('click', () => {
      const willOpen = !nav.classList.contains('mobile-open');
      nav.classList.toggle('mobile-open', willOpen);
      document.body.classList.toggle('mobile-menu-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMobileNav);
  else setupMobileNav();
  window.addEventListener('madhi:shellready', setupMobileNav);
})();


/* SOURCE: landing.js */
/* Madhi Studio main landing page interactions.
   Hero timing and accent choreography match the supplied scrollytelling reference. */

const typeLineOneText = document.getElementById("typeLineOneText");
const typeLineTwoBefore = document.getElementById("typeLineTwoBefore");
const typeAccentMessage = document.getElementById("typeAccentMessage");
const typeLineThreeBefore = document.getElementById("typeLineThreeBefore");
const typeAccentAudience = document.getElementById("typeAccentAudience");
const typeLineFourBefore = document.getElementById("typeLineFourBefore");
const typeAccentTime = document.getElementById("typeAccentTime");
const heroPeriod = document.getElementById("heroPeriod");

const typingCursor = document.createElement("span");
typingCursor.className = "typing-cursor";
typingCursor.id = "typingCursor";

const hasTypewriterHero = Boolean(
  typeLineOneText &&
  typeLineTwoBefore &&
  typeAccentMessage &&
  typeLineThreeBefore &&
  typeAccentAudience &&
  typeLineFourBefore &&
  typeAccentTime &&
  heroPeriod
);

const typeSteps = hasTypewriterHero ? [
  { target: typeLineOneText, text: "There’s nothing more powerful", pauseAfterWord: 230, pauseAfterLine: 1250 },
  { target: typeLineTwoBefore, text: "than getting the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentMessage, text: "right message", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true },
  { target: typeLineThreeBefore, text: "to the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentAudience, text: "right audience", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true },
  { target: typeLineFourBefore, text: "at the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentTime, text: "right time", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true, addPeriodAfterAccent: true }
] : [];

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function placeCursorInside(target) {
  target.appendChild(typingCursor);
}

async function blinkBeforeTyping() {
  typeLineOneText.textContent = "";
  placeCursorInside(typeLineOneText);
  await wait(3900);
}

async function typeInto(target, textToType, speed = 72, pauseAfterWord = 230) {
  let typedText = "";
  placeCursorInside(target);

  for (const char of textToType) {
    typedText += char;
    target.textContent = typedText;
    placeCursorInside(target);
    await wait(char === " " ? pauseAfterWord : speed);
  }
}

function wrapAccentLetters(accentElement) {
  const text = accentElement.textContent;
  accentElement.textContent = "";
  const chars = [];

  for (const char of text) {
    const span = document.createElement("span");
    span.className = "accent-char";
    span.textContent = char === " " ? "\u00A0" : char;
    accentElement.appendChild(span);
    chars.push(span);
  }

  accentElement.appendChild(typingCursor);
  return chars;
}

async function animateAccentBackward(accentElement) {
  const chars = wrapAccentLetters(accentElement);

  for (let i = chars.length - 1; i >= 0; i--) {
    accentElement.insertBefore(typingCursor, chars[i]);
    chars[i].classList.add("is-selected");
    await wait(95);
  }

  await wait(260);
  accentElement.classList.add("is-green");
  await wait(260);
  chars[chars.length - 1].insertAdjacentElement("afterend", typingCursor);
  chars.forEach(char => char.classList.remove("is-selected"));
  await wait(450);
}

async function runHeroTypewriter() {
  await blinkBeforeTyping();

  for (const step of typeSteps) {
    await typeInto(step.target, step.text, 72, step.pauseAfterWord);

    if (step.animateAccent) {
      await wait(250);
      await animateAccentBackward(step.target);
    }

    if (step.addPeriodAfterAccent) {
      heroPeriod.textContent = ".";
      typingCursor.remove();
    }

    if (step.pauseAfterLine) {
      await wait(step.pauseAfterLine);
    }
  }
}

if (hasTypewriterHero) runHeroTypewriter();

/* Landing navigation state.
   Home remains the active page pill. The service nav underline follows only the
   featured-work viewport crossing the visual center of the screen, and clears
   immediately outside those four viewports (including after Web Design). */
const homeNavLink = document.querySelector('nav [data-nav="home"]');
const contactNavLink = document.querySelector('nav [data-nav="contact"]');
const serviceNavLinks = [...document.querySelectorAll('nav [data-section-target]')];
const serviceSections = serviceNavLinks
  .map(link => ({ link, section: document.getElementById(link.dataset.sectionTarget) }))
  .filter(item => item.section);
const contactSection = document.getElementById('contact');

if (homeNavLink) homeNavLink.classList.add('active');

let navStateFrame = 0;

function updateServiceUnderline() {
  navStateFrame = 0;
  const probeY = window.innerHeight * 0.5;
  let currentId = '';

  for (const { section } of serviceSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > probeY) {
      currentId = section.id;
      break;
    }
  }

  if (!currentId && contactSection) {
    const contactRect = contactSection.getBoundingClientRect();
    if (contactRect.top <= probeY && contactRect.bottom > probeY) {
      currentId = 'contact';
    }
  }

  serviceNavLinks.forEach(link => {
    link.classList.toggle('section-current', Boolean(currentId) && link.dataset.sectionTarget === currentId);
  });

  if (contactNavLink) {
    contactNavLink.classList.toggle('section-current', currentId === 'contact');
  }
}

function queueServiceUnderlineUpdate() {
  if (navStateFrame) return;
  navStateFrame = window.requestAnimationFrame(updateServiceUnderline);
}

window.addEventListener('scroll', queueServiceUnderlineUpdate, { passive: true });
window.addEventListener('resize', queueServiceUnderlineUpdate);
window.addEventListener('load', updateServiceUnderline);
updateServiceUnderline();


/* Contact-project brief validation, attachments, and email submission. */
const projectBriefForm = document.getElementById('projectBriefForm');
const briefFormStatus = document.getElementById('briefFormStatus');
const attachmentInput = document.getElementById('briefAttachments');
const attachmentDropzone = document.getElementById('attachmentDropzone');
const attachmentBrowse = document.getElementById('attachmentBrowse');
const attachmentFileList = document.getElementById('attachmentFileList');
const contactSuccessPopup = document.getElementById('contactSuccessPopup');

if (projectBriefForm) {
  const requiredBriefFields = [...projectBriefForm.querySelectorAll('[required]')];
  const submitButton = projectBriefForm.querySelector('.contact-submit');
  let selectedAttachments = [];
  let successTimer = 0;

  function fieldHasValidValue(field) {
    if (!String(field.value || '').trim()) return false;
    return field.checkValidity();
  }

  function updateBriefFieldState(field) {
    const wrapper = field.closest('.contact-field');
    if (!wrapper) return;
    wrapper.classList.toggle('is-valid', fieldHasValidValue(field));
  }

  requiredBriefFields.forEach(field => {
    ['input', 'change', 'blur'].forEach(eventName => {
      field.addEventListener(eventName, () => updateBriefFieldState(field));
    });
    updateBriefFieldState(field);
  });

  function buildProjectBrief() {
    const value = id => document.getElementById(id)?.value?.trim() || '';
    return [
      `Name: ${value('briefName')}`,
      `Email: ${value('briefEmail')}`,
      `Project type: ${value('briefProjectType')}`,
      `Timeline: ${value('briefTimeline')}`,
      '',
      'What I am trying to build or fix:',
      value('briefMessage')
    ].join('\n');
  }

  function renderAttachments() {
    if (!attachmentFileList) return;
    attachmentFileList.textContent = selectedAttachments.length
      ? selectedAttachments.map(file => file.name).join(', ')
      : 'No files added.';
  }

  function addAttachments(files) {
    const incoming = [...(files || [])].filter(file => file instanceof File);
    if (!incoming.length) return;

    const merged = [...selectedAttachments];
    incoming.forEach(file => {
      const duplicate = merged.some(existing =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
      );
      if (!duplicate) merged.push(file);
    });

    const totalBytes = merged.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 10 * 1024 * 1024) {
      if (briefFormStatus) briefFormStatus.textContent = 'Attachments must total 10 MB or less.';
      return;
    }

    selectedAttachments = merged;
    if (briefFormStatus) briefFormStatus.textContent = '';
    renderAttachments();
  }

  if (attachmentBrowse && attachmentInput) {
    attachmentBrowse.addEventListener('click', event => {
      event.preventDefault();
      attachmentInput.click();
    });
    attachmentInput.addEventListener('change', () => {
      addAttachments(attachmentInput.files);
      attachmentInput.value = '';
    });
  }

  if (attachmentDropzone) {
    attachmentDropzone.addEventListener('click', event => {
      if (event.target !== attachmentBrowse) attachmentDropzone.focus();
    });
    attachmentDropzone.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && attachmentInput) {
        event.preventDefault();
        attachmentInput.click();
      }
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      attachmentDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        attachmentDropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      attachmentDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        attachmentDropzone.classList.remove('is-dragover');
      });
    });
    attachmentDropzone.addEventListener('drop', event => addAttachments(event.dataTransfer?.files));
    attachmentDropzone.addEventListener('paste', event => {
      const files = [...(event.clipboardData?.items || [])]
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean);
      if (files.length) {
        event.preventDefault();
        addAttachments(files);
      }
    });
  }

  function showSuccessPopup() {
    if (!contactSuccessPopup) return;
    window.clearTimeout(successTimer);
    contactSuccessPopup.classList.add('is-visible');
    contactSuccessPopup.setAttribute('aria-hidden', 'false');
    successTimer = window.setTimeout(() => {
      contactSuccessPopup.classList.remove('is-visible');
      contactSuccessPopup.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  if (contactSuccessPopup) {
    contactSuccessPopup.addEventListener('click', () => {
      window.clearTimeout(successTimer);
      contactSuccessPopup.classList.remove('is-visible');
      contactSuccessPopup.setAttribute('aria-hidden', 'true');
    });
  }

  projectBriefForm.addEventListener('submit', async event => {
    event.preventDefault();
    requiredBriefFields.forEach(updateBriefFieldState);

    if (!projectBriefForm.checkValidity()) {
      projectBriefForm.reportValidity();
      if (briefFormStatus) briefFormStatus.textContent = 'Please complete the required fields.';
      return;
    }

    if (briefFormStatus) briefFormStatus.textContent = 'Sending…';
    if (submitButton) submitButton.disabled = true;

    const formData = new FormData(projectBriefForm);
    formData.delete('attachment');
    selectedAttachments.forEach(file => formData.append('attachment', file, file.name));
    formData.append('project_brief', buildProjectBrief());

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@madhistudio.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      let result = null;
      try { result = await response.json(); } catch (error) { result = null; }
      if (!response.ok || result?.success === false) throw new Error('Submission failed');

      if (briefFormStatus) briefFormStatus.textContent = '';
      showSuccessPopup();
      projectBriefForm.reset();
      selectedAttachments = [];
      renderAttachments();
      requiredBriefFields.forEach(updateBriefFieldState);
    } catch (error) {
      if (briefFormStatus) briefFormStatus.textContent = 'Unable to send. Please email info@madhistudio.com directly.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  renderAttachments();
}


/* SOURCE: service-interactions.js */
(() => {
  'use strict';

  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function setupReveal(){
    const rows=[...document.querySelectorAll('.print-row')];
    if(!rows.length) return;
    if(window.MadhiPreferences?.motionEnabled() === false || !('IntersectionObserver' in window)){ rows.forEach(r=>r.classList.add('reveal')); return; }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('reveal'); observer.unobserve(entry.target); } });
    },{threshold:.12});
    rows.forEach(row=>observer.observe(row));
  }

  // ---------------- Split-flap ----------------
  function setupSplitFlap(){
    const host=document.getElementById('splitFlapInline');
    const input=document.getElementById('cityInput');
    if(!host || !input) return;

    const cityField=host.querySelector('#cityFlaps');
    const statusField=host.querySelector('#statusFlaps');
    const stairField=host.querySelector('#stairFlaps');
    const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const DIGITS='0123456789';
    const tickMs=45;
    let runToken=0;

    const wait=ms=>new Promise(resolve=>setTimeout(resolve, window.MadhiPreferences?.motionEnabled() === false ? 0 : ms));

    const normalize=(value,slots)=>String(value||'')
      .toUpperCase()
      .replace(/[^A-Z0-9 -]/g,' ')
      .slice(0,slots)
      .padEnd(slots,' ');

    const boardValue=(field,value)=>{
      const slots=Math.max(1,Number(field?.dataset.slots)||1);
      const pad=Math.max(0,Number(field?.dataset.pad)||0);
      const core=normalize(value,slots);
      return `${' '.repeat(pad)}${core}${' '.repeat(pad)}`;
    };

    function cellMarkup(ch){
      const safe=ch===' ' ? '&nbsp;' : ch;
      return `
        <div class="solari-half top"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-half bottom"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-motion top"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-motion bottom"><span class="solari-glyph">${safe}</span></div>`;
    }

    function buildField(field){
      if(!field) return;
      const value=boardValue(field,field.dataset.solariValue);
      field.innerHTML='';
      [...value].forEach(ch=>{
        // Every character position is its own independent split-flap pair.
        const cell=document.createElement('span');
        cell.className='solari-cell';
        cell.dataset.char=ch;
        cell.innerHTML=cellMarkup(ch);
        field.appendChild(cell);
      });
    }

    function setGlyph(node,ch){
      if(node) node.textContent=ch===' ' ? '\u00A0' : ch;
    }

    function setCellImmediate(cell,ch){
      if(!cell) return;
      cell.classList.remove('is-flipping');
      cell.dataset.char=ch;
      cell.querySelectorAll('.solari-glyph').forEach(node=>setGlyph(node,ch));
    }

    async function flipOne(cell,next,token){
      if(!cell || token!==runToken) return false;
      const old=cell.dataset.char||' ';
      if(old===next) return true;

      const staticTop=cell.querySelector('.solari-half.top .solari-glyph');
      const staticBottom=cell.querySelector('.solari-half.bottom .solari-glyph');
      const motionTop=cell.querySelector('.solari-motion.top .solari-glyph');
      const motionBottom=cell.querySelector('.solari-motion.bottom .solari-glyph');

      // Each slot owns its own top/bottom pair. The outgoing top half flips away
      // while the incoming bottom half receives the next character.
      setGlyph(staticTop,next);
      setGlyph(staticBottom,old);
      setGlyph(motionTop,old);
      setGlyph(motionBottom,next);

      cell.classList.remove('is-flipping');
      void cell.offsetWidth;
      cell.classList.add('is-flipping');
      await wait(tickMs);
      if(token!==runToken) return false;

      cell.dataset.char=next;
      setGlyph(staticTop,next);
      setGlyph(staticBottom,next);
      setGlyph(motionTop,next);
      setGlyph(motionBottom,next);
      cell.classList.remove('is-flipping');
      return true;
    }

    function orderedSequence(from,to){
      if(from===to) return [];

      // Letters advance only through A → B → ... → Z → A.
      if(LETTERS.includes(to)){
        let index=LETTERS.indexOf(from);
        if(index<0) index=LETTERS.length-1; // next step becomes A
        const target=LETTERS.indexOf(to);
        const sequence=[];
        let guard=0;
        while(index!==target && guard<LETTERS.length){
          index=(index+1)%LETTERS.length;
          sequence.push(LETTERS[index]);
          guard++;
        }
        return sequence;
      }

      // Numbers advance only through 0 → 1 → ... → 9 → 0.
      if(DIGITS.includes(to)){
        let index=DIGITS.indexOf(from);
        if(index<0) index=DIGITS.length-1; // next step becomes 0
        const target=DIGITS.indexOf(to);
        const sequence=[];
        let guard=0;
        while(index!==target && guard<DIGITS.length){
          index=(index+1)%DIGITS.length;
          sequence.push(DIGITS[index]);
          guard++;
        }
        return sequence;
      }

      // Blank and hyphen are terminal board positions rather than part of either wheel.
      return [to];
    }

    async function animateFieldOneCellAtATime(field,value,token){
      if(!field) return true;
      const cells=[...field.querySelectorAll('.solari-cell')];
      const target=boardValue(field,value);
      if(window.MadhiPreferences?.motionEnabled() === false){
        cells.forEach((cell,index)=>setCellImmediate(cell,target[index] || ' '));
        field.dataset.solariValue=String(value||'').toUpperCase();
        return true;
      }

      for(let index=0; index<cells.length; index++){
        if(token!==runToken) return false;
        const cell=cells[index];
        const targetChar=target[index];
        const sequence=orderedSequence(cell.dataset.char||' ',targetChar);

        // Finish the complete A-Z or 0-9 sequence for this character before
        // the next character position starts moving.
        for(let step=0; step<sequence.length; step++){
          if(token!==runToken) return false;
          const ok=await flipOne(cell,sequence[step],token);
          if(!ok) return false;
        }
      }

      field.dataset.solariValue=String(value||'').toUpperCase();
      return true;
    }

    host.querySelectorAll('.solari-field[data-solari-value]').forEach(buildField);

    window.updateBoard=async()=>{
      const token=++runToken;
      const city=(input.value.trim()||'PHILADELPHIA').toUpperCase();
      const statuses=['BOARDING','ON TIME','DELAYED','ARRIVING'];
      const status=statuses[Math.floor(Math.random()*statuses.length)];
      const stair=String(Math.floor(Math.random()*9)+1);

      statusField?.classList.toggle('is-yellow',status==='BOARDING');

      // One physical character card moves at a time across the editable row.
      if(!await animateFieldOneCellAtATime(cityField,city,token)) return;
      if(!await animateFieldOneCellAtATime(statusField,status,token)) return;
      if(!await animateFieldOneCellAtATime(stairField,stair,token)) return;
    };

    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        window.updateBoard();
      }
    });
  }

  // ---------------- Turntable ----------------
  function setupTurntable(){
    const host=document.getElementById('turntableInline');
    const scene=host?.querySelector('#turntableScene');
    const tonearm=host?.querySelector('#tonearm');
    const physical=host?.querySelector('#startStopPhysical');
    const buttonMessage=host?.querySelector('#buttonMessage');
    const button=document.getElementById('turntableStartButton');
    const audio=document.getElementById('recordAudio');
    if(!host||!scene||!tonearm||(!physical&&!button)) return;

    const style=document.createElement('style');
    style.textContent=`
      #turntableInline{width:90%;height:90%;display:flex;align-items:center;justify-content:center}
      #turntableInline>svg{width:100%;height:100%;display:block}
      #turntableScene #platterSpin{transform-origin:248px 258px;transform-box:view-box}
      #turntableScene.is-playing #platterSpin,#turntableScene.is-starting #platterSpin{animation:madhiRecordSpin 2.4s linear infinite}
      @keyframes madhiRecordSpin{to{transform:rotate(360deg)}}
      #turntableScene #tonearm{transform-origin:465px 163px;transform-box:view-box;transition:transform 1.35s cubic-bezier(.22,.8,.22,1)}
      #turntableScene .button-face{fill:#18d73e!important;filter:drop-shadow(0 0 6px rgba(24,215,62,.82)) drop-shadow(0 0 12px rgba(24,215,62,.42));animation:madhiButtonBlink 1.1s ease-in-out infinite}
      #turntableScene.is-playing .button-face,#turntableScene.is-starting .button-face{fill:#ff8a1f!important;filter:drop-shadow(0 0 6px rgba(255,138,31,.86)) drop-shadow(0 0 12px rgba(255,138,31,.46))}
      @keyframes madhiButtonBlink{0%,100%{opacity:1}50%{opacity:.55}}
      #turntableScene.arm-lifted #tonearm{transform:translateY(-12px) rotate(0deg)}
      #turntableScene.arm-over #tonearm{transform:translateY(-12px) rotate(24deg)}
      #turntableScene.arm-dropped #tonearm{transform:translateY(0) rotate(24deg)}
    `;
    document.head.appendChild(style);

    let playing=false,moving=false,timers=[];
    const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);};
    const clear=()=>{timers.forEach(clearTimeout);timers=[]};
    async function primeAudio(){
      if(!audio) return;
      try{audio.muted=true; await audio.play(); audio.pause(); audio.currentTime=0; audio.muted=false;}catch(e){audio.muted=false;}
    }
    function stopAudio(){if(!audio)return; audio.pause(); audio.currentTime=0;}
    function setArm(state){scene.classList.remove('arm-lifted','arm-over','arm-dropped'); if(state) scene.classList.add(state);}
    function setExternalButton(text){ if(button) button.textContent=text; }
    function setPhysicalText(text){ if(buttonMessage) buttonMessage.textContent=text; }
    async function start(){
      if(moving||playing)return; clear();
      if(window.MadhiPreferences?.motionEnabled() === false){
        playing=true; moving=false; scene.classList.add('is-playing'); setArm('arm-dropped'); setExternalButton('STOP'); setPhysicalText('STOP');
        if(audio){ try{ await audio.play(); }catch(e){} }
        return;
      }
      moving=true; await primeAudio();
      scene.classList.add('is-starting'); setExternalButton('Starting…'); setPhysicalText('START'); setArm('arm-lifted');
      later(()=>setArm('arm-over'),800);
      later(()=>setArm('arm-dropped'),2400);
      later(async()=>{moving=false;playing=true;scene.classList.remove('is-starting');scene.classList.add('is-playing');setExternalButton('STOP');setPhysicalText('STOP'); if(audio){audio.muted=false;try{await audio.play();}catch(e){console.warn('Audio could not play:',e);}}},3550);
    }
    function stop(){
      if(moving||!playing)return; clear();
      if(window.MadhiPreferences?.motionEnabled() === false){
        moving=false; playing=false; stopAudio(); scene.classList.remove('is-playing','is-starting'); setArm(''); setExternalButton('START'); setPhysicalText('START'); return;
      }
      moving=true;playing=false;stopAudio();scene.classList.remove('is-playing');scene.classList.add('is-starting');setExternalButton('Stopping…');setPhysicalText('STOP');setArm('arm-over');
      later(()=>setArm('arm-lifted'),1150);
      later(()=>{setArm('');scene.classList.remove('is-starting');moving=false;setExternalButton('START');setPhysicalText('START');},2400);
    }
    const toggle=()=>playing?stop():start();
    button?.addEventListener('click',toggle); physical?.addEventListener('click',toggle);
  }

  // ---------------- Evacuation plan ----------------
  function setupEvacuation(){
    const host=document.getElementById('evacuationInline');
    const svg=host?.querySelector('#evacuationPlan');
    const demo=document.getElementById('evacuationDemo');
    const buttons=[...document.querySelectorAll('.evacuation-room-btn[data-room]')];
    const dark=document.getElementById('evacuationDarkBtn');
    const reset=document.getElementById('evacuationResetBtn');
    if(!host||!svg||!demo)return;
    host.style.width='100%';host.style.height='100%';host.style.display='flex';
    svg.style.width='100%';svg.style.height='100%';svg.style.display='block';
    const rooms=[...svg.querySelectorAll('.evac-room[data-room]')];
    const select=(name)=>{
      rooms.forEach(r=>r.classList.toggle('active',r.dataset.room===name));
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.room===name));
    };
    rooms.forEach(room=>{
      room.addEventListener('click',()=>select(room.dataset.room));
      room.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(room.dataset.room)}});
    });
    buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.room)));
    dark?.addEventListener('click',()=>{const on=svg.classList.toggle('dark');demo.classList.toggle('dark',on);dark.textContent=on?'Light':'Dark';});
    reset?.addEventListener('click',()=>select(''));
  }

  // ---------------- Soccer pitch ----------------
  function setupSoccer(){
    const host=document.getElementById('soccerPitchInline');
    const svg=host?.querySelector('svg');
    const button=document.getElementById('soccerPitchStartButton');
    if(!host||!svg||!button)return;
    host.style.width='100%';host.style.height='100%';host.style.display='flex';host.style.alignItems='center';host.style.justifyContent='center';
    svg.style.width='100%';svg.style.height='100%';svg.style.display='block';

    const NS='http://www.w3.org/2000/svg';
    const layer=document.createElementNS(NS,'g'); layer.setAttribute('id','formationLayer');
    svg.appendChild(layer);

    const mkText=(x,y,text,anchor='middle',size='8',color='#fff',opacity='1')=>{
      const t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('text-anchor',anchor);t.setAttribute('font-family','Arial,sans-serif');t.setAttribute('font-size',size);t.setAttribute('font-weight','700');t.setAttribute('fill',color);t.setAttribute('opacity',opacity);t.textContent=text;return t;
    };
    const addFormationLabel=(items,color)=>{
      items.forEach(item=>{
        const t=mkText(item.x,item.y,item.text,'middle','20',color,'1');
        t.setAttribute('stroke','#ffffff');
        t.setAttribute('stroke-width','0.9');
        t.setAttribute('paint-order','stroke fill');
        t.setAttribute('stroke-linejoin','round');
        layer.appendChild(t);
      });
    };
    const formations={
      red:[
        [28,134,'GK'],
        [88,48,''],[88,104,''],[88,165,''],[88,221,''],
        [150,72,''],[150,134,''],[150,198,''],
        [210,62,''],[210,134,''],[210,208,'']
      ],
      blue:[
        [465,134,'GK'],
        [404,76,''],[404,134,''],[404,192,''],
        [346,42,''],[346,88,''],[346,134,''],[346,180,''],[346,226,''],
        [288,98,''],[288,172,'']
      ],
      /* After the whistle the goalkeepers stay home while the six outfield
         lines interleave evenly across the pitch:
         RED 4 → BLUE 2 → RED 3 → BLUE 5 → RED 3 → BLUE 3. */
      
redFace:[
        [28,134,'GK'],
        /* RED 4 stays in its original back-line position. */
        [88,48,''],[88,104,''],[88,165,''],[88,221,''],
        /* RED 3 becomes the third alternating line. */
        [214.4,72,''],[214.4,134,''],[214.4,198,''],
        /* RED 3 becomes the fifth alternating line. */
        [340.8,62,''],[340.8,134,''],[340.8,208,'']
      ],
      blueFace:[
        [465,134,'GK'],
        /* BLUE 3 stays in its original back-line position. */
        [404,76,''],[404,134,''],[404,192,''],
        /* BLUE 5 becomes the fourth alternating line. */
        [277.6,42,''],[277.6,88,''],[277.6,134,''],[277.6,180,''],[277.6,226,''],
        /* BLUE 2 becomes the second alternating line. */
        [151.2,98,''],[151.2,172,'']
      ]
    };

    const players=[];
    function addTeam(team,color,positions){
      positions.forEach((pos,i)=>{
        const g=document.createElementNS(NS,'g');g.dataset.team=team;g.dataset.index=i;
        const c=document.createElementNS(NS,'circle');c.setAttribute('r',i===0?'7':'6');c.setAttribute('fill',color);c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','1.6');
        g.appendChild(c);if(pos[2])g.appendChild(mkText(0,2.7,pos[2]));
        layer.appendChild(g);players.push({g,team,index:i,x:pos[0],y:pos[1]});
        g.setAttribute('transform',`translate(${pos[0]} ${pos[1]})`);
      });
    }
    addTeam('red','#e03131',formations.red);
    addFormationLabel([
      {x:88,y:21,text:'4'},
      {x:119,y:21,text:'-'},
      {x:150,y:21,text:'3'},
      {x:180,y:21,text:'-'},
      {x:210,y:21,text:'3'}
    ], '#ff3b3b');
    addTeam('blue','#2563eb',formations.blue);
    addFormationLabel([
      {x:288,y:21,text:'2'},
      {x:317,y:21,text:'-'},
      {x:346,y:21,text:'5'},
      {x:375,y:21,text:'-'},
      {x:404,y:21,text:'3'}
    ], '#2563eb');

    let facing=false,raf=0;
    function animateTo(targetRed,targetBlue){
      cancelAnimationFrame(raf);
      if(window.MadhiPreferences?.motionEnabled() === false){
        players.forEach(p=>{ const target=(p.team==='red'?targetRed:targetBlue)[p.index]; p.x=target[0]; p.y=target[1]; p.g.setAttribute('transform',`translate(${p.x} ${p.y})`); });
        return;
      }
      const start=performance.now();const duration=950;
      const starts=players.map(p=>({x:p.x,y:p.y}));
      const targets=players.map(p=> (p.team==='red'?targetRed:targetBlue)[p.index]);
      const ease=t=>1-Math.pow(1-t,3);
      const frame=now=>{
        const t=Math.min(1,(now-start)/duration),e=ease(t);
        players.forEach((p,i)=>{
          const tx=targets[i][0],ty=targets[i][1];const x=starts[i].x+(tx-starts[i].x)*e;const y=starts[i].y+(ty-starts[i].y)*e;
          p.g.setAttribute('transform',`translate(${x} ${y})`);if(t===1){p.x=tx;p.y=ty;}
        });
        if(t<1) raf=requestAnimationFrame(frame);
      };raf=requestAnimationFrame(frame);
    }
    function whistle(){
      try{
        const ctx=new (window.AudioContext||window.webkitAudioContext)();const now=ctx.currentTime;
        const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(1850,now);osc.frequency.linearRampToValueAtTime(2250,now+.15);osc.frequency.linearRampToValueAtTime(1780,now+.42);
        gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.07,now+.02);gain.gain.setValueAtTime(.07,now+.28);gain.gain.exponentialRampToValueAtTime(.0001,now+.5);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.52);
      }catch(e){}
    }
    button.textContent='Blow Whistle';
    button.addEventListener('click',()=>{
      facing=!facing; whistle();
      animateTo(facing?formations.redFace:formations.red,facing?formations.blueFace:formations.blue);
      button.textContent=facing?'Reset Formations':'Blow Whistle';button.classList.toggle('is-active',facing);
    });
  }

  onReady(()=>{setupReveal();setupSplitFlap();setupTurntable();setupEvacuation();setupSoccer();});
})();


/* SOURCE: wanderports-hero-card.js */
document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('wanderportsHeroFrame');
  const button = document.getElementById('wanderportsPlayButton');

  if (!frame || !button) return;

  const setReady = (label = 'PLAY') => {
    button.disabled = false;
    button.textContent = label;
    button.classList.add('is-ready');
  };

  const setPlaying = () => {
    button.disabled = true;
    button.textContent = 'PLAYING…';
    button.classList.remove('is-ready');
  };

  frame.addEventListener('load', () => {
    setReady('PLAY');
  });

  try {
    if (frame.contentDocument?.readyState === 'complete') {
      setReady('PLAY');
    }
  } catch (error) {}

  const syncMotionState = () => {
    const enabled = window.MadhiPreferences?.motionEnabled() !== false;
    button.disabled = !enabled;
    if (!enabled) { button.textContent = 'MOTION OFF'; button.classList.remove('is-ready'); }
    else if (button.textContent === 'MOTION OFF') setReady('PLAY');
  };
  syncMotionState();
  window.addEventListener('madhi:motionchange', syncMotionState);

  button.addEventListener('click', () => {
    if (window.MadhiPreferences?.motionEnabled() === false || !frame.contentWindow) return;
    setPlaying();
    frame.contentWindow.postMessage({ type: 'wanderports-hero:play' }, '*');
  });

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;

    if (event.data?.type === 'wanderports-hero:ready') {
      setReady('PLAY');
    }

    if (event.data?.type === 'wanderports-hero:complete') {
      setReady('REPLAY');
    }
  });
});



/* UI service-page-only interactions */
(() => {
document.querySelectorAll('[data-aerowordsmith-action]').forEach(button => {
    button.addEventListener('click', () => {
      const frame = document.getElementById('aerowordsmithFrame');
      frame?.contentWindow?.postMessage({ aerowordsmithAction: button.dataset.aerowordsmithAction }, '*');
    });
  });

  const aoeArtwork = document.getElementById('aoeLearningObject');
  const aoeRow = document.querySelector('.aoe-learning-row');

  if (aoeArtwork && aoeRow) {
    const loadAoeAnimation = () => {
      if (window.MadhiPreferences?.motionEnabled() === false) return;
      if (aoeArtwork.dataset.started === 'true') return;
      const source = aoeArtwork.dataset.src;
      if (!source) return;
      aoeArtwork.dataset.started = 'true';
      const startUrl = `${source}?start=${Date.now()}`;
      if (aoeArtwork.tagName === 'IMG') {
        aoeArtwork.setAttribute('src', startUrl);
      } else {
        aoeArtwork.setAttribute('data', startUrl);
      }
    };

    if ('IntersectionObserver' in window) {
      const aoeObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadAoeAnimation();
          observer.disconnect();
        }
      }, { threshold: 0.18 });
      aoeObserver.observe(aoeRow);
    } else {
      loadAoeAnimation();
    }
  }

  document.getElementById('aoeLearningReplay')?.addEventListener('click', () => {
    if (window.MadhiPreferences?.motionEnabled() === false || !aoeArtwork) return;
    const source = aoeArtwork.dataset.src;
    if (!source) return;
    aoeArtwork.dataset.started = 'true';
    const replayUrl = `${source}?replay=${Date.now()}`;
    if (aoeArtwork.tagName === 'IMG') {
      aoeArtwork.setAttribute('src', replayUrl);
    } else {
      aoeArtwork.setAttribute('data', replayUrl);
    }
  });

  document.getElementById('aerowordsmithFullscreen')?.addEventListener('click', () => {
    const container = document.querySelector('.aerowordsmith-row .image-card');
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    container.requestFullscreen?.();
  });


  // Compact visual page scrollbar: keeps the same green visual language while
  // using a shorter thumb that tracks page position.
  function madhiCompactScrollbar() {
    if (document.getElementById('madhiScrollTrack')) return;
    const track = document.createElement('div');
    track.id = 'madhiScrollTrack';
    track.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div');
    thumb.id = 'madhiScrollThumb';
    track.appendChild(thumb);
    document.body.appendChild(track);

    const update = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      const trackHeight = track.clientHeight;
      const thumbHeight = thumb.offsetHeight;
      const maxTravel = Math.max(0, trackHeight - thumbHeight);
      thumb.style.transform = `translateY(${ratio * maxTravel}px)`;
    };

    let dragging = false;
    let grabOffset = 0;
    thumb.addEventListener('pointerdown', (event) => {
      dragging = true;
      grabOffset = event.clientY - thumb.getBoundingClientRect().top;
      thumb.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    thumb.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const rect = track.getBoundingClientRect();
      const maxTravel = Math.max(1, rect.height - thumb.offsetHeight);
      const y = Math.max(0, Math.min(maxTravel, event.clientY - rect.top - grabOffset));
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      window.scrollTo({ top: (y / maxTravel) * maxScroll, behavior: 'auto' });
    });
    thumb.addEventListener('pointerup', (event) => {
      dragging = false;
      try { thumb.releasePointerCapture(event.pointerId); } catch (_) {}
    });
    track.addEventListener('pointerdown', (event) => {
      if (event.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const maxTravel = Math.max(1, rect.height - thumb.offsetHeight);
      const y = Math.max(0, Math.min(maxTravel, event.clientY - rect.top - thumb.offsetHeight / 2));
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      window.scrollTo({ top: (y / maxTravel) * maxScroll, behavior: 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    new ResizeObserver(update).observe(document.documentElement);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', madhiCompactScrollbar, { once: true });
  } else {
    madhiCompactScrollbar();
  }
})();

/* Airport-map fullscreen controls used on the landing and User Interfaces pages. */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-map-fullscreen-target]');
  if (!button) return;

  const targetId = button.getAttribute('data-map-fullscreen-target');
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;

  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else {
    target.requestFullscreen?.();
  }
});



/* Keep the Runway Marking Inspection iframe in the parent page's active theme,
   including local/file previews where direct frame access can be restricted. */
(() => {
  'use strict';
  const root = document.documentElement;

  function syncRunwayFrameTheme() {
    const frame = document.querySelector('.runway-inspection-frame');
    if (!frame) return;
    const theme = root.dataset.theme === 'light' ? 'light' : 'dark';

    try {
      const doc = frame.contentDocument;
      if (doc?.documentElement) doc.documentElement.dataset.theme = theme;
    } catch (_) {}

    try {
      const raw = frame.getAttribute('src');
      if (!raw) return;
      const url = new URL(raw, window.location.href);
      if (url.searchParams.get('theme') === theme) return;
      url.searchParams.set('theme', theme);
      frame.setAttribute('src', url.href);
    } catch (_) {}
  }

  window.addEventListener('madhi:themechange', syncRunwayFrameTheme);
  window.addEventListener('madhi:shellready', syncRunwayFrameTheme);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncRunwayFrameTheme, { once: true });
  } else {
    syncRunwayFrameTheme();
  }
})();


/* Sept 11 — mobile orientation guidance + back-to-top control. */
(() => {
  const setupPortfolioMobilePolish = () => {
    const orientationText = 'Note: Rotate device to landscape for best experience.';
    const panels = [
      ...document.querySelectorAll('#ui-icons .landing-feature-info, #motion-graphics .landing-feature-info, #web-design .landing-feature-info'),
      ...document.querySelectorAll('html[data-page="service"] .print-row .info-panel')
    ];
    panels.forEach(panel => {
      if (panel.querySelector(':scope > .orientation-note')) return;
      const note = document.createElement('p');
      note.className = 'orientation-note';
      note.textContent = orientationText;
      const description = [...panel.children].find(el => el.matches?.('p:not(.orientation-note)'));
      if (description) description.insertAdjacentElement('afterend', note);
      else panel.appendChild(note);
    });

    const backToTop = document.getElementById('backToTop');
    if (!backToTop || backToTop.dataset.ready === 'true') return;
    backToTop.dataset.ready = 'true';
    backToTop.addEventListener('click', () => {
      const reduce = window.MadhiPreferences?.motionEnabled?.() === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    const syncAttention = () => {
      const threshold = Math.max(window.innerHeight * .9, 420);
      backToTop.classList.toggle('is-attention', window.scrollY > threshold);
    };
    syncAttention();
    window.addEventListener('scroll', syncAttention, { passive: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupPortfolioMobilePolish, { once: true });
  else setupPortfolioMobilePolish();
  window.addEventListener('madhi:shellready', setupPortfolioMobilePolish);
})();
