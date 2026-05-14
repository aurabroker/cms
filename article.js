// =============================================================================
//  KONFIGURACJA SUPABASE
// =============================================================================
const SB_URL = 'https://kukvgsjrmrqtzhkszzum.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY';
const SB_CLIENT = supabase.createClient(SB_URL, SB_KEY);

let tiptapInstance = null;
let autoSaveTimer  = null;
let editorDirty    = false;

const ALL_PLATFORMS = [
  { id: 'plat_aurabenefits',   value: 'AuraBenefits' },
  { id: 'plat_auraconsulting', value: 'AuraConsulting.pl' },
  { id: 'plat_grupowe',        value: 'Grupowe.pro' },
  { id: 'plat_utratadochodu',  value: 'UtrataDochodu.pl' },
  { id: 'plat_gwarancje',      value: 'Gwarancje.pro' },
  { id: 'plat_idzik',          value: 'Idzik.org.pl' },
  { id: 'plat_rwaw',    value: 'RozwodWaw.pl' },
  { id: 'plat_rtarch',  value: 'RozwodTarchomin.pl' },
  { id: 'plat_rochota', value: 'RozwodOchota.pl' },
  { id: 'plat_rzolibz', value: 'RozwodZoliborz.pl' },
  { id: 'plat_rbielan', value: 'RozwodBielany.pl' },
  { id: 'plat_rlegion', value: 'RozwodLegionowo.pl' },
  { id: 'plat_rmokot',  value: 'RozwodMokotow.pl' },
  { id: 'plat_rlomian', value: 'RozwodLomianki.pl' },
  { id: 'plat_rwola',   value: 'RozwodWola.pl' },
  { id: 'plat_rbemowo', value: 'RozwodBemowo.pl' },
  { id: 'plat_rjablon', value: 'RozwodJablonna.pl' },
];


// =============================================================================
//  NARZĘDZIA
// =============================================================================
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') || '';
    const allowed = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'vimeo.com'];
    if (!allowed.some(d => src.includes(d))) node.removeAttribute('src');
  }
});

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

function goBack() {
  try { window.opener?.loadAdminArticles?.(); } catch (_) {}
  if (window.opener && !window.opener.closed) {
    window.close();
  } else {
    window.location.href = 'index.html';
  }
}


// =============================================================================
//  SUPABASE STORAGE — upload zdjęć
// =============================================================================
async function uploadImageToSupabase(file) {
  const ext = ((file.name || 'image').split('.').pop() || 'jpg')
    .toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  setAutoSaveIndicator('saving', 'Wgrywanie zdjęcia...');

  const { error } = await SB_CLIENT.storage
    .from('article-images')
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) {
    setAutoSaveIndicator('error', '⚠ Błąd uploadu: ' + error.message);
    setTimeout(hideAutoSaveIndicator, 4000);
    return null;
  }

  const { data: { publicUrl } } = SB_CLIENT.storage
    .from('article-images')
    .getPublicUrl(filename);

  setAutoSaveIndicator('saved', '✓ Zdjęcie wgrane');
  setTimeout(hideAutoSaveIndicator, 2000);
  return publicUrl;
}


// =============================================================================
//  TIPTAP
// =============================================================================
function initTiptap() {
  const { Editor, StarterKit, Image, Link, Underline, Placeholder, Youtube } = window.Tiptap;

  tiptapInstance = new Editor({
    element: document.querySelector('#tiptapEditor'),
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: 'Zacznij pisać swój artykuł tutaj...' }),
      Youtube,
    ],
    content: '',
    onUpdate: () => {
      editorDirty = true;
      updateTiptapToolbar();
    },
    onSelectionUpdate: () => {
      updateTiptapToolbar();
    },
  });

  tiptapInstance.view.dom.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const url = await uploadImageToSupabase(file);
        if (url) tiptapInstance.chain().focus().setImage({ src: url }).run();
        return;
      }
    }
  });
}

function tiptapCmd(cmd, args) {
  if (!tiptapInstance) return;
  const chain = tiptapInstance.chain().focus();
  if (args) chain[cmd](args).run();
  else chain[cmd]().run();
}

function tiptapSetLink() {
  if (!tiptapInstance) return;
  const prev = tiptapInstance.getAttributes('link').href || '';
  const url  = prompt('Wpisz URL linku:', prev);
  if (url === null) return;
  if (url === '') tiptapInstance.chain().focus().unsetLink().run();
  else tiptapInstance.chain().focus().setLink({ href: url }).run();
}

function tiptapInsertImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const url = await uploadImageToSupabase(file);
    if (url) tiptapInstance.chain().focus().setImage({ src: url }).run();
  };
  input.click();
}

function tiptapInsertYoutube() {
  const url = prompt('Wpisz URL YouTube:');
  if (!url) return;
  tiptapInstance.chain().focus().setYoutubeVideo({ src: url }).run();
}

function tiptapClearFormat() {
  if (!tiptapInstance) return;
  tiptapInstance.chain().focus().clearNodes().unsetAllMarks().run();
}

function updateTiptapToolbar() {
  if (!tiptapInstance) return;
  document.querySelectorAll('#tiptapToolbar .tb-btn[data-active-check]').forEach(btn => {
    try {
      const parsed = JSON.parse(btn.dataset.activeCheck);
      const name   = parsed[0];
      const attrs  = parsed[1] || {};
      btn.classList.toggle('is-active', tiptapInstance.isActive(name, attrs));
    } catch (_) {}
  });
}


// =============================================================================
//  AUTO-SAVE
// =============================================================================
function setAutoSaveIndicator(state, text) {
  const el = document.getElementById('autosaveIndicator');
  if (!el) return;
  el.className = `autosave-indicator ${state}`;
  el.textContent = text;
}

function hideAutoSaveIndicator() {
  const el = document.getElementById('autosaveIndicator');
  if (el) el.classList.add('hidden');
}

function startAutoSave() {
  editorDirty = false;
  clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(runAutoSave, 30000);
}

function stopAutoSave() {
  clearInterval(autoSaveTimer);
  autoSaveTimer = null;
  hideAutoSaveIndicator();
}

async function runAutoSave() {
  if (!editorDirty) return;
  const id = document.getElementById('cmsId').value;
  if (!id) return;

  const title = document.getElementById('cmsTitle').value.trim();
  if (!title) return;

  setAutoSaveIndicator('saving', 'Automatyczne zapisywanie...');

  const contentHtml     = tiptapInstance.getHTML();
  const excerpt         = document.getElementById('cmsExcerpt').value.trim();
  const tagsStr         = document.getElementById('cmsTags').value.trim();
  const tags            = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
  const thumbnailUrl    = document.getElementById('cmsThumbnail').value.trim();
  const previewImageUrl = document.getElementById('cmsPreviewImageUrl').value.trim();

  const platforms = ALL_PLATFORMS
    .filter(p => document.getElementById(p.id).checked)
    .map(p => p.value);

  const { error } = await SB_CLIENT.from('aura_articles').update({
    title, excerpt, content: contentHtml, tags, platforms,
    thumbnail_url: thumbnailUrl || null,
    preview_image_url: previewImageUrl || null,
  }).eq('id', id);

  if (!error) {
    editorDirty = false;
    setAutoSaveIndicator('saved', '✓ Automatycznie zapisano');
    setTimeout(hideAutoSaveIndicator, 3000);
  } else {
    setAutoSaveIndicator('error', '⚠ Błąd auto-zapisu');
  }
}


// =============================================================================
//  MINIATURKI
// =============================================================================
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

async function handlePreviewImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const url = await uploadImageToSupabase(file);
  if (!url) return;
  document.getElementById('cmsPreviewImageUrl').value = url;
  showPreviewImgThumb(url);
}

function showPreviewImgThumb(url) {
  const el       = document.getElementById('previewImgThumb');
  const clearBtn = document.getElementById('previewImgClear');
  if (url) {
    el.style.backgroundImage = `url('${url}')`;
    el.classList.remove('hidden');
    clearBtn.style.display = '';
  } else {
    el.style.backgroundImage = '';
    el.classList.add('hidden');
    clearBtn.style.display = 'none';
  }
}

function clearPreviewImage() {
  document.getElementById('cmsPreviewImageUrl').value = '';
  document.getElementById('cmsPreviewImageFile').value = '';
  showPreviewImgThumb('');
}


