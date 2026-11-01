/* =====================================================================
 * Halaman GURU (1/2): beranda, sesi & absensi GPS, kelas & siswa, impor,
 * materi, tugas & penilaian.
 * ===================================================================== */
(function () {
  const esc = UI.esc;
  const G = {};
  window.GuruUI = G;

  G.opsiKelas = (list, nilai, extra) => (extra || '') + list.map((k) => '<option value="' + esc(k.id_kelas) + '"' + (k.id_kelas === nilai ? ' selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('');
  G.opsiTopik = (nilai, kosong) => (kosong ? '<option value="">' + esc(kosong) + '</option>' : '') + App.TOPIK.map((t) => '<option' + (t === nilai ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
  G.form = (el) => { const o = {}; new FormData(el.querySelector('form') || el).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; };
  G.muatKelas = (cb) => API.load('kelas.list', {}, cb, { maxAge: 60000 });
  G.rumusBantu = (idTextarea) => '<div class="bantu-rumus"><button type="button" class="btn btn-tipis" data-rumus="' + idTextarea + '">' + ikon('sigma') + 'Sisipkan rumus</button><span class="kecil teks-2">Tulis rumus di antara <code>$$ … $$</code>, contoh <code>$$F = m a$$</code></span></div>';
  G.pasangRumus = (root, idTextarea, idPreview) => {
    const ta = root.querySelector('#' + idTextarea), pv = idPreview ? root.querySelector('#' + idPreview) : null;
    const segar = UI.debounce(() => { if (pv) { pv.innerHTML = ta.value ? UI.teks(ta.value) : '<span class="teks-2">Pratinjau tampil di sini.</span>'; UI.rumus(pv); } }, 250);
    const b = root.querySelector('[data-rumus="' + idTextarea + '"]');
    if (b) b.addEventListener('click', () => {
      const s = ta.selectionStart, e = ta.selectionEnd, pilih = ta.value.slice(s, e) || 'v = v_0 + a t';
      ta.setRangeText('$$' + pilih + '$$', s, e, 'end'); ta.focus(); segar();
    });
    ta.addEventListener('input', segar); segar();
  };
  /** Dropzone berkas generik di dalam form modal. */
  G.dropzone = (id, teks, accept) => '<div class="dropzone dropzone-kecil" data-dz="' + id + '"><input type="file" hidden accept="' + esc(accept || '') + '">' + ikon('upload') + '<span><b>' + esc(teks) + '</b><small class="teks-2" data-dz-info>Seret berkas ke sini atau klik untuk memilih</small></span></div>';
  G.pasangDropzone = (root, id, onFile) => {
    const dz = root.querySelector('[data-dz="' + id + '"]'); if (!dz) return;
    const inp = dz.querySelector('input');
    dz.addEventListener('click', (e) => { if (e.target !== inp) inp.click(); });
    inp.addEventListener('change', () => { if (inp.files[0]) pilih(inp.files[0]); });
    ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('aktif'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('aktif'); if (ev === 'drop' && e.dataTransfer.files[0]) pilih(e.dataTransfer.files[0]); }));
    async function pilih(f) { dz.querySelector('[data-dz-info]').textContent = f.name + ' · ' + UI.ukuran(f.size); dz.classList.add('terisi'); await onFile(f); }
  };

  // =================================================================
  // BERANDA GURU
  // =================================================================
  App.rute('/g/beranda', async () => {
    App.judul('Beranda', 'Ringkasan hari ini');
    const v = App.view();
    v.innerHTML = '<div class="konten-lebar" id="gb">' + UI.skeleton(4) + '</div>';
    const render = (d) => {
      const s = d.stat;
      App.badge('menunggu', s.menunggu); App.badge('#/g/tugas', s.belum_dinilai);
      const kartu = (ik, label, angka, satuan, ket, kelas, href) => '<a class="stat-kartu kartu ' + (kelas || '') + '"' + (href ? ' href="' + href + '"' : '') + '><div class="sk-atas"><span>' + esc(label) + '</span><span class="ikon-bulat">' + ikon(ik) + '</span></div><b class="angka-besar mono">' + angka + '</b><span class="sk-satuan">' + esc(satuan) + '</span><small>' + ket + '</small></a>';
      let h = '';
      if (s.menunggu) h += '<a class="alert alert-warn" href="#/g/kelas?menunggu=1">' + ikon('users') + '<span><b>' + s.menunggu + ' pendaftaran menunggu persetujuan.</b> Tinjau sekarang.</span>' + ikon('right') + '</a>';
      h += '<div class="grid-stat">' +
        kartu('users', 'Total siswa', s.siswa, 'siswa', ikon('checkCircle') + s.kelas + ' kelas aktif', '', '#/g/kelas') +
        kartu('radar', 'Sesi hari ini', s.sesi_hari_ini, 'sesi', d.sesi_aktif.length ? ikon('radar') + d.sesi_aktif.length + ' sesi GPS berjalan' : 'Belum ada sesi berjalan', '', '#/g/sesi') +
        kartu('clipboard', 'Tugas belum dinilai', s.belum_dinilai, 'berkas', s.tugas_teratas ? esc(s.tugas_teratas.judul) : 'Semua sudah dinilai', s.belum_dinilai ? 'stat-warn' : '', s.tugas_teratas ? '#/g/tugas/' + s.tugas_teratas.id_tugas : '#/g/tugas') +
        kartu('star', 'Rata-rata nilai', s.rata_rata === '' ? '–' : UI.angka(s.rata_rata), '', s.rata_rata === '' ? 'Belum ada nilai' : (s.rata_rata >= d.batas_ketuntasan ? 'Di atas' : 'Di bawah') + ' batas ketuntasan (' + d.batas_ketuntasan + ')', s.rata_rata !== '' && s.rata_rata < d.batas_ketuntasan ? 'stat-bahaya' : '', '#/g/laporan') + '</div>';
      if (d.sesi_aktif.length) {
        h += '<section class="kartu kartu-radar-ringkas"><div class="judul-seksi"><h2>' + ikon('radar') + 'Sesi berjalan</h2><a class="btn btn-primary btn-kecil" href="#/g/sesi">Kelola sesi</a></div><div class="tumpuk">' + d.sesi_aktif.map((x) =>
          '<div class="sesi-baris"><span class="denyut"></span><span class="bd-isi"><b>' + esc(x.nama_kelas) + ' · ' + esc(x.topik) + '</b><small>' + esc(x.nama_lokasi) + ' · jarak guru ' + x.jarak_m + ' m · tutup ' + esc(UI.tgl(x.batas_tutup, 'jam')) + '</small></span><span class="sesi-hitung mono">' + x.hadir + '/' + x.total + '</span>' + UI.progres(x.total ? x.hadir / x.total * 100 : 0) + '</div>').join('') + '</div></section>';
      } else {
        h += '<section class="kartu kartu-mulai"><div class="km-dekor" aria-hidden="true">' + ikon('radar') + '</div><div><span class="label-caps">Verifikasi lokasi GPS</span><h2>Mulai sesi pembelajaran</h2><p class="teks-2">Sesi hanya bisa dibuka saat Anda berada di dalam radius lokasi belajar. Setelah dibuka, siswa menekan "Hadir".</p></div>' +
          (d.lokasi.length ? '<form class="mulai-form" id="gb-mulai"><select name="id_kelas" aria-label="Kelas">' + G.opsiKelas(d.kelas) + '</select><select name="id_lokasi" aria-label="Lokasi">' + d.lokasi.map((l) => '<option value="' + esc(l.id_lokasi) + '">' + esc(l.nama_lokasi) + '</option>').join('') + '</select><button class="btn btn-primary" type="submit">' + ikon('play') + 'Mulai sesi</button></form>'
            : '<a class="btn btn-primary" href="#/g/pengaturan?tab=lokasi">' + ikon('pin') + 'Atur lokasi belajar dulu</a>') + '</section>';
      }
      h += '<div class="grid-2"><section class="kartu"><div class="judul-seksi"><div><h2>Rata-rata nilai per kelas</h2><p class="teks-2 kecil">Semua tugas dan ujian yang sudah dinilai</p></div></div><div id="gb-g1" class="grafik-wadah"></div></section>' +
        '<section class="kartu"><div class="judul-seksi"><div><h2>Tren kehadiran mingguan</h2><p class="teks-2 kecil">Persentase hadir dari sesi yang sudah ditutup, 6 minggu terakhir</p></div></div><div id="gb-g2" class="grafik-wadah"></div></section></div>';
      h += '<div class="grid-2-1"><section class="kartu"><div class="judul-seksi"><h2>Pengumpulan terbaru</h2><a class="tautan" href="#/g/tugas">Semua tugas</a></div>' +
        (d.terbaru.length ? '<div class="tabel-wadah"><table class="tabel tabel-responsif"><thead><tr><th>Siswa</th><th>Tugas</th><th>Waktu</th><th>Status</th><th></th></tr></thead><tbody>' + d.terbaru.map((k) =>
          '<tr><td><span><b>' + esc(k.nama) + '</b><br><small class="teks-2">' + esc(k.nama_kelas) + '</small></span></td><td data-label="Tugas">' + esc(k.judul) + '</td><td data-label="Waktu" class="mono kecil">' + esc(UI.relatif(k.waktu)) + '</td><td data-label="Status">' + (k.status === 'dinilai' ? UI.pill('dinilai', 'Nilai ' + UI.angka(k.nilai)) : UI.pill(k.terlambat ? 'terlambat' : k.status)) + '</td><td data-label="Aksi"><a class="btn btn-tipis" href="#/g/tugas/' + esc(k.id_tugas) + '?k=' + esc(k.id_pengumpulan) + '">Periksa</a></td></tr>').join('') + '</tbody></table></div>' : UI.kosong('clipboard', 'Belum ada pengumpulan', '')) + '</section>' +
        '<section class="kartu"><div class="judul-seksi"><h2>Aktivitas terbaru</h2></div><ul class="linimasa">' + (d.aktivitas.map((a) => '<li><b>' + esc(a.aksi.replace(/_/g, ' ').toLowerCase()) + '</b><span>' + esc(a.detail || '') + '</span><small class="mono">' + esc(UI.relatif(a.waktu)) + ' · ' + esc(a.nama) + '</small></li>').join('') || '<li class="teks-2">Belum ada aktivitas.</li>') + '</ul></section></div>';
      v.firstElementChild.innerHTML = h;
      Grafik.batang(document.getElementById('gb-g1'), d.per_kelas.map((k) => ({ label: k.nama_kelas, nilai: k.rata_rata })), { batas: d.batas_ketuntasan, judul: 'Rata-rata nilai per kelas', kosong: 'Belum ada nilai.' });
      Grafik.garis(document.getElementById('gb-g2'), d.tren_kehadiran.map((t) => ({ label: UI.tgl(t.minggu, 'singkat'), nilai: t.persen })), { satuan: '%', judul: 'Tren kehadiran', id: 'gb', kosong: 'Belum ada sesi yang ditutup.' });
      const f = document.getElementById('gb-mulai');
      if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const o = G.form(f); App.go('#/g/sesi?kelas=' + encodeURIComponent(o.id_kelas) + '&lokasi=' + encodeURIComponent(o.id_lokasi) + '&mulai=1'); });
    };
    API.load('guru.dashboard', {}, render, { maxAge: 20000, onError: (r) => { v.firstElementChild.innerHTML = UI.kosong('wifiOff', 'Data belum termuat', r.message); } });
    API.warmUp('admin');
  }, 'guru');

  // =================================================================
  // SESI & ABSENSI (radar GPS)
  // =================================================================
  function radarSVG(o) {
    const S = 260, c = S / 2, maksM = Math.max(o.radius * 1.6, (o.jarak || 0) * 1.2, 50), px = (m) => (m / maksM) * (c - 16);
    let titik = '';
    if (o.posisi) {
      const dx = (o.posisi.lng - o.lok.lng) * Math.cos(o.lok.lat * Math.PI / 180) * 111320, dy = (o.posisi.lat - o.lok.lat) * 110540;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001, r = Math.min(px(d), c - 12);
      const tx = c + (dx / d) * r, ty = c - (dy / d) * r, di = d <= o.radius;
      titik = '<circle cx="' + tx + '" cy="' + ty + '" r="' + Math.max(6, px(o.posisi.akurasi || 0)) + '" class="radar-akurasi ' + (di ? 'ok' : 'luar') + '"/><circle cx="' + tx + '" cy="' + ty + '" r="7" class="radar-guru ' + (di ? 'ok' : 'luar') + '"/>' +
        '<text x="' + tx + '" y="' + (ty - 14) + '" text-anchor="middle" class="radar-teks">Anda · ' + Math.round(d) + ' m</text>';
    }
    return '<svg class="radar" viewBox="0 0 ' + S + ' ' + S + '" role="img" aria-label="Radar lokasi: radius ' + o.radius + ' meter"><circle cx="' + c + '" cy="' + c + '" r="' + (c - 4) + '" class="radar-latar"/>' +
      [0.25, 0.5, 0.75, 1].map((f) => '<circle cx="' + c + '" cy="' + c + '" r="' + (c - 16) * f + '" class="radar-cincin"/>').join('') +
      '<line x1="' + c + '" y1="12" x2="' + c + '" y2="' + (S - 12) + '" class="radar-cincin"/><line x1="12" y1="' + c + '" x2="' + (S - 12) + '" y2="' + c + '" class="radar-cincin"/>' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + px(o.radius) + '" class="radar-pagar"/><g class="radar-sapu"><path d="M' + c + ' ' + c + ' L' + c + ' 16 A' + (c - 16) + ' ' + (c - 16) + ' 0 0 1 ' + (c + (c - 16) * Math.sin(Math.PI / 5)) + ' ' + (c - (c - 16) * Math.cos(Math.PI / 5)) + ' Z"/></g>' +
      '<circle cx="' + c + '" cy="' + c + '" r="9" class="radar-pusat"/><text x="' + c + '" y="' + (c + 26) + '" text-anchor="middle" class="radar-teks">' + esc(o.lok.nama_lokasi) + '</text>' + titik +
      '<text x="' + (c + px(o.radius) * 0.72) + '" y="' + (c - px(o.radius) * 0.72) + '" class="radar-teks radar-pagar-teks">' + o.radius + ' m</text></svg>';
  }
  G.radarSVG = radarSVG;

  App.rute('/g/sesi', async (p, q) => {
    App.judul('Sesi & Absensi', 'Verifikasi kehadiran berbasis GPS');
    const v = App.view();
    v.innerHTML = '<div class="konten-lebar"><div class="grid-sesi"><section class="kartu" id="ss-radar">' + UI.skeleton(1) + '</section><section class="kartu" id="ss-hadir">' + UI.skeleton(2, 'baris') + '</section></div><section class="kartu" id="ss-riwayat"></section></div>';
    const st = { kelas: [], lokasi: [], aktif: [], posisi: null, pilih: null, poll: null };
    const elR = document.getElementById('ss-radar'), elH = document.getElementById('ss-hadir');
    function lokTerpilih() { const id = (elR.querySelector('[name=id_lokasi]') || {}).value || q.lokasi; return st.lokasi.find((l) => l.id_lokasi === id) || st.lokasi[0]; }
    function renderRadar() {
      if (!st.lokasi.length) { elR.innerHTML = UI.kosong('pin', 'Belum ada lokasi belajar', 'Simpan titik lokasi kelas atau laboratorium terlebih dahulu.', '<a class="btn btn-primary" href="#/g/pengaturan?tab=lokasi">' + ikon('pin') + 'Atur lokasi</a>'); return; }
      const lok = lokTerpilih(), pos = st.posisi;
      const jarak = pos ? Math.round(haversine(pos.lat, pos.lng, lok.lat, lok.lng)) : null;
      const di = pos && jarak <= lok.radius_m, akurOk = pos && pos.akurasi <= lok.akurasi_maks_m;
      elR.innerHTML = '<div class="judul-seksi"><div><span class="label-caps">Radar GPS</span><h2>Buka sesi pembelajaran</h2></div>' + (pos ? UI.pill(di && akurOk ? 'ok' : 'danger', di ? (akurOk ? 'Di dalam radius' : 'Akurasi rendah') : 'Di luar radius') : '') + '</div>' +
        '<div class="radar-wadah">' + radarSVG({ lok, radius: lok.radius_m, posisi: pos, jarak }) + '</div>' +
        '<div class="telemetri"><div><span class="label-caps">Jarak dari titik</span><b class="mono">' + (pos ? jarak + ' m' : '–') + '</b></div><div><span class="label-caps">Radius izin</span><b class="mono">' + lok.radius_m + ' m</b></div><div><span class="label-caps">Akurasi GPS</span><b class="mono ' + (pos && !akurOk ? 'teks-bahaya' : '') + '">' + (pos ? '±' + pos.akurasi + ' m' : '–') + '</b></div></div>' +
        (pos && (!di || !akurOk) ? '<div class="alert alert-bahaya">' + ikon('alert') + '<span>' + (!di ? 'Anda berada ' + jarak + ' m dari ' + esc(lok.nama_lokasi) + '. Masuk ke dalam radius ' + lok.radius_m + ' m.' : 'Akurasi ±' + pos.akurasi + ' m melebihi batas ' + lok.akurasi_maks_m + ' m.') + ' Nyalakan GPS akurasi tinggi atau pindah ke area terbuka.</span></div>' : '') +
        '<form class="form" id="ss-form"><div class="grid-2"><label class="field"><span>Kelas</span><select name="id_kelas">' + G.opsiKelas(st.kelas, q.kelas) + '</select></label><label class="field"><span>Lokasi</span><select name="id_lokasi">' + st.lokasi.map((l) => '<option value="' + esc(l.id_lokasi) + '"' + (l.id_lokasi === lok.id_lokasi ? ' selected' : '') + '>' + esc(l.nama_lokasi) + '</option>').join('') + '</select></label></div>' +
        '<div class="grid-2-1"><label class="field"><span>Topik pertemuan</span><input name="topik" placeholder="cth. Dinamika Gerak Lurus" value="' + esc(q.topik || '') + '"></label><label class="field"><span>Durasi (menit)</span><input name="durasi_menit" type="number" min="10" max="300" value="' + esc((App.cfg && App.cfg.durasi_sesi_menit) || 90) + '"></label></div>' +
        '<div class="aksi-baris"><button type="button" class="btn btn-ghost" data-cek>' + ikon('pin') + 'Cek lokasi saya</button><button type="submit" class="btn btn-primary">' + ikon('radar') + 'Buka sesi absensi</button></div></form>';
      elR.querySelector('[name=id_lokasi]').addEventListener('change', () => { q.lokasi = elR.querySelector('[name=id_lokasi]').value; q.kelas = elR.querySelector('[name=id_kelas]').value; renderRadar(); });
      elR.querySelector('[data-cek]').addEventListener('click', (e) => UI.sibuk(e.currentTarget, bacaGPS, 'Membaca GPS…'));
      elR.querySelector('#ss-form').addEventListener('submit', (e) => { e.preventDefault(); UI.sibuk(e.submitter || elR.querySelector('[type=submit]'), buka, 'Memverifikasi…'); });
    }
    async function bacaGPS() {
      const f = elR.querySelector('#ss-form'); if (f) { q.kelas = f.id_kelas.value; q.topik = f.topik.value; }
      try { st.posisi = await UI.gps(); renderRadar(); return true; } catch (err) { UI.toast(err.message, 'error'); return false; }
    }
    async function buka() {
      const f = elR.querySelector('#ss-form'), o = G.form(f);
      q.kelas = o.id_kelas; q.topik = o.topik;
      if (!(await bacaGPS())) return;
      const r = await API.call('sesi.buka', Object.assign(o, { lat: st.posisi.lat, lng: st.posisi.lng, akurasi: st.posisi.akurasi }));
      if (r.success) { UI.toast(r.message, 'ok', { partikel: true }); st.pilih = r.data.id_sesi; muat(true); }
      else UI.toast(r.message, 'error', { ms: 7000 });
    }
    function renderHadir(d) {
      if (!st.aktif.length && !d) { elH.innerHTML = '<div class="judul-seksi"><h2>Daftar hadir</h2></div>' + UI.kosong('users', 'Belum ada sesi berjalan', 'Buka sesi di panel radar. Daftar hadir siswa akan diperbarui otomatis setiap 15 detik.'); return; }
      const ses = d ? d.sesi : null;
      const pilihan = st.aktif.length > 1 ? '<select data-pilih-sesi aria-label="Pilih sesi">' + st.aktif.map((s) => '<option value="' + esc(s.id_sesi) + '"' + (s.id_sesi === st.pilih ? ' selected' : '') + '>' + esc(s.nama_kelas) + ' · ' + esc(s.topik) + '</option>').join('') + '</select>' : '';
      if (!d) { elH.innerHTML = '<div class="judul-seksi"><h2>Daftar hadir</h2>' + pilihan + '</div>' + UI.skeleton(3, 'baris'); return; }
      const hadir = d.siswa.filter((s) => s.status === 'hadir').length, izin = d.siswa.filter((s) => s.status === 'izin' || s.status === 'sakit').length, belum = d.siswa.filter((s) => s.status === 'belum').length;
      elH.innerHTML = '<div class="judul-seksi"><div><span class="label-caps">' + (ses.status === 'buka' ? '<i class="denyut"></i>Langsung · diperbarui tiap 15 detik' : 'Sesi ditutup') + '</span><h2>' + esc(ses.nama_kelas) + ' · ' + esc(ses.topik) + '</h2></div>' + pilihan + '</div>' +
        '<div class="hadir-ringkas"><b class="mono angka-besar">' + hadir + '<small>/' + d.siswa.length + '</small></b><span>siswa hadir</span>' + (ses.status === 'buka' ? '<span class="chip">' + ikon('clock') + 'Tutup otomatis ' + esc(UI.tgl(ses.batas_tutup, 'jam')) + '</span>' : '') + '</div>' + UI.progres(d.siswa.length ? hadir / d.siswa.length * 100 : 0) +
        '<p class="legenda-hadir"><i class="lg lg-ok"></i>' + hadir + ' hadir <i class="lg lg-info"></i>' + izin + ' izin/sakit <i class="lg lg-netral"></i>' + belum + ' belum absen</p>' +
        '<div class="tabel-wadah"><table class="tabel tabel-rapat"><thead><tr><th>Nama</th><th>Waktu</th><th>Status</th></tr></thead><tbody>' + d.siswa.map((s) =>
          '<tr><td><b>' + esc(s.nama) + '</b><br><small class="mono teks-2">' + esc(s.nis) + '</small></td><td class="mono kecil">' + (s.waktu ? esc(UI.tgl(s.waktu, 'jam')) : '–') + '</td><td><select class="pilih-status st-' + esc(s.status) + '" data-siswa="' + esc(s.id_siswa) + '" aria-label="Status ' + esc(s.nama) + '">' +
          (s.status === 'belum' ? '<option value="">Belum absen</option>' : '') + ['hadir', 'izin', 'sakit', 'alfa'].map((x) => '<option value="' + x + '"' + (x === s.status ? ' selected' : '') + '>' + x.charAt(0).toUpperCase() + x.slice(1) + '</option>').join('') + '</select></td></tr>').join('') + '</tbody></table></div>' +
        (ses.status === 'buka' ? '<button class="btn btn-danger btn-penuh" data-tutup>' + ikon('lock') + 'Tutup sesi sekarang</button>' : '');
      const ps = elH.querySelector('[data-pilih-sesi]');
      if (ps) ps.addEventListener('change', () => { st.pilih = ps.value; muatHadir(true); });
      UI.$$('.pilih-status', elH).forEach((sel) => sel.addEventListener('change', async () => {
        if (!sel.value) return;
        const r = await API.call('absen.ubah', { id_sesi: ses.id_sesi, id_siswa: sel.dataset.siswa, status: sel.value });
        if (UI.hasil(r)) { sel.className = 'pilih-status st-' + sel.value; muatHadir(true); }
      }));
      const tb = elH.querySelector('[data-tutup]');
      if (tb) tb.addEventListener('click', async () => {
        if (!(await UI.konfirmasi('Siswa yang belum absen akan tercatat <b>alfa</b>. Anda masih bisa mengoreksinya nanti.', { ok: 'Tutup sesi', bahaya: true }))) return;
        const r = await API.call('sesi.tutup', { id_sesi: ses.id_sesi });
        if (UI.hasil(r)) muat(true);
      });
    }
    async function muatHadir(paksa) {
      if (!st.pilih) { renderHadir(null); return; }
      if (paksa) renderHadir(null);
      await API.load('sesi.hadir', { id_sesi: st.pilih }, renderHadir, { maxAge: 10000, force: !!paksa, batch: false });
    }
    async function muat(paksa) {
      const [a, k, l] = await Promise.all([API.load('sesi.aktif', {}, null, { force: !!paksa, maxAge: 10000 }), API.load('kelas.list', {}, null, { maxAge: 60000 }), API.load('lokasi.list', {}, null, { maxAge: 60000 })]);
      st.aktif = a.success ? a.data : []; st.kelas = k.success ? k.data : []; st.lokasi = l.success ? l.data : [];
      if (!st.pilih || !st.aktif.some((s) => s.id_sesi === st.pilih)) st.pilih = st.aktif[0] ? st.aktif[0].id_sesi : st.pilih;
      renderRadar();
      muatHadir(paksa);
      API.load('sesi.riwayat', {}, renderRiwayat, { maxAge: 30000, force: !!paksa });
    }
    function renderRiwayat(list) {
      const el = document.getElementById('ss-riwayat');
      el.innerHTML = '<div class="judul-seksi"><h2>Riwayat sesi</h2><span class="teks-2 kecil">40 sesi terakhir</span></div>' + (list.length ? '<div class="tabel-wadah"><table class="tabel"><thead><tr><th>Tanggal</th><th>Kelas</th><th>Topik</th><th>Lokasi · jarak guru</th><th>Hadir</th><th>Status</th><th></th></tr></thead><tbody>' + list.map((s) =>
        '<tr><td class="mono kecil">' + esc(UI.tgl(s.dibuka, 'lengkap')) + '</td><td>' + esc(s.nama_kelas) + '</td><td>' + esc(s.topik) + '</td><td>' + esc(s.nama_lokasi) + ' · <span class="mono">' + s.jarak_m + ' m</span></td><td class="mono">' + s.hadir + '/' + s.total + '</td><td>' + UI.pill(s.status) + '</td><td><button class="btn btn-tipis" data-lihat="' + esc(s.id_sesi) + '">Daftar hadir</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="teks-2">Belum ada sesi.</p>');
      UI.$$('[data-lihat]', el).forEach((b) => b.addEventListener('click', () => { st.pilih = b.dataset.lihat; muatHadir(true); elH.scrollIntoView({ behavior: 'smooth' }); }));
    }
    await muat(false);
    if (q.mulai === '1') { history.replaceState(null, '', '#/g/sesi'); setTimeout(() => { const b = elR.querySelector('#ss-form [type=submit]'); if (b) b.click(); }, 300); }
    st.poll = setInterval(() => { if (document.visibilityState === 'visible' && st.pilih && st.aktif.some((s) => s.id_sesi === st.pilih)) muatHadir(false); }, 15000);
    App.onLeave(() => clearInterval(st.poll));
  }, 'guru');

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000, r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  G.haversine = haversine;

  // =================================================================
  // KELAS & SISWA
  // =================================================================
  App.rute('/g/kelas', async (p, q) => {
    App.judul('Kelas & Siswa', 'Kelola kelas, akun siswa, dan pendaftaran');
    const v = App.view();
    const st = { kelas: [], siswa: [], pilih: q.kelas || '', cari: '', status: '', centang: {} };
    v.innerHTML = '<div class="konten-lebar"><div class="kelas-baris" id="kl-kelas">' + UI.skeleton(3, 'chip') + '</div><div id="kl-banner"></div>' +
      '<section class="kartu"><div class="toolbar"><div class="cari cari-terang"><span>' + ikon('search') + '</span><input id="kl-cari" placeholder="Cari nama atau NIS" aria-label="Cari siswa"></div>' +
      '<select id="kl-status" aria-label="Filter status"><option value="">Semua status</option><option value="aktif">Aktif</option><option value="menunggu">Menunggu</option><option value="nonaktif">Nonaktif</option></select>' +
      '<span class="toolbar-isi"></span><a class="btn btn-ghost" href="#/g/impor">' + ikon('upload') + 'Impor data</a><button class="btn btn-primary" data-tambah>' + ikon('plus') + 'Tambah siswa</button></div>' +
      '<div class="aksi-massal" id="kl-massal" hidden><span id="kl-jml"></span><button class="btn btn-tipis" data-massal="aktif">Aktifkan</button><button class="btn btn-tipis" data-massal="nonaktif">Nonaktifkan</button></div>' +
      '<div id="kl-tabel">' + UI.skeleton(5, 'baris') + '</div></section></div>';
    function renderKelas() {
      document.getElementById('kl-kelas').innerHTML = '<button class="kelas-kartu ' + (!st.pilih ? 'aktif' : '') + '" data-k=""><span class="label-caps">Semua</span><b>' + st.siswa.length + ' siswa</b></button>' +
        st.kelas.map((k) => '<button class="kelas-kartu ' + (st.pilih === k.id_kelas ? 'aktif' : '') + '" data-k="' + esc(k.id_kelas) + '"><span class="kk-atas"><b>' + esc(k.nama_kelas) + '</b><span class="btn-ikon btn-ikon-kecil" data-menu="' + esc(k.id_kelas) + '" role="button" aria-label="Menu kelas">' + ikon('more') + '</span></span>' +
          '<span class="kode-kelas"><span class="mono">' + esc(k.kode_kelas) + '</span><span class="btn-ikon btn-ikon-kecil" data-salin="' + esc(k.kode_kelas) + '" role="button" aria-label="Salin kode kelas">' + ikon('copy') + '</span></span><small>' + k.jumlah_siswa + ' siswa' + (k.menunggu ? ' · <em class="teks-warn">' + k.menunggu + ' menunggu</em>' : '') + '</small></button>').join('') +
        '<button class="kelas-kartu kelas-baru" data-kelas-baru>' + ikon('plus') + '<b>Kelas baru</b></button>';
      const menunggu = st.siswa.filter((s) => s.status === 'menunggu');
      App.badge('menunggu', menunggu.length);
      document.getElementById('kl-banner').innerHTML = menunggu.length ? '<div class="alert alert-warn">' + ikon('users') + '<span><b>' + menunggu.length + ' pendaftaran menunggu persetujuan.</b></span><button class="btn btn-tipis" data-tinjau>Tinjau</button></div>' : '';
    }
    function renderTabel() {
      const kata = st.cari.toLowerCase();
      const list = st.siswa.filter((s) => (!st.pilih || s.id_kelas === st.pilih) && (!st.status || s.status === st.status) && (!kata || (s.nama + ' ' + s.nis + ' ' + s.email).toLowerCase().indexOf(kata) > -1));
      const el = document.getElementById('kl-tabel');
      if (!list.length) { el.innerHTML = UI.kosong('users', st.siswa.length ? 'Tidak ada siswa yang cocok' : 'Belum ada siswa', st.siswa.length ? '' : 'Tambahkan siswa satu per satu, impor dari Excel/CSV, atau bagikan kode kelas agar siswa mendaftar sendiri.'); return; }
      el.innerHTML = '<div class="tabel-wadah"><table class="tabel tabel-responsif"><thead><tr><th><input type="checkbox" data-semua aria-label="Pilih semua"></th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Masuk terakhir</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' + list.map((s) =>
        '<tr><td><input type="checkbox" data-c="' + esc(s.id_user) + '"' + (st.centang[s.id_user] ? ' checked' : '') + ' aria-label="Pilih ' + esc(s.nama) + '"></td><td data-label="Nama"><a href="#/g/siswa/' + esc(s.id_user) + '" class="sel-nama">' + UI.avatar(s.nama, '', 'avatar-sm') + '<span><b>' + esc(s.nama) + '</b><small class="teks-2">' + esc(s.email || (s.metode_login.indexOf('google') > -1 ? 'Google' : 'Akun aplikasi')) + '</small></span></a></td>' +
        '<td data-label="NIS" class="mono">' + esc(s.nis) + '</td><td data-label="Kelas">' + esc(s.nama_kelas) + '</td><td data-label="Masuk" class="kecil">' + (s.login_terakhir ? esc(UI.relatif(s.login_terakhir)) : '<span class="teks-2">Belum pernah</span>') + (s.wajib_ganti_sandi ? '<br><small class="teks-warn">sandi awal</small>' : '') + '</td>' +
        '<td data-label="Status">' + UI.pill(s.status) + '</td><td data-label="Aksi" class="sel-aksi">' +
        (s.status === 'menunggu' ? '<button class="btn btn-tipis" data-setuju="' + esc(s.id_user) + '">' + ikon('check') + 'Setujui</button>' : '') +
        '<button class="btn-ikon" data-ubah="' + esc(s.id_user) + '" title="Ubah" aria-label="Ubah ' + esc(s.nama) + '">' + ikon('edit') + '</button><button class="btn-ikon" data-reset="' + esc(s.id_user) + '" title="Reset sandi" aria-label="Reset sandi ' + esc(s.nama) + '">' + ikon('key') + '</button>' +
        (s.status !== 'menunggu' ? '<button class="btn-ikon" data-toggle="' + esc(s.id_user) + '" title="' + (s.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '" aria-label="' + (s.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan') + '">' + ikon(s.status === 'aktif' ? 'lock' : 'checkCircle') + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
      perbaruiMassal();
    }
    function perbaruiMassal() { const n = Object.keys(st.centang).filter((k) => st.centang[k]).length; document.getElementById('kl-massal').hidden = !n; document.getElementById('kl-jml').textContent = n + ' dipilih'; }
    async function muat(paksa) {
      const [k, s] = await Promise.all([API.load('kelas.list', {}, null, { force: !!paksa, maxAge: 30000 }), API.load('siswa.list', {}, null, { force: !!paksa, maxAge: 30000 })]);
      st.kelas = k.success ? k.data : []; st.siswa = s.success ? s.data : [];
      renderKelas(); renderTabel();
    }
    function formSiswa(s) {
      s = s || {};
      UI.modal({ title: s.id_user ? 'Ubah data siswa' : 'Tambah siswa', body: '<form class="form"><label class="field"><span>Nama lengkap</span><input name="nama" value="' + esc(s.nama || '') + '" required></label><div class="grid-2"><label class="field"><span>NIS</span><input name="nis" class="mono" value="' + esc(s.nis || '') + '" required></label>' +
        '<label class="field"><span>Kelas</span><select name="id_kelas">' + G.opsiKelas(st.kelas, s.id_kelas || st.pilih) + '</select></label></div><label class="field"><span>Email Google <em>(opsional)</em></span><input name="email" type="email" value="' + esc(s.email || '') + '"><small>Untuk tombol "Masuk dengan Google".</small></label>' +
        (s.id_user ? '' : '<p class="catatan">' + ikon('info') + 'Sandi awal = NIS. Siswa wajib menggantinya saat pertama masuk.</p>') + '</form>',
        actions: [{ label: 'Batal' }, { label: 'Simpan', cls: 'btn-primary', icon: 'save', onClick: async (m) => {
          const o = G.form(m.el); o.id_user = s.id_user;
          await UI.sibuk(m.btn, async () => { const r = await API.call('siswa.simpan', o); if (UI.hasil(r)) { m.close(); muat(true); } }, 'Menyimpan…');
        } }] });
    }
    function formKelas(k) {
      k = k || {};
      UI.modal({ title: k.id_kelas ? 'Ubah kelas' : 'Kelas baru', body: '<form class="form"><label class="field"><span>Nama kelas</span><input name="nama_kelas" value="' + esc(k.nama_kelas || '') + '" placeholder="cth. XI MIPA 2" required></label><div class="grid-2"><label class="field"><span>Tingkat</span><input name="tingkat" value="' + esc(k.tingkat || '') + '" placeholder="X / XI / XII"></label>' +
        '<label class="field"><span>Tahun ajaran</span><input name="tahun_ajaran" value="' + esc(k.tahun_ajaran || (App.cfg && App.cfg.tahun_ajaran) || '') + '"></label></div>' + (k.id_kelas ? '<label class="cek"><input type="checkbox" name="kodeBaru" value="1"> Buat kode kelas baru (kode lama tidak berlaku lagi)</label>' : '') + '</form>',
        actions: [{ label: 'Batal' }, { label: 'Simpan', cls: 'btn-primary', icon: 'save', onClick: async (m) => {
          const o = G.form(m.el); o.id_kelas = k.id_kelas; o.kodeBaru = !!o.kodeBaru;
          await UI.sibuk(m.btn, async () => { const r = await API.call('kelas.simpan', o); if (UI.hasil(r)) { m.close(); muat(true); } });
        } }] });
    }
    function tinjau() {
      const pend = st.siswa.filter((s) => s.status === 'menunggu');
      UI.modal({ title: 'Pendaftaran menunggu', wide: true, body: pend.length ? '<p class="teks-2">Centang siswa yang dikenal, lalu setujui. Pendaftaran yang ditolak akan dihapus.</p><div class="daftar">' + pend.map((s) => '<label class="baris-daftar"><input type="checkbox" value="' + esc(s.id_user) + '" checked><span class="bd-isi"><b>' + esc(s.nama) + '</b><small class="mono">NIS ' + esc(s.nis) + ' · ' + esc(s.nama_kelas) + ' · ' + esc(UI.relatif(s.dibuat_pada)) + (s.email ? ' · ' + esc(s.email) : '') + '</small></span></label>').join('') + '</div>' : '<p>Tidak ada pendaftaran menunggu.</p>',
        actions: pend.length ? [{ label: 'Tolak', cls: 'btn-danger', onClick: (m) => kirimStatus(m, 'tolak') }, { label: 'Setujui', cls: 'btn-primary', icon: 'check', onClick: (m) => kirimStatus(m, 'aktif') }] : [] });
      async function kirimStatus(m, status) {
        const ids = UI.$$('input:checked', m.el).map((i) => i.value);
        if (!ids.length) return UI.toast('Pilih minimal satu siswa.', 'error');
        if (status === 'tolak' && !(await UI.konfirmasi('Tolak dan hapus ' + ids.length + ' pendaftaran?', { ok: 'Tolak', bahaya: true }))) return;
        const r = await API.call('siswa.status', { ids, status });
        if (UI.hasil(r)) { m.close(); muat(true); }
      }
    }
    v.addEventListener('click', async (e) => {
      const t = e.target;
      const salin = t.closest('[data-salin]');
      if (salin) { e.stopPropagation(); try { await navigator.clipboard.writeText(salin.dataset.salin); UI.toast('Kode kelas ' + salin.dataset.salin + ' disalin.'); } catch (x) { UI.toast('Kode: ' + salin.dataset.salin, 'info'); } return; }
      const menu = t.closest('[data-menu]');
      if (menu) {
        e.stopPropagation();
        const k = st.kelas.find((x) => x.id_kelas === menu.dataset.menu);
        UI.modal({ title: k.nama_kelas, sheet: true, body: '<div class="menu-grid"><button class="menu-item" data-a="ubah">' + ikon('edit') + '<span>Ubah kelas</span></button><button class="menu-item" data-a="arsip">' + ikon('database') + '<span>Arsipkan kelas</span></button><a class="menu-item" href="#/g/laporan?kelas=' + esc(k.id_kelas) + '">' + ikon('barChart') + '<span>Laporan kelas</span></a></div>',
          onOpen: (el, close) => el.addEventListener('click', async (ev) => {
            const b = ev.target.closest('[data-a]'); if (!b) return; close();
            if (b.dataset.a === 'ubah') formKelas(k);
            if (b.dataset.a === 'arsip' && await UI.konfirmasi('Arsipkan <b>' + esc(k.nama_kelas) + '</b>? Kelas disembunyikan, nilai dan data siswa tetap tersimpan.', { ok: 'Arsipkan' })) { const r = await API.call('kelas.arsip', { id_kelas: k.id_kelas, arsip: true }); if (UI.hasil(r)) muat(true); }
          }) });
        return;
      }
      const kk = t.closest('[data-k]');
      if (kk) { st.pilih = kk.dataset.k; st.centang = {}; renderKelas(); renderTabel(); return; }
      if (t.closest('[data-kelas-baru]')) return formKelas();
      if (t.closest('[data-tambah]')) return formSiswa();
      if (t.closest('[data-tinjau]')) return tinjau();
      const ubah = t.closest('[data-ubah]');
      if (ubah) return formSiswa(st.siswa.find((s) => s.id_user === ubah.dataset.ubah));
      const reset = t.closest('[data-reset]');
      if (reset) {
        const s = st.siswa.find((x) => x.id_user === reset.dataset.reset);
        if (!(await UI.konfirmasi('Buat sandi sementara untuk <b>' + esc(s.nama) + '</b>? Sesi lamanya akan dicabut.', { ok: 'Reset sandi' }))) return;
        const r = await API.call('siswa.resetSandi', { id_user: s.id_user });
        if (r.success) UI.modal({ title: 'Sandi sementara', body: '<p>Berikan sandi ini kepada <b>' + esc(r.data.nama) + '</b>. Sandi hanya tampil sekali dan wajib diganti saat masuk.</p><p class="sandi-tampil mono">' + esc(r.data.sandi) + '</p>', actions: [{ label: 'Salin', icon: 'copy', onClick: async (m) => { try { await navigator.clipboard.writeText(r.data.sandi); UI.toast('Disalin.'); } catch (x) { /* abaikan */ } m.close(); } }, { label: 'Selesai', cls: 'btn-primary' }] });
        else UI.toast(r.message, 'error');
        return;
      }
      const tg = t.closest('[data-toggle]');
      if (tg) {
        const s = st.siswa.find((x) => x.id_user === tg.dataset.toggle), baru = s.status === 'aktif' ? 'nonaktif' : 'aktif';
        if (baru === 'nonaktif' && !(await UI.konfirmasi('Nonaktifkan <b>' + esc(s.nama) + '</b>? Siswa langsung keluar dan tidak bisa masuk.', { ok: 'Nonaktifkan', bahaya: true }))) return;
        const r = await API.call('siswa.status', { ids: [s.id_user], status: baru });
        if (UI.hasil(r)) muat(true);
        return;
      }
      const setuju = t.closest('[data-setuju]');
      if (setuju) { const r = await API.call('siswa.status', { ids: [setuju.dataset.setuju], status: 'aktif' }); if (UI.hasil(r)) muat(true); return; }
      const massal = t.closest('[data-massal]');
      if (massal) {
        const ids = Object.keys(st.centang).filter((k) => st.centang[k]);
        const r = await API.call('siswa.status', { ids, status: massal.dataset.massal });
        if (UI.hasil(r)) { st.centang = {}; muat(true); }
      }
    });
    v.addEventListener('change', (e) => {
      if (e.target.matches('[data-c]')) { st.centang[e.target.dataset.c] = e.target.checked; perbaruiMassal(); }
      if (e.target.matches('[data-semua]')) { UI.$$('[data-c]', v).forEach((c) => { c.checked = e.target.checked; st.centang[c.dataset.c] = c.checked; }); perbaruiMassal(); }
      if (e.target.id === 'kl-status') { st.status = e.target.value; renderTabel(); }
    });
    document.getElementById('kl-cari').addEventListener('input', UI.debounce((e) => { st.cari = e.target.value.trim(); renderTabel(); }, 200));
    if (q.menunggu) { st.status = ''; }
    await muat(false);
    if (q.menunggu && st.siswa.some((s) => s.status === 'menunggu')) tinjau();
  }, 'guru');

  // =================================================================
  // IMPOR DATA (aman diulang, pindai dulu)
  // =================================================================
  App.rute('/g/impor', async () => {
    App.judul('Impor Data Siswa', 'Dari Excel/CSV atau spreadsheet lama — aman diulang');
    const v = App.view();
    const st = { sumber: 'baris', baris: null, namaBerkas: '', kelas: [] };
    v.innerHTML = '<div class="konten-lebar"><a class="tautan" href="#/g/kelas">' + ikon('left') + 'Kembali ke Kelas & Siswa</a>' +
      '<div class="grid-2-1"><section class="kartu"><h2>1 · Pilih sumber data</h2>' + UI.segmen('sumber', [['baris', 'Berkas Excel / CSV'], ['spreadsheet', 'Spreadsheet lama (Google Sheets)']], 'baris') +
      '<div id="im-sumber"></div>' +
      '<h2>2 · Atur import</h2><form class="form" id="im-opsi"><label class="field"><span>Kelas tujuan untuk baris tanpa kolom Kelas</span><select name="id_kelas_default" id="im-kelas"><option value="">— pilih bila perlu —</option></select><small>Kelas yang belum ada akan dibuat otomatis dari kolom Kelas.</small></label>' +
      '<label class="cek"><input type="checkbox" name="timpa" value="1"> Perbarui nama, email, dan kelas siswa yang NIS-nya sudah ada <em>(status & sandi tidak pernah diubah)</em></label></form>' +
      '<div class="aksi-baris"><button class="btn btn-ghost" data-pindai>' + ikon('search') + 'Pindai (tanpa menyimpan)</button><button class="btn btn-primary" data-jalan disabled>' + ikon('upload') + 'Jalankan import</button></div></section>' +
      '<aside class="kartu kartu-info"><h3>' + ikon('shield') + 'Aman diulang</h3><ul class="daftar-cek"><li>Sumber hanya <b>dibaca</b>, tidak pernah diubah.</li><li>Kunci pencocokan: <b>NIS</b>. Import kedua kali tidak membuat data dobel.</li><li>Pindai dulu untuk melihat jumlah yang akan ditambah, diperbarui, dan dilewati.</li><li>Sandi awal siswa baru = NIS (wajib diganti saat masuk).</li></ul>' +
      '<button class="btn btn-tipis" data-templat>' + ikon('download') + 'Unduh templat CSV</button></aside></div>' +
      '<section class="kartu" id="im-hasil" hidden></section></div>';
    const elS = document.getElementById('im-sumber');
    function renderSumber() {
      elS.innerHTML = st.sumber === 'baris'
        ? G.dropzone('im', 'Pilih berkas .xlsx atau .csv', '.csv,.xlsx,.xls') + '<p class="kecil teks-2">Judul kolom yang dikenali: <b>NIS</b>, <b>Nama</b>, Email, Kelas (huruf besar/kecil bebas).</p>'
        : '<label class="field"><span>URL atau ID spreadsheet lama</span><input id="im-url" placeholder="https://docs.google.com/spreadsheets/d/…"><small>Spreadsheet harus dimiliki atau dibagikan ke akun Google pemilik aplikasi. Hanya dibaca.</small></label><label class="field"><span>Nama sheet <em>(opsional)</em></span><input id="im-sheet" placeholder="Otomatis mencari sheet dengan kolom NIS"></label>';
      if (st.sumber === 'baris') G.pasangDropzone(elS, 'im', async (f) => {
        try { st.baris = await UI.bacaTabel(f); st.namaBerkas = f.name; UI.toast(st.baris.length + ' baris terbaca dari ' + f.name + '.', 'info'); document.querySelector('[data-jalan]').disabled = true; }
        catch (e) { UI.toast(e.message, 'error'); }
      });
    }
    UI.pasangSegmen(v, 'sumber', (x) => { st.sumber = x; renderSumber(); document.querySelector('[data-jalan]').disabled = true; });
    renderSumber();
    G.muatKelas((k) => { st.kelas = k; document.getElementById('im-kelas').innerHTML = '<option value="">— pilih bila perlu —</option>' + G.opsiKelas(k); });
    function payload() {
      const o = G.form(document.getElementById('im-opsi'));
      const d = { sumber: st.sumber, id_kelas_default: o.id_kelas_default, timpa: !!o.timpa };
      if (st.sumber === 'baris') { d.baris = st.baris; d.namaBerkas = st.namaBerkas; } else { d.spreadsheet = document.getElementById('im-url').value.trim(); d.sheet = document.getElementById('im-sheet').value.trim(); }
      return d;
    }
    function renderHasil(r) {
      const el = document.getElementById('im-hasil'); el.hidden = false;
      const rep = r.report;
      el.innerHTML = '<div class="judul-seksi"><div><span class="label-caps">' + (r.dryRun ? 'Hasil pindai · belum ada yang disimpan' : 'Import selesai') + '</span><h2>' + esc(r.sumber) + '</h2></div>' + (r.dryRun ? UI.pill('info', 'Dry-run') : UI.pill('ok', 'Tersimpan')) + '</div>' +
        '<div class="tabel-wadah"><table class="tabel"><thead><tr><th>Data</th><th>Di sumber</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th></tr></thead><tbody>' +
        ['Siswa', 'Kelas'].map((k) => '<tr><td><b>' + k + '</b></td><td class="mono">' + rep[k].sumber + '</td><td class="mono teks-ok">+' + rep[k].ditambah + '</td><td class="mono">' + rep[k].diperbarui + '</td><td class="mono teks-2">' + rep[k].dilewati + '</td></tr>').join('') + '</tbody></table></div>' +
        (r.peta ? '<p class="kecil teks-2">Kolom terbaca: ' + Object.keys(r.peta).map((k) => '<b>' + k + '</b> ← “' + esc(r.peta[k]) + '”').join(' · ') + '</p>' : '') +
        (r.warnings.length ? '<details class="peringatan" open><summary>' + ikon('alert') + r.jumlahPeringatan + ' peringatan</summary><ul>' + r.warnings.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul></details>' : '<p class="teks-ok">' + ikon('checkCircle') + 'Tidak ada peringatan.</p>');
    }
    v.querySelector('[data-pindai]').addEventListener('click', (e) => UI.sibuk(e.currentTarget, async () => {
      const d = payload();
      if (d.sumber === 'baris' && !(d.baris && d.baris.length)) return UI.toast('Pilih berkas terlebih dahulu.', 'error');
      if (d.sumber === 'spreadsheet' && !d.spreadsheet) return UI.toast('Tempel URL spreadsheet.', 'error');
      const r = await API.call('import.pindai', d, { timeout: 120000 });
      if (!r.success) return UI.toast(r.message, 'error');
      renderHasil(r.data);
      document.querySelector('[data-jalan]').disabled = !(r.data.report.Siswa.ditambah || r.data.report.Siswa.diperbarui || r.data.report.Kelas.ditambah);
    }, 'Memindai…'));
    v.querySelector('[data-jalan]').addEventListener('click', async (e) => {
      if (!(await UI.konfirmasi('Jalankan import sekarang? Data yang sudah ada tidak akan dihapus.', { ok: 'Jalankan import' }))) return;
      UI.sibuk(e.currentTarget, async () => {
        const r = await API.call('import.jalankan', payload(), { timeout: 300000, retry: 0 });
        if (UI.hasil(r)) { renderHasil(r.data); e.currentTarget.disabled = true; }
      }, 'Mengimpor…');
    });
    v.querySelector('[data-templat]').addEventListener('click', () => UI.unduhCSV('templat-siswa-physicslearn.csv', [['NIS', 'Nama', 'Email', 'Kelas'], ['2024001', 'Aisyah Putri', 'aisyah@gmail.com', 'XI MIPA 2'], ['2024002', 'Bima Arya', '', 'XI MIPA 2']]));
  }, 'guru');

  // =================================================================
  // KELOLA MATERI
  // =================================================================
  const TIPE_MATERI = [['pdf', 'PDF'], ['word', 'Word'], ['gambar', 'Gambar'], ['video', 'Video'], ['tautan', 'Tautan'], ['simulasi', 'Simulasi']];
  const ACCEPT = { pdf: '.pdf', word: '.doc,.docx', gambar: 'image/png,image/jpeg,image/webp,image/gif', video: 'video/mp4,video/webm,video/quicktime' };
  App.rute('/g/materi', async (p, q) => {
    App.judul('Materi', 'Bahan ajar per topik fisika');
    const v = App.view();
    const st = { kelas: [], materi: [], fKelas: q.kelas || '', fTopik: '', cari: '' };
    v.innerHTML = '<div class="konten-lebar"><section class="kartu"><div class="toolbar"><div class="cari cari-terang"><span>' + ikon('search') + '</span><input id="gm-cari" placeholder="Cari judul materi" aria-label="Cari materi"></div>' +
      '<select id="gm-kelas" aria-label="Filter kelas"><option value="">Semua kelas</option></select><select id="gm-topik" aria-label="Filter topik">' + G.opsiTopik('', 'Semua topik') + '</select><span class="toolbar-isi"></span><button class="btn btn-primary" data-baru>' + ikon('plus') + 'Materi baru</button></div><div id="gm-isi">' + UI.skeleton(4, 'baris') + '</div></section></div>';
    function render() {
      const kata = st.cari.toLowerCase();
      const list = st.materi.filter((m) => (!st.fKelas || m.id_kelas === st.fKelas || m.id_kelas === 'semua') && (!st.fTopik || m.topik === st.fTopik) && (!kata || m.judul.toLowerCase().indexOf(kata) > -1));
      const el = document.getElementById('gm-isi');
      if (!list.length) { el.innerHTML = UI.kosong('book', st.materi.length ? 'Tidak ada materi yang cocok' : 'Belum ada materi', st.materi.length ? '' : 'Unggah PDF, Word, gambar, video, atau tempel tautan YouTube/simulasi PhET.', '<button class="btn btn-primary" data-baru>' + ikon('plus') + 'Materi baru</button>'); return; }
      const grup = {};
      list.forEach((m) => { (grup[m.topik] = grup[m.topik] || []).push(m); });
      el.innerHTML = Object.keys(grup).map((t) => '<div class="grup-topik"><h3 class="sub-judul">' + ikonTopik(t) + esc(t) + ' <span class="teks-2">(' + grup[t].length + ')</span></h3><div class="daftar">' + grup[t].map((m, i) =>
        '<div class="baris-materi"><div class="urut-tombol"><button class="btn-ikon btn-ikon-kecil" data-naik="' + esc(m.id_materi) + '" aria-label="Naikkan"' + (i === 0 ? ' disabled' : '') + '>' + ikon('arrowUp') + '</button><button class="btn-ikon btn-ikon-kecil" data-turun="' + esc(m.id_materi) + '" aria-label="Turunkan"' + (i === grup[t].length - 1 ? ' disabled' : '') + '>' + ikon('arrowDown') + '</button></div>' +
        '<span class="ikon-bulat">' + ikon({ pdf: 'fileText', word: 'fileText', gambar: 'image', video: 'video', tautan: 'link', simulasi: 'flask' }[m.tipe]) + '</span>' +
        '<span class="bd-isi"><b>' + esc(m.judul) + '</b><small>' + esc(m.nama_kelas) + ' · ' + m.tipe.toUpperCase() + (m.nama_file ? ' · ' + esc(m.nama_file) : '') + '</small></span>' +
        '<span class="bm-progres" title="Siswa yang menandai selesai"><span class="mono kecil">' + m.jumlah_selesai + '/' + m.jumlah_siswa + '</span>' + UI.progres(m.jumlah_siswa ? m.jumlah_selesai / m.jumlah_siswa * 100 : 0, 'bar-tipis') + '</span>' +
        UI.pill(m.status_terbit) + '<span class="sel-aksi"><button class="btn-ikon" data-ubah="' + esc(m.id_materi) + '" aria-label="Ubah">' + ikon('edit') + '</button><button class="btn-ikon" data-hapus="' + esc(m.id_materi) + '" aria-label="Hapus">' + ikon('trash') + '</button></span></div>').join('') + '</div></div>').join('');
    }
    async function muat(paksa) {
      const [k, m] = await Promise.all([API.load('kelas.list', {}, null, { maxAge: 60000 }), API.load('materi.list', {}, null, { force: !!paksa, maxAge: 20000 })]);
      st.kelas = k.success ? k.data : []; st.materi = m.success ? m.data : [];
      document.getElementById('gm-kelas').innerHTML = '<option value="">Semua kelas</option>' + G.opsiKelas(st.kelas, st.fKelas);
      render();
    }
    function form(m) {
      m = m || { tipe: 'pdf', status_terbit: 'draf', id_kelas: st.fKelas || (st.kelas[0] && st.kelas[0].id_kelas), topik: st.fTopik || 'Mekanika' };
      let berkas = null, thumb = null, tipe = m.tipe;
      UI.modal({ title: m.id_materi ? 'Ubah materi' : 'Materi baru', wide: true, body: '<form class="form"><label class="field"><span>Judul materi</span><input name="judul" value="' + esc(m.judul || '') + '" required></label>' +
        '<div class="grid-2"><label class="field"><span>Kelas tujuan</span><select name="id_kelas"><option value="semua"' + (m.id_kelas === 'semua' ? ' selected' : '') + '>Semua kelas</option>' + G.opsiKelas(st.kelas, m.id_kelas) + '</select></label><label class="field"><span>Topik</span><select name="topik">' + G.opsiTopik(m.topik) + '</select></label></div>' +
        '<div class="field"><span>Tipe materi</span>' + UI.segmen('tipe', TIPE_MATERI, tipe) + '</div><div id="mf-sumber"></div>' +
        '<label class="field"><span>Thumbnail <em>(opsional)</em></span><input type="file" accept="image/*" name="thumb_file"><small>Bila kosong, thumbnail diambil otomatis dari Drive/YouTube.</small></label>' +
        '<div class="grid-2 grid-atas"><label class="field"><span>Deskripsi & rumus</span><textarea id="mf-desk" name="deskripsi" rows="7" placeholder="Ringkasan materi. Rumus: $$F = m a$$">' + esc(m.deskripsi || '') + '</textarea>' + G.rumusBantu('mf-desk') + '</label>' +
        '<div class="field"><span>Pratinjau</span><div class="prosa pratinjau" id="mf-pv"></div></div></div><div class="unggah-progres" hidden>' + UI.progres(0) + '<span class="mono kecil">0%</span></div></form>',
        actions: [{ label: 'Batal' }, { label: 'Simpan draf', cls: 'btn-ghost', icon: 'save', onClick: (x) => simpan(x, 'draf') }, { label: 'Terbitkan', cls: 'btn-primary', icon: 'send', onClick: (x) => simpan(x, 'terbit') }],
        onOpen: (el) => {
          const sumber = () => {
            const butuhFile = ACCEPT[tipe], butuhUrl = tipe === 'tautan' || tipe === 'simulasi' || tipe === 'video';
            el.querySelector('#mf-sumber').innerHTML = (butuhFile ? G.dropzone('mf', m.nama_file && m.tipe === tipe ? 'Ganti berkas (' + m.nama_file + ')' : 'Unggah berkas ' + tipe.toUpperCase(), ACCEPT[tipe]) : '') +
              (butuhUrl ? '<label class="field"><span>' + (tipe === 'video' ? 'Atau tempel tautan YouTube/Drive' : tipe === 'simulasi' ? 'Alamat simulasi (mis. PhET HTML5)' : 'Alamat tautan') + '</span><input name="url" type="url" value="' + esc(m.url || '') + '" placeholder="https://"></label>' : '') +
              (tipe === 'video' ? '<p class="catatan">' + ikon('info') + 'Video panjang sebaiknya diunggah ke YouTube (tidak publik) lalu tempel tautannya. Unggahan langsung dibatasi ' + ((App.cfg && App.cfg.ukuran_maks_video_mb) || 25) + ' MB.</p>' : '');
            if (butuhFile) G.pasangDropzone(el, 'mf', async (f) => { berkas = await UI.bacaBerkas(f); });
          };
          sumber();
          UI.pasangSegmen(el, 'tipe', (x) => { tipe = x; berkas = null; sumber(); });
          G.pasangRumus(el, 'mf-desk', 'mf-pv');
          el.querySelector('[name=thumb_file]').addEventListener('change', async (e) => { if (e.target.files[0]) thumb = await UI.kompresGambar(e.target.files[0], 800, 0.85); });
        } });
      async function simpan(x, status) {
        const o = G.form(x.el);
        delete o.thumb_file;
        o.id_materi = m.id_materi; o.tipe = tipe; o.status_terbit = status;
        if (berkas) {
          const maks = (tipe === 'video' ? Number((App.cfg && App.cfg.ukuran_maks_video_mb) || 25) : Number((App.cfg && App.cfg.ukuran_maks_dokumen_mb) || 10)) * 1048576;
          if (berkas.ukuran > maks) return UI.toast('Berkas melebihi ' + Math.round(maks / 1048576) + ' MB.', 'error');
          o.berkas = { nama: berkas.nama, tipe: berkas.tipe, base64: berkas.base64 };
        }
        if (thumb) o.thumbnail = { nama: thumb.nama, tipe: thumb.tipe, base64: thumb.base64 };
        const prog = x.el.querySelector('.unggah-progres');
        await UI.sibuk(x.btn, async () => {
          const r = o.berkas || o.thumbnail ? (prog.hidden = false, await API.upload('materi.simpan', o, (pct) => { prog.querySelector('.bar span').style.width = pct + '%'; prog.querySelector('span.mono').textContent = pct + '%'; })) : await API.call('materi.simpan', o);
          if (UI.hasil(r)) { x.close(); muat(true); } else prog.hidden = true;
        }, status === 'terbit' ? 'Menerbitkan…' : 'Menyimpan…');
      }
    }
    async function geser(id, arah) {
      const m = st.materi.find((x) => x.id_materi === id);
      const sekelompok = st.materi.filter((x) => x.topik === m.topik && x.id_kelas === m.id_kelas);
      const i = sekelompok.indexOf(m), j = i + arah;
      if (j < 0 || j >= sekelompok.length) return;
      sekelompok.splice(i, 1); sekelompok.splice(j, 0, m);
      const semuaKelas = st.materi.filter((x) => x.id_kelas === m.id_kelas).sort((a, b) => App.TOPIK.indexOf(a.topik) - App.TOPIK.indexOf(b.topik) || (a.topik === m.topik ? sekelompok.indexOf(a) - sekelompok.indexOf(b) : a.urutan - b.urutan));
      const r = await API.call('materi.urut', { ids: semuaKelas.map((x) => x.id_materi) });
      if (r.success) muat(true); else UI.toast(r.message, 'error');
    }
    v.addEventListener('click', async (e) => {
      if (e.target.closest('[data-baru]')) return form();
      const u = e.target.closest('[data-ubah]'); if (u) return form(st.materi.find((m) => m.id_materi === u.dataset.ubah));
      const n = e.target.closest('[data-naik]'); if (n) return geser(n.dataset.naik, -1);
      const t = e.target.closest('[data-turun]'); if (t) return geser(t.dataset.turun, 1);
      const h = e.target.closest('[data-hapus]');
      if (h) {
        const m = st.materi.find((x) => x.id_materi === h.dataset.hapus);
        if (!(await UI.konfirmasi('Hapus materi <b>' + esc(m.judul) + '</b>? Berkasnya dipindah ke folder arsip di Drive.', { ok: 'Hapus', bahaya: true }))) return;
        const r = await API.call('materi.hapus', { id_materi: m.id_materi });
        if (UI.hasil(r)) muat(true);
      }
    });
    document.getElementById('gm-cari').addEventListener('input', UI.debounce((e) => { st.cari = e.target.value.trim(); render(); }, 200));
    document.getElementById('gm-kelas').addEventListener('change', (e) => { st.fKelas = e.target.value; render(); });
    document.getElementById('gm-topik').addEventListener('change', (e) => { st.fTopik = e.target.value; render(); });
    muat(false);
  }, 'guru');

  // =================================================================
  // TUGAS & PENILAIAN
  // =================================================================
  App.rute('/g/tugas', async () => {
    App.judul('Tugas & Penilaian', 'LKPD, pengumpulan, dan nilai');
    const v = App.view();
    const st = { kelas: [], tugas: [], fKelas: '' };
    v.innerHTML = '<div class="konten-lebar"><section class="kartu"><div class="toolbar"><select id="gt-kelas" aria-label="Filter kelas"><option value="">Semua kelas</option></select><span class="toolbar-isi"></span><button class="btn btn-primary" data-baru>' + ikon('plus') + 'Tugas baru</button></div><div id="gt-isi">' + UI.skeleton(4, 'baris') + '</div></section></div>';
    function render() {
      const list = st.tugas.filter((t) => !st.fKelas || t.id_kelas === st.fKelas);
      App.badge('#/g/tugas', st.tugas.reduce((a, t) => a + t.belum_dinilai, 0));
      document.getElementById('gt-isi').innerHTML = list.length ? '<div class="tabel-wadah"><table class="tabel tabel-responsif"><thead><tr><th>Tugas</th><th>Kelas</th><th>Tenggat</th><th>Terkumpul</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' + list.map((t) => {
        const lewat = new Date(t.tenggat).getTime() < Date.now();
        return '<tr><td data-label="Tugas"><b>' + esc(t.judul) + '</b>' + (t.belum_dinilai ? ' <span class="pill pill-warn">' + t.belum_dinilai + ' belum dinilai</span>' : '') + '<br><small class="teks-2">' + esc(t.topik || '') + ' · nilai maks ' + t.nilai_maks + '</small></td>' +
          '<td data-label="Kelas">' + esc(t.nama_kelas) + '</td><td data-label="Tenggat" class="mono kecil ' + (lewat ? 'teks-2' : '') + '">' + esc(UI.tgl(t.tenggat, 'lengkap')) + '</td>' +
          '<td data-label="Terkumpul"><span class="mono kecil">' + t.terkumpul + '/' + t.jumlah_siswa + '</span>' + UI.progres(t.jumlah_siswa ? t.terkumpul / t.jumlah_siswa * 100 : 0, 'bar-tipis') + '</td><td data-label="Status">' + UI.pill(t.status) + '</td>' +
          '<td data-label="Aksi" class="sel-aksi"><a class="btn btn-tipis" href="#/g/tugas/' + esc(t.id_tugas) + '">' + ikon('eye') + 'Periksa</a><button class="btn-ikon" data-ubah="' + esc(t.id_tugas) + '" aria-label="Ubah">' + ikon('edit') + '</button><button class="btn-ikon" data-hapus="' + esc(t.id_tugas) + '" aria-label="Hapus">' + ikon('trash') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' : UI.kosong('clipboard', 'Belum ada tugas', 'Buat LKPD atau tugas, lalu terbitkan agar siswa mendapat pengingat.', '<button class="btn btn-primary" data-baru>' + ikon('plus') + 'Tugas baru</button>');
    }
    async function muat(paksa) {
      const [k, t] = await Promise.all([API.load('kelas.list', {}, null, { maxAge: 60000 }), API.load('tugas.list', {}, null, { force: !!paksa, maxAge: 15000 })]);
      st.kelas = k.success ? k.data : []; st.tugas = t.success ? t.data : [];
      document.getElementById('gt-kelas').innerHTML = '<option value="">Semua kelas</option>' + G.opsiKelas(st.kelas, st.fKelas);
      render();
    }
    function form(t) {
      const def = new Date(Date.now() + 3 * 86400000); def.setHours(23, 59, 0, 0);
      t = t || { tipe_file_diizinkan: ['pdf', 'gambar', 'word'], nilai_maks: 100, ukuran_maks_mb: 10, izinkan_terlambat: true, tenggat: def.toISOString(), id_kelas: st.fKelas || (st.kelas[0] && st.kelas[0].id_kelas) };
      let lampiran = null;
      UI.modal({ title: t.id_tugas ? 'Ubah tugas' : 'Tugas baru', wide: true, body: '<form class="form"><label class="field"><span>Judul tugas / LKPD</span><input name="judul" value="' + esc(t.judul || '') + '" required></label>' +
        '<div class="grid-3"><label class="field"><span>Kelas</span><select name="id_kelas">' + G.opsiKelas(st.kelas, t.id_kelas) + '</select></label><label class="field"><span>Topik</span><select name="topik">' + G.opsiTopik(t.topik, '— tanpa topik —') + '</select></label><label class="field"><span>Tenggat</span><input type="datetime-local" name="tenggat" value="' + esc(UI.isoLokal(t.tenggat)) + '" required></label></div>' +
        '<label class="field"><span>Instruksi</span><textarea name="instruksi" id="tf-ins" rows="5">' + esc(t.instruksi || '') + '</textarea>' + G.rumusBantu('tf-ins') + '</label>' +
        G.dropzone('tf', t.lampiran_nama ? 'Ganti lampiran (' + t.lampiran_nama + ')' : 'Lampiran LKPD (opsional)', '.pdf,.doc,.docx,image/*,video/mp4') +
        '<div class="grid-3"><div class="field"><span>Jenis berkas jawaban</span><div class="cek-baris">' + [['pdf', 'PDF'], ['gambar', 'Gambar'], ['word', 'Word'], ['video', 'Video']].map((j) => '<label class="cek"><input type="checkbox" name="tipe_' + j[0] + '" value="1"' + (t.tipe_file_diizinkan.indexOf(j[0]) > -1 ? ' checked' : '') + '>' + j[1] + '</label>').join('') + '</div></div>' +
        '<label class="field"><span>Nilai maksimal</span><input type="number" name="nilai_maks" min="1" max="1000" value="' + t.nilai_maks + '"></label><label class="field"><span>Ukuran maks (MB)</span><input type="number" name="ukuran_maks_mb" min="1" max="25" value="' + t.ukuran_maks_mb + '"></label></div>' +
        '<label class="cek"><input type="checkbox" name="izinkan_terlambat" value="1"' + (t.izinkan_terlambat ? ' checked' : '') + '> Terima pengumpulan setelah tenggat (ditandai terlambat)</label>' + (t.lampiran_nama ? '<label class="cek"><input type="checkbox" name="hapusLampiran" value="1"> Hapus lampiran lama</label>' : '') +
        '<div class="unggah-progres" hidden>' + UI.progres(0) + '<span class="mono kecil">0%</span></div></form>',
        actions: [{ label: 'Batal' }, { label: 'Simpan draf', icon: 'save', onClick: (x) => simpan(x, 'draf') }, { label: 'Terbitkan', cls: 'btn-primary', icon: 'send', onClick: (x) => simpan(x, 'terbit') }],
        onOpen: (el) => { G.pasangDropzone(el, 'tf', async (f) => { lampiran = await UI.bacaBerkas(f); }); G.pasangRumus(el, 'tf-ins'); } });
      async function simpan(x, status) {
        const o = G.form(x.el);
        const d = { id_tugas: t.id_tugas, judul: o.judul, id_kelas: o.id_kelas, topik: o.topik, instruksi: o.instruksi, tenggat: o.tenggat ? new Date(o.tenggat).toISOString() : '', nilai_maks: o.nilai_maks, ukuran_maks_mb: o.ukuran_maks_mb,
          izinkan_terlambat: !!o.izinkan_terlambat, hapusLampiran: !!o.hapusLampiran, status, tipe_file_diizinkan: ['pdf', 'gambar', 'word', 'video'].filter((j) => o['tipe_' + j]) };
        if (lampiran) d.berkas = { nama: lampiran.nama, tipe: lampiran.tipe, base64: lampiran.base64 };
        const prog = x.el.querySelector('.unggah-progres');
        await UI.sibuk(x.btn, async () => {
          const r = d.berkas ? (prog.hidden = false, await API.upload('tugas.simpan', d, (pct) => { prog.querySelector('.bar span').style.width = pct + '%'; prog.querySelector('span.mono').textContent = pct + '%'; })) : await API.call('tugas.simpan', d);
          if (UI.hasil(r)) { x.close(); muat(true); } else prog.hidden = true;
        });
      }
    }
    v.addEventListener('click', async (e) => {
      if (e.target.closest('[data-baru]')) return form();
      const u = e.target.closest('[data-ubah]'); if (u) return form(st.tugas.find((t) => t.id_tugas === u.dataset.ubah));
      const h = e.target.closest('[data-hapus]');
      if (h) {
        const t = st.tugas.find((x) => x.id_tugas === h.dataset.hapus);
        const el = await UI.konfirmasi('Hapus tugas <b>' + esc(t.judul) + '</b>?', { ok: 'Hapus', bahaya: true, extra: t.terkumpul ? '<label class="cek"><input type="checkbox" data-paksa> Hapus beserta ' + t.terkumpul + ' pengumpulan dan nilainya</label>' : '' });
        if (!el) return;
        const paksa = el !== true && el.querySelector('[data-paksa]') && el.querySelector('[data-paksa]').checked;
        const r = await API.call('tugas.hapus', { id_tugas: t.id_tugas, paksa });
        if (UI.hasil(r)) muat(true);
      }
    });
    document.getElementById('gt-kelas').addEventListener('change', (e) => { st.fKelas = e.target.value; render(); });
    muat(false);
  }, 'guru');

  App.rute('/g/tugas/:id', async (p, q) => {
    App.judul('Periksa Pengumpulan', 'Pratinjau jawaban & beri nilai');
    const v = App.view();
    const st = { data: null, pilih: null, filter: 'semua' };
    v.innerHTML = '<div class="konten-lebar"><a class="tautan" href="#/g/tugas">' + ikon('left') + 'Semua tugas</a><div id="pk">' + UI.skeleton(3) + '</div></div>';
    const el = document.getElementById('pk');
    function urutan() { return st.data.siswa.filter((s) => st.filter === 'semua' || (st.filter === 'perlu' && s.pengumpulan && s.pengumpulan.status === 'dikumpulkan') || (st.filter === 'dinilai' && s.status === 'dinilai') || (st.filter === 'belum' && !s.pengumpulan)); }
    function render() {
      const d = st.data, t = d.tugas, list = urutan();
      const perlu = d.siswa.filter((s) => s.pengumpulan && s.pengumpulan.status === 'dikumpulkan').length;
      if (!st.pilih) { const x = (q.k && d.siswa.find((s) => s.pengumpulan && s.pengumpulan.id_pengumpulan === q.k)) || d.siswa.find((s) => s.pengumpulan && s.pengumpulan.status === 'dikumpulkan') || d.siswa.find((s) => s.pengumpulan); st.pilih = x ? x.id_siswa : null; }
      const s = d.siswa.find((x) => x.id_siswa === st.pilih), k = s && s.pengumpulan;
      el.innerHTML = '<div class="judul-seksi"><div><span class="label-caps">' + esc(t.nama_kelas) + ' · tenggat ' + esc(UI.tgl(t.tenggat, 'lengkap')) + '</span><h1 class="judul-halaman">' + esc(t.judul) + '</h1></div><span class="chip">' + d.siswa.filter((x) => x.pengumpulan).length + '/' + d.siswa.length + ' terkumpul · ' + perlu + ' perlu dinilai</span></div>' +
        '<div class="grid-periksa"><aside class="kartu daftar-periksa">' + UI.segmen('f', [['semua', 'Semua'], ['perlu', 'Perlu nilai', perlu], ['dinilai', 'Dinilai'], ['belum', 'Belum']], st.filter) + '<div class="daftar">' +
        (list.map((x) => '<button class="baris-daftar ' + (x.id_siswa === st.pilih ? 'terpilih' : '') + '" data-s="' + esc(x.id_siswa) + '" ' + (x.pengumpulan ? '' : 'disabled') + '><span class="bd-isi"><b>' + esc(x.nama) + '</b><small class="mono">' + esc(x.nis) + (x.pengumpulan ? ' · ' + esc(UI.relatif(x.pengumpulan.waktu_kumpul)) : '') + '</small></span>' + (x.status === 'dinilai' ? '<b class="mono nilai-pill ok">' + UI.angka(x.pengumpulan.nilai) + '</b>' : UI.pill(x.pengumpulan ? (x.pengumpulan.terlambat ? 'terlambat' : x.pengumpulan.status) : x.status)) + '</button>').join('') || '<p class="teks-2 kecil">Tidak ada siswa di filter ini.</p>') + '</div></aside>' +
        '<section class="kartu panel-pratinjau">' + (k ? '<div class="pp-kepala"><span class="bd-isi"><b>' + esc(k.nama_file) + '</b><small>' + esc(s.nama) + ' · ' + UI.ukuran(k.ukuran_kb * 1024) + ' · ' + esc(UI.tgl(k.waktu_kumpul, 'lengkap')) + '</small></span>' + (k.terlambat ? UI.pill('terlambat') : '') + '<a class="btn btn-ghost btn-kecil" href="' + esc(k.buka_url) + '" target="_blank" rel="noopener">' + ikon('external') + 'Buka di Drive</a></div>' +
          '<div class="viewer viewer-dok"><iframe src="' + esc(k.preview_url) + '" title="Pratinjau jawaban ' + esc(s.nama) + '" allow="autoplay" loading="lazy"></iframe></div><p class="catatan kecil">' + ikon('info') + 'Berkas siswa bersifat privat. Pratinjau tampil bila browser ini masuk dengan akun Google pemilik aplikasi; bila tidak, tekan "Buka di Drive".</p>' : UI.kosong('file', 'Pilih pengumpulan', 'Pilih siswa di daftar untuk melihat jawabannya.')) + '</section>' +
        '<aside class="kartu panel-nilai">' + (k ? '<span class="label-caps">Penilaian</span><h3>' + esc(s.nama) + '</h3><form class="form" id="pk-form"><label class="field"><span>Nilai</span><span class="input-satuan"><input type="number" name="nilai" min="0" max="' + t.nilai_maks + '" step="0.5" value="' + esc(k.nilai) + '" class="mono input-besar"><em>/ ' + t.nilai_maks + '</em></span></label>' +
          '<label class="field"><span>Komentar untuk siswa</span><textarea name="komentar" rows="5" placeholder="Umpan balik singkat">' + esc(k.komentar || '') + '</textarea></label>' +
          '<button class="btn btn-primary btn-penuh" data-status="dinilai">' + ikon('checkCircle') + 'Simpan nilai</button><button class="btn btn-ghost btn-penuh" data-status="revisi">' + ikon('refresh') + 'Minta revisi</button></form>' +
          '<p class="kecil teks-2 tengah">' + perlu + ' pengumpulan menunggu nilai</p>' : '<p class="teks-2">Belum ada jawaban dipilih.</p>') + '</aside></div>';
      UI.pasangSegmen(el, 'f', (x) => { st.filter = x; render(); });
      const f = document.getElementById('pk-form');
      if (f) f.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-status]'); if (!b) return; e.preventDefault();
        const o = G.form(f);
        if (b.dataset.status === 'dinilai' && (o.nilai === '' || Number(o.nilai) < 0 || Number(o.nilai) > t.nilai_maks)) return UI.toast('Isi nilai 0–' + t.nilai_maks + '.', 'error');
        await UI.sibuk(b, async () => {
          const r = await API.call('pengumpulan.nilai', { id_pengumpulan: k.id_pengumpulan, nilai: o.nilai, komentar: o.komentar, status: b.dataset.status });
          if (UI.hasil(r)) {
            const lanjut = st.data.siswa.find((x) => x.id_siswa !== s.id_siswa && x.pengumpulan && x.pengumpulan.status === 'dikumpulkan');
            st.pilih = lanjut ? lanjut.id_siswa : s.id_siswa;
            await muat(true);
          }
        });
      });
    }
    async function muat(paksa) {
      const r = await API.load('tugas.pengumpulan', { id_tugas: p.id }, (d) => { st.data = d; render(); }, { force: !!paksa, maxAge: 10000, batch: false });
      if (!r.success && !st.data) el.innerHTML = UI.kosong('alert', 'Tugas tidak ditemukan', r.message);
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b && !b.disabled) { st.pilih = b.dataset.s; render(); } });
    muat(false);
  }, 'guru');
})();
