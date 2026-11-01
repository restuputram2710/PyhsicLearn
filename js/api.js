/* =====================================================================
 * Klien API PhysicsLearn → Google Apps Script (/exec)
 *  - POST dengan Content-Type text/plain (tanpa CORS preflight)
 *  - Token sesi di BODY, bukan di URL
 *  - Dedupe baca in-flight + epoch tulis (tidak menumpang data basi)
 *  - Penggabung batch otomatis (beberapa baca di tik yang sama = 1 eksekusi)
 *  - Cache lokal SWR per pengguna (tampil instan, diperbarui di belakang)
 *  - Coba ulang otomatis dengan jeda acak saat server sibuk / jaringan putus
 * ===================================================================== */
(function () {
  // ---------------- Konfigurasi URL Web App ----------------
  // Toleran terhadap salah tempel yang umum (spasi, garis miring/parameter di akhir, URL akun
  // Google Workspace /a/macros/<domain>/s/…), dan bisa mendiagnosis kenapa URL belum terbaca.
  const POLA_GAS = /^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+|macros)\/s\/[A-Za-z0-9_-]{10,}\/(exec|dev)$/;
  function cekUrl(mentah) {
    const url = String(mentah || '').replace(/\s+/g, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (!url) return { ok: false, kode: 'KOSONG', url };
    if (/GANTI|XXXX/i.test(url)) return { ok: false, kode: 'CONTOH', url };
    const m = url.match(POLA_GAS);
    if (!m) return { ok: false, kode: /\/home\/projects\/|\/edit$|\/d\//.test(url) ? 'BUKAN_WEBAPP' : 'FORMAT', url };
    if (m[1] === 'dev') return { ok: false, kode: 'DEV', url };
    return { ok: true, kode: 'OK', url };
  }
  const CEK_AWAL = window.APP_CONFIG ? cekUrl(window.APP_CONFIG.GAS_URL) : { ok: false, kode: 'TIDAK_ADA', url: '' };
  let URL_API = CEK_AWAL.ok ? CEK_AWAL.url : '';
  let SIAP = CEK_AWAL.ok;

  /**
   * Dipanggil bila konfigurasi awal tidak valid: baca ulang js/config.js langsung dari server
   * (tanpa cache browser/CDN). Menangani kasus config.js baru di-push tetapi browser masih
   * memegang versi lama. Bila URL baru valid, API langsung memakainya.
   */
  async function periksaKonfigurasi() {
    let teks = null, status = 0;
    try {
      const r = await fetch('js/config.js?cek=' + Date.now(), { cache: 'no-store' });
      status = r.status;
      if (r.ok) teks = await r.text();
    } catch (e) { status = -1; }
    let hasil;
    if (teks === null) hasil = window.APP_CONFIG ? CEK_AWAL : { ok: false, kode: 'TIDAK_ADA', url: '', status };
    else {
      const m = teks.match(/GAS_URL\s*:\s*['"`]([^'"`]*)['"`]/);
      hasil = m ? cekUrl(m[1]) : { ok: false, kode: 'RUSAK', url: '' };
    }
    if (hasil.ok) { URL_API = hasil.url; SIAP = true; API.siap = true; API.url = hasil.url; }
    return hasil;
  }
  const BACA = /^(app\.|materi\.(list|detail)|tugas\.(list|detail|pengumpulan)|ujian\.(list|hasil|detailGuru|pantau)|siswa\.(beranda|list|detail)|pengingat\.list|nilai\.|guru\.|kelas\.list|lokasi\.list|sesi\.(aktif|hadir|riwayat)|soal\.list|laporan\.|pengaturan\.get|rahasia\.status|sistem\.status|log\.|profil\.foto|import\.pindai)/;
  const Perf = { log: [], table() { console.table(this.log.slice(-40)); }, summary() {
    const by = {};
    this.log.forEach((l) => { (by[l.aksi] = by[l.aksi] || []).push(l.total); });
    console.table(Object.keys(by).map((k) => ({ aksi: k, n: by[k].length, rata_ms: Math.round(by[k].reduce((a, b) => a + b, 0) / by[k].length) })));
  } };

  const Sesi = {
    get token() { try { return localStorage.getItem('pl_token') || ''; } catch (e) { return ''; } },
    set token(v) { try { v ? localStorage.setItem('pl_token', v) : localStorage.removeItem('pl_token'); } catch (e) { /* abaikan */ } },
    get uid() { try { return (JSON.parse(localStorage.getItem('pl_me') || 'null') || {}).id_user || 'anon'; } catch (e) { return 'anon'; } }
  };

  let _epoch = 0, _writeAt = 0;
  try { _writeAt = Number(sessionStorage.getItem('pl_writeAt') || 0); } catch (e) { _writeAt = 0; }
  const _inflight = {};
  const tunda = (ms) => new Promise((r) => setTimeout(r, ms));

  async function kirim(action, data, opts) {
    opts = opts || {};
    if (!SIAP) return { success: false, message: 'Konfigurasi belum lengkap: isi GAS_URL di js/config.js.', code: 'CONFIG' };
    const body = JSON.stringify({ action, token: Sesi.token, data: data || {} });
    const maks = opts.retry === undefined ? (BACA.test(action) ? 3 : 1) : opts.retry;
    let terakhir = null;
    for (let i = 0; i <= maks; i++) {
      const t0 = performance.now();
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), opts.timeout || 45000);
      try {
        const res = await fetch(URL_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ctrl.signal, redirect: 'follow' });
        clearTimeout(to);
        const json = await res.json();
        Perf.log.push({ aksi: action, total: Math.round(performance.now() - t0), server: json.ms, cache: !!json.cached, ok: json.success });
        if (json.serverNow) API.offset = json.serverNow - Date.now();
        if (!json.success && json.code === 'BUSY' && i < maks) { await tunda(800 * Math.pow(2, i) + Math.random() * 700); continue; }
        if (!json.success && json.code === 'AUTH' && action !== 'auth.login') API.onAuthLost && API.onAuthLost(json.message);
        return json;
      } catch (e) {
        clearTimeout(to);
        terakhir = e;
        if (i < maks) { await tunda(700 * Math.pow(2, i) + Math.random() * 900); continue; }
      }
    }
    return { success: false, offline: !navigator.onLine, code: 'NETWORK', message: navigator.onLine ? 'Server tidak merespons. Periksa koneksi lalu coba lagi.' : 'Anda sedang offline. Periksa koneksi internet.', error: String(terakhir) };
  }

  /** Panggil aksi. Aksi tulis menaikkan epoch sehingga baca berikutnya selalu segar. */
  function call(action, data, opts) {
    if (!BACA.test(action)) {
      _epoch++;
      const p = kirim(action, data, opts);
      p.then((r) => { if (r && r.success) { _writeAt = Date.now(); try { sessionStorage.setItem('pl_writeAt', String(_writeAt)); } catch (e) { /* abaikan */ } } });
      return p;
    }
    const k = _epoch + '|' + action + '|' + Sesi.token.slice(-12) + '|' + JSON.stringify(data || {});
    if (_inflight[k]) return _inflight[k];
    const p = kirim(action, data, opts);
    _inflight[k] = p;
    p.then(() => delete _inflight[k], () => delete _inflight[k]);
    return p;
  }

  /** Penggabung batch: baca yang dipanggil di tik yang sama dijadikan satu eksekusi. */
  const Batcher = {
    q: null,
    add(action, data) {
      return new Promise((res) => {
        if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); }
        this.q.push({ action, data: data || {}, res });
      });
    },
    async flush() {
      const q = this.q; this.q = null;
      const uniq = [], map = {};
      q.forEach((it) => { const k = it.action + '|' + JSON.stringify(it.data); if (!map[k]) { map[k] = []; uniq.push(it); } map[k].push(it); });
      for (let i = 0; i < uniq.length; i += 10) {
        const part = uniq.slice(i, i + 10);
        if (part.length === 1) {
          const r = await call(part[0].action, part[0].data);
          map[part[0].action + '|' + JSON.stringify(part[0].data)].forEach((it) => it.res(r));
          continue;
        }
        const r = await call('batch', { calls: part.map((p) => ({ action: p.action, data: p.data })) });
        part.forEach((p, j) => {
          const hasil = r.success ? r.data[j] : r;
          map[p.action + '|' + JSON.stringify(p.data)].forEach((it) => it.res(hasil));
        });
      }
    }
  };

  // ---------------- Cache lokal (SWR) ----------------
  function kunci(action, data) { return 'pl:' + Sesi.uid + ':' + action + ':' + JSON.stringify(data || {}); }
  function bacaCache(action, data) { try { return JSON.parse(localStorage.getItem(kunci(action, data)) || 'null'); } catch (e) { return null; } }
  function tulisCache(action, data, value) {
    try { localStorage.setItem(kunci(action, data), JSON.stringify({ t: Date.now(), v: value })); }
    catch (e) { bersihkanCache(true); }
  }
  function bersihkanCache(sebagian) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('pl:') === 0) keys.push(k); }
      (sebagian ? keys.slice(0, Math.ceil(keys.length / 2)) : keys).forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* abaikan */ }
  }

  /**
   * Muat data dengan pola stale-while-revalidate.
   * onData(data, {stale}) dipanggil segera dari cache (bila ada) lalu sekali lagi bila data server berbeda.
   * Mengembalikan Promise hasil server.
   */
  async function load(action, data, onData, opts) {
    opts = opts || {};
    const c = bacaCache(action, data);
    const segar = c && Date.now() - c.t < (opts.maxAge || 20000) && c.t > _writeAt;
    if (c && onData) onData(c.v, { stale: !segar });
    if (segar && !opts.force) return { success: true, data: c.v, cached: true };
    const r = opts.batch === false ? await call(action, data) : await Batcher.add(action, data);
    if (r.success) {
      const beda = !c || JSON.stringify(c.v) !== JSON.stringify(r.data);
      tulisCache(action, data, r.data);
      if (onData && beda) onData(r.data, { stale: false });
    } else if (onData && !c && opts.onError) opts.onError(r);
    return r;
  }

  /** Unggah dengan progres persen (XHR, tetap text/plain = tanpa preflight). */
  function upload(action, data, onProgress) {
    _epoch++;
    return new Promise((resolve) => {
      if (!SIAP) return resolve({ success: false, message: 'Konfigurasi belum lengkap.' });
      const xhr = new XMLHttpRequest();
      xhr.open('POST', URL_API, true);
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
      xhr.timeout = 300000;
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.min(99, Math.round(e.loaded / e.total * 100))); };
      xhr.onload = () => {
        try {
          const j = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          if (j.success) { _writeAt = Date.now(); try { sessionStorage.setItem('pl_writeAt', String(_writeAt)); } catch (e) { /* abaikan */ } }
          if (!j.success && j.code === 'AUTH') API.onAuthLost && API.onAuthLost(j.message);
          resolve(j);
        } catch (e) { resolve({ success: false, message: 'Respons server tidak terbaca. Coba lagi.' }); }
      };
      xhr.onerror = () => resolve({ success: false, code: 'NETWORK', message: 'Unggahan gagal. Periksa koneksi lalu coba lagi.' });
      xhr.ontimeout = () => resolve({ success: false, code: 'NETWORK', message: 'Unggahan terlalu lama. Coba berkas yang lebih kecil atau jaringan yang lebih stabil.' });
      xhr.send(JSON.stringify({ action, token: Sesi.token, data }));
    });
  }

  /** Memanaskan server (GET no-cors), maks. 1× per 4 menit per lingkup. */
  function warmUp(scope) {
    if (!SIAP) return;
    const k = 'pl_warm_' + scope;
    try {
      if (Date.now() - Number(sessionStorage.getItem(k) || 0) < 240000) return;
      sessionStorage.setItem(k, String(Date.now()));
    } catch (e) { /* tetap panaskan */ }
    fetch(URL_API + '?w=' + scope, { mode: 'no-cors' }).catch(() => {});
  }

  const API = { siap: SIAP, url: URL_API, cekAwal: CEK_AWAL, periksaKonfigurasi, offset: 0, call, load, upload, warmUp, batch: (a, d) => Batcher.add(a, d), cache: { baca: bacaCache, tulis: tulisCache, bersihkan: bersihkanCache }, sesi: Sesi, perf: Perf, onAuthLost: null,
    now() { return Date.now() + this.offset; } };
  window.API = API;
  window.Perf = Perf;
})();
