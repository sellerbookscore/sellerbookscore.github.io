import './style.css';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || window.SELLERBOOKS_CONFIG?.supabaseUrl;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || window.SELLERBOOKS_CONFIG?.supabaseAnonKey;
let supabase = null;
let supabaseInitError = '';
try {
  supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (error) {
  supabaseInitError = error instanceof Error ? error.message : String(error);
  console.error('SellerBooks Core Supabase initialization failed:', error);
}
let lang = localStorage.getItem('sellerbooks-core-language') === 'EN' ? 'EN' : 'ID';
let currentUser = null;
let currentAccess = null;
let isAdmin = false;
let initializationPromise = null;

const copy = {
  ID: {
    subtitle: 'Pusat akses akun SellerBooks', login: 'Masuk', register: 'Daftar akun', email: 'Alamat email', password: 'Kata sandi',
    loginBtn: 'Masuk', registerBtn: 'Buat akun', google: 'Lanjutkan dengan Google', noAccount: 'Belum punya akun?', hasAccount: 'Sudah punya akun?',
    pending: 'Pendaftaran Anda sedang menunggu persetujuan Superadmin.', rejected: 'Pendaftaran Anda ditolak. Hubungi administrator jika perlu peninjauan.',
    suspended: 'Akses akun Anda sedang ditangguhkan.', approved: 'Akun Anda disetujui. Portal aplikasi siap dihubungkan.',
    admin: 'Panel Superadmin', users: 'Permintaan akses client', refresh: 'Muat ulang', approve: 'Setujui', reject: 'Tolak', suspend: 'Tangguhkan',
    status: 'Status', id: 'ID pengguna', signout: 'Keluar', language: 'Bahasa', note: 'Catatan (opsional)', confirmTitle: { APPROVED: 'Setujui permintaan akses?', REJECTED: 'Tolak permintaan akses?', SUSPENDED: 'Tangguhkan akses client?' }, confirmBody: 'Tindakan ini akan memperbarui status akses client.', cancel: 'Batal', confirm: 'Konfirmasi', saving: 'Menyimpan perubahan…', saved: 'Status akses berhasil diperbarui.',
    config: supabaseInitError ? `Inisialisasi Supabase gagal: ${supabaseInitError}` : 'Konfigurasi belum lengkap. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di environment deployment.',
    loadError: 'Gagal memuat data.', empty: 'Belum ada permintaan akses.', signedIn: 'Berhasil masuk.', registerOk: 'Pendaftaran dikirim. Periksa email jika konfirmasi diminta.',
    googleError: 'Google Login belum siap. Periksa konfigurasi provider dan URL redirect di Supabase.', oauthCallbackError: 'Login Google belum selesai: ', notAdmin: 'Akun ini bukan Superadmin.',
    accessTitle: 'Status akses', unknown: 'Belum ada status akses. Silakan daftar atau muat ulang.',
  },
  EN: {
    subtitle: 'SellerBooks account access center', login: 'Sign in', register: 'Create account', email: 'Email address', password: 'Password',
    loginBtn: 'Sign in', registerBtn: 'Create account', google: 'Continue with Google', noAccount: 'New here?', hasAccount: 'Already have an account?',
    pending: 'Your registration is waiting for Superadmin approval.', rejected: 'Your registration was rejected. Contact an administrator if you need a review.',
    suspended: 'Your account access is suspended.', approved: 'Your account is approved. The application portal can now be connected.',
    admin: 'Superadmin panel', users: 'Client access requests', refresh: 'Refresh', approve: 'Approve', reject: 'Reject', suspend: 'Suspend',
    status: 'Status', id: 'User ID', signout: 'Sign out', language: 'Language', note: 'Note (optional)', confirmTitle: { APPROVED: 'Approve access request?', REJECTED: 'Reject access request?', SUSPENDED: 'Suspend client access?' }, confirmBody: 'This action will update the client access status.', cancel: 'Cancel', confirm: 'Confirm', saving: 'Saving changes…', saved: 'Access status updated successfully.',
    config: supabaseInitError ? `Supabase initialization failed: ${supabaseInitError}` : 'Configuration is incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.',
    loadError: 'Failed to load data.', empty: 'No access requests yet.', signedIn: 'Signed in successfully.', registerOk: 'Registration submitted. Check your email if confirmation is required.',
    googleError: 'Google Login is not ready. Check the provider and redirect URL configuration in Supabase.', oauthCallbackError: 'Google sign-in could not be completed: ', notAdmin: 'This account is not a Superadmin.',
    accessTitle: 'Access status', unknown: 'No access status found. Register or refresh the page.',
  }
};
const t = (key) => copy[lang][key] || key;
const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function shell(content) {
  document.documentElement.lang = lang.toLowerCase();
  document.querySelector('#app').innerHTML = `<main class="page"><header class="top"><a class="brand" href="#" aria-label="SellerBooks Core home"><span class="mark logo-mark"><img src="./sellerbooks-logo.svg" alt="MBI — Marketplace Business Intelligence" /></span><span>SellerBooks <b>Core</b><small>${t('subtitle')}</small></span></a><div class="top-actions"><label class="language">${t('language')} <select id="language"><option value="ID" ${lang === 'ID' ? 'selected' : ''}>Indonesia</option><option value="EN" ${lang === 'EN' ? 'selected' : ''}>English</option></select></label>${currentUser ? `<button id="logout" class="button quiet">${t('signout')}</button>` : ''}</div></header>${content}<footer>SellerBooks Core · Copyright 2026 Reserved by PT.adiimasa distribusi indonesia</footer></main>`;
  document.querySelector('#language')?.addEventListener('change', (e) => { lang = e.target.value; localStorage.setItem('sellerbooks-core-language', lang); render(); });
  document.querySelector('#logout')?.addEventListener('click', async () => { await supabase?.auth.signOut(); currentUser = null; currentAccess = null; isAdmin = false; render(); });
}
function alertBox(message, kind = 'info') { return `<div class="notice ${kind}" role="status">${esc(message)}</div>`; }
function authView(mode = 'login', message = '') {
  const isRegister = mode === 'register';
  shell(`<section class="auth-layout"><div class="intro"><div class="eyebrow">MARKETPLACE BUSINESS INTELLIGENCE</div><h1>SellerBooks<br><span>Core.</span></h1><p>${lang === 'ID' ? 'Kelola identitas akun dan persetujuan akses dalam sistem.' : 'Manage account identities and access approvals in one place.'}</p><div class="feature-list"><div><span>01</span> ${lang === 'ID' ? 'Akses client terkontrol' : 'Controlled client access'}</div><div><span>02</span> ${lang === 'ID' ? 'Persetujuan Superadmin' : 'Superadmin approval'}</div><div><span>03</span> ${lang === 'ID' ? 'Satu akun, data terpisah' : 'Separate account data'}</div></div></div><div class="panel auth-panel"><div class="tabs"><button class="tab ${!isRegister ? 'active' : ''}" id="tab-login">${t('login')}</button><button class="tab ${isRegister ? 'active' : ''}" id="tab-register">${t('register')}</button></div><h2>${isRegister ? t('register') : t('login')}</h2><p class="muted">${isRegister ? (lang === 'ID' ? 'Buat akun untuk meminta akses SellerBooks.' : 'Create an account to request SellerBooks access.') : (lang === 'ID' ? 'Masuk untuk melanjutkan ke pusat akses.' : 'Sign in to continue to the access center.')}</p>${message}${!supabase ? alertBox(t('config'), 'warning') : ''}<form id="auth-form"><label>${t('email')}<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" /></label><label>${t('password')}<input name="password" type="password" minlength="8" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required placeholder="••••••••" /></label><button class="button primary full" type="submit" ${!supabase ? 'disabled' : ''}>${isRegister ? t('registerBtn') : t('loginBtn')}</button><div id="form-message" aria-live="polite"></div></form><div class="or"><span>${lang === 'ID' ? 'atau' : 'or'}</span></div><button id="google" class="button google full" ${!supabase ? 'disabled' : ''}><span class="google-g">G</span>${t('google')}</button><p class="tiny">${lang === 'ID' ? 'Akun baru akan berstatus PENDING sampai disetujui administrator.' : 'New accounts remain PENDING until approved by an administrator.'}</p></div></section>`);
  document.querySelector('#tab-login').onclick = () => authView('login');
  document.querySelector('#tab-register').onclick = () => authView('register');
  document.querySelector('#auth-form').onsubmit = async (e) => {
    e.preventDefault(); const form = new FormData(e.currentTarget); const email = String(form.get('email')).trim(); const password = String(form.get('password'));
    const status = document.querySelector('#form-message'); status.innerHTML = alertBox(lang === 'ID' ? 'Memproses…' : 'Working…');
    const result = isRegister ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { status.innerHTML = alertBox(result.error.message, 'error'); return; }
    if (isRegister && !result.data.session) { status.innerHTML = alertBox(t('registerOk'), 'success'); return; }
    if (!result.data.session?.user) {
      status.innerHTML = alertBox(lang === 'ID' ? 'Login berhasil dikirim, tetapi sesi belum tersedia. Periksa konfirmasi email atau coba masuk kembali.' : 'Sign-in completed, but no session is available yet. Check email confirmation or try signing in again.', 'warning');
      return;
    }
    currentUser = result.data.session.user;
    status.innerHTML = alertBox(lang === 'ID' ? 'Berhasil masuk. Memuat akses akun…' : 'Signed in. Loading account access…', 'success');
    try { await initialize(); } catch (error) { handleInitializationError(error); }
  };
  document.querySelector('#google').onclick = async () => {
    const button = document.querySelector('#google');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname, queryParams: { prompt: 'select_account' } } });
    if (error) {
      const target = document.querySelector('#form-message');
      if (target) target.innerHTML = alertBox(`${t('googleError')} ${error.message}`, 'error');
      button.disabled = false;
    }
  };
}
async function initialize() {
  if (initializationPromise) return initializationPromise;
  initializationPromise = (async () => {
    if (!supabase) return authView();
    // Supabase PKCE OAuth returns a ?code=... callback. Exchange it explicitly
    // before checking the session so the login view cannot win a race.
    const url = new URL(window.location.href);
    const oauthCode = url.searchParams.get('code');
    if (oauthCode) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(oauthCode);
      url.searchParams.delete('code');
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      if (exchangeError) {
        console.error('SellerBooks Core OAuth callback exchange failed:', exchangeError);
        return authView('login', alertBox(`${t('oauthCallbackError')}${exchangeError.message}`, 'error'));
      }
    } else {
      const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
      if (oauthError) {
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        return authView('login', alertBox(`${t('oauthCallbackError')}${oauthError}`, 'error'));
      }
    }
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('SellerBooks Core session restore failed:', sessionError);
      return authView('login', alertBox(`${t('oauthCallbackError')}${sessionError.message}`, 'error'));
    }
    currentUser = data.session?.user || null;
    if (!currentUser) { authView(); return; }
    const [adminRes, accessRes] = await Promise.all([
      supabase.from('sellerbooks_core_admins').select('role,is_active').eq('user_id', currentUser.id).maybeSingle(),
      supabase.from('sellerbooks_client_access').select('status,requested_at,review_note').eq('user_id', currentUser.id).maybeSingle(),
    ]);
    if (adminRes.error) console.warn('SellerBooks Core admin lookup failed:', adminRes.error);
    if (accessRes.error) console.warn('SellerBooks Core access lookup failed:', accessRes.error);
    isAdmin = Boolean(adminRes.data?.is_active && ['superadmin', 'admin'].includes(adminRes.data?.role));
    currentAccess = accessRes.data;
    if (isAdmin) { await adminView(); return; }
    if (!currentAccess) {
      const { error: requestError } = await supabase.rpc('sellerbooks_request_access');
      if (requestError) console.warn('SellerBooks Core access request failed:', requestError);
      const refreshed = await supabase.from('sellerbooks_client_access').select('status,requested_at,review_note').eq('user_id', currentUser.id).maybeSingle();
      if (refreshed.error) console.warn('SellerBooks Core access refresh failed:', refreshed.error);
      currentAccess = refreshed.data;
    }
    render();
  })();
  try {
    return await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}
