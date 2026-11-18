/* V212 — News tab changes are local navigation, not a page jump (mobile only). */
(() => {
  'use strict';
  const isMobile = () => window.matchMedia('(max-width:700px)').matches;
  const isNews = hash => /^#\/noticias(?:\/|$|\?)/.test(hash || '');
  const restore = y => requestAnimationFrame(() => {
    if (!isMobile() || !isNews(location.hash) || !document.querySelector('.vi-news-tabs')) return;
    window.scrollTo({top:y,behavior:'instant'});
  });

  document.addEventListener('click', event => {
    const link = event.target.closest?.('.vi-news-page .vi-news-tabs a[href^="#/noticias"]');
    if (!isMobile() || !link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (!hash || !isNews(hash)) return;
    event.preventDefault();
    if (hash === location.hash) return;

    const oldY = window.scrollY;
    // pushState avoids hashchange's generic scroll-to-top and keeps Back working.
    history.replaceState({...history.state, viMobileNewsScroll:oldY}, '', location.href);
    history.pushState({...history.state, viMobileNewsScroll:oldY}, '', hash);
    const currentPage = document.querySelector('.vi-news-page');
    if (currentPage && typeof window.viNewsPage === 'function') {
      // Replace only the news panel: header, footer and scroll container do not remount.
      currentPage.outerHTML = window.viNewsPage(hash.slice(1));
      queueMicrotask(() => window.viApplyI18n?.());
    } else if (typeof window.render === 'function') window.render();
    restore(oldY);
    // Keep keyboard focus on the selected filter without causing a new jump.
    document.querySelector('.vi-news-tabs a.is-active')?.focus({preventScroll:true});
  }, true);

  // Browser/Android Back may use the app's normal hashchange renderer.
  // Restore after that renderer has handled the route.
  window.addEventListener('popstate', () => {
    const y = history.state?.viMobileNewsScroll;
    if (isMobile() && isNews(location.hash) && Number.isFinite(y)) {
      requestAnimationFrame(() => restore(y));
    }
  });
})();
