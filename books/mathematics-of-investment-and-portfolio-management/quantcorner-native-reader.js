/* Shared native reader bootstrap. Per-book code is reviewed and registered in adapter.js. */
(() => {
"use strict";
/** Generic static-content transplant; each executable source needs a reviewed adapter. */
const adapters = globalThis.QuantCornerReaderAdapters ||= {};
const adapterLoads = globalThis.QuantCornerReaderAdapterLoads ||= new Map();
async function ensureAdapter(page, pageURL) {
  if (adapters[page.scriptAdapter]) return;
  const url = new URL(page.adapterURL || 'adapter.js', pageURL);
  const manifestURL = new URL(pageURL);
  if (url.origin !== manifestURL.origin || !/^https?:$/.test(url.protocol) || !url.pathname.endsWith('/adapter.js')) throw new Error('Adapter URL must be the reviewed adapter.js beside the manifest');
  if (!adapterLoads.has(url.href)) adapterLoads.set(url.href, new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = url.href;
    script.onload = resolve; script.onerror = () => { adapterLoads.delete(url.href); reject(new Error('Adapter failed to load')); };
    document.head.append(script);
  }));
  await adapterLoads.get(url.href);
  if (!adapters[page.scriptAdapter]) throw new Error('Adapter did not register expected key');
}
class QuantCornerNativeReader extends HTMLElement {
  static get observedAttributes() { return ['page-url']; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.generation = 0;
    this.cleanup = () => {};
  }
  connectedCallback() { if (!this.loadedURL) this.load(); }
  disconnectedCallback() { this.generation++; this.cleanup(); this.loadedURL = null; }
  attributeChangedCallback(name, before, after) {
    if (before !== after && this.isConnected) this.load();
  }
  async load() {
    const suppliedURL = this.getAttribute('page-url');
    if (!suppliedURL) return;
    const pageURL = new URL(suppliedURL, globalThis.document.baseURI).href;
    if (this.loadedURL === pageURL) return;
    this.loadedURL = pageURL;
    const generation = ++this.generation;
    this.cleanup();
    this.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const reactRoots = [];
    const cleanups = [];
    const lifecycle = {
      signal: controller.signal,
      isCurrent: () => !controller.signal.aborted && generation === this.generation,
      trackRoot: root => { reactRoots.push(root); return root; },
      onCleanup: fn => cleanups.push(fn),
      listen: (target, type, listener, options) => {
        target.addEventListener(type, listener, options);
        cleanups.push(() => target.removeEventListener(type, listener, options));
      }
    };
    let cleaned = false;
    this.cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      controller.abort();
      this.shadowRoot.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      cleanups.forEach(fn => fn());
      reactRoots.forEach(root => root.unmount());
    };
    const root = this.shadowRoot;
    try {
      const response = await fetch(pageURL, { signal: controller.signal });
      if (!response.ok) throw new Error('Page request failed: ' + response.status);
      const page = await response.json();
      if (generation !== this.generation) return;
      if (page.schemaVersion !== 1 || !page.scriptAdapter) throw new Error('Unreviewed reader adapter');
      await ensureAdapter(page, pageURL);
      if (generation !== this.generation) return;
      const sourceDocument = globalThis.document.createElement('div');
      sourceDocument.className = 'qc-source-document ' + (page.htmlClass || '');
      Object.assign(sourceDocument.dataset, page.htmlDataset || {});
      sourceDocument.lang = page.lang;
      sourceDocument.dataset.theme = page.theme || 'light';
      const sourceBody = globalThis.document.createElement('div');
      sourceBody.className = 'qc-source-body ' + page.bodyClass;
      Object.assign(sourceBody.dataset, page.bodyDataset || {});
      const template = globalThis.document.createElement('template');
      template.innerHTML = page.bodyHTML;
      // Defense in depth: source HTML is build-time reviewed, never execute HTML scripts.
      for (const element of template.content.querySelectorAll('script,iframe,object,embed')) element.remove();
      for (const element of template.content.querySelectorAll('*')) {
        for (const attribute of [...element.attributes]) {
          if (/^on/i.test(attribute.name) || /^(?:javascript|vbscript):/i.test(attribute.value.trim())) element.removeAttribute(attribute.name);
        }
      }
      sourceBody.append(template.content);
      sourceDocument.append(sourceBody);
      const css = globalThis.document.createElement('link');
      css.rel = 'stylesheet';
      css.href = new URL(page.stylesURL, pageURL).href;
      const cssReady = new Promise((resolve, reject) => {
        css.onload = resolve;
        css.onerror = () => reject(new Error('Reader stylesheet failed to load'));
        controller.signal.addEventListener('abort', () => reject(new DOMException('Reader disconnected', 'AbortError')), { once: true });
      });
      root.replaceChildren(css, sourceDocument);
      const fontsURL = page.fontsURL ? new URL(page.fontsURL, pageURL).href : null;
      if (fontsURL && ![...globalThis.document.querySelectorAll('link[data-qc-reader-fonts]')].some(link => link.href === fontsURL)) {
        const fonts = globalThis.document.createElement('link');
        fonts.rel = 'stylesheet'; fonts.href = fontsURL; fonts.dataset.qcReaderFonts = '';
        globalThis.document.head.append(fonts);
      }
      // Shadow DOM does not resolve fragment navigation itself. Keep native URLs
      // and intercept only same-page fragment anchors, including back/forward.
      const scrollToHash = hash => {
        let id;
        try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return; }
        const target = root.getElementById(id);
        if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      };
      lifecycle.listen(root, 'click', event => {
        const anchor = event.target.closest?.('a[href]');
        if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const href = anchor.getAttribute('href');
        const parsed = new URL(href, location.href);
        const canonical = new URL(page.canonicalURL);
        if (href.startsWith('#') || (parsed.pathname === canonical.pathname && parsed.hash)) {
          event.preventDefault();
          history.pushState(null, '', parsed.hash);
          scrollToHash(parsed.hash);
          root.getElementById('search-dialog')?.close();
        }
      });
      lifecycle.listen(window, 'hashchange', () => scrollToHash(location.hash));
      await cssReady;
      if (generation !== this.generation) return;
      // Mount tools immediately; book search is secondary and must not block tools.
      await adapters[page.scriptAdapter].mountSourceLabs(root, lifecycle, page);
      if (generation !== this.generation) return;
      let searchIndex = [];
      if (page.searchIndexURL) {
        const searchResponse = await fetch(new URL(page.searchIndexURL, pageURL), { signal: controller.signal });
        if (!searchResponse.ok) throw new Error('Search index failed: ' + searchResponse.status);
        searchIndex = await searchResponse.json();
      }
      if (generation !== this.generation) return;
      await adapters[page.scriptAdapter].mountSourceShell(root, sourceDocument, sourceBody, searchIndex, lifecycle);
      if (generation !== this.generation) return;
      this.removeAttribute('aria-busy');
      this.dataset.readerState = 'ready';
      this.dispatchEvent(new CustomEvent('reader-ready', { bubbles: true, composed: true, detail: { pageSlug: page.pageSlug, mounts: page.mountIds.length + (page.mountSelectors?.length || 0) } }));
      if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash));
    } catch (error) {
      if (error.name === 'AbortError' || generation !== this.generation) return;
      this.removeAttribute('aria-busy');
      this.dataset.readerState = 'error';
      const message = globalThis.document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = 'เครื่องมืออ่านโหลดไม่ครบ กรุณาลองโหลดหน้านี้อีกครั้ง';
      root.append(message);
      console.error('QuantCorner native reader:', error);
      this.dispatchEvent(new CustomEvent('reader-error', { bubbles: true, composed: true, detail: { message: error.message } }));
    }
  }
}
if (!customElements.get('quantcorner-native-reader')) customElements.define('quantcorner-native-reader', QuantCornerNativeReader);

})();
