document.addEventListener("DOMContentLoaded", () => {
  const navMount = document.getElementById("site-nav");
  const footerMount = document.getElementById("site-footer");

  const shellScript = document.currentScript || document.querySelector('script[src$="site-shell.js"]');
  const shellUrl = new URL(shellScript ? shellScript.src : "../js/site-shell.js", window.location.href);
  const studioRootUrl = new URL("../", shellUrl);
  const siteUrl = (path = "") => new URL(path, studioRootUrl).href;
  const currentFile = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";

  if (navMount) {
    navMount.innerHTML = `
      <nav aria-label="Primary navigation">
        <div class="nav-inner">
          <div class="logo">
            <a href="${siteUrl("index.html#home")}" aria-label="Madhi Studio home">
              <img src="${siteUrl("assets/madhi-studio-logo-plain.svg")}" alt="Madhi Studio">
            </a>
          </div>
          <div class="nav-links">
            <a href="${siteUrl("index.html#home")}" data-nav="home">Home</a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl("design/branding-logos.html")}" data-nav="branding-logos">Branding + Logos</a>
            <a href="${siteUrl("design/ui-icons.html")}" data-nav="ui-icons">UI + Icons</a>
            <a href="${siteUrl("design/motion-graphics.html")}" data-nav="motion-graphics">Motion Graphics</a>
            <a href="${siteUrl("design/web-design.html")}" data-nav="web-design">Web Design</a>
            <span class="nav-divider" aria-hidden="true"></span>
            <a href="${siteUrl("contact.html")}" data-nav="contact">Contact</a>
            <a href="${siteUrl("about.html")}" data-nav="about">About</a>
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
    "ui-icons.html": "ui-icons",
    "branding-logos.html": "branding-logos",
    "motion-graphics.html": "motion-graphics",
    "web-design.html": "web-design"
  };
  const activeNav = pageToNav[currentFile];
  if (activeNav) {
    document.querySelector(`#site-nav [data-nav="${activeNav}"]`)?.classList.add("active");
  }
});
