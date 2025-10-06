document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggle = document.getElementById('themeToggle');
  const search = document.getElementById('siteSearch');
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
  if (search) {
    const status = document.getElementById('searchStatus');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      const cards = Array.from(document.querySelectorAll('.card'));
      let visible = 0;
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const match = text.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      if (status) status.textContent = q ? `${visible} result${visible === 1 ? '' : 's'} for “${q}”.` : '';
    });
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
    function renderCerts(certs) {
      if (!Array.isArray(certs)) return;
      const fragment = document.createDocumentFragment();
      certs.forEach(cert => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = cert.name || '';
        const tdIssuer = document.createElement('td');
        tdIssuer.textContent = cert.issuer || '';
        const tdIssued = document.createElement('td');
        tdIssued.textContent = [cert.issued, cert.expires ? ` · Expires ${cert.expires}` : ''].filter(Boolean).join('');
        const tdLink = document.createElement('td');
        if (cert.url) {
          const a = document.createElement('a');
          a.href = cert.url;
          a.target = '_blank';
          a.rel = 'noreferrer noopener';
          a.textContent = cert.credentialId ? `View (${cert.credentialId})` : 'View';
          tdLink.appendChild(a);
        } else {
          tdLink.textContent = cert.credentialId || '—';
        }
        tr.appendChild(tdName);
        tr.appendChild(tdIssuer);
        tr.appendChild(tdIssued);
        tr.appendChild(tdLink);
        fragment.appendChild(tr);
      });
      certsBody.innerHTML = '';
      certsBody.appendChild(fragment);
    }

    fetch('certs.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(renderCerts)
      .catch(() => {
        const inline = document.getElementById('certs-data');
        if (inline && inline.textContent) {
          try {
            const data = JSON.parse(inline.textContent);
            renderCerts(data);
          } catch {}
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


