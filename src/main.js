import './style.css';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || window.SELLERBOOKS_CONFIG?.supabaseUrl;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || window.SELLERBOOKS_CONFIG?.supabaseAnonKey;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
let lang = localStorage.getItem('sellerbooks-core-language') === 'EN' ? 'EN' : 'ID';
let currentUser = null;
let currentAccess = null;
let isAdmin = false;

const copy = {
  ID: {
    subtitle: 'Pusat akses akun SellerBooks', login: 'Masuk', register: 'Daftar akun', email: 'Alamat email', password: 'Kata sandi',
    loginBtn: 'Masuk', registerBtn: 'Buat akun', google: 'Lanjutkan dengan Google', noAccount: 'Belum punya akun?', hasAccount: 'Sudah punya akun?',
    pending: 'Pendaftaran Anda sedang menunggu persetujuan Superadmin.', rejected: 'Pendaftaran Anda ditolak. Hubungi administrator jika perlu peninjauan.',
    suspended: 'Akses akun Anda sedang ditangguhkan.', approved: 'Akun Anda disetujui. Portal aplikasi siap dihubungkan.',
    admin: 'Panel Superadmin', users: 'Permintaan akses client', refresh: 'Muat ulang', approve: 'Setujui', reject: 'Tolak', suspend: 'Tangguhkan',
    status: 'Status', id: 'ID pengguna', signout: 'Keluar', language: 'Bahasa', note: 'Catatan (opsional)',
    config: 'Konfigurasi belum lengkap. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di environment deployment.',
    loadError: 'Gagal memuat data.', empty: 'Belum ada permintaan akses.', signedIn: 'Berhasil masuk.', registerOk: 'Pendaftaran dikirim. Periksa email jika konfirmasi diminta.',
    googleError: 'Google Login belum siap. Periksa konfigurasi provider dan URL redirect di Supabase.', notAdmin: 'Akun ini bukan Superadmin.',
    accessTitle: 'Status akses', unknown: 'Belum ada status akses. Silakan daftar atau muat ulang.',
  },
  EN: {
    subtitle: 'SellerBooks account access center', login: 'Sign in', register: 'Create account', email: 'Email address', password: 'Password',
    loginBtn: 'Sign in', registerBtn: 'Create account', google: 'Continue with Google', noAccount: 'New here?', hasAccount: 'Already have an account?',
    pending: 'Your registration is waiting for Superadmin approval.', rejected: 'Your registration was rejected. Contact an administrator if you need a review.',
    suspended: 'Your account access is suspended.', approved: 'Your account is approved. The application portal can now be connected.',
    admin: 'Superadmin panel', users: 'Client access requests', refresh: 'Refresh', approve: 'Approve', reject: 'Reject', suspend: 'Suspend',
    status: 'Status', id: 'User ID', signout: 'Sign out', language: 'Language', note: 'Note (optional)',
    config: 'Configuration is incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.',
    loadError: 'Failed to load data.', empty: 'No access requests yet.', signedIn: 'Signed in successfully.', registerOk: 'Registration submitted. Check your email if confirmation is required.',
    googleError: 'Google Login is not ready. Check the provider and redirect URL configuration in Supabase.', notAdmin: 'This account is not a Superadmin.',
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
  shell(`<section class="auth-layout"><div class="intro"><div class="eyebrow">MARKETPLACE BUSINESS INTELLIGENCE</div><h1>SellerBooks<br><span>Core.</span></h1><p>Kelola identitas akun dan persetujuan akses dalam sistem.</p><div class="feature-list"><div><span>01</span> ${lang === 'ID' ? 'Akses client terkontrol' : 'Controlled client access'}</div><div><span>02</span> ${lang === 'ID' ? 'Persetujuan Superadmin' : 'Superadmin approval'}</div><div><span>03</span> ${lang === 'ID' ? 'Satu akun, data terpisah' : 'Separate account data'}</div></div></div><div class="panel auth-panel"><div class="tabs"><button class="tab ${!isRegister ? 'active' : ''}" id="tab-login">${t('login')}</button><button class="tab ${isRegister ? 'active' : ''}" id="tab-register">${t('register')}</button></div><h2>${isRegister ? t('register') : t('login')}</h2><p class="muted">${isRegister ? (lang === 'ID' ? 'Buat akun untuk meminta akses SellerBooks.' : 'Create an account to request SellerBooks access.') : (lang === 'ID' ? 'Masuk untuk melanjutkan ke pusat akses.' : 'Sign in to continue to the access center.')}</p>${message}${!supabase ? alertBox(t('config'), 'warning') : ''}<form id="auth-form"><label>${t('email')}<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" /></label><label>${t('password')}<input name="password" type="password" minlength="8" autocomplete="${isRegister ? 'new-password' : 'current-password'}" required placeholder="••••••••" /></label><button class="button primary full" type="submit" ${!supabase ? 'disabled' : ''}>${isRegister ? t('registerBtn') : t('loginBtn')}</button><div id="form-message" aria-live="polite"></div></form><div class="or"><span>${lang === 'ID' ? 'atau' : 'or'}</span></div><button id="google" class="button google full" ${!supabase ? 'disabled' : ''}><span class="google-g">G</span>${t('google')}</button><p class="tiny">${lang === 'ID' ? 'Akun baru akan berstatus PENDING sampai disetujui administrator.' : 'New accounts remain PENDING until approved by an administrator.'}</p></div></section>`);
  document.querySelector('#tab-login').onclick = () => authView('login');
  document.querySelector('#tab-register').onclick = () => authView('register');
  document.querySelector('#auth-form').onsubmit = async (e) => {
    e.preventDefault(); const form = new FormData(e.currentTarget); const email = String(form.get('email')).trim(); const password = String(form.get('password'));
    const status = document.querySelector('#form-message'); status.innerHTML = alertBox(lang === 'ID' ? 'Memproses…' : 'Working…');
    const result = isRegister ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { status.innerHTML = alertBox(result.error.message, 'error'); return; }
    if (isRegister && !result.data.session) { status.innerHTML = alertBox(t('registerOk'), 'success'); return; }
    await initialize();
  };
  document.querySelector('#google').onclick = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    if (error) document.querySelector('#form-message').innerHTML = alertBox(`${t('googleError')} ${error.message}`, 'error');
  };
}
async function initialize() {
  if (!supabase) return authView();
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  if (!currentUser) { authView(); return; }
  const [adminRes, accessRes] = await Promise.all([
    supabase.from('sellerbooks_core_admins').select('role,is_active').eq('user_id', currentUser.id).maybeSingle(),
    supabase.from('sellerbooks_client_access').select('status,requested_at,review_note').eq('user_id', currentUser.id).maybeSingle(),
  ]);
  isAdmin = Boolean(adminRes.data?.is_active && ['superadmin', 'admin'].includes(adminRes.data?.role));
  currentAccess = accessRes.data;
  if (isAdmin) { await adminView(); return; }
  if (!currentAccess) {
    await supabase.rpc('sellerbooks_request_access');
    const refreshed = await supabase.from('sellerbooks_client_access').select('status,requested_at,review_note').eq('user_id', currentUser.id).maybeSingle();
    currentAccess = refreshed.data;
  }
  render();
}
function clientView() {
  const status = String(currentAccess?.status || 'PENDING').toUpperCase();
  const statusClass = status === 'APPROVED' ? 'good' : status === 'REJECTED' || status === 'SUSPENDED' || status === 'REVOKED' ? 'bad' : 'waiting';
  const messageKey = status === 'APPROVED' ? 'approved' : status === 'REJECTED' || status === 'REVOKED' ? 'rejected' : status === 'SUSPENDED' ? 'suspended' : 'pending';
  shell(`<section class="dashboard"><div class="welcome"><div><div class="eyebrow">SELLERBOOKS CORE</div><h1>${lang === 'ID' ? 'Halo, selamat datang.' : 'Welcome back.'}</h1><p class="muted">${esc(currentUser.email)}</p></div><span class="status ${statusClass}">${esc(status)}</span></div><div class="panel status-panel"><div class="status-icon">${status === 'APPROVED' ? '✓' : '…'}</div><div><h2>${t('accessTitle')}</h2><p>${t(messageKey)}</p>${currentAccess?.review_note ? `<p class="muted">${esc(currentAccess.review_note)}</p>` : ''}</div></div>${status === 'APPROVED' ? `<div class="panel"><h2>${lang === 'ID' ? 'Akses aplikasi' : 'Application access'}</h2><p class="muted">${lang === 'ID' ? 'Status Core sudah disetujui. Integrasi dashboard operasional SellerBooks akan ditambahkan pada tahap berikutnya.' : 'Core access is approved. The SellerBooks operations dashboard integration will be added in a later step.'}</p></div>` : ''}<button id="reload" class="button quiet">${t('refresh')}</button></section>`);
  document.querySelector('#reload').onclick = initialize;
}
async function adminView() {
  shell(`<section class="dashboard"><div class="welcome"><div><div class="eyebrow">ADMINISTRATION</div><h1>${t('admin')}</h1><p class="muted">${esc(currentUser.email)}</p></div><span class="status good">SUPERADMIN</span></div><div class="panel"><div class="panel-heading"><div><h2>${t('users')}</h2><p class="muted">${lang === 'ID' ? 'Periksa status lalu tinjau permintaan akses.' : 'Review access requests and update their status.'}</p></div><button id="refresh-requests" class="button quiet">${t('refresh')}</button></div><div id="requests" class="request-list">${alertBox(lang === 'ID' ? 'Memuat permintaan…' : 'Loading requests…')}</div></div></section>`);
  document.querySelector('#refresh-requests').onclick = loadRequests;
  await loadRequests();
}
async function loadRequests() {
  const target = document.querySelector('#requests'); if (!target) return;
  const { data, error } = await supabase.rpc('sellerbooks_core_list_access_requests');
  if (error) { target.innerHTML = alertBox(`${t('loadError')} ${error.message}`, 'error'); return; }
  if (!data?.length) { target.innerHTML = `<p class="muted">${t('empty')}</p>`; return; }
  target.innerHTML = data.map((item) => `<article class="request"><div class="request-info"><strong>${esc(item.email || item.user_id)}</strong><small>${esc(item.user_id)}</small><span class="status ${item.status === 'APPROVED' ? 'good' : item.status === 'REJECTED' || item.status === 'SUSPENDED' || item.status === 'REVOKED' ? 'bad' : 'waiting'}">${esc(item.status)}</span><small>${esc(new Date(item.requested_at).toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US'))}</small>${item.review_note ? `<small>${esc(item.review_note)}</small>` : ''}</div><div class="request-actions"><button class="button small primary" data-status="APPROVED" data-id="${esc(item.user_id)}">${t('approve')}</button><button class="button small quiet" data-status="REJECTED" data-id="${esc(item.user_id)}">${t('reject')}</button><button class="button small danger" data-status="SUSPENDED" data-id="${esc(item.user_id)}">${t('suspend')}</button></div></article>`).join('');
  target.querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', async () => {
    const note = window.prompt(t('note'));
    if (note === null) return;
    button.disabled = true;
    const { error: reviewError } = await supabase.rpc('sellerbooks_review_client_access', { p_user_id: button.dataset.id, p_status: button.dataset.status, p_note: note || null });
    if (reviewError) { window.alert(`${t('loadError')} ${reviewError.message}`); button.disabled = false; return; }
    await loadRequests();
  }));
}
function render() {
  if (!currentUser) { authView(); return; }
  if (isAdmin) { adminView(); return; }
  clientView();
}
supabase?.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  if (!currentUser) { currentAccess = null; isAdmin = false; authView(); }
  else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') setTimeout(initialize, 0);
});
initialize();
