/* Komponen & utilitas tampilan PhysicsLearn (vanilla JS). */
(function () {
  const UI = {};
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.esc = esc;
  UI.$ = (sel, root) => (root || document).querySelector(sel);
  UI.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  UI.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms || 250); }; };

  // ---------------- Format ----------------
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const d = (v) => { const x = v instanceof Date ? v : new Date(v); return isNaN(x.getTime()) ? null : x; };
  const p2 = (n) => String(n).padStart(2, '0');
  UI.tgl = (v, gaya) => {
    const x = d(v); if (!x) return '-';
    if (gaya === 'jam') return p2(x.getHours()) + '.' + p2(x.getMinutes());
    if (gaya === 'hari') return HARI[x.getDay()] + ', ' + x.getDate() + ' ' + BULAN[x.getMonth()];
    if (gaya === 'lengkap') return HARI[x.getDay()] + ', ' + x.getDate() + ' ' + BULAN[x.getMonth()] + ' ' + x.getFullYear() + ' · ' + p2(x.getHours()) + '.' + p2(x.getMinutes());
    if (gaya === 'singkat') return x.getDate() + ' ' + BULAN[x.getMonth()];
    return x.getDate() + ' ' + BULAN[x.getMonth()] + ' ' + x.getFullYear();
  };
  UI.relatif = (v) => {
    const x = d(v); if (!x) return '';
    const s = Math.round((x.getTime() - API.now()) / 1000), a = Math.abs(s), lalu = s < 0;
    let t;
    if (a < 60) t = 'baru saja';
    else if (a < 3600) t = Math.round(a / 60) + ' menit';
    else if (a < 86400) t = Math.round(a / 3600) + ' jam';
    else t = Math.round(a / 86400) + ' hari';
    return t === 'baru saja' ? t : t + (lalu ? ' lalu' : ' lagi');
  };
  UI.ukuran = (bytes) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
  UI.angka = (n, dgt) => (n === '' || n === null || n === undefined || isNaN(n)) ? '–' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: dgt === undefined ? 1 : dgt });
  UI.durasi = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? p2(h) + ':' : '') + p2(m) + ':' + p2(s);
  };
  UI.namaDepan = (n) => String(n || '').split(/\s+/)[0];
  UI.inisial = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  UI.isoLokal = (v) => { const x = d(v); if (!x) return ''; return x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate()) + 'T' + p2(x.getHours()) + ':' + p2(x.getMinutes()); };

  // ---------------- Teks kaya + rumus ----------------
  UI.teks = (s) => {
    const aman = esc(s || '');
    return aman.split(/\n{2,}/).map((par) => '<p>' + par
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>') + '</p>').join('');
  };
  UI.rumus = (el) => {
    if (!el) return;
    const jalan = () => {
      if (!window.renderMathInElement) return false;
      try {
        window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }], throwOnError: false });
      } catch (e) { /* biarkan teks asli */ }
      return true;
    };
    if (!jalan()) { let n = 0; const t = setInterval(() => { if (jalan() || ++n > 20) clearInterval(t); }, 300); }
  };

  // ---------------- Toast ----------------
  UI.toast = (msg, tipe, opts) => {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast toast-' + (tipe || 'ok');
    el.setAttribute('role', tipe === 'error' ? 'alert' : 'status');
    el.innerHTML = ikon(tipe === 'error' ? 'alert' : tipe === 'info' ? 'info' : 'checkCircle') + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    if ((tipe || 'ok') === 'ok' && opts && opts.partikel) UI.partikel(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, (opts && opts.ms) || (tipe === 'error' ? 5200 : 3200));
  };
  UI.hasil = (r, okMsg) => {
    if (r && r.success) { UI.toast(r.message || okMsg || 'Berhasil.', 'ok'); return true; }
    UI.toast((r && r.message) || 'Terjadi kesalahan.', 'error');
    return false;
  };
  /** Ledakan partikel singkat (dimatikan bila "kurangi gerakan"). */
  UI.partikel = (anchor) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = anchor.getBoundingClientRect(), wrap = document.createElement('div');
    wrap.className = 'partikel';
    wrap.style.left = (r.left + 28) + 'px'; wrap.style.top = (r.top + r.height / 2) + 'px';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i'), a = (i / 14) * Math.PI * 2, jarak = 26 + Math.random() * 34;
      s.style.setProperty('--dx', Math.cos(a) * jarak + 'px'); s.style.setProperty('--dy', Math.sin(a) * jarak + 'px');
      wrap.appendChild(s);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 900);
  };

  // ---------------- Modal & lembar ----------------
  UI.modal = (o) => {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'overlay' + (o.sheet ? ' overlay-sheet' : '');
    wrap.innerHTML = '<div class="modal ' + (o.wide ? 'modal-wide ' : '') + (o.sheet ? 'modal-sheet ' : '') + (o.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title || 'Dialog') + '">' +
      '<div class="modal-head"><h3>' + esc(o.title || '') + '</h3><button class="btn-ikon" data-tutup aria-label="Tutup">' + ikon('x') + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' +
      (o.actions && o.actions.length ? '<div class="modal-foot">' + o.actions.map((a, i) => '<button class="btn ' + (a.cls || 'btn-ghost') + '" data-aksi="' + i + '">' + (a.icon ? ikon(a.icon) : '') + esc(a.label) + '</button>').join('') + '</div>' : '') + '</div>';
    root.appendChild(wrap);
    document.body.classList.add('modal-terbuka');
    const prevFocus = document.activeElement;
    const close = () => { wrap.classList.remove('show'); setTimeout(() => { wrap.remove(); if (!root.children.length) document.body.classList.remove('modal-terbuka'); }, 200); if (o.onClose) o.onClose(); if (prevFocus && prevFocus.focus) prevFocus.focus(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape' && !o.wajib) close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      if ((e.target === wrap && !o.wajib) || e.target.closest('[data-tutup]')) { if (!o.wajib || e.target.closest('[data-tutup]')) close(); return; }
      const b = e.target.closest('[data-aksi]');
      if (b) { const a = o.actions[Number(b.dataset.aksi)]; if (a && a.onClick) a.onClick({ close, el: wrap, btn: b }); else close(); }
    });
    if (o.wajib) { const t = wrap.querySelector('[data-tutup]'); if (t) t.remove(); }
    requestAnimationFrame(() => { wrap.classList.add('show'); const f = wrap.querySelector('input,select,textarea,button.btn-primary'); if (f && !o.noFocus) f.focus(); });
    if (o.onOpen) o.onOpen(wrap, close);
    return { el: wrap, close };
  };
  UI.konfirmasi = (pesan, o) => new Promise((resolve) => {
    o = o || {};
    UI.modal({ title: o.judul || 'Konfirmasi', body: '<p class="teks-2">' + pesan + '</p>' + (o.extra || ''),
      actions: [{ label: o.batal || 'Batal', cls: 'btn-ghost', onClick: (m) => { resolve(false); m.close(); } },
        { label: o.ok || 'Ya, lanjutkan', cls: o.bahaya ? 'btn-danger' : 'btn-primary', onClick: (m) => { resolve(o.extra ? m.el : true); m.close(); } }],
      onClose: () => resolve(false) });
  });
  /** Tombol sibuk: nonaktifkan + label memuat selama promise berjalan. */
  UI.sibuk = async (btn, fn, label) => {
    if (!btn || btn.disabled) return;
    const asli = btn.innerHTML;
    btn.disabled = true; btn.classList.add('memuat');
    btn.innerHTML = '<span class="spinner"></span>' + esc(label || 'Memproses…');
    try { return await fn(); } finally { if (document.body.contains(btn)) { btn.disabled = false; btn.classList.remove('memuat'); btn.innerHTML = asli; } }
  };

  // ---------------- Komponen kecil ----------------
  const PILL = {
    belum: ['info', 'Belum dikerjakan'], terkumpul: ['ok', 'Terkumpul'], terlambat: ['warn', 'Terlambat'], dinilai: ['ok', 'Dinilai'], revisi: ['warn', 'Perlu revisi'],
    lewat_tenggat: ['danger', 'Lewat tenggat'], ditutup: ['danger', 'Ditutup'], dikumpulkan: ['info', 'Menunggu nilai'],
    hadir: ['ok', 'Hadir'], izin: ['info', 'Izin'], sakit: ['info', 'Sakit'], alfa: ['danger', 'Alfa'],
    mengerjakan: ['warn', 'Mengerjakan'], selesai: ['ok', 'Selesai'], menunggu_koreksi: ['info', 'Menunggu koreksi'],
    aktif: ['ok', 'Aktif'], menunggu: ['warn', 'Menunggu'], nonaktif: ['danger', 'Nonaktif'], arsip: ['netral', 'Arsip'],
    terbit: ['ok', 'Terbit'], draf: ['netral', 'Draf'], buka: ['ok', 'Berjalan'], tutup: ['netral', 'Ditutup'],
    akan: ['info', 'Akan datang'], berlangsung: ['warn', 'Berlangsung'], berakhir: ['netral', 'Berakhir'], tuntas: ['ok', 'Tuntas'], belum_tuntas: ['danger', 'Belum tuntas'],
    latihan: ['info', 'Latihan'], ujian: ['warn', 'Ujian'],
    ok: ['ok', ''], info: ['info', ''], warn: ['warn', ''], danger: ['danger', ''], netral: ['netral', '']
  };
  UI.pill = (status, label) => {
    const p = PILL[status] || ['netral', status];
    return '<span class="pill pill-' + p[0] + '">' + esc(label || p[1]) + '</span>';
  };
  UI.avatar = (nama, url, cls) => url ? '<span class="avatar ' + (cls || '') + '"><img src="' + esc(url) + '" alt=""></span>' : '<span class="avatar ' + (cls || '') + '" aria-hidden="true">' + esc(UI.inisial(nama)) + '</span>';
  UI.kosong = (ik, judul, teks, aksi) => '<div class="kosong">' + ikon(ik || 'atom', 'ik-besar') + '<h4>' + esc(judul) + '</h4>' + (teks ? '<p>' + esc(teks) + '</p>' : '') + (aksi || '') + '</div>';
  UI.skeleton = (n, tipe) => Array.from({ length: n || 3 }).map(() => '<div class="skel skel-' + (tipe || 'kartu') + '"></div>').join('');
  UI.labelCaps = (t) => '<span class="label-caps">' + esc(t) + '</span>';

  /** Cincin orbit progres: lintasan abu, busur biru muda, "elektron" kuning di ujung. */
  UI.orbit = (persen, ukuran, teksTengah, sub) => {
    const s = ukuran || 96, r = s / 2 - 8, c = s / 2, p = Math.max(0, Math.min(100, Number(persen) || 0));
    const sudut = (p / 100) * Math.PI * 2 - Math.PI / 2, ex = c + r * Math.cos(sudut), ey = c + r * Math.sin(sudut), keliling = 2 * Math.PI * r;
    return '<div class="orbit" style="width:' + s + 'px;height:' + s + 'px"><svg viewBox="0 0 ' + s + ' ' + s + '" role="img" aria-label="Progres ' + Math.round(p) + ' persen">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" class="orbit-jalur"/>' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" class="orbit-isi" stroke-dasharray="' + (keliling * p / 100) + ' ' + keliling + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>' +
      '<circle cx="' + ex + '" cy="' + ey + '" r="4.5" class="orbit-elektron"/></svg>' +
      '<div class="orbit-teks"><b>' + esc(teksTengah !== undefined ? teksTengah : Math.round(p) + '%') + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>';
  };
  UI.progres = (persen, cls) => '<div class="bar ' + (cls || '') + '"><span style="width:' + Math.max(0, Math.min(100, persen || 0)) + '%"></span></div>';
  UI.segmen = (nama, opsi, nilai) => '<div class="segmen" role="tablist" data-segmen="' + esc(nama) + '">' + opsi.map((o) => '<button type="button" role="tab" class="' + (o[0] === nilai ? 'aktif' : '') + '" data-nilai="' + esc(o[0]) + '" aria-selected="' + (o[0] === nilai) + '">' + esc(o[1]) + (o[2] !== undefined ? ' <span class="hitung">' + esc(o[2]) + '</span>' : '') + '</button>').join('') + '</div>';
  UI.pasangSegmen = (root, nama, onChange) => {
    const s = root.querySelector('[data-segmen="' + nama + '"]');
    if (!s) return;
    s.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      s.querySelectorAll('button').forEach((x) => { x.classList.toggle('aktif', x === b); x.setAttribute('aria-selected', x === b); });
      onChange(b.dataset.nilai);
    });
  };

  // ---------------- Berkas ----------------
  UI.bacaBerkas = (file) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve({ nama: file.name, tipe: file.type || 'application/octet-stream', base64: String(fr.result).split(',')[1], ukuran: file.size });
    fr.onerror = () => reject(new Error('Berkas tidak bisa dibaca.'));
    fr.readAsDataURL(file);
  });
  function muatGambar(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibuka.')); };
      img.src = url;
    });
  }
  /** Kecilkan foto (mis. dari kamera HP) agar unggahan cepat. */
  UI.kompresGambar = async (file, sisiMaks, kualitas) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return UI.bacaBerkas(file);
    const img = await muatGambar(file);
    const skala = Math.min(1, (sisiMaks || 1600) / Math.max(img.width, img.height));
    if (skala === 1 && file.size < 900 * 1024) return UI.bacaBerkas(file);
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * skala); cv.height = Math.round(img.height * skala);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const url = cv.toDataURL('image/jpeg', kualitas || 0.85), base64 = url.split(',')[1];
    return { nama: file.name.replace(/\.\w+$/, '') + '.jpg', tipe: 'image/jpeg', base64, ukuran: Math.floor(base64.length * 3 / 4) };
  };
  /** Potong persegi (tengah, dengan zoom & geser) lalu ubah ke PNG ukuran tertentu. */
  UI.potongKotak = async (sumber, ukuran, zoom, gx, gy) => {
    const img = sumber instanceof HTMLImageElement ? sumber : await muatGambar(sumber);
    const sisi = Math.min(img.width, img.height) / (zoom || 1);
    const sx = (img.width - sisi) / 2 + (gx || 0) * (img.width - sisi) / 2, sy = (img.height - sisi) / 2 + (gy || 0) * (img.height - sisi) / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = ukuran;
    cv.getContext('2d').drawImage(img, Math.max(0, sx), Math.max(0, sy), sisi, sisi, 0, 0, ukuran, ukuran);
    const url = cv.toDataURL('image/png');
    return { nama: 'logo_' + ukuran + '.png', tipe: 'image/png', base64: url.split(',')[1], dataUrl: url };
  };
  UI.muatGambar = muatGambar;

  // ---------------- CSV / Excel ----------------
  UI.parseCSV = (teks) => {
    teks = String(teks || '').replace(/^﻿/, '');
    const baris1 = teks.split(/\r?\n/)[0] || '';
    const sep = (baris1.match(/;/g) || []).length > (baris1.match(/,/g) || []).length ? ';' : (baris1.indexOf('\t') > -1 ? '\t' : ',');
    const rows = []; let row = [], sel = '', kutip = false;
    for (let i = 0; i < teks.length; i++) {
      const ch = teks[i];
      if (kutip) { if (ch === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += ch; }
      else if (ch === '"') kutip = true;
      else if (ch === sep) { row.push(sel); sel = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && teks[i + 1] === '\n') i++; row.push(sel); rows.push(row); row = []; sel = ''; }
      else sel += ch;
    }
    if (sel !== '' || row.length) { row.push(sel); rows.push(row); }
    const isi = rows.filter((r) => r.some((x) => String(x).trim() !== ''));
    if (!isi.length) return [];
    const h = isi[0].map((x) => String(x).trim());
    return isi.slice(1).map((r) => { const o = {}; h.forEach((k, i) => { if (k) o[k] = String(r[i] === undefined ? '' : r[i]).trim(); }); return o; });
  };
  function muatSkrip(src) {
    return new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Pustaka gagal dimuat. Periksa koneksi.')); document.head.appendChild(s); });
  }
  /** Baca CSV atau Excel (.xlsx) menjadi array objek berdasarkan judul kolom. */
  UI.bacaTabel = async (file) => {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      if (!window.XLSX) await muatSkrip('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
      const buf = await file.arrayBuffer(), wb = window.XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return window.XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    }
    return UI.parseCSV(await file.text());
  };
  UI.unduhCSV = (nama, rows) => {
    const isi = rows.map((r) => r.map((v) => { const s = String(v === null || v === undefined ? '' : v); return /[";,\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  // ---------------- Warna ----------------
  const hexKe = (h) => { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const keHex = (rgb) => '#' + rgb.map((v) => p2(Math.round(Math.max(0, Math.min(255, v))).toString(16))).join('');
  UI.campur = (a, b, t) => { const x = hexKe(a), y = hexKe(b); return keHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = (h) => { const c = hexKe(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  UI.kontras = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  // ---------------- GPS ----------------
  UI.gps = (o) => new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Perangkat ini tidak mendukung GPS di browser.'));
    if (!window.isSecureContext) return reject(new Error('GPS hanya berjalan di alamat HTTPS.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: Math.round(p.coords.accuracy) }),
      (e) => reject(new Error(e.code === 1 ? 'Izin lokasi ditolak. Buka pengaturan situs di browser lalu izinkan Lokasi.' : e.code === 3 ? 'GPS terlalu lama merespons. Nyalakan GPS akurasi tinggi lalu coba lagi.' : 'Lokasi belum terbaca. Pindah ke area terbuka lalu coba lagi.')),
      { enableHighAccuracy: true, timeout: (o && o.timeout) || 20000, maximumAge: 0 });
  });

  window.UI = UI;
})();