function clientView() {
  const status = String(currentAccess?.status || 'PENDING').toUpperCase();
  const statusClass = status === 'APPROVED' ? 'good' : status === 'REJECTED' || status === 'SUSPENDED' || status === 'REVOKED' ? 'bad' : 'waiting';
  const messageKey = status === 'APPROVED' ? 'approved' : status === 'REJECTED' || status === 'REVOKED' ? 'rejected' : status === 'SUSPENDED' ? 'suspended' : 'pending';
  shell(`<section class="dashboard"><div class="welcome"><div><div class="eyebrow">SELLERBOOKS CORE</div><h1>${lang === 'ID' ? 'Halo, selamat datang.' : 'Welcome back.'}</h1><p class="muted">${esc(currentUser.email)}</p></div><span class="status ${statusClass}">${esc(status)}</span></div><div class="panel status-panel"><div class="status-icon">${status === 'APPROVED' ? '✓' : '…'}</div><div><h2>${t('accessTitle')}</h2><p>${t(messageKey)}</p>${currentAccess?.review_note ? `<p class="muted">${esc(currentAccess.review_note)}</p>` : ''}</div></div>${status === 'APPROVED' ? `<div class="panel"><h2>${lang === 'ID' ? 'Akses aplikasi' : 'Application access'}</h2><p class="muted">${lang === 'ID' ? 'Status Core sudah disetujui. Integrasi dashboard operasional SellerBooks akan ditambahkan pada tahap berikutnya.' : 'Core access is approved. The SellerBooks operations dashboard integration will be added in a later step.'}</p></div>` : ''}<button id="reload" class="button quiet">${t('refresh')}</button></section>`);
  document.querySelector('#reload').onclick = initialize;
}
async function adminView() {
  shell(`<section class="dashboard"><div class="welcome"><div><div class="eyebrow">ADMINISTRATION</div><h1>${t('admin')}</h1><p class="muted">${esc(currentUser.email)}</p></div><span class="status good">SUPERADMIN</span></div><div class="panel"><div class="panel-heading"><div><h2>${t('users')}</h2><p class="muted">${lang === 'ID' ? 'Periksa status lalu tinjau permintaan akses.' : 'Review access requests and update their status.'}</p></div><button id="refresh-requests" class="button quiet">${t('refresh')}</button></div><div id="requests" class="request-list">${alertBox(lang === 'ID' ? 'Memuat permintaan…' : 'Loading requests…')}</div></div><div class="panel operator-panel"><div class="panel-heading"><div><h2>${lang === 'ID' ? 'Persetujuan Operator SellerBooks' : 'SellerBooks Operator Approvals'}</h2><p class="muted">${lang === 'ID' ? 'Kelola permintaan akses Operator secara terpisah dari persetujuan client.' : 'Manage Operator access requests separately from client approvals.'}</p></div><button id="refresh-operators" class="button quiet">${t('refresh')}</button></div><div id="operator-requests" class="operator-list">${alertBox(lang === 'ID' ? 'Memuat permintaan Operator…' : 'Loading Operator requests…')}</div></div></section>`);
  document.querySelector('#refresh-requests').onclick = loadRequests;
  document.querySelector('#refresh-operators').onclick = loadOperators;
  await Promise.all([loadRequests(), loadOperators()]);
}
async function loadRequests() {
  const target = document.querySelector('#requests'); if (!target) return;
  const { data, error } = await supabase.rpc('sellerbooks_core_list_access_requests_v2');
  if (error) { target.innerHTML = alertBox(`${t('loadError')} ${error.message}`, 'error'); return; }
  if (!data?.length) { target.innerHTML = `<p class="muted">${t('empty')}</p>`; return; }
  target.innerHTML = data.map((item) => `<article class="request"><div class="request-info"><strong>${esc(item.email || item.user_id)}</strong>${item.owner_name ? `<small class="owner-name">${lang === 'ID' ? 'Nama pemilik/usaha' : 'Owner / business name'}: <strong>${esc(item.owner_name)}</strong></small>` : `<small class="owner-name missing">${lang === 'ID' ? 'Nama pemilik belum diisi' : 'Owner name not provided'}</small>`}<small>${esc(item.user_id)}</small><span class="status ${item.status === 'APPROVED' ? 'good' : item.status === 'REJECTED' || item.status === 'SUSPENDED' || item.status === 'REVOKED' ? 'bad' : 'waiting'}">${esc(({ PENDING: lang === 'ID' ? 'MENUNGGU' : 'PENDING', APPROVED: lang === 'ID' ? 'DISETUJUI' : 'APPROVED', REJECTED: lang === 'ID' ? 'DITOLAK' : 'REJECTED', SUSPENDED: lang === 'ID' ? 'DITANGGUHKAN' : 'SUSPENDED', REVOKED: lang === 'ID' ? 'DICABUT' : 'REVOKED' })[String(item.status || 'PENDING').toUpperCase()] || item.status)}</span><small>${esc(new Date(item.requested_at).toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US'))}</small>${item.review_note ? `<small>${esc(item.review_note)}</small>` : ''}</div><div class="request-actions"><button class="button small primary" data-status="APPROVED" data-id="${esc(item.user_id)}">${t('approve')}</button><button class="button small danger" data-status="SUSPENDED" data-id="${esc(item.user_id)}">${t('suspend')}</button><button class="button small quiet" data-status="REJECTED" data-id="${esc(item.user_id)}">${t('reject')}</button><button class="button small danger" data-client-delete="1" data-id="${esc(item.user_id)}">${lang === 'ID' ? 'Hapus' : 'Delete'}</button></div></article>`).join('');
  target.querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', () => {
    openReviewModal(button.dataset.id, button.dataset.status, button);
  }));
  target.querySelectorAll('[data-client-delete]').forEach((button) => button.addEventListener('click', () => deleteClientRequest(button.dataset.id)));
}
async function deleteClientRequest(userId) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="confirm-modal" role="dialog" aria-modal="true"><h2>${lang === 'ID' ? 'Hapus permintaan akses client?' : 'Delete client access request?'}</h2><p class="muted">${lang === 'ID' ? 'Yang dihapus hanya data permintaan akses dari daftar ini, bukan akun Gmail atau data penjualan client.' : 'Only the access request entry will be removed, not the Gmail account or client sales data.'}</p><div class="modal-actions"><button class="button quiet" id="client-delete-cancel">${t('cancel')}</button><button class="button danger" id="client-delete-confirm">${lang === 'ID' ? 'Hapus' : 'Delete'}</button></div></section>`;
  document.body.appendChild(modal);
  modal.querySelector('#client-delete-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#client-delete-confirm').onclick = async () => {
    const btn = modal.querySelector('#client-delete-confirm'); btn.disabled = true; btn.textContent = t('saving');
    const { error } = await supabase.rpc('sellerbooks_core_delete_client_access_request', { p_user_id: userId });
    if (error) { modal.querySelector('.confirm-modal').insertAdjacentHTML('beforeend', alertBox(`${t('loadError')} ${error.message}`, 'error')); btn.disabled = false; btn.textContent = lang === 'ID' ? 'Hapus' : 'Delete'; return; }
    modal.remove(); await loadRequests();
  };
}

async function loadOperators() {
  const target = document.querySelector('#operator-requests'); if (!target) return;
  const { data, error } = await supabase.rpc('sellerbooks_core_list_operator_requests');
  if (error) { target.innerHTML = alertBox(`${t('loadError')} ${error.message}`, 'error'); return; }
  if (!data?.length) { target.innerHTML = `<p class="muted">${lang === 'ID' ? 'Belum ada permintaan Operator.' : 'No Operator requests yet.'}</p>`; return; }
  target.innerHTML = data.map((x) => {
    const status = String(x.approval_status || 'PENDING').toUpperCase();
    const label = { PENDING: lang === 'ID' ? 'MENUNGGU' : 'PENDING', APPROVED: lang === 'ID' ? 'DISETUJUI' : 'APPROVED', REJECTED: lang === 'ID' ? 'DITOLAK' : 'REJECTED', SUSPENDED: lang === 'ID' ? 'DITANGGUHKAN' : 'SUSPENDED' }[status] || status;
    let actions = '';
    if (status === 'PENDING') actions += `<button class="button small primary" data-op-status="APPROVED" data-id="${esc(x.id)}">${t('approve')}</button><button class="button small quiet" data-op-status="REJECTED" data-id="${esc(x.id)}">${t('reject')}</button>`;
    if (status === 'APPROVED') actions += `<button class="button small danger" data-op-status="SUSPENDED" data-id="${esc(x.id)}">${lang === 'ID' ? 'Tangguhkan' : 'Suspend'}</button>`;
    if (status === 'SUSPENDED' || status === 'REJECTED') actions += `<button class="button small primary" data-op-status="APPROVED" data-id="${esc(x.id)}">${lang === 'ID' ? 'Aktifkan' : 'Reactivate'}</button>`;
    actions += `<button class="button small danger" data-op-delete="1" data-id="${esc(x.id)}">${lang === 'ID' ? 'Hapus' : 'Delete'}</button>`;
    return `<article class="request operator-request"><div class="request-info"><strong>${esc(x.operator_email)}</strong><small>${lang === 'ID' ? 'Nama pemilik' : 'Owner'}: <strong>${esc(x.owner_name || (lang === 'ID' ? 'Belum ditentukan' : 'Not specified'))}</strong></small><small>${esc(x.id)}</small><span class="status ${status === 'APPROVED' ? 'good' : status === 'REJECTED' || status === 'SUSPENDED' ? 'bad' : 'waiting'}">${esc(label)}</span><small>${esc(new Date(x.created_at).toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US'))}</small>${x.approval_note ? `<small>${esc(x.approval_note)}</small>` : ''}</div><div class="request-actions">${actions}</div></article>`;
  }).join('');
  target.querySelectorAll('[data-op-status]').forEach(button => button.addEventListener('click', () => reviewOperator(button.dataset.id, button.dataset.opStatus)));
  target.querySelectorAll('[data-op-delete]').forEach(button => button.addEventListener('click', () => deleteOperator(button.dataset.id)));
}
async function reviewOperator(id, status) {
  const title = { APPROVED: lang === 'ID' ? 'Setujui Operator?' : 'Approve Operator?', REJECTED: lang === 'ID' ? 'Tolak Operator?' : 'Reject Operator?', SUSPENDED: lang === 'ID' ? 'Tangguhkan Operator?' : 'Suspend Operator?' }[status];
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="confirm-modal" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p class="muted">${lang === 'ID' ? 'Tindakan ini hanya mengubah akses Operator, bukan status akses client.' : 'This changes Operator access only, not the client access status.'}</p><label class="modal-note-label">${esc(t('note'))}<textarea rows="3" maxlength="1000" id="operator-note"></textarea></label><div id="operator-modal-message"></div><div class="modal-actions"><button class="button quiet" id="operator-cancel">${t('cancel')}</button><button class="button ${status === 'APPROVED' ? 'primary' : 'danger'}" id="operator-confirm">${t('confirm')}</button></div></section>`;
  document.body.appendChild(modal);
  modal.querySelector('#operator-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#operator-confirm').onclick = async () => {
    const btn = modal.querySelector('#operator-confirm'); btn.disabled = true; btn.textContent = t('saving');
    const { error } = await supabase.rpc('sellerbooks_core_review_operator', { p_id: id, p_status: status, p_note: modal.querySelector('#operator-note').value.trim() || null });
    if (error) { modal.querySelector('#operator-modal-message').innerHTML = alertBox(`${t('loadError')} ${error.message}`, 'error'); btn.disabled = false; btn.textContent = t('confirm'); return; }
    modal.remove(); await loadOperators();
  };
}
async function deleteOperator(id) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="confirm-modal" role="dialog" aria-modal="true"><h2>${lang === 'ID' ? 'Hapus data Operator?' : 'Delete Operator record?'}</h2><p class="muted">${lang === 'ID' ? 'Data permintaan ini akan dihapus permanen.' : 'This request record will be permanently deleted.'}</p><div class="modal-actions"><button class="button quiet" id="operator-cancel">${t('cancel')}</button><button class="button danger" id="operator-confirm">${t('confirm')}</button></div></section>`;
  document.body.appendChild(modal);
  modal.querySelector('#operator-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#operator-confirm').onclick = async () => {
    const btn = modal.querySelector('#operator-confirm'); btn.disabled = true; btn.textContent = t('saving');
    const { error } = await supabase.rpc('sellerbooks_core_delete_operator', { p_id: id });
    if (error) { modal.querySelector('.confirm-modal').insertAdjacentHTML('beforeend', alertBox(`${t('loadError')} ${error.message}`, 'error')); btn.disabled = false; btn.textContent = t('confirm'); return; }
    modal.remove(); await loadOperators();
  };
}