// =============================================================================
//  ZAPIS
// =============================================================================
async function saveArticle(desiredStatus) {
  const id           = document.getElementById('cmsId').value;
  const title        = document.getElementById('cmsTitle').value.trim();
  const excerpt      = document.getElementById('cmsExcerpt').value.trim();
  const tagsStr      = document.getElementById('cmsTags').value.trim();
  const contentHtml  = tiptapInstance.getHTML();
  const thumbnailUrl    = document.getElementById('cmsThumbnail').value.trim();
  const previewImageUrl = document.getElementById('cmsPreviewImageUrl').value.trim();

  const platforms = ALL_PLATFORMS
    .filter(p => document.getElementById(p.id).checked)
    .map(p => p.value);

  if (!platforms.length)      return alert('Wybierz przynajmniej jedno miejsce publikacji.');
  if (!title)                 return alert('Podaj tytuł artykułu.');
  if (tiptapInstance.isEmpty) return alert('Artykuł nie może być pusty.');

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  const payload = {
    title, excerpt, content: contentHtml,
    tags, platforms,
    thumbnail_url: thumbnailUrl || null,
    preview_image_url: previewImageUrl || null,
    status: desiredStatus,
    ai_generated: false,
  };
  if (desiredStatus === 'published') payload.published_at = new Date().toISOString();

  const { error } = id
    ? await SB_CLIENT.from('aura_articles').update(payload).eq('id', id)
    : await SB_CLIENT.from('aura_articles').insert([payload]);

  if (!error) {
    editorDirty = false;
    stopAutoSave();
    goBack();
  } else {
    alert('Błąd zapisu: ' + error.message);
  }
}

function cancelEdit() {
  if (editorDirty && !confirm('Masz niezapisane zmiany. Na pewno zamknąć?')) return;
  stopAutoSave();
  goBack();
}


// =============================================================================
//  LOGOWANIE
// =============================================================================
function showLoginScreen() {
  document.getElementById('articleLoginScreen').classList.remove('hidden');
  document.getElementById('articleEditorWrap').classList.add('hidden');
}

function showEditor() {
  document.getElementById('articleLoginScreen').classList.add('hidden');
  document.getElementById('articleEditorWrap').classList.remove('hidden');
}

async function articleDoLogin() {
  const email  = document.getElementById('articleLoginEmail').value.trim();
  const pass   = document.getElementById('articleLoginPassword').value;
  const errEl  = document.getElementById('articleLoginError');
  const btn    = document.getElementById('articleLoginBtn');

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

  await bootEditor();
}

async function checkAdminAccess() {
  const { data: { session } } = await SB_CLIENT.auth.getSession();
  if (!session) return false;

  const { data: profile } = await SB_CLIENT
    .from('profiles')
    .select('rola')
    .eq('id', session.user.id)
    .single();

  return profile?.rola === 'admin';
}


// =============================================================================
//  INIT EDYTORA
// =============================================================================
async function bootEditor() {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    showLoginScreen();
    const errEl = document.getElementById('articleLoginError');
    errEl.textContent = 'Brak uprawnień administratora.';
    errEl.classList.remove('hidden');
    return;
  }

  showEditor();
  lucide.createIcons();

  if (!tiptapInstance) initTiptap();

  const params    = new URLSearchParams(window.location.search);
  const articleId = params.get('id') || null;

  if (articleId) {
    document.getElementById('articlePageTitle').textContent = 'Edycja Artykułu';
    document.title = 'Edycja Artykułu — AuraHUB CMS';
    document.getElementById('cmsId').value = articleId;

    const { data, error } = await SB_CLIENT
      .from('aura_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (!data || error) {
      alert('Nie znaleziono artykułu.');
      goBack();
      return;
    }

    document.getElementById('cmsTitle').value     = data.title;
    document.getElementById('cmsExcerpt').value   = data.excerpt || '';
    document.getElementById('cmsTags').value      = (data.tags || []).join(', ');
    document.getElementById('cmsThumbnail').value = data.thumbnail_url || '';
    previewThumbnail(data.thumbnail_url || '');
    document.getElementById('cmsPreviewImageUrl').value = data.preview_image_url || '';
    showPreviewImgThumb(data.preview_image_url || '');

    const platforms = data.platforms || ['AuraBenefits'];
    ALL_PLATFORMS.forEach(p => {
      document.getElementById(p.id).checked = platforms.includes(p.value);
    });

    tiptapInstance.commands.setContent(data.content || '');
  } else {
    document.getElementById('articlePageTitle').textContent = 'Nowy Artykuł';
    document.title = 'Nowy Artykuł — AuraHUB CMS';
    document.getElementById('plat_aurabenefits').checked = true;
  }

  startAutoSave();

  window.addEventListener('beforeunload', (e) => {
    if (editorDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

window.onload = async () => {
  const isAdmin = await checkAdminAccess();
  if (isAdmin) {
    await bootEditor();
  } else {
    showLoginScreen();
  }
};
