// =============================================================================
//  KONFIGURACJA SUPABASE
//  Klucz anon jest publiczny z założenia — bezpieczeństwo zapewniają
//  polityki RLS po stronie bazy danych.
// =============================================================================
const SB_URL = 'https://kukvgsjrmrqtzhkszzum.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY';
const SB_CLIENT = supabase.createClient(SB_URL, SB_KEY);

let currentRole = 'viewer';
let currentUser = null;
let quillInstance = null;

// Mapowanie platform na klasy CSS domain-tag
const PLAT_CLASS = {
  'AuraBenefits':     'd-benefits',
  'AuraConsulting.pl':'d-aura',
  'Grupowe.pro':      'd-grupowe',
  'UtrataDochodu.pl': 'd-utrata',
  'Gwarancje.pro':    'd-gwar',
  'Idzik.org.pl':     'd-idzik',
};

const ALL_PLATFORMS = [
  { id: 'plat_aurabenefits',   value: 'AuraBenefits' },
  { id: 'plat_auraconsulting', value: 'AuraConsulting.pl' },
  { id: 'plat_grupowe',        value: 'Grupowe.pro' },
  { id: 'plat_utratadochodu',  value: 'UtrataDochodu.pl' },
  { id: 'plat_gwarancje',      value: 'Gwarancje.pro' },
  { id: 'plat_idzik',          value: 'Idzik.org.pl' },
];

const PAGE_TITLES = {
  blog:      'Baza Wiedzy HR',
  article:   'Artykuł',
  dashboard: 'Pulpit',
  articles:  'Artykuły',
  social:    'Social Media',
  analytics: 'Analityka',
  users:     'Użytkownicy',
};

const ADMIN_PAGES = ['dashboard', 'articles', 'social', 'analytics', 'users'];


// =============================================================================
//  BEZPIECZEŃSTWO — DOMPurify
// =============================================================================
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') || '';
    const allowed = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'vimeo.com'];
    if (!allowed.some(d => src.includes(d))) node.removeAttribute('src');
  }
});

function safeHtml(dirty) {
  return DOMPurify.sanitize(dirty || '', {
    FORCE_BODY: true,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow', 'src'],
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function youtubeThumbnail(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

function platBadge(platform) {
  const cls = PLAT_CLASS[platform] || 'd-aura';
  return `<span class="domain-tag ${cls}">${escapeHtml(platform)}</span>`;
}


// =============================================================================
//  AUTORYZACJA
// =============================================================================
async function checkAuthAndUpdateUI() {
  const { data: { session } } = await SB_CLIENT.auth.getSession();

  if (!session) {
    currentRole = 'viewer';
    currentUser = null;
    updateNavForRole();
    return;
  }

  currentUser = session.user;

  const { data: profile, error } = await SB_CLIENT
    .from('profiles')
    .select('rola')
    .eq('id', session.user.id)
    .single();

  currentRole = (!error && profile?.rola === 'admin') ? 'admin' : 'viewer';
  updateNavForRole();
}

function updateNavForRole() {
  const isAdmin = currentRole === 'admin';

  document.querySelectorAll('.admin-only').forEach(el =>
    el.classList.toggle('hidden', !isAdmin)
  );
  document.getElementById('loginSideBtn').classList.toggle('hidden', isAdmin);
  document.getElementById('logoutSideBtn').classList.toggle('hidden', !isAdmin);

  const userEl = document.getElementById('topbarUser');
  if (isAdmin && currentUser) {
    userEl.textContent = currentUser.email;
    userEl.classList.remove('hidden');
  } else {
    userEl.classList.add('hidden');
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');

  errEl.classList.add('hidden');
  btn.textContent = 'Logowanie...';
  btn.disabled = true;

  const { error } = await SB_CLIENT.auth.signInWithPassword({ email, password: pass });

  btn.textContent = 'Zaloguj się';
  btn.disabled = false;

  if (error) {
    errEl.textContent = 'Błąd: ' + error.message;
    errEl.classList.remove('hidden');
    return;
  }

  closeLoginScreen();
  await checkAuthAndUpdateUI();
  if (currentRole === 'admin') navTo('dashboard');
}

async function doLogout() {
  await SB_CLIENT.auth.signOut();
  currentRole = 'viewer';
  currentUser = null;
  updateNavForRole();
  navTo('blog');
}

function showLoginScreen()  { document.getElementById('loginScreen').classList.remove('hidden'); }
function closeLoginScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('loginError').classList.add('hidden');
}


// =============================================================================
//  NAWIGACJA / ROUTING
// =============================================================================
function navTo(page, skipHash = false) {
  if (ADMIN_PAGES.includes(page) && currentRole !== 'admin') {
    showLoginScreen();
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || page;

  if (page === 'blog')      loadPublishedArticles();
  if (page === 'dashboard') loadDashboard();
  if (page === 'articles')  loadAdminArticles();

  if (!skipHash) history.pushState(null, null, '#' + page);
}

async function handleHashChange() {
  const hash = window.location.hash.replace('#', '');

  if (hash.startsWith('article-')) {
    await openArticle(hash.replace('article-', ''), true);
  } else if (hash && document.getElementById('page-' + hash)) {
    navTo(hash, true);
  } else {
    navTo('blog', true);
  }
}

window.addEventListener('hashchange', handleHashChange);

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}


// =============================================================================
//  DARK MODE
// =============================================================================
function initThemeToggle() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? '' : 'dark';
    const iconEl = btn.querySelector('i');
    if (iconEl) {
      iconEl.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
      lucide.createIcons();
    }
  });
}


// =============================================================================
//  QUILL — inicjalizacja
// =============================================================================
function initQuill() {
  quillInstance = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Zacznij pisać swój artykuł tutaj...',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    },
  });
}


