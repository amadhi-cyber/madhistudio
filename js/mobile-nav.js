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
    };

    toggle.addEventListener('click', () => {
      const willOpen = !nav.classList.contains('mobile-open');
      nav.classList.toggle('mobile-open', willOpen);
      document.body.classList.toggle('mobile-menu-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
    });

    links.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) closeMenu();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileNav);
  } else {
    setupMobileNav();
  }
})();
