function mountSiteShell() {
  const navMount = document.getElementById("site-nav");
  const footerMount = document.getElementById("site-footer");

  const shellScript = document.currentScript || document.querySelector('script[src$="site-shell.js"]');
  const shellUrl = new URL(shellScript ? shellScript.src : "../js/site-shell.js", window.location.href);
  const studioRootUrl = new URL("../", shellUrl);
  const siteUrl = (path = "") => new URL(path, studioRootUrl).href;
  const currentFile = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";

  if (navMount) {
    navMount.innerHTML = `
      <nav class="site-nav-global" aria-label="Primary navigation">
        <div class="nav-inner">
          <div class="logo">
            <a href="${siteUrl("index.html#home")}" aria-label="Madhi Studio home">
              <img src="${siteUrl("assets/madhi-studio-logo-alt.svg")}" alt="Madhi Studio">
            </a>
          </div>
          <div class="nav-links">
            <a href="${siteUrl("index.html#home")}" data-nav="home">Home</a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl("design/branding-logos.html")}" data-nav="branding-logos" data-section-target="branding-logos"><span class="service-nav-label">Branding, Logos &amp; Icons</span></a>
            <a href="${siteUrl("design/ui-icons.html")}" data-nav="ui-icons" data-section-target="ui-icons"><span class="service-nav-label">Interactive User Platforms</span></a>
            <a href="${siteUrl("design/motion-graphics.html")}" data-nav="motion-graphics" data-section-target="motion-graphics"><span class="service-nav-label">Motion Graphics</span></a>
            <a href="${siteUrl("design/web-design.html")}" data-nav="web-design" data-section-target="web-design"><span class="service-nav-label">Websites &amp; Landing Pages</span></a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl("index.html#contact")}" data-nav="contact">Contact</a>
          </div>
        </div>
      </nav>`;
  }

  if (footerMount) {
    footerMount.innerHTML = `
      <footer>
        <div class="footer-inner">
          <div class="footer-main">© 2026 Madhi Studio | Crafted with Intention | <a href="${siteUrl("sitemap.html")}">Sitemap</a></div>
        </div>
      </footer>`;
  }

  const pageToNav = {
    "index.html": "home",
    "contact.html": "contact",
    "ui-icons.html": "ui-icons",
    "branding-logos.html": "branding-logos",
    "motion-graphics.html": "motion-graphics",
    "web-design.html": "web-design"
  };
  const activeNav = pageToNav[currentFile];
  if (activeNav) {
    document.querySelector(`#site-nav [data-nav="${activeNav}"]`)?.classList.add("active");
  }
}

if (document.getElementById("site-nav") || document.getElementById("site-footer")) {
  mountSiteShell();
} else {
  document.addEventListener("DOMContentLoaded", mountSiteShell, { once: true });
}

