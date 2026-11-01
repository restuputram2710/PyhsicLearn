/* =====================================================================
 * PhysicsLearn — inti aplikasi: tema, router hash, shell, autentikasi.
 * ===================================================================== */
(function () {
  const esc = UI.esc;
  const PRESET_TEMA = {
    'biru-elektron': { nama: 'Biru Elektron', primer: '#2F6DB0', sekunder: '#1B3A6B', aksen: '#F6C343' },
    'ungu-kuantum': { nama: 'Ungu Kuantum', primer: '#6B4FBB', sekunder: '#2E1F5E', aksen: '#F6C343' },
    'hijau-medan': { nama: 'Hijau Medan', primer: '#1F7A5A', sekunder: '#0F3D2E', aksen: '#F6C343' },
    'oranye-termo': { nama: 'Oranye Termo', primer: '#C2410C', sekunder: '#5A1F06', aksen: '#FCD34D' },
    'toska-gelombang': { nama: 'Toska Gelombang', primer: '#0F7C86', sekunder: '#08414A', aksen: '#F6C343' },
    'gelap-nebula': { nama: 'Gelap Nebula', primer: '#6EA8E8', sekunder: '#0B1424', aksen: '#F6C343', gelap: true }
  };
  const TOPIK = ['Mekanika', 'Fluida', 'Termodinamika', 'Gelombang & Bunyi', 'Optik', 'Listrik & Magnet', 'Fisika Modern'];
  const LOGO_DEFAULT = '<svg class="logo-mark" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="var(--primary)"/><g fill="none" stroke="#fff" stroke-width="2.2"><ellipse cx="24" cy="24" rx="15" ry="6"/><ellipse cx="24" cy="24" rx="15" ry="6" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="15" ry="6" transform="rotate(-60 24 24)"/></g><circle cx="24" cy="24" r="3.2" fill="var(--accent)"/></svg>';

  const App = {
    cfg: null, me: null, _leave: [], PRESET_TEMA, TOPIK, halaman: {},
    view() { return document.getElementById('view') || document.getElementById('app'); },
    onLeave(fn) { this._leave.push(fn); },
    go(h) { if (location.hash === h) router(); else location.hash = h; },
    rumah() { return this.me && this.me.peran === 'guru' ? '#/g/beranda' : '#/beranda'; },
    logo(cls) {
      const c = this.cfg || {};
      return c.logo_thumb_url ? '<img class="logo-mark ' + (cls || '') + '" src="' + esc(c.logo_thumb_url) + '" alt="" referrerpolicy="no-referrer">' : LOGO_DEFAULT;
    },
    nama() { return (this.cfg && this.cfg.nama_aplikasi) || 'PhysicsLearn'; },
    fotoSaya() { try { return localStorage.getItem('pl_foto_' + (this.me && this.me.id_user)) || ''; } catch (e) { return ''; } }
  };
  window.App = App;

  // ---------------- Tema ----------------
  const hexOk = (v) => /^#[0-9A-Fa-f]{6}$/.test(String(v || ''));
  App.terapkanTema = function (cfg) {
    cfg = cfg || {};
    const root = document.documentElement, preset = PRESET_TEMA[cfg.mode_tema];
    const gelap = !!(preset && preset.gelap);
    root.dataset.tema = gelap ? 'gelap' : 'terang';
    const p = hexOk(cfg.warna_primer) ? cfg.warna_primer : '#2F6DB0', n = hexOk(cfg.warna_sekunder) ? cfg.warna_sekunder : '#1B3A6B', a = hexOk(cfg.warna_aksen) ? cfg.warna_aksen : '#F6C343';
    const set = (k, v) => root.style.setProperty(k, v);
    set('--primary', p);
    set('--primary-strong', gelap ? UI.campur(p, '#FFFFFF', 0.18) : UI.campur(p, '#000000', 0.25));
    set('--primary-light', gelap ? UI.campur(p, '#0E1726', 0.25) : UI.campur(p, '#FFFFFF', 0.28));
    set('--primary-tint', gelap ? UI.campur(p, '#0E1726', 0.8) : UI.campur(p, '#FFFFFF', 0.9));
    set('--navy', n);
    set('--accent', a);
    set('--on-primary', UI.kontras(p, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#0F1B34');
    set('--on-accent', UI.kontras(a, '#1B3A6B') >= 4.5 ? '#1B3A6B' : '#0F1B34');
    set('--hero', gelap ? '#13213A' : p);
    document.title = cfg.nama_aplikasi || 'PhysicsLearn';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = gelap ? '#0E1726' : n;
    const fav = document.querySelector('link[rel="icon"]');
    if (fav && cfg.favicon_url) fav.href = cfg.favicon_url;
  };

  // ---------------- Router ----------------
  const ROUTES = [];
  App.rute = (pola, fn, peran) => ROUTES.push({ pola, fn, peran, re: new RegExp('^' + pola.replace(/:(\w+)/g, '([^/]+)') + '$'), keys: (pola.match(/:(\w+)/g) || []).map((k) => k.slice(1)) });
  function parseHash() {
    const h = (location.hash || '#/').slice(1), i = h.indexOf('?');
    const path = i > -1 ? h.slice(0, i) : h, q = {};
    if (i > -1) new URLSearchParams(h.slice(i + 1)).forEach((v, k) => { q[k] = v; });
    return { path: path || '/', q };
  }
  async function router() {
    App._leave.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* abaikan */ } });
    document.body.classList.remove('mode-fokus');
    const { path, q } = parseHash();
    let rute = null, params = {};
    for (const r of ROUTES) { const m = path.match(r.re); if (m) { rute = r; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); }); break; } }
    if (!rute) { App.go(App.me ? App.rumah() : '#/'); return; }
    if (rute.peran === 'publik' && App.me && path !== '/darurat') { App.go(App.rumah()); return; }
    if (rute.peran !== 'publik') {
      if (!App.me) { App.go('#/masuk'); return; }
      if (rute.peran !== App.me.peran) { App.go(App.rumah()); return; }
      shell(App.me.peran, path);
      gantiNode(document.getElementById('view'));   // buang listener halaman sebelumnya
    } else { hapusShell(); gantiNode(document.getElementById('app')); }
    window.scrollTo(0, 0);
    try { await rute.fn(params, q); }
    catch (e) { console.error(e); App.view().innerHTML = UI.kosong('alert', 'Halaman gagal dimuat', 'Muat ulang halaman atau coba lagi nanti.'); }
    const v = App.view();
    if (v && !v.dataset.fokusOk) { const h1 = v.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); } }
  }
  window.addEventListener('hashchange', router);
  /** Ganti elemen dengan salinan kosong agar listener delegasi dari halaman lama tidak menumpuk. */
  function gantiNode(el) {
    if (!el) return;
    const baru = el.cloneNode(false);
    el.replaceWith(baru);
  }

  // ---------------- Shell (sidebar, navigasi pil, topbar) ----------------
  const NAV = {
    siswa: [['#/beranda', 'home', 'Beranda'], ['#/materi', 'book', 'Materi'], ['#/tugas', 'clipboard', 'Tugas'], ['#/ujian', 'timer', 'Ujian'], ['#/profil', 'user', 'Profil']],
    guru: [['#/g/beranda', 'home', 'Beranda'], ['#/g/sesi', 'radar', 'Sesi & Absensi'], ['#/g/kelas', 'school', 'Kelas & Siswa'], ['#/g/materi', 'book', 'Materi'],
      ['#/g/tugas', 'clipboard', 'Tugas & Penilaian'], ['#/g/soal', 'layers', 'Bank Soal'], ['#/g/ujian', 'timer', 'Ujian'], ['#/g/laporan', 'barChart', 'Laporan'], ['#/g/pengaturan', 'settings', 'Pengaturan']],
    guruBawah: [['#/g/beranda', 'home', 'Beranda'], ['#/g/kelas', 'school', 'Kelas'], ['#/g/tugas', 'clipboard', 'Penilaian'], ['#/g/laporan', 'barChart', 'Laporan']]
  };
  function hapusShell() { const s = document.querySelector('.shell'); if (s) document.getElementById('app').innerHTML = ''; }
  function shell(peran, path) {
    const app = document.getElementById('app');
    let s = app.querySelector('.shell');
    if (!s || s.dataset.peran !== peran) {
      const nav = NAV[peran];
      const sidebar = '<aside class="sidebar" aria-label="Menu utama"><a class="brand" href="' + App.rumah() + '">' + App.logo() + '<span><b>' + esc(App.nama()) + '</b><small>' + (peran === 'guru' ? 'PORTAL GURU' : 'RUANG BELAJAR') + '</small></span></a>' +
        '<div class="sidebar-profil">' + UI.avatar(App.me.nama, App.fotoSaya()) + '<span><b>' + esc(App.me.nama) + '</b><small>' + esc(peran === 'guru' ? (App.me.darurat ? 'Akses darurat' : 'Guru Fisika') : (App.me.nama_kelas || 'Siswa')) + '</small></span></div>' +
        '<nav>' + nav.map((n) => '<a href="' + n[0] + '" data-nav="' + n[0] + '">' + ikon(n[1]) + '<span>' + esc(n[2]) + '</span><em class="nav-badge" data-badge="' + n[0] + '"></em></a>').join('') + '</nav>' +
        '<button class="sidebar-keluar" data-keluar>' + ikon('logout') + '<span>Keluar</span></button></aside>';
      const bawah = peran === 'guru'
        ? NAV.guruBawah.map((n) => '<a href="' + n[0] + '" data-nav="' + n[0] + '"><span class="pn-ikon">' + ikon(n[1]) + '</span><span>' + n[2] + '</span></a>').join('') + '<button data-lainnya><span class="pn-ikon">' + ikon('menu') + '</span><span>Lainnya</span></button>'
        : NAV.siswa.map((n) => '<a href="' + n[0] + '" data-nav="' + n[0] + '"><span class="pn-ikon">' + ikon(n[1]) + '</span><span>' + n[2] + '</span></a>').join('');
      app.innerHTML = '<div class="shell shell-' + peran + '" data-peran="' + peran + '">' + sidebar +
        '<div class="kolom-utama">' + (peran === 'guru' ? '<header class="topbar"><div><span class="label-caps" id="topbar-sub">' + esc(App.nama()) + '</span><h2 id="topbar-judul">Beranda</h2></div><div class="topbar-aksi"><span class="chip-mono" id="topbar-ta"></span><a class="btn-ikon" href="#/g/kelas?menunggu=1" aria-label="Pendaftaran menunggu" title="Pendaftaran menunggu">' + ikon('bell') + '<em class="titik-badge" data-badge="menunggu"></em></a>' + UI.avatar(App.me.nama, App.fotoSaya(), 'avatar-sm') + '</div></header>' : '') +
        '<main id="view" class="view" tabindex="-1"></main></div>' +
        '<nav class="pillnav" aria-label="Navigasi">' + bawah + '</nav></div>';
      app.querySelector('[data-keluar]').addEventListener('click', App.keluar);
      const lain = app.querySelector('[data-lainnya]');
      if (lain) lain.addEventListener('click', menuLainnya);
      if (peran === 'guru' && App.cfg) { const ta = document.getElementById('topbar-ta'); if (ta) ta.textContent = (App.cfg.tahun_ajaran || '') + ' · ' + (App.cfg.semester || ''); }
    }
    UI.$$('[data-nav]', app).forEach((a) => {
      const href = a.dataset.nav.slice(1);
      a.classList.toggle('aktif', path === href || (href.length > 3 && path.indexOf(href + '/') === 0));
    });
  }
  function menuLainnya() {
    UI.modal({ title: 'Menu', sheet: true, body: '<div class="menu-grid">' + NAV.guru.map((n) => '<a href="' + n[0] + '" class="menu-item">' + ikon(n[1]) + '<span>' + esc(n[2]) + '</span></a>').join('') +
      '<button class="menu-item" data-keluar>' + ikon('logout') + '<span>Keluar</span></button></div>',
      onOpen: (el, close) => { UI.$$('a', el).forEach((a) => a.addEventListener('click', close)); el.querySelector('[data-keluar]').addEventListener('click', () => { close(); App.keluar(); }); } });
  }
  App.judul = function (judul, sub) {
    const j = document.getElementById('topbar-judul'); if (j) j.textContent = judul;
    const s = document.getElementById('topbar-sub'); if (s) s.textContent = sub || App.nama();
    document.title = judul + ' · ' + App.nama();
  };
  App.badge = function (key, n) {
    UI.$$('[data-badge="' + key + '"]').forEach((el) => { el.textContent = n > 99 ? '99+' : (n || ''); el.classList.toggle('ada', !!n); });
  };
  /** Bar atas sederhana untuk halaman siswa (judul + tombol kembali). */
  App.barAtas = (judul, kembali, aksi) => '<header class="bar-atas">' + (kembali ? '<a class="btn-ikon" href="' + kembali + '" aria-label="Kembali">' + ikon('left') + '</a>' : '<span></span>') + '<h1>' + esc(judul) + '</h1>' + (aksi || '<span></span>') + '</header>';

  // ---------------- Sesi login ----------------
  function simpanMasuk(data) {
    API.sesi.token = data.token;
    App.me = data.me;
    try { localStorage.setItem('pl_me', JSON.stringify(data.me)); } catch (e) { /* abaikan */ }
  }
  App.setelahMasuk = async function (data) {
    simpanMasuk(data);
    if (data.me.wajibGantiSandi) await App.gantiSandi(true);
    App.go(App.rumah());
    muatFotoSaya();
  };
  App.keluar = async function () {
    if (!(await UI.konfirmasi('Keluar dari ' + esc(App.nama()) + ' di perangkat ini?', { ok: 'Keluar' }))) return;
    App.keluarPaksa();
  };
  App.keluarPaksa = function (pesan) {
    API.cache.bersihkan(false);
    API.sesi.token = '';
    try { localStorage.removeItem('pl_me'); } catch (e) { /* abaikan */ }
    App.me = null;
    App.go('#/masuk');
    if (pesan) setTimeout(() => UI.toast(pesan, 'info'), 300);
  };
  API.onAuthLost = (msg) => { if (App.me) App.keluarPaksa(msg || 'Sesi berakhir. Silakan masuk lagi.'); };
  async function muatFotoSaya() {
    if (!App.me || !App.me.punyaFoto) return;
    const r = await API.call('profil.foto', {});
    if (r.success && r.data.dataUrl) {
      try { localStorage.setItem('pl_foto_' + App.me.id_user, r.data.dataUrl); } catch (e) { /* abaikan */ }
      UI.$$('.sidebar-profil .avatar, .topbar .avatar').forEach((el) => { el.innerHTML = '<img src="' + r.data.dataUrl + '" alt="">'; });
    }
  }
  App.muatFotoSaya = muatFotoSaya;

  App.gantiSandi = (wajib) => new Promise((resolve) => {
    UI.modal({
      title: wajib ? 'Buat kata sandi baru' : 'Ganti kata sandi', wajib: !!wajib,
      body: (wajib ? '<p class="teks-2">Demi keamanan, ganti sandi awal Anda sebelum melanjutkan. Jangan memakai NIS sebagai sandi.</p>' : '<label class="field"><span>Kata sandi lama</span><input type="password" name="lama" autocomplete="current-password"></label>') +
        '<label class="field"><span>Kata sandi baru</span><input type="password" name="baru" autocomplete="new-password" minlength="8"><small>Minimal 8 karakter, berisi huruf dan angka.</small></label>' +
        '<label class="field"><span>Ulangi kata sandi baru</span><input type="password" name="ulang" autocomplete="new-password"></label><p class="galat" data-galat></p>',
      actions: (wajib ? [] : [{ label: 'Batal', cls: 'btn-ghost' }]).concat([{ label: 'Simpan sandi', cls: 'btn-primary', icon: 'lock', onClick: async (m) => {
        const f = (n) => m.el.querySelector('[name="' + n + '"]'), g = m.el.querySelector('[data-galat]');
        const baru = f('baru').value;
        if (baru.length < 8 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru)) { g.textContent = 'Sandi minimal 8 karakter dan berisi huruf serta angka.'; return; }
        if (baru !== f('ulang').value) { g.textContent = 'Ulangan sandi tidak sama.'; return; }
        await UI.sibuk(m.btn, async () => {
          const r = await API.call('profil.gantiSandi', { lama: f('lama') ? f('lama').value : '', baru });
          if (r.success) { App.me.wajibGantiSandi = false; try { localStorage.setItem('pl_me', JSON.stringify(App.me)); } catch (e) { /* abaikan */ } UI.toast(r.message); m.close(); resolve(true); }
          else g.textContent = r.message;
        }, 'Menyimpan…');
      } }]),
      onClose: () => resolve(false)
    });
  });

  // ---------------- Halaman publik ----------------
  function heroDekor() {
    return '<div class="hero-dekor" aria-hidden="true"><svg viewBox="0 0 400 400" class="orbit-bg"><g fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="200" cy="200" rx="180" ry="70"/><ellipse cx="200" cy="200" rx="180" ry="70" transform="rotate(60 200 200)"/><ellipse cx="200" cy="200" rx="180" ry="70" transform="rotate(-60 200 200)"/></g></svg>' +
      '<span class="rumus-bg">F = m·a &nbsp; E = mc² &nbsp; v = λ·f &nbsp; V = I·R &nbsp; P = W/t &nbsp; F = m·a &nbsp; E = mc² &nbsp; v = λ·f</span></div>';
  }
  App.rute('/', async () => {
    const app = document.getElementById('app');
    app.innerHTML = '<section class="splash">' + heroDekor() +
      '<div class="splash-inti"><div class="atom-anim" aria-hidden="true"><i></i><i></i><i></i><b></b></div><div class="logo-kartu">' + App.logo('logo-besar') + '</div>' +
      '<h1>' + esc(App.nama()) + '</h1><p class="chip-gelap">' + esc((App.cfg && App.cfg.tagline) || 'Belajar fisika jadi seru') + '</p></div>' +
      '<div class="splash-panel"><button class="btn-geser" data-masuk aria-label="Masuk">' + ikon('up') + '</button><p>Geser ke atas untuk masuk</p><span class="label-caps">Ruang belajar fisika digital</span></div></section>';
    const masuk = () => App.go('#/masuk');
    app.querySelector('[data-masuk]').addEventListener('click', masuk);
    let y0 = null;
    app.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    app.addEventListener('touchend', (e) => { if (y0 !== null && y0 - e.changedTouches[0].clientY > 50) masuk(); y0 = null; });
    API.warmUp('pub');
  }, 'publik');

  function kerangkaAuth(judul, sub, isi) {
    return '<section class="auth">' +
      '<div class="auth-hero">' + heroDekor() + '<div class="auth-hero-isi"><div class="logo-kartu">' + App.logo() + '<span>' + esc(App.nama()) + '</span></div>' +
      '<h2 class="auth-hero-judul">Satu tempat untuk <em>materi, LKPD,</em> dan <em>ujian fisika</em>.</h2>' +
      '<ul class="auth-fitur"><li>' + ikon('book') + 'Materi per topik dengan rumus yang rapi</li><li>' + ikon('clipboard') + 'Kumpulkan LKPD langsung dari HP</li><li>' + ikon('timer') + 'Ujian online yang tetap aman saat sinyal putus</li></ul></div></div>' +
      '<div class="auth-kartu-wrap"><div class="auth-kartu"><h1>' + esc(judul) + '</h1><p class="teks-2">' + esc(sub) + '</p>' + isi + '</div></div></section>';
  }
  App.rute('/masuk', async () => {
    const app = document.getElementById('app');
    app.innerHTML = kerangkaAuth('Masuk', 'Masuk ke akun ' + App.nama() + ' Anda.',
      '<form class="form" id="f-masuk" novalidate>' +
      '<label class="field"><span>NIS atau Username</span><input name="username" autocomplete="username" inputmode="text" required placeholder="cth. 2024001"></label>' +
      '<label class="field"><span class="field-baris">Kata sandi <button type="button" class="tautan" data-lupa>Lupa sandi?</button></span><span class="input-ikon"><input type="password" name="password" autocomplete="current-password" required><button type="button" class="btn-ikon" data-intip aria-label="Tampilkan sandi">' + ikon('eye') + '</button></span></label>' +
      '<p class="galat" data-galat role="alert"></p>' +
      '<button class="btn btn-primary btn-penuh" type="submit">Masuk ' + ikon('right') + '</button></form>' +
      '<div class="pemisah"><span>atau</span></div><div id="g-btn" class="g-btn-wrap"></div>' +
      '<p class="auth-alt">Belum punya akun? <a href="#/daftar">Daftar dengan kode kelas</a></p>');
    const f = document.getElementById('f-masuk'), g = f.querySelector('[data-galat]');
    f.querySelector('[data-intip]').addEventListener('click', (e) => { const i = f.password; i.type = i.type === 'password' ? 'text' : 'password'; e.currentTarget.innerHTML = ikon(i.type === 'password' ? 'eye' : 'eyeOff'); });
    f.querySelector('[data-lupa]').addEventListener('click', () => UI.modal({ title: 'Lupa kata sandi', body: '<p>Minta guru mereset sandi Anda: guru membuka <b>Kelas & Siswa</b>, memilih nama Anda, lalu menekan <b>Reset sandi</b>. Anda akan menerima sandi sementara yang wajib diganti saat masuk.</p>', actions: [{ label: 'Mengerti', cls: 'btn-primary' }] }));
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); g.textContent = '';
      if (!f.username.value.trim() || !f.password.value) { g.textContent = 'Isi NIS/username dan kata sandi.'; return; }
      await UI.sibuk(f.querySelector('button[type=submit]'), async () => {
        const r = await API.call('auth.login', { username: f.username.value.trim(), password: f.password.value });
        if (r.success) await App.setelahMasuk(r.data); else g.textContent = r.message;
      }, 'Memeriksa…');
    });
    pasangGoogle(document.getElementById('g-btn'));
    API.warmUp('pub');
  }, 'publik');

  function pasangGoogle(wadah) {
    const c = App.cfg || {};
    if (!c.googleLogin || !c.googleClientId) { wadah.innerHTML = '<p class="catatan">' + ikon('info') + 'Masuk dengan Google akan tersedia setelah guru mengaktifkannya.</p>'; const pm = wadah.previousElementSibling; if (pm && pm.classList.contains('pemisah')) pm.remove(); return; }
    const mulai = () => {
      try {
        google.accounts.id.initialize({ client_id: c.googleClientId, callback: async (resp) => {
          wadah.classList.add('memuat');
          const r = await API.call('auth.google', { credential: resp.credential });
          wadah.classList.remove('memuat');
          if (r.success) await App.setelahMasuk(r.data); else UI.toast(r.message, 'error');
        } });
        google.accounts.id.renderButton(wadah, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'id', width: Math.min(360, wadah.clientWidth || 320) });
      } catch (e) { wadah.innerHTML = '<p class="catatan">Login Google tidak tersedia saat ini.</p>'; }
    };
    if (window.google && window.google.accounts) return mulai();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = mulai;
    s.onerror = () => { wadah.innerHTML = '<p class="catatan">Login Google gagal dimuat. Gunakan NIS dan sandi.</p>'; };
    document.head.appendChild(s);
  }

  App.rute('/daftar', async () => {
    const app = document.getElementById('app');
    app.innerHTML = kerangkaAuth('Daftar', 'Buat akun siswa dengan kode kelas dari guru.',
      '<form class="form" id="f-daftar" novalidate>' +
      '<label class="field"><span>Nama lengkap</span><input name="nama" autocomplete="name" required></label>' +
      '<div class="grid-2"><label class="field"><span>NIS</span><input name="nis" inputmode="numeric" required></label>' +
      '<label class="field"><span>Kode kelas</span><input name="kode_kelas" class="mono" maxlength="6" required placeholder="6 karakter" style="text-transform:uppercase"></label></div>' +
      '<label class="field"><span>Email Google <em>(opsional)</em></span><input type="email" name="email" autocomplete="email"><small>Isi bila ingin masuk dengan tombol Google.</small></label>' +
      '<label class="field"><span>Kata sandi</span><input type="password" name="password" autocomplete="new-password" required></label>' +
      '<label class="field"><span>Ulangi kata sandi</span><input type="password" name="ulang" autocomplete="new-password" required></label>' +
      '<p class="galat" data-galat role="alert"></p><button class="btn btn-primary btn-penuh" type="submit">Kirim pendaftaran ' + ikon('send') + '</button></form>' +
      '<p class="auth-alt">Sudah punya akun? <a href="#/masuk">Masuk di sini</a></p>');
    const f = document.getElementById('f-daftar'), g = f.querySelector('[data-galat]');
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); g.textContent = '';
      const d = { nama: f.nama.value.trim(), nis: f.nis.value.trim(), kode_kelas: f.kode_kelas.value.trim().toUpperCase(), email: f.email.value.trim(), password: f.password.value };
      if (d.nama.length < 3 || !d.nis || d.kode_kelas.length !== 6) { g.textContent = 'Lengkapi nama, NIS, dan kode kelas 6 karakter.'; return; }
      if (d.password.length < 8 || !/[A-Za-z]/.test(d.password) || !/\d/.test(d.password)) { g.textContent = 'Sandi minimal 8 karakter dan berisi huruf serta angka.'; return; }
      if (d.password !== f.ulang.value) { g.textContent = 'Ulangan sandi tidak sama.'; return; }
      await UI.sibuk(f.querySelector('button[type=submit]'), async () => {
        const r = await API.call('auth.daftar', d);
        if (!r.success) { g.textContent = r.message; return; }
        f.parentElement.innerHTML = '<div class="sukses-daftar">' + ikon('clock', 'ik-besar') + '<h1>Menunggu persetujuan guru</h1><p class="teks-2">Pendaftaran ke kelas <b>' + esc(r.data.nama_kelas) + '</b> sudah terkirim. Anda bisa masuk setelah guru menyetujuinya.</p><a class="btn btn-primary btn-penuh" href="#/masuk">Kembali ke Masuk</a></div>';
      }, 'Mengirim…');
    });
  }, 'publik');

  App.rute('/darurat', async () => {
    const app = document.getElementById('app');
    app.innerHTML = kerangkaAuth('Akses darurat', 'Hanya untuk pemulihan bila akun guru tidak bisa dipakai.',
      '<form class="form" id="f-darurat"><label class="field"><span>Nama pengguna</span><input name="username" autocomplete="off" required></label>' +
      '<label class="field"><span>Kata sandi darurat</span><input type="password" name="password" autocomplete="off" required></label><p class="galat" data-galat></p>' +
      '<button class="btn btn-primary btn-penuh" type="submit">' + ikon('shield') + 'Masuk darurat</button></form>');
    const f = document.getElementById('f-darurat');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      await UI.sibuk(f.querySelector('button'), async () => {
        const r = await API.call('auth.darurat', { username: f.username.value.trim(), password: f.password.value });
        if (r.success) { await App.setelahMasuk(r.data); UI.toast('Masuk darurat. Segera ganti sandi darurat di Pengaturan → Keamanan.', 'info'); }
        else f.querySelector('[data-galat]').textContent = r.message;
      });
    });
  }, 'publik');

  // ---------------- Mulai aplikasi ----------------
  async function mulai() {
    const app = document.getElementById('app');
    if (!API.siap) {
      app.innerHTML = '<section class="auth"><div class="auth-kartu-wrap"><div class="auth-kartu">' + LOGO_DEFAULT + '<h1>Konfigurasi belum lengkap</h1><p class="teks-2">Isi alamat Web App Apps Script (berakhiran <code>/exec</code>) di berkas <code>js/config.js</code>, lalu unggah ulang. Petunjuk lengkap ada di PANDUAN-INSTALASI.md.</p></div></div></section>';
      return;
    }
    try { App.cfg = JSON.parse(localStorage.getItem('pl_cfg') || 'null'); App.me = JSON.parse(localStorage.getItem('pl_me') || 'null'); } catch (e) { App.cfg = null; App.me = null; }
    if (App.me && !API.sesi.token) App.me = null;
    App.terapkanTema(App.cfg || {});
    const cfgP = API.call('app.config', {}).then((r) => {
      if (r.success) {
        const lama = JSON.stringify(App.cfg);
        App.cfg = r.data;
        try { localStorage.setItem('pl_cfg', JSON.stringify(r.data)); } catch (e) { /* abaikan */ }
        App.terapkanTema(App.cfg);
        if (lama !== JSON.stringify(r.data) && !App.me) router();
        if (r.data.belumSetup) UI.toast('Backend belum dipasang: jalankan setupAppEnvironment() di Apps Script.', 'error', { ms: 9000 });
      }
    });
    if (!App.cfg) await cfgP;
    router();
    if (App.me) {
      API.load('app.boot', {}, (d) => {
        if (!d || !d.me) return;
        App.me = Object.assign(App.me || {}, d.me);
        try { localStorage.setItem('pl_me', JSON.stringify(App.me)); } catch (e) { /* abaikan */ }
        if (d.dashboard) App.badge('menunggu', d.dashboard.stat.menunggu);
        if (d.beranda) App.badge('#/beranda', d.beranda.belumDibaca);
      }, { maxAge: 15000 });
      muatFotoSaya();
    }
  }
  window.addEventListener('online', () => document.body.classList.remove('offline'));
  window.addEventListener('offline', () => document.body.classList.add('offline'));
  document.addEventListener('DOMContentLoaded', mulai);
})();