function openReviewModal(userId, status, triggerButton) {
  document.querySelector('#review-modal')?.remove();
  const title = copy[lang].confirmTitle?.[status] || t('confirm');
  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
    <div class="modal-symbol ${status === 'APPROVED' ? 'modal-success' : status === 'REJECTED' ? 'modal-reject' : 'modal-suspend'}">${status === 'APPROVED' ? '✓' : status === 'REJECTED' ? '×' : '!'}</div>
    <h2 id="review-modal-title">${esc(title)}</h2>
    <p class="muted">${esc(t('confirmBody'))}</p>
    <label class="modal-note-label">${esc(t('note'))}<textarea id="review-note" rows="3" maxlength="1000" placeholder="${esc(t('note'))}"></textarea></label>
    <div id="review-modal-message" aria-live="polite"></div>
    <div class="modal-actions"><button type="button" id="review-cancel" class="button quiet">${esc(t('cancel'))}</button><button type="button" id="review-confirm" class="button ${status === 'SUSPENDED' || status === 'REJECTED' ? 'danger' : 'primary'}">${esc(t('confirm'))}</button></div>
  </section>`;
  document.body.appendChild(modal);
  const cancel = () => modal.remove();
  modal.addEventListener('click', (event) => { if (event.target === modal) cancel(); });
  modal.querySelector('#review-cancel').addEventListener('click', cancel);
  modal.querySelector('#review-confirm').addEventListener('click', async () => {
    const confirmButton = modal.querySelector('#review-confirm');
    const cancelButton = modal.querySelector('#review-cancel');
    const message = modal.querySelector('#review-modal-message');
    const note = modal.querySelector('#review-note').value.trim();
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    confirmButton.textContent = t('saving');
    if (triggerButton) triggerButton.disabled = true;
    const { error: reviewError } = await supabase.rpc('sellerbooks_review_client_access', {
      p_user_id: userId, p_status: status, p_note: note || null
    });
    if (reviewError) {
      message.innerHTML = alertBox(`${t('loadError')} ${reviewError.message}`, 'error');
      confirmButton.disabled = false;
      cancelButton.disabled = false;
      confirmButton.textContent = t('confirm');
      if (triggerButton) triggerButton.disabled = false;
      return;
    }
    message.innerHTML = alertBox(t('saved'), 'success');
    confirmButton.textContent = t('saved');
    window.setTimeout(async () => { modal.remove(); await loadRequests(); }, 450);
  });
  modal.querySelector('#review-note').focus();
}

function render() {
  if (!currentUser) { authView(); return; }
  if (isAdmin) { adminView(); return; }
  clientView();
}
supabase?.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    currentUser = session.user;
    if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'INITIAL_SESSION') {
      setTimeout(() => initialize().catch(handleInitializationError), 0);
    }
    return;
  }
  if (_event === 'SIGNED_OUT') {
    currentUser = null;
    currentAccess = null;
    isAdmin = false;
    authView();
  }
});
function handleInitializationError(error) {
  console.error('SellerBooks Core initialization failed:', error);
  authView('login', `${t('loadError')} ${error instanceof Error ? error.message : String(error)}`);
}
authView();
initialize().catch(handleInitializationError);
