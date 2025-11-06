document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggle = document.getElementById('themeToggle');
  const search = document.getElementById('siteSearch');
  const searchSubmit = document.getElementById('siteSearchSubmit');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const stored = localStorage.getItem('theme');
  if (stored === 'light') {
    document.documentElement.classList.add('light');
  } else if (stored === 'dark') {
    document.documentElement.classList.remove('light');
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      toggle.setAttribute('aria-pressed', String(isLight));
      updateThemeIcon(isLight);
    });
    // Initialize pressed state
    const initialIsLight = document.documentElement.classList.contains('light');
    toggle.setAttribute('aria-pressed', String(initialIsLight));
    updateThemeIcon(initialIsLight);
  }

  // Simple client-side filter announce for screen readers
  // Blur home link on mouse click to avoid persistent focus ring
  const homeLink = document.querySelector('.home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      // e.detail > 0 indicates a pointer (mouse/touch) activation
      if (e && e.detail > 0) {
        requestAnimationFrame(() => homeLink.blur());
      }
    });
  }

  function runSearch() {
    const status = document.getElementById('searchStatus');
    const q = (search?.value || '').trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll('.card'));
    let visible = 0;
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const match = text.includes(q);
      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    if (status) status.textContent = q ? `${visible} result${visible === 1 ? '' : 's'} for “${q}”.` : '';
  }

  if (search) {
    const status = document.getElementById('searchStatus');
    search.addEventListener('input', runSearch);
    if (searchSubmit) {
      searchSubmit.addEventListener('click', (e) => { e.preventDefault(); runSearch(); });
    }
  }

  // Sidebar toggle with persistence
  if (sidebar && sidebarToggle) {
    const storedSidebar = localStorage.getItem('sidebar');
    if (storedSidebar === 'open') {
      sidebar.classList.add('open');
      sidebarToggle.setAttribute('aria-expanded', 'true');
    }
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      sidebarToggle.setAttribute('aria-expanded', String(isOpen));
      localStorage.setItem('sidebar', isOpen ? 'open' : 'closed');
    });
  }

  // Load certifications from local JSON and render table rows
  const certsBody = document.getElementById('certsBody');
  if (certsBody) {
    let certsData = [];
    let currentSort = { key: 'issued', dir: 'desc' };

    function normalizeIssued(value) {
      // Expect formats like "Jul 2024"; fallback to Date parse
      if (!value) return 0;
      const d = Date.parse(value);
      return isNaN(d) ? 0 : d;
    }

    function renderCerts(data) {
      if (!Array.isArray(data)) return;
      const fragment = document.createDocumentFragment();
      data.forEach(cert => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = cert.name || '';
        const tdIssuer = document.createElement('td');
        tdIssuer.textContent = cert.issuer || '';
        const tdIssued = document.createElement('td');
        tdIssued.textContent = cert.issued || '';
        const tdCred = document.createElement('td');
        if (cert.url) {
          const a = document.createElement('a');
          a.href = cert.url;
          a.target = '_blank';
          a.rel = 'noreferrer noopener';
          a.textContent = cert.credentialId ? cert.credentialId : 'View';
          tdCred.appendChild(a);
        } else {
          tdCred.textContent = cert.credentialId || '—';
        }
        tr.appendChild(tdName);
        tr.appendChild(tdIssuer);
        tr.appendChild(tdIssued);
        tr.appendChild(tdCred);
        fragment.appendChild(tr);
      });
      certsBody.innerHTML = '';
      certsBody.appendChild(fragment);
    }

    function sortAndRender(key) {
      const dir = (currentSort.key === key && currentSort.dir === 'asc') ? 'desc' : 'asc';
      currentSort = { key, dir };
      const sorted = [...certsData].sort((a, b) => {
        let va = a[key] ?? '';
        let vb = b[key] ?? '';
        if (key === 'issued') {
          va = normalizeIssued(va);
          vb = normalizeIssued(vb);
        }
        if (typeof va === 'string' && typeof vb === 'string') {
          va = va.toLowerCase();
          vb = vb.toLowerCase();
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
      });
      // Update aria-sort on headers
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.setAttribute('aria-sort', th.getAttribute('data-sort') === key ? dir === 'asc' ? 'ascending' : 'descending' : 'none');
      });
      renderCerts(sorted);
    }

    function attachSortHandlers() {
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortAndRender(th.getAttribute('data-sort')));
        th.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortAndRender(th.getAttribute('data-sort')); }
        });
      });
    }

    function initCerts(data) {
      certsData = Array.isArray(data) ? data : [];
      attachSortHandlers();
      sortAndRender(currentSort.key);
    }

    fetch('certs.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(initCerts)
      .catch(() => {
        const inline = document.getElementById('certs-data');
        if (inline && inline.textContent) {
          try { initCerts(JSON.parse(inline.textContent)); } catch {}
        }
      });
  }

  function updateThemeIcon(isLight) {
    if (!toggle) return;
    // Use emoji for broad support; include accessible label
    toggle.textContent = isLight ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  }

  // Scrollspy: highlight sidebar link for visible section
  const sectionIds = ['projects','design','resume','certifications','salesforce','about','contact'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const sidebarLinks = Array.from(document.querySelectorAll('#sidebar a[href^="#"]'));
  if (sections.length && sidebarLinks.length) {
    const topbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')) || 56;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          sidebarLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
          history.replaceState(null, '', `#${id}`);
        }
      });
    }, { root: null, rootMargin: `-${topbarHeight + 8}px 0px -60% 0px`, threshold: 0.2 });

    sections.forEach(sec => observer.observe(sec));

    // Initialize based on current hash
    const initHash = location.hash.replace('#','');
    if (initHash) {
      sidebarLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${initHash}`));
    }

    // Improve click behavior: set active immediately
    sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }
});



// Split button web component: <split-button label="View" figma-href="..." handoff-href="...">
(function defineSplitButton(){
  if (customElements.get('split-button')) return;
  class SplitButton extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({ mode: 'open' });
      this.onDocClick = this.onDocClick.bind(this);
    }
    connectedCallback(){
      const label = this.getAttribute('label') || 'View';
      const figmaHref = this.getAttribute('figma-href') || '#';
      const handoffHref = this.getAttribute('handoff-href') || '#';
      const style = `
        :host{ display:block; width:100%; }
        .group{ display:flex; position:relative; width:100%; }
        button, a.button { font: inherit; }
        .btn{ background: var(--primary, #4f46e5); color:#fff; border:none; padding:.5rem .9rem; cursor:pointer; border-radius:8px 0 0 8px; flex:1; text-align:center; }
        .toggle{ background: var(--primary, #4f46e5); color:#fff; border:none; padding:.5rem .5rem; width:42px; cursor:pointer; border-radius:0 8px 8px 0; border-left: 1px solid rgba(255,255,255,.2); }
        .btn:focus, .toggle:focus { outline: 3px solid var(--focus, #22c55e); outline-offset: 3px; }
        .menu{ position:absolute; top:100%; right:0; background: var(--card, #111217); color: var(--text, #e5e7eb); border:1px solid var(--border, #1f2330); border-radius:8px; padding:.25rem; margin-top:.25rem; min-width: 160px; display:none; z-index:1000; }
        .menu[open]{ display:block; }
        .item{ display:block; width:100%; text-align:left; background:transparent; color:inherit; border:none; padding:.5rem .6rem; border-radius:6px; cursor:pointer; }
        .item:hover{ background: rgba(124,58,237,.12); }
      `;
      this.shadowRoot.innerHTML = `
        <style>${style}</style>
        <div class="group" role="group" aria-label="Split button">
          <button class="btn" part="button" aria-label="${label}">${label}</button>
          <button class="toggle" part="toggle" aria-haspopup="menu" aria-expanded="false" aria-label="More options" title="More options">▾</button>
          <div class="menu" part="menu" role="menu">
            <button class="item" role="menuitem" data-href="${figmaHref}" data-target="_blank">Figma</button>
            <button class="item" role="menuitem" data-href="${handoffHref}" data-target="_blank">Handoff</button>
          </div>
        </div>
      `;
      const primary = this.shadowRoot.querySelector('.btn');
      const toggle = this.shadowRoot.querySelector('.toggle');
      const menu = this.shadowRoot.querySelector('.menu');
      const items = Array.from(this.shadowRoot.querySelectorAll('.item'));

      primary.addEventListener('click', () => {
        const href = items[0]?.getAttribute('data-href') || '#';
        if (href && href !== '#') window.open(href, '_blank', 'noopener');
      });
      toggle.addEventListener('click', () => this.setMenuOpen(!this.isMenuOpen()));
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown'){ e.preventDefault(); this.setMenuOpen(true); items[0]?.focus(); }
      });
      items.forEach((el, idx) => {
        el.addEventListener('click', () => {
          const href = el.getAttribute('data-href');
          if (href) window.open(href, '_blank', 'noopener');
          this.setMenuOpen(false);
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Escape'){ this.setMenuOpen(false); toggle.focus(); }
          if (e.key === 'ArrowDown'){ e.preventDefault(); (items[idx+1] || items[0]).focus(); }
          if (e.key === 'ArrowUp'){ e.preventDefault(); (items[idx-1] || items[items.length-1]).focus(); }
        });
      });
      document.addEventListener('click', this.onDocClick);
    }
    disconnectedCallback(){
      document.removeEventListener('click', this.onDocClick);
    }
    onDocClick(e){
      if (!this.shadowRoot) return;
      const path = e.composedPath?.() || [];
      if (!path.includes(this)) this.setMenuOpen(false);
    }
    isMenuOpen(){ return this.shadowRoot.querySelector('.menu')?.hasAttribute('open'); }
    setMenuOpen(open){
      const menu = this.shadowRoot.querySelector('.menu');
      const toggle = this.shadowRoot.querySelector('.toggle');
      if (!menu || !toggle) return;
      if (open){ menu.setAttribute('open', ''); toggle.setAttribute('aria-expanded', 'true'); }
      else { menu.removeAttribute('open'); toggle.setAttribute('aria-expanded', 'false'); }
    }
  }
  customElements.define('split-button', SplitButton);
})();