// =============================================================================
//  DASHBOARD — KPI + ostatnie artykuły
// =============================================================================
async function loadDashboard() {
  if (currentRole !== 'admin') return;

  const [{ count: published }, { count: drafts }] = await Promise.all([
    SB_CLIENT.from('aura_articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    SB_CLIENT.from('aura_articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  document.getElementById('kpi-published').textContent = published ?? '—';
  document.getElementById('kpi-drafts').textContent = drafts ?? '—';

  const { data } = await SB_CLIENT
    .from('aura_articles')
    .select('id, title, platforms, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const tbody = document.getElementById('dashboard-recent-articles');

  if (!data || !data.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Brak artykułów.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(art => {
    const plats = (art.platforms || []).map(platBadge).join(' ');
    const badge = art.status === 'published'
      ? '<span class="badge badge-success">Opublikowano</span>'
      : '<span class="badge badge-muted">Szkic</span>';
    return `<tr>
      <td><strong>${escapeHtml(art.title)}</strong></td>
      <td>${plats}</td>
      <td>${badge}</td>
      <td>${new Date(art.created_at).toLocaleDateString('pl-PL')}</td>
    </tr>`;
  }).join('');
}


// =============================================================================
//  CZYTNIK ARTYKUŁÓW
// =============================================================================
async function openArticle(id, skipHashChange = false) {
  const { data, error } = await SB_CLIENT
    .from('aura_articles')
    .select('*')
    .eq('id', id)
    .single();

  if (!data || error) {
    alert('Nie znaleziono artykułu.');
    navTo('blog');
    return;
  }

  document.getElementById('amTitle').textContent = data.title;
  document.getElementById('amDate').textContent  =
    `Opublikowano: ${new Date(data.published_at || data.created_at).toLocaleString('pl-PL')}`;
  document.getElementById('amContent').innerHTML = safeHtml(data.content);
  document.getElementById('amTags').innerHTML = (data.tags || [])
    .map(t => `<span class="article-tag">${escapeHtml(t)}</span>`)
    .join('');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-article').classList.add('active');
  document.getElementById('topbarTitle').textContent = 'Artykuł';

  window.scrollTo(0, 0);
  if (!skipHashChange) history.pushState(null, null, '#article-' + id);
}

function closeArticle() { navTo('blog'); }

function copyArticleLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert('Link skopiowany!'))
    .catch(() => alert('Skopiuj ręcznie:\n' + window.location.href));
}


// =============================================================================
//  BLOG PUBLICZNY
// =============================================================================
async function loadPublishedArticles() {
  const grid = document.getElementById('blogGrid');
  grid.innerHTML = '<div class="empty-state">Pobieranie artykułów...</div>';

  const { data, error } = await SB_CLIENT
    .from('aura_articles')
    .select('id, title, excerpt, tags, published_at, thumbnail_url')
    .eq('status', 'published')
    .contains('platforms', ['AuraBenefits'])
    .order('published_at', { ascending: false });

  if (error || !data) {
    grid.innerHTML = '<div class="empty-state empty-state-error">Błąd połączenia z bazą danych.</div>';
    return;
  }

  if (data.length === 0) {
    grid.innerHTML = '<div class="empty-state">Brak opublikowanych artykułów.</div>';
    return;
  }

  grid.innerHTML = data.map(art => {
    const thumb = youtubeThumbnail(art.thumbnail_url);
    const thumbHtml = thumb
      ? `<div class="blog-card-thumb" style="background-image:url('${thumb}')">
           <div class="blog-card-thumb-overlay"></div>
         </div>`
      : '';

    const tagsHtml = (art.tags || []).slice(0, 2).map(t =>
      `<span class="badge badge-primary">${escapeHtml(t)}</span>`
    ).join('') + (art.tags?.length > 2
      ? `<span style="font-size:11px;color:var(--color-text-faint)">+${art.tags.length - 2}</span>`
      : '');

    return `
      <div class="blog-card" onclick="openArticle('${escapeHtml(String(art.id))}')">
        ${thumbHtml}
        <div class="blog-card-body">
          <div class="blog-card-tags">${tagsHtml}</div>
          <div class="blog-card-title">${escapeHtml(art.title)}</div>
          <div class="blog-card-excerpt">${escapeHtml(art.excerpt || '')}</div>
          <div class="blog-card-footer">
            <span>${new Date(art.published_at).toLocaleDateString('pl-PL')}</span>
            <span class="blog-card-cta">Czytaj →</span>
          </div>
        </div>
      </div>`;
  }).join('');
}


// =============================================================================
//  ADMIN — TABELA ARTYKUŁÓW
// =============================================================================
async function loadAdminArticles() {
  if (currentRole !== 'admin') return;

  const tbody = document.getElementById('adminArticlesList');
  tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Ładowanie...</td></tr>`;

  let query = SB_CLIENT.from('aura_articles').select('*').order('created_at', { ascending: false });

  const filterStatus   = document.getElementById('filterStatus')?.value;
  const filterPlatform = document.getElementById('filterPlatform')?.value;
  if (filterStatus)   query = query.eq('status', filterStatus);
  if (filterPlatform) query = query.contains('platforms', [filterPlatform]);

  const { data, error } = await query;

  if (error || !data) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state empty-state-error">Błąd: ${escapeHtml(error?.message || '')}</td></tr>`;
    return;
  }

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Brak artykułów spełniających kryteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(art => {
    const safeId = escapeHtml(String(art.id));
    const isDraft = art.status === 'draft';
    const badge = isDraft
      ? '<span class="badge badge-muted">Szkic</span>'
      : '<span class="badge badge-success">Opublikowano</span>';
    const plats = (art.platforms || []).map(platBadge).join(' ');
    const unpublishBtn = !isDraft
      ? `<button class="btn-icon" onclick="unpublishArticle('${safeId}')" title="Cofnij publikację">
           <i data-lucide="eye-off" width="15" height="15"></i>
         </button>`
      : '';

    return `<tr>
      <td>
        <strong>${escapeHtml(art.title)}</strong><br>
        <span class="td-meta">${escapeHtml((art.excerpt || '').slice(0, 80))}${(art.excerpt || '').length > 80 ? '…' : ''}</span>
      </td>
      <td>${plats}</td>
      <td>${badge}</td>
      <td>${new Date(art.created_at).toLocaleDateString('pl-PL')}</td>
      <td class="td-actions">
        <button class="btn-icon" onclick="openArticle('${safeId}')" title="Podgląd">
          <i data-lucide="eye" width="15" height="15"></i>
        </button>
        <button class="btn-icon" onclick="editArticleInCms('${safeId}')" title="Edytuj">
          <i data-lucide="edit" width="15" height="15"></i>
        </button>
        ${unpublishBtn}
        <button class="btn-icon btn-icon-danger" onclick="deleteArticle('${safeId}')" title="Usuń">
          <i data-lucide="trash-2" width="15" height="15"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  lucide.createIcons();
}


// =============================================================================
//  CMS MODAL — otwieranie / edycja
// =============================================================================
function openNewArticleModal() {
  if (currentRole !== 'admin') return;

  document.getElementById('cmsModalTitle').textContent = 'Tworzenie Nowego Artykułu';
  document.getElementById('cmsId').value        = '';
  document.getElementById('cmsTitle').value     = '';
  document.getElementById('cmsExcerpt').value   = '';
  document.getElementById('cmsTags').value      = '';
  document.getElementById('cmsThumbnail').value = '';
  document.getElementById('thumbPreview').classList.add('hidden');
  document.getElementById('thumbPreview').style.backgroundImage = '';

  ALL_PLATFORMS.forEach(p => {
    document.getElementById(p.id).checked = (p.value === 'AuraBenefits');
  });

  quillInstance.root.innerHTML = '';
  openModal('modal-article');
}

async function editArticleInCms(id) {
  if (currentRole !== 'admin') return;

  const { data } = await SB_CLIENT.from('aura_articles').select('*').eq('id', id).single();
  if (!data) return;

  document.getElementById('cmsModalTitle').textContent = 'Edycja Artykułu';
  document.getElementById('cmsId').value        = id;
  document.getElementById('cmsTitle').value     = data.title;
  document.getElementById('cmsExcerpt').value   = data.excerpt || '';
  document.getElementById('cmsTags').value      = (data.tags || []).join(', ');
  document.getElementById('cmsThumbnail').value = data.thumbnail_url || '';
  previewThumbnail(data.thumbnail_url || '');

  const platforms = data.platforms || ['AuraBenefits'];
  ALL_PLATFORMS.forEach(p => {
    document.getElementById(p.id).checked = platforms.includes(p.value);
  });

  quillInstance.root.innerHTML = data.content;
  openModal('modal-article');
}

async function saveArticle(desiredStatus) {
  if (currentRole !== 'admin') { alert('Brak uprawnień.'); return; }

  const id           = document.getElementById('cmsId').value;
  const title        = document.getElementById('cmsTitle').value.trim();
  const excerpt      = document.getElementById('cmsExcerpt').value.trim();
  const tagsStr      = document.getElementById('cmsTags').value.trim();
  const contentHtml  = quillInstance.root.innerHTML;
  const thumbnailUrl = document.getElementById('cmsThumbnail').value.trim();

  const platforms = ALL_PLATFORMS
    .filter(p => document.getElementById(p.id).checked)
    .map(p => p.value);

  if (!platforms.length)             return alert('Wybierz przynajmniej jedno miejsce publikacji.');
  if (!title)                        return alert('Podaj tytuł artykułu.');
  if (contentHtml === '<p><br></p>') return alert('Artykuł nie może być pusty.');

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  const payload = {
    title, excerpt, content: contentHtml,
    tags, platforms,
    thumbnail_url: thumbnailUrl || null,
    status: desiredStatus,
    ai_generated: false,
  };
  if (desiredStatus === 'published') payload.published_at = new Date().toISOString();

  const { error } = id
    ? await SB_CLIENT.from('aura_articles').update(payload).eq('id', id)
    : await SB_CLIENT.from('aura_articles').insert([payload]);

  if (!error) {
    closeModal('modal-article');
    alert(desiredStatus === 'published' ? 'Artykuł opublikowany!' : 'Szkic zapisany.');
    loadAdminArticles();
  } else {
    alert('Błąd zapisu: ' + error.message);
  }
}

async function unpublishArticle(id) {
  if (currentRole !== 'admin') return;
  await SB_CLIENT.from('aura_articles').update({ status: 'draft' }).eq('id', id);
  loadAdminArticles();
}

async function deleteArticle(id) {
  if (currentRole !== 'admin') return;
  if (!confirm('Na pewno usunąć ten artykuł bezpowrotnie?')) return;
  await SB_CLIENT.from('aura_articles').delete().eq('id', id);
  loadAdminArticles();
}

function previewThumbnail(url) {
  const el = document.getElementById('thumbPreview');
  const thumb = youtubeThumbnail(url);
  if (thumb) {
    el.style.backgroundImage = `url('${thumb}')`;
    el.classList.remove('hidden');
  } else {
    el.style.backgroundImage = '';
    el.classList.add('hidden');
  }
}


// =============================================================================
//  MODALS — generyczne
// =============================================================================
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }


// =============================================================================
//  INIT
// =============================================================================
window.onload = async () => {
  lucide.createIcons();
  initThemeToggle();
  initQuill();

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  await checkAuthAndUpdateUI();
  handleHashChange();
};
