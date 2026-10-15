/* Reviewed source reader adapter; see source-manifest.json. */
(() => {
"use strict";
function mountSourceShell(root, sourceDocument, sourceBody, sourceSearchIndex, lifecycle) {
  const document = {
    body: sourceBody, documentElement: sourceDocument,
    getElementById: id => root.getElementById(id),
    querySelector: selector => root.querySelector(selector),
    querySelectorAll: selector => root.querySelectorAll(selector),
    createElement: tag => globalThis.document.createElement(tag),
    createDocumentFragment: () => globalThis.document.createDocumentFragment(),
    addEventListener: (type, listener, options) => lifecycle.listen(globalThis.document, type, listener, options)
  };
(() => {
  'use strict';

  const body = document.body;
  if (!body || !body.classList.contains('book')) return;

  const menuButton = document.getElementById('menu-button');
  const sidebar = document.getElementById('book-sidebar');
  const themeButton = document.getElementById('theme-button');
  const printButton = document.getElementById('print-button');
  const searchButton = document.getElementById('search-button');
  const searchDialog = document.getElementById('search-dialog');
  const closeSearchButton = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');
  const searchStatus = document.getElementById('search-status');
  const searchResults = document.getElementById('search-results');
  const pageList = document.querySelector('.page-list');
  const mobile = window.matchMedia('(max-width: 800px)');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
  }

  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.addEventListener('click', () => {
    setMenu(!body.classList.contains('menu-open'));
  });
  sidebar?.addEventListener('click', (event) => {
    if (mobile.matches && event.target.closest('a')) setMenu(false);
  });
  lifecycle.listen(mobile,'change', () => setMenu(false));

  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('book-reader-theme') || 'light';
  } catch (_) {
    // The reader still works when browser storage is disabled.
  }
  function setTheme(theme) {
    const dark = theme === 'dark';
    body.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    if (themeButton) {
      const label = dark ? 'พื้นหลังสว่าง' : 'พื้นหลังมืด';
      themeButton.textContent = label;
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('aria-pressed', String(dark));
    }
  }
  setTheme(savedTheme);
  themeButton?.addEventListener('click', () => {
    const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('book-reader-theme', next); } catch (_) { /* optional */ }
  });

  printButton?.addEventListener('click', () => window.print());

  function normalize(value) {
    return String(value ?? '').normalize('NFKC').toLocaleLowerCase();
  }
  let indexedSource;
  let searchIndex = [];
  function getSearchIndex() {
    const source = Array.isArray(sourceSearchIndex) ? sourceSearchIndex : [];
    if (source !== indexedSource) {
      indexedSource = source;
      searchIndex = source
        .filter((entry) => entry && typeof entry.url === 'string')
        .map((entry) => ({
          title: String(entry.title || ''),
          section: String(entry.section || ''),
          url: entry.url,
          text: String(entry.text || ''),
          titleKey: normalize(entry.title),
          sectionKey: normalize(entry.section),
          textKey: normalize(entry.text),
        }));
    }
    return searchIndex;
  }

  function validLocalUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return url.origin === window.location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  function renderSearch() {
    if (!searchInput || !searchStatus || !searchResults) return;
    const query = normalize(searchInput.value).trim();
    const terms = query.split(/\s+/u).filter(Boolean);
    const index = getSearchIndex();
    const ranked = index
      .map((entry) => {
        if (terms.length && !terms.every((term) =>
          entry.titleKey.includes(term) || entry.sectionKey.includes(term) || entry.textKey.includes(term))) {
          return null;
        }
        const score = terms.reduce((sum, term) =>
          sum + (entry.titleKey.includes(term) ? 4 : 0)
              + (entry.sectionKey.includes(term) ? 2 : 0)
              + (entry.textKey.includes(term) ? 1 : 0), 0);
        return { entry, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    const visible = ranked.slice(0, terms.length ? 30 : 12);
    const fragment = document.createDocumentFragment();
    for (const { entry } of visible) {
      const href = validLocalUrl(entry.url);
      if (!href) continue;
      const link = document.createElement('a');
      link.href = href;
      const section = document.createElement('small');
      section.textContent = entry.section || 'บทเรียน';
      const title = document.createElement('strong');
      title.textContent = entry.title || entry.section || 'หน้า';
      link.append(section, title);
      if (entry.text) {
        const snippet = document.createElement('span');
        snippet.textContent = entry.text.trim().slice(0, 180);
        link.append(snippet);
      }
      fragment.append(link);
    }
    searchResults.replaceChildren(fragment);
    if (!index.length) {
      searchStatus.textContent = 'ยังไม่มีข้อมูลสำหรับค้นหา';
    } else if (!terms.length) {
      searchStatus.textContent = 'เลือกหัวข้อ หรือพิมพ์คำที่ต้องการค้นหา';
    } else {
      searchStatus.textContent = ranked.length
        ? `พบ ${ranked.length} รายการ${ranked.length > visible.length ? ` · แสดง ${visible.length} รายการแรก` : ''}`
        : 'ไม่พบผลการค้นหา';
    }
  }

  function openSearch() {
    if (!searchDialog || !searchInput) return;
    if (!searchDialog.open) searchDialog.showModal();
    renderSearch();
    searchInput.focus();
  }
  searchButton?.addEventListener('click', openSearch);
  closeSearchButton?.addEventListener('click', () => searchDialog?.close());
  searchInput?.addEventListener('input', renderSearch);
  searchDialog?.addEventListener('click', (event) => {
    if (event.target === searchDialog) searchDialog.close();
  });
  searchDialog?.addEventListener('close', () => searchButton?.focus());

  function setZoom(figure, zoomed) {
    figure.classList.toggle('is-zoomed', zoomed);
    const button = figure.querySelector('.page-zoom-control');
    if (button) {
      button.textContent = zoomed ? 'ย่อหน้า' : 'ขยายหน้า';
      button.setAttribute('aria-expanded', String(zoomed));
    }
    if (!zoomed && pageList) pageList.scrollLeft = 0;
  }
  if (pageList) {
    pageList.querySelectorAll('.source-page').forEach((figure) => {
      let caption = figure.querySelector('figcaption');
      if (!caption) {
        caption = document.createElement('figcaption');
        figure.append(caption);
      }
      const control = document.createElement('button');
      control.className = 'page-zoom-control';
      control.type = 'button';
      control.textContent = 'ขยายหน้า';
      control.setAttribute('aria-expanded', 'false');
      caption.append(control);
    });
    pageList.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.matches('.source-page img, .page-zoom-control')) return;
      const figure = target.closest('.source-page');
      if (!figure) return;
      const zoomed = !figure.classList.contains('is-zoomed');
      pageList.querySelectorAll('.source-page.is-zoomed').forEach((other) => {
        if (other !== figure) setZoom(other, false);
      });
      setZoom(figure, zoomed);
    });
  }

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
      return;
    }
    if (event.key === 'Escape') {
      if (body.classList.contains('menu-open')) {
        setMenu(false);
        menuButton?.focus();
      } else if (pageList) {
        pageList.querySelectorAll('.source-page.is-zoomed').forEach((figure) => setZoom(figure, false));
      }
    }
  });
})();

}
function mountSourceLabs() {}

(globalThis.QuantCornerReaderAdapters ||= {})["mathematics-of-investment-and-portfolio-management/20261015"] = { mountSourceShell, mountSourceLabs };
})();
