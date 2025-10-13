document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggle = document.getElementById('themeToggle');
  const search = document.getElementById('siteSearch');
  const searchSubmit = document.getElementById('siteSearchSubmit');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || !stored) {
    document.documentElement.classList.add('light');
    if (!stored) localStorage.setItem('theme', 'light');
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
});


