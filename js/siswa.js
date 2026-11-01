/* =====================================================================
 * Halaman SISWA: beranda, pengingat, materi, tugas/LKPD, ujian, hasil, profil.
 * ===================================================================== */
(function () {
  const esc = UI.esc;
  const ICON_TIPE = { pdf: 'fileText', word: 'fileText', gambar: 'image', video: 'video', tautan: 'link', simulasi: 'flask' };
  const LABEL_TIPE = { pdf: 'PDF', word: 'WORD', gambar: 'GAMBAR', video: 'VIDEO', tautan: 'TAUTAN', simulasi: 'SIMULASI' };
  const SINGKAT_TOPIK = { 'Mekanika': 'Mekanika', 'Fluida': 'Fluida', 'Termodinamika': 'Termo', 'Gelombang & Bunyi': 'Gelombang', 'Optik': 'Optik', 'Listrik & Magnet': 'Listrik', 'Fisika Modern': 'Modern' };

  function gelombang() { return '<svg class="gelombang-bawah" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 C 50 0, 100 0, 150 12 S 250 24, 300 12 S 380 2, 400 8 L400 24 L0 24 Z"/></svg>'; }
  function dekorHero() {
    return '<div class="hero-dekor" aria-hidden="true"><svg viewBox="0 0 400 400" class="orbit-bg"><g fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="200" cy="200" rx="180" ry="70"/><ellipse cx="200" cy="200" rx="180" ry="70" transform="rotate(60 200 200)"/><ellipse cx="200" cy="200" rx="180" ry="70" transform="rotate(-60 200 200)"/></g></svg>' +
      '<span class="rumus-bg">F = m·a &nbsp; E = mc² &nbsp; v = λ·f &nbsp; V = I·R &nbsp; P = W/t &nbsp; F = m·a &nbsp; E = mc²</span></div>';
  }
  function thumb(m) {
    return m.thumbnail_url
      ? '<div class="thumb"><img src="' + esc(m.thumbnail_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'thumb-gagal\');this.remove()"><span class="thumb-tipe">' + LABEL_TIPE[m.tipe] + '</span></div>'
      : '<div class="thumb thumb-gagal" data-topik="' + esc(m.topik) + '">' + ikonTopik(m.topik, 'thumb-ikon') + '<span class="thumb-tipe">' + LABEL_TIPE[m.tipe] + '</span></div>';
  }
  function kartuMateri(m) {
    return '<a class="kartu-materi" href="#/materi/' + esc(m.id_materi) + '">' + thumb(m) +
      '<div class="km-isi"><span class="label-caps">' + esc(m.topik) + '</span><h4>' + esc(m.judul) + '</h4>' +
      '<span class="km-meta">' + ikon(ICON_TIPE[m.tipe]) + esc(LABEL_TIPE[m.tipe]) + (m.selesai ? '<span class="km-selesai">' + ikon('checkCircle') + 'Selesai</span>' : '') + '</span></div></a>';
  }
  function kartuTugas(t) {
    const sisa = new Date(t.tenggat).getTime() - API.now();
    const dekat = sisa > 0 && sisa < 86400000;
    return '<a class="kartu kartu-tugas" href="#/tugas/' + esc(t.id_tugas) + '"><div class="kt-atas">' +
      (dekat ? '<span class="pill pill-warn">Tenggat ' + esc(UI.relatif(t.tenggat)) + '</span>' : UI.pill(t.status_saya)) +
      '<span class="mono kecil">' + esc(UI.tgl(t.tenggat, 'hari')) + ' · ' + esc(UI.tgl(t.tenggat, 'jam')) + '</span></div>' +
      '<h4>' + esc(t.judul) + '</h4>' + (t.instruksi ? '<p class="teks-2 potong-2">' + esc(t.instruksi) + '</p>' : '') +
      '<div class="kt-bawah"><span class="mono kecil">' + ikon('file') + esc(t.tipe_file_diizinkan.join(' / ').toUpperCase()) + ' · maks ' + t.ukuran_maks_mb + ' MB</span><span class="btn btn-tipis">' + (t.status_saya === 'belum' || t.status_saya === 'revisi' ? 'Unggah' : 'Lihat') + '</span></div></a>';
  }
  function kartuUjian(u) {
    const tombol = u.status_saya === 'mengerjakan' ? '<a class="btn btn-accent" href="#/ujian/' + esc(u.id_ujian) + '/kerjakan">' + ikon('play') + 'Lanjutkan</a>'
      : u.bisa_mulai ? '<a class="btn btn-primary" href="#/ujian/' + esc(u.id_ujian) + '/kerjakan">' + ikon('play') + 'Mulai</a>'
        : u.id_percobaan_terakhir ? '<a class="btn btn-ghost" href="#/hasil/' + esc(u.id_percobaan_terakhir) + '">Lihat hasil</a>'
          : '<button class="btn btn-ghost" disabled>' + (u.jendela === 'akan' ? 'Belum dibuka' : 'Ditutup') + '</button>';
    return '<div class="kartu kartu-ujian"><div class="kt-atas">' + UI.pill(u.jenis) + '<span class="mono kecil">' + esc(u.jumlah_soal) + ' soal · ' + esc(u.durasi_menit) + ' menit</span></div>' +
      '<h4>' + esc(u.judul) + '</h4><p class="mono kecil teks-2">' + ikon('calendar') + esc(UI.tgl(u.mulai, 'lengkap')) + ' – ' + esc(UI.tgl(u.selesai, 'jam')) + '</p>' +
      '<div class="kt-bawah"><span class="kecil teks-2">Percobaan ' + u.percobaan + '/' + u.maks_percobaan + (u.nilai_terbaik !== '' ? ' · Nilai terbaik <b class="mono">' + UI.angka(u.nilai_terbaik) + '</b>' : '') + '</span>' + tombol + '</div></div>';
  }

  // ---------------- BERANDA ----------------
  App.rute('/beranda', async () => {
    const v = App.view(), me = App.me;
    v.innerHTML = '<section class="hero-siswa">' + dekorHero() +
      '<div class="hero-baris"><a href="#/profil" class="hero-profil">' + UI.avatar(me.nama, App.fotoSaya(), 'avatar-hero') + '<span><b>Halo, ' + esc(UI.namaDepan(me.nama)) + '</b><span class="chip-mono">' + esc(me.nama_kelas || 'Siswa') + '</span></span></a>' +
      '<a href="#/pengingat" class="btn-lonceng" aria-label="Pengingat">' + ikon('bell') + '<em class="titik-badge" data-badge="#/beranda"></em></a></div>' +
      '<h1 class="hero-judul">Ayo jelajahi fisika hari ini</h1>' +
      '<form class="cari" role="search"><span>' + ikon('search') + '</span><input name="q" placeholder="Cari materi, tugas, rumus…" aria-label="Cari materi"></form>' + gelombang() + '</section>' +
      '<div class="konten" id="beranda-isi">' + UI.skeleton(3) + '</div>';
    v.querySelector('.cari').addEventListener('submit', (e) => { e.preventDefault(); const q = e.target.q.value.trim(); App.go('#/materi' + (q ? '?q=' + encodeURIComponent(q) : '')); });
    const isi = document.getElementById('beranda-isi');
    const render = (d) => {
      App.badge('#/beranda', d.belumDibaca);
      const persen = d.progres.total ? Math.round(d.progres.selesai / d.progres.total * 100) : 0;
      let h = '';
      if (d.sesi) {
        h += '<section class="kartu kartu-sesi"><div class="ks-atas"><span class="label-caps"><i class="denyut"></i>Sesi fisika sedang berlangsung</span><span class="chip">' + ikon('pin') + esc(d.sesi.nama_lokasi) + '</span></div>' +
          '<div class="ks-isi"><div><h3>' + esc(d.sesi.topik) + '</h3><p class="teks-2 kecil">Dibuka ' + esc(UI.tgl(d.sesi.dibuka, 'jam')) + ' · ditutup ' + esc(UI.tgl(d.sesi.batas_tutup, 'jam')) + '</p></div>' +
          (d.sesi.sudahAbsen ? UI.pill(d.sesi.statusAbsen, d.sesi.statusAbsen === 'hadir' ? 'Sudah hadir' : null) : '<button class="btn btn-accent" data-hadir>' + ikon('checkCircle') + 'Hadir</button>') + '</div></section>';
      }
      h += '<section><div class="judul-seksi"><h2>Topik Fisika</h2><span class="label-caps">' + d.topik.length + ' topik</span></div><div class="topik-scroll">' +
        d.topik.map((t) => '<a class="chip-topik" href="#/materi?topik=' + encodeURIComponent(t.topik) + '"><span>' + ikonTopik(t.topik) + '</span><small>' + esc(SINGKAT_TOPIK[t.topik] || t.topik) + '</small></a>').join('') + '</div></section>';
      h += '<div class="grid-beranda"><section class="kartu kartu-progres"><div><span class="label-caps">Capaian belajar</span><h3>Progres materi</h3><p class="teks-2">' + d.progres.selesai + ' dari ' + d.progres.total + ' materi selesai</p>' +
        (d.tugasBelum ? '<a class="chip chip-warn" href="#/tugas">' + ikon('clipboard') + d.tugasBelum + ' tugas belum dikumpulkan</a>' : '<span class="chip chip-ok">' + ikon('checkCircle') + 'Semua tugas beres</span>') + '</div>' + UI.orbit(persen, 112, persen + '%', 'selesai') + '</section>';
      h += '<section><div class="judul-seksi"><h2>' + ikon('clock') + 'Segera berakhir</h2><a href="#/tugas" class="tautan">Lihat semua</a></div>' +
        (d.segera.length || d.ujianAktif.length ? '<div class="tumpuk">' + d.ujianAktif.map(kartuUjian).join('') + d.segera.map(kartuTugas).join('') + '</div>' : UI.kosong('checkCircle', 'Tidak ada tenggat dekat', 'Tugas dengan tenggat 2 hari ke depan akan muncul di sini.')) + '</section></div>';
      h += '<section><div class="judul-seksi"><h2>' + ikon('book') + 'Materi terbaru</h2><a href="#/materi" class="tautan">Semua materi</a></div>' +
        (d.terbaru.length ? '<div class="grid-materi">' + d.terbaru.map(kartuMateri).join('') + '</div>' : UI.kosong('book', 'Belum ada materi', 'Materi dari guru akan tampil di sini.')) + '</section>';
      if (d.simulasi) h += '<section class="kartu kartu-lab"><div class="lab-ikon">' + ikon('flask') + '</div><div><h3>Laboratorium virtual</h3><p class="teks-2">' + esc(d.simulasi.judul) + '</p></div><a class="btn btn-primary" href="#/materi/' + esc(d.simulasi.id_materi) + '">Buka lab ' + ikon('external') + '</a></section>';
      isi.innerHTML = h;
      const b = isi.querySelector('[data-hadir]');
      if (b) b.addEventListener('click', () => hadir(b, d.sesi));
    };
    API.load('siswa.beranda', {}, render, { maxAge: 15000, onError: (r) => { isi.innerHTML = UI.kosong('wifiOff', 'Data belum termuat', r.message); } });
    const t = setInterval(() => { if (document.visibilityState === 'visible') API.load('siswa.beranda', {}, render, { maxAge: 25000 }); }, 30000);
    App.onLeave(() => clearInterval(t));
  }, 'siswa');

  async function hadir(btn, sesi) {
    await UI.sibuk(btn, async () => {
      let posisi = {};
      if (sesi.gpsWajib) {
        try { posisi = await UI.gps(); } catch (e) { UI.toast(e.message, 'error'); return; }
      }
      const r = await API.call('absen.hadir', Object.assign({ id_sesi: sesi.id_sesi }, posisi));
      if (r.success) {
        UI.toast(r.message, 'ok', { partikel: true });
        btn.outerHTML = UI.pill('hadir', 'Sudah hadir');
        API.load('siswa.beranda', {}, null, { force: true });
      } else UI.toast(r.message, 'error');
    }, 'Mencatat…');
  }

  // ---------------- PENGINGAT ----------------
  App.rute('/pengingat', async () => {
    const v = App.view();
    v.innerHTML = App.barAtas('Pengingat', '#/beranda', '<button class="tautan" data-semua>Tandai dibaca</button>') + '<div class="konten" id="pg-isi">' + UI.skeleton(4, 'baris') + '</div>';
    const isi = document.getElementById('pg-isi');
    const TUJUAN = { materi: (id) => '#/materi/' + id, tugas: (id) => '#/tugas/' + id, ujian: () => '#/ujian', latihan: () => '#/ujian', nilai: () => '#/ujian' };
    const IK = { materi: 'book', tugas: 'clipboard', ujian: 'timer', latihan: 'timer', nilai: 'star' };
    const render = (list) => {
      if (!list.length) { isi.innerHTML = UI.kosong('bell', 'Belum ada pengingat', 'Pengingat muncul saat guru menerbitkan materi, tugas, atau ujian baru.'); return; }
      const hari = new Date(); hari.setHours(0, 0, 0, 0);
      const grup = { 'Hari ini': [], 'Minggu ini': [], 'Sebelumnya': [] };
      list.forEach((p) => { const t = new Date(p.dibuat_pada).getTime(); (t >= hari.getTime() ? grup['Hari ini'] : t >= hari.getTime() - 6 * 86400000 ? grup['Minggu ini'] : grup['Sebelumnya']).push(p); });
      isi.innerHTML = Object.keys(grup).filter((g) => grup[g].length).map((g) => '<h2 class="sub-judul">' + g + '</h2><div class="daftar">' + grup[g].map((p) =>
        '<a class="baris-daftar ' + (p.dibaca ? '' : 'belum-dibaca') + '" href="' + TUJUAN[p.jenis](p.ref_id) + '" data-id="' + esc(p.id_pengingat) + '"><span class="ikon-bulat">' + ikon(IK[p.jenis] || 'bell') + '</span>' +
        '<span class="bd-isi"><b>' + esc(p.judul) + '</b><small>' + esc(UI.relatif(p.dibuat_pada)) + '</small></span>' + (p.dibaca ? '' : '<i class="titik-baru" aria-label="belum dibaca"></i>') + '</a>').join('') + '</div>').join('');
    };
    API.load('pengingat.list', {}, render, { maxAge: 10000 });
    isi.addEventListener('click', (e) => { const a = e.target.closest('[data-id]'); if (a && a.classList.contains('belum-dibaca')) API.call('pengingat.baca', { ids: [a.dataset.id] }); });
    v.querySelector('[data-semua]').addEventListener('click', async () => {
      const r = await API.call('pengingat.baca', { semua: true });
      if (r.success) { App.badge('#/beranda', 0); UI.toast('Semua pengingat ditandai dibaca.'); API.load('pengingat.list', {}, render, { force: true }); }
    });
  }, 'siswa');

  // ---------------- MATERI ----------------
  App.rute('/materi', async (p, q) => {
    const v = App.view();
    let topik = q.topik || 'Semua', cari = q.q || '';
    v.innerHTML = App.barAtas('Materi', null) + '<div class="konten"><form class="cari cari-terang" role="search"><span>' + ikon('search') + '</span><input name="q" value="' + esc(cari) + '" placeholder="Cari judul atau isi materi" aria-label="Cari materi"></form>' +
      '<div class="chip-scroll" id="m-topik">' + ['Semua'].concat(App.TOPIK).map((t) => '<button class="chip-pilih ' + (t === topik ? 'aktif' : '') + '" data-t="' + esc(t) + '">' + (t === 'Semua' ? '' : ikonTopik(t)) + esc(t) + '</button>').join('') + '</div>' +
      '<div id="m-isi">' + UI.skeleton(4) + '</div></div>';
    let data = [];
    const isi = document.getElementById('m-isi');
    const render = () => {
      const kata = cari.toLowerCase();
      const list = data.filter((m) => (topik === 'Semua' || m.topik === topik) && (!kata || (m.judul + ' ' + m.deskripsi).toLowerCase().indexOf(kata) > -1));
      if (!list.length) { isi.innerHTML = UI.kosong('book', data.length ? 'Tidak ada yang cocok' : 'Belum ada materi', data.length ? 'Coba kata kunci atau topik lain.' : 'Materi dari guru akan tampil di sini.'); return; }
      const grup = {};
      list.forEach((m) => { (grup[m.topik] = grup[m.topik] || []).push(m); });
      isi.innerHTML = Object.keys(grup).map((t) => {
        const semua = data.filter((m) => m.topik === t), selesai = semua.filter((m) => m.selesai).length;
        return '<section class="grup-topik"><div class="judul-seksi"><h2>' + ikonTopik(t) + esc(t) + '</h2><span class="mono kecil teks-2">' + selesai + '/' + semua.length + ' selesai</span></div>' + UI.progres(selesai / semua.length * 100, 'bar-tipis') +
          '<div class="grid-materi">' + grup[t].map(kartuMateri).join('') + '</div></section>';
      }).join('');
    };
    API.load('materi.list', {}, (d) => { data = d; render(); }, { maxAge: 30000 });
    v.querySelector('#m-topik').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; topik = b.dataset.t; UI.$$('#m-topik button').forEach((x) => x.classList.toggle('aktif', x === b)); render(); });
    v.querySelector('.cari').addEventListener('input', UI.debounce((e) => { cari = e.target.value.trim(); render(); }, 200));
    v.querySelector('.cari').addEventListener('submit', (e) => e.preventDefault());
  }, 'siswa');

  App.rute('/materi/:id', async (p) => {
    const v = App.view();
    v.innerHTML = App.barAtas('Detail materi', '#/materi') + '<div class="konten" id="md-isi">' + UI.skeleton(2) + '</div>';
    const isi = document.getElementById('md-isi');
    const render = (m) => {
      let viewer = '';
      if (m.tipe === 'gambar' && m.file_id) viewer = '<figure class="viewer viewer-gambar"><img src="https://drive.google.com/thumbnail?id=' + esc(m.file_id) + '&sz=w1600" alt="' + esc(m.judul) + '" referrerpolicy="no-referrer"></figure>';
      else if (m.embed_url) viewer = '<div class="viewer ' + (m.tipe === 'pdf' || m.tipe === 'word' ? 'viewer-dok' : 'viewer-video') + '"><iframe src="' + esc(m.embed_url) + '" title="' + esc(m.judul) + '" allow="autoplay; fullscreen" allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe></div>';
      else if (m.url) viewer = '<a class="kartu kartu-tautan" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + ikon('link') + '<span><b>Buka tautan materi</b><small>' + esc(m.url) + '</small></span>' + ikon('external') + '</a>';
      isi.innerHTML = '<span class="chip-topik-label">' + ikonTopik(m.topik) + esc(m.topik) + '</span><h1 class="judul-halaman">' + esc(m.judul) + '</h1>' + viewer +
        '<div class="aksi-viewer">' + (m.unduh_url ? '<a class="btn btn-ghost btn-kecil" href="' + esc(m.unduh_url) + '" target="_blank" rel="noopener">' + ikon('download') + 'Unduh</a>' : '') +
        (m.tipe === 'simulasi' && m.url ? '<a class="btn btn-ghost btn-kecil" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + ikon('external') + 'Layar penuh</a>' : '') + '</div>' +
        (m.deskripsi ? '<div class="kartu prosa" id="md-desk">' + UI.teks(m.deskripsi) + '</div>' : '') +
        '<button class="btn ' + (m.selesai ? 'btn-ghost' : 'btn-primary') + ' btn-penuh" data-selesai>' + ikon('checkCircle') + (m.selesai ? 'Sudah selesai · batalkan' : 'Tandai selesai') + '</button>' +
        (m.berikutnya && m.berikutnya.length ? '<section><div class="judul-seksi"><h2>Materi berikutnya</h2></div><div class="daftar">' + m.berikutnya.map((x) =>
          '<a class="baris-daftar" href="#/materi/' + esc(x.id_materi) + '"><span class="ikon-bulat">' + ikon(ICON_TIPE[x.tipe]) + '</span><span class="bd-isi"><b>' + esc(x.judul) + '</b><small>' + esc(x.topik) + ' · ' + LABEL_TIPE[x.tipe] + '</small></span>' + ikon('right') + '</a>').join('') + '</div></section>' : '');
      UI.rumus(document.getElementById('md-desk'));
      isi.querySelector('[data-selesai]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        await UI.sibuk(btn, async () => {
          const r = await API.call('materi.selesai', { id_materi: m.id_materi, selesai: !m.selesai });
          if (r.success) { m.selesai = r.data.selesai; UI.toast(r.message, 'ok', { partikel: m.selesai }); render(m); }
          else UI.toast(r.message, 'error');
        });
      });
    };
    API.load('materi.detail', { id_materi: p.id }, render, { maxAge: 60000, onError: (r) => { isi.innerHTML = UI.kosong('alert', 'Materi tidak tersedia', r.message); } });
  }, 'siswa');

  // ---------------- TUGAS ----------------
  App.rute('/tugas', async () => {
    const v = App.view();
    let tab = 'semua', data = [];
    v.innerHTML = App.barAtas('Tugas & LKPD', null) + '<div class="konten"><div id="t-tab"></div><div id="t-isi" class="tumpuk">' + UI.skeleton(3) + '</div></div>';
    const KEL = { semua: () => true, belum: (t) => ['belum', 'revisi', 'lewat_tenggat'].indexOf(t.status_saya) > -1, terkumpul: (t) => ['terkumpul', 'terlambat'].indexOf(t.status_saya) > -1, dinilai: (t) => t.status_saya === 'dinilai' };
    const render = () => {
      document.getElementById('t-tab').innerHTML = UI.segmen('tab', [['semua', 'Semua', data.length], ['belum', 'Belum', data.filter(KEL.belum).length], ['terkumpul', 'Terkumpul', data.filter(KEL.terkumpul).length], ['dinilai', 'Dinilai', data.filter(KEL.dinilai).length]], tab);
      UI.pasangSegmen(v, 'tab', (x) => { tab = x; render(); });
      const list = data.filter(KEL[tab]);
      document.getElementById('t-isi').innerHTML = list.length ? list.map((t) => {
        const html = kartuTugas(t);
        return t.status_saya === 'dinilai' ? html.replace('</h4>', '</h4><p class="nilai-kecil">Nilai <b class="mono">' + UI.angka(t.pengumpulan.nilai) + '</b>/' + t.nilai_maks + '</p>') : html;
      }).join('') : UI.kosong('clipboard', 'Tidak ada tugas di sini', tab === 'belum' ? 'Semua tugas sudah dikumpulkan. Mantap!' : '');
    };
    API.load('tugas.list', {}, (d) => { data = d; render(); }, { maxAge: 20000 });
  }, 'siswa');

  App.rute('/tugas/:id', async (p) => {
    const v = App.view();
    v.innerHTML = App.barAtas('Detail tugas', '#/tugas') + '<div class="konten" id="td-isi">' + UI.skeleton(2) + '</div>';
    const isi = document.getElementById('td-isi');
    let berkas = null;
    const render = (t) => {
      const bisa = ['belum', 'revisi', 'lewat_tenggat', 'terkumpul', 'terlambat'].indexOf(t.status_saya) > -1 && t.status_saya !== 'ditutup';
      const k = t.pengumpulan;
      const accept = t.tipe_file_diizinkan.map((j) => ({ pdf: '.pdf', gambar: 'image/*', video: 'video/mp4,video/webm,video/quicktime', word: '.doc,.docx' }[j])).join(',');
      isi.innerHTML = '<div class="kt-atas">' + UI.pill(t.status_saya) + (t.topik ? '<span class="label-caps">' + esc(t.topik) + '</span>' : '') + '</div><h1 class="judul-halaman">' + esc(t.judul) + '</h1>' +
        '<div class="info-baris"><span class="chip">' + ikon('calendar') + 'Tenggat ' + esc(UI.tgl(t.tenggat, 'lengkap')) + '</span><span class="chip">' + ikon('star') + 'Nilai maks ' + t.nilai_maks + '</span>' + (t.izinkan_terlambat ? '<span class="chip">' + ikon('clock') + 'Terlambat diterima</span>' : '') + '</div>' +
        (t.instruksi ? '<div class="kartu prosa" id="td-ins"><span class="label-caps">Instruksi</span>' + UI.teks(t.instruksi) + '</div>' : '') +
        (t.lampiran_file_id ? '<div class="baris-daftar kartu"><span class="ikon-bulat">' + ikon('fileText') + '</span><span class="bd-isi"><b>' + esc(t.lampiran_nama || 'Lampiran guru') + '</b><small>Lampiran dari guru</small></span><button class="btn btn-ghost btn-kecil" data-pratinjau>' + ikon('eye') + 'Lihat</button><a class="btn-ikon" href="' + esc(t.lampiran_unduh) + '" target="_blank" rel="noopener" aria-label="Unduh">' + ikon('download') + '</a></div>' : '') +
        (k && k.status === 'dinilai' ? '<section class="kartu kartu-nilai"><span class="label-caps">Nilai dari guru</span><div class="nilai-besar"><b>' + UI.angka(k.nilai) + '</b><span>/ ' + t.nilai_maks + '</span></div>' + (k.komentar ? '<blockquote>' + esc(k.komentar) + '</blockquote>' : '') + '</section>' : '') +
        (k && k.status === 'revisi' ? '<div class="alert alert-warn">' + ikon('alert') + '<span><b>Guru meminta revisi.</b> ' + esc(k.komentar || '') + '</span></div>' : '') +
        '<section class="kartu"><span class="label-caps">Jawaban saya</span>' +
        (k ? '<div class="baris-daftar"><span class="ikon-bulat ikon-ok">' + ikon('checkCircle') + '</span><span class="bd-isi"><b>' + esc(k.nama_file) + '</b><small>Dikumpulkan ' + esc(UI.tgl(k.waktu_kumpul, 'lengkap')) + ' · ' + UI.ukuran(k.ukuran_kb * 1024) + (k.terlambat ? ' · terlambat' : '') + '</small></span></div>' : '') +
        (bisa && (!k || k.status !== 'dinilai') ? '<div class="dropzone" id="dz"><input type="file" id="f-berkas" accept="' + esc(accept) + '" hidden><input type="file" id="f-kamera" accept="image/*" capture="environment" hidden>' +
          ikon('upload', 'ik-besar') + '<p><b>' + (k ? 'Ganti berkas jawaban' : 'Unggah berkas jawaban') + '</b><br><span class="teks-2 kecil">' + esc(t.tipe_file_diizinkan.join(', ').toUpperCase()) + ' · dokumen maks ' + t.ukuran_maks_mb + ' MB, video maks ' + ((App.cfg && App.cfg.ukuran_maks_video_mb) || 25) + ' MB</span></p>' +
          '<div class="dz-tombol"><button class="btn btn-ghost" data-pilih>' + ikon('file') + 'Pilih berkas</button>' + (t.tipe_file_diizinkan.indexOf('gambar') > -1 ? '<button class="btn btn-ghost" data-kamera>' + ikon('camera') + 'Ambil foto</button>' : '') + '</div></div>' +
          '<div id="dz-pilihan"></div>' : (t.status_saya === 'ditutup' ? '<p class="teks-2">Tenggat sudah lewat dan pengumpulan ditutup.</p>' : '')) + '</section>' +
        (bisa && (!k || k.status !== 'dinilai') ? '<div class="aksi-lengket"><button class="btn btn-primary btn-penuh" data-kumpul disabled>' + ikon('send') + 'Kumpulkan</button></div>' : '');
      UI.rumus(document.getElementById('td-ins'));
      const pr = isi.querySelector('[data-pratinjau]');
      if (pr) pr.addEventListener('click', () => UI.modal({ title: t.lampiran_nama || 'Lampiran', wide: true, body: '<div class="viewer viewer-dok"><iframe src="' + esc(t.lampiran_url) + '" title="Lampiran" allow="autoplay"></iframe></div>' }));
      const dz = document.getElementById('dz');
      if (!dz) return;
      const pilih = async (file) => {
        if (!file) return;
        const maksVideo = Number((App.cfg && App.cfg.ukuran_maks_video_mb) || 25), video = /^video\//.test(file.type);
        const batas = (video ? maksVideo : t.ukuran_maks_mb) * 1048576;
        try {
          berkas = /^image\//.test(file.type) ? await UI.kompresGambar(file, 1800, 0.85) : await UI.bacaBerkas(file);
        } catch (e) { UI.toast(e.message, 'error'); return; }
        if (berkas.ukuran > batas) { UI.toast('Berkas ' + UI.ukuran(berkas.ukuran) + ' melebihi batas ' + Math.round(batas / 1048576) + ' MB.', 'error'); berkas = null; return; }
        document.getElementById('dz-pilihan').innerHTML = '<div class="baris-daftar berkas-terpilih"><span class="ikon-bulat">' + ikon(video ? 'video' : /^image/.test(file.type) ? 'image' : 'fileText') + '</span><span class="bd-isi"><b>' + esc(berkas.nama) + '</b><small>' + UI.ukuran(berkas.ukuran) + ' · siap dikumpulkan</small></span><button class="btn-ikon" data-hapus aria-label="Batal">' + ikon('x') + '</button></div><div class="unggah-progres" hidden>' + UI.progres(0) + '<span class="mono kecil">0%</span></div>';
        isi.querySelector('[data-kumpul]').disabled = false;
        document.querySelector('[data-hapus]').addEventListener('click', () => { berkas = null; document.getElementById('dz-pilihan').innerHTML = ''; isi.querySelector('[data-kumpul]').disabled = true; });
      };
      dz.querySelector('[data-pilih]').addEventListener('click', () => document.getElementById('f-berkas').click());
      const kam = dz.querySelector('[data-kamera]');
      if (kam) kam.addEventListener('click', () => document.getElementById('f-kamera').click());
      document.getElementById('f-berkas').addEventListener('change', (e) => pilih(e.target.files[0]));
      document.getElementById('f-kamera').addEventListener('change', (e) => pilih(e.target.files[0]));
      ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('aktif'); }));
      ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('aktif'); if (ev === 'drop') pilih(e.dataTransfer.files[0]); }));
      isi.querySelector('[data-kumpul]').addEventListener('click', async (e) => {
        if (!berkas) return;
        const btn = e.currentTarget, prog = document.querySelector('.unggah-progres');
        prog.hidden = false;
        await UI.sibuk(btn, async () => {
          const r = await API.upload('tugas.kumpul', { id_tugas: t.id_tugas, berkas: { nama: berkas.nama, tipe: berkas.tipe, base64: berkas.base64 } }, (pct) => {
            prog.querySelector('.bar span').style.width = pct + '%'; prog.querySelector('span.mono').textContent = pct + '%';
          });
          if (r.success) { UI.toast(r.message, 'ok', { partikel: true }); berkas = null; API.load('tugas.detail', { id_tugas: t.id_tugas }, render, { force: true }); }
          else { UI.toast(r.message, 'error'); prog.hidden = true; }
        }, 'Mengunggah…');
      });
    };
    API.load('tugas.detail', { id_tugas: p.id }, render, { maxAge: 15000, onError: (r) => { isi.innerHTML = UI.kosong('alert', 'Tugas tidak tersedia', r.message); } });
  }, 'siswa');

  // ---------------- UJIAN ----------------
  App.rute('/ujian', async () => {
    const v = App.view();
    let tab = 'berlangsung', data = [];
    v.innerHTML = App.barAtas('Ujian & Latihan', null) + '<div class="konten"><div id="u-tab"></div><div id="u-isi" class="tumpuk">' + UI.skeleton(3) + '</div></div>';
    const render = () => {
      const kel = { akan: data.filter((u) => u.jendela === 'akan'), berlangsung: data.filter((u) => u.jendela === 'berlangsung'), selesai: data.filter((u) => u.jendela === 'berakhir') };
      document.getElementById('u-tab').innerHTML = UI.segmen('tab', [['akan', 'Akan datang', kel.akan.length], ['berlangsung', 'Berlangsung', kel.berlangsung.length], ['selesai', 'Selesai', kel.selesai.length]], tab);
      UI.pasangSegmen(v, 'tab', (x) => { tab = x; render(); });
      document.getElementById('u-isi').innerHTML = kel[tab].length ? kel[tab].map(kartuUjian).join('') : UI.kosong('timer', 'Tidak ada ' + (tab === 'akan' ? 'jadwal ujian' : tab === 'selesai' ? 'ujian yang sudah berakhir' : 'ujian yang sedang dibuka'), '');
    };
    API.load('ujian.list', {}, (d) => { data = d; if (!d.some((u) => u.jendela === 'berlangsung') && d.some((u) => u.jendela === 'akan')) tab = 'akan'; render(); }, { maxAge: 15000 });
  }, 'siswa');

  App.rute('/ujian/:id/kerjakan', async (p) => {
    const v = App.view();
    document.body.classList.add('mode-fokus');
    v.innerHTML = '<div class="konten">' + UI.skeleton(2) + '<p class="teks-2 tengah">Menyiapkan soal…</p></div>';
    const r = await API.call('ujian.mulai', { id_ujian: p.id }, { retry: 3 });
    if (!r.success) { document.body.classList.remove('mode-fokus'); v.innerHTML = App.barAtas('Ujian', '#/ujian') + '<div class="konten">' + UI.kosong('alert', 'Ujian tidak bisa dibuka', r.message, '<a class="btn btn-primary" href="#/ujian">Kembali</a>') + '</div>'; return; }
    const D = r.data, idP = D.percobaan.id_percobaan, kunciLokal = 'pl_ujian_' + idP;
    let lokal = null;
    try { lokal = JSON.parse(localStorage.getItem(kunciLokal) || 'null'); } catch (e) { lokal = null; }
    const S = { jawaban: Object.assign({}, D.jawaban || {}, (lokal && lokal.jawaban) || {}), ragu: (lokal && lokal.ragu) || {}, idx: (lokal && lokal.idx) || 0,
      pindah: Math.max(D.pindah_tab || 0, (lokal && lokal.pindah) || 0), dirty: !!lokal, terkirim: false, batas: new Date(D.percobaan.batas_waktu).getTime(), simpanTerakhir: 0, mengirim: false };
    const soal = D.soal;
    const simpanLokal = () => { try { localStorage.setItem(kunciLokal, JSON.stringify({ jawaban: S.jawaban, ragu: S.ragu, idx: S.idx, pindah: S.pindah, t: Date.now() })); } catch (e) { /* abaikan */ } };
    v.innerHTML = '<div class="ujian">' +
      '<header class="ujian-head"><div><span class="label-caps">' + esc(D.ujian.jenis === 'latihan' ? 'Latihan' : 'Ujian') + '</span><h1>' + esc(D.ujian.judul) + '</h1></div>' +
      '<div class="ujian-waktu"><span class="timer mono" id="uj-timer" aria-live="off">--:--</span><span class="simpan-status" id="uj-simpan">' + ikon('checkCircle') + 'Tersimpan</span></div></header>' +
      '<div class="banner-offline" id="uj-offline" hidden>' + ikon('wifiOff') + 'Koneksi terputus — jawaban tetap tersimpan di HP.</div>' +
      '<main class="ujian-isi" id="uj-soal"></main>' +
      '<nav class="ujian-nav"><button class="btn btn-ghost" data-prev>' + ikon('left') + '<span>Sebelumnya</span></button>' +
      '<button class="btn btn-ghost btn-ragu" data-ragu>' + ikon('flag') + '<span>Ragu-ragu</span></button>' +
      '<button class="btn btn-ghost" data-daftar aria-label="Daftar soal">' + ikon('grid') + '</button>' +
      '<button class="btn btn-primary" data-next><span>Berikutnya</span>' + ikon('right') + '</button></nav></div>';
    const elSoal = document.getElementById('uj-soal'), elTimer = document.getElementById('uj-timer'), elSimpan = document.getElementById('uj-simpan');
    const terjawab = (s) => S.jawaban[s.id_soal] !== undefined && String(S.jawaban[s.id_soal]).trim() !== '';
    function tampil() {
      const s = soal[S.idx];
      let input = '';
      if (s.tipe === 'pg') input = '<div class="opsi" role="radiogroup">' + s.opsi.map((o, i) => '<button type="button" role="radio" class="opsi-item ' + (S.jawaban[s.id_soal] === o.k ? 'dipilih' : '') + '" aria-checked="' + (S.jawaban[s.id_soal] === o.k) + '" data-k="' + esc(o.k) + '"><span class="opsi-huruf">' + 'ABCDE'[i] + '</span><span class="opsi-teks">' + esc(o.t) + '</span></button>').join('') + '</div>';
      else if (s.tipe === 'isian') input = '<label class="field"><span>Jawaban singkat</span><input class="mono" data-isian value="' + esc(S.jawaban[s.id_soal] || '') + '" autocomplete="off" placeholder="Ketik jawaban"></label>';
      else input = '<label class="field"><span>Jawaban uraian</span><textarea data-uraian rows="7" placeholder="Tulis penjelasan Anda">' + esc(S.jawaban[s.id_soal] || '') + '</textarea></label>';
      elSoal.innerHTML = '<article class="kartu kartu-soal"><div class="ks-head"><span class="badge-mono">SOAL ' + (S.idx + 1) + '/' + soal.length + '</span><span class="mono kecil teks-2">Bobot ' + s.bobot + (s.tipe === 'uraian' ? ' · dinilai guru' : '') + '</span></div>' +
        '<div class="prosa soal-teks" id="uj-teks">' + UI.teks(s.pertanyaan) + '</div>' + (s.gambar_url ? '<figure class="soal-gambar"><img src="' + esc(s.gambar_url) + '" alt="Gambar soal" referrerpolicy="no-referrer"></figure>' : '') + input + '</article>';
      UI.rumus(document.getElementById('uj-teks'));
      UI.$$('.opsi-item', elSoal).forEach((b) => { b.classList.add('rumus-ok'); UI.rumus(b); });
      v.querySelector('[data-prev]').disabled = S.idx === 0;
      const akhir = S.idx === soal.length - 1, nb = v.querySelector('[data-next]');
      nb.innerHTML = akhir ? ikon('send') + '<span>Selesai & kirim</span>' : '<span>Berikutnya</span>' + ikon('right');
      nb.classList.toggle('btn-accent', akhir); nb.classList.toggle('btn-primary', !akhir);
      v.querySelector('[data-ragu]').classList.toggle('aktif', !!S.ragu[s.id_soal]);
      elSoal.onclick = (e) => { const b = e.target.closest('.opsi-item'); if (!b) return; ubah(s, b.dataset.k); tampil(); };
      const inp = elSoal.querySelector('[data-isian],[data-uraian]');
      if (inp) inp.addEventListener('input', () => ubah(s, inp.value));
    }
    function ubah(s, val) { S.jawaban[s.id_soal] = val; S.dirty = true; simpanLokal(); elSimpan.innerHTML = ikon('save') + 'Belum tersimpan'; elSimpan.className = 'simpan-status menunggu'; }
    async function simpanServer() {
      if (!S.dirty || S.terkirim || S.mengirim) return;
      S.dirty = false;
      elSimpan.innerHTML = '<span class="spinner"></span>Menyimpan…';
      const res = await API.call('ujian.simpan', { id_percobaan: idP, jawaban: S.jawaban, pindah_tab: S.pindah }, { retry: 1 });
      if (res.success) { S.simpanTerakhir = Date.now(); elSimpan.className = 'simpan-status'; elSimpan.innerHTML = ikon('checkCircle') + 'Tersimpan ' + UI.tgl(new Date(), 'jam'); document.getElementById('uj-offline').hidden = true; }
      else if (res.code === 'SELESAI') { kirim(true); }
      else { S.dirty = true; elSimpan.className = 'simpan-status offline'; elSimpan.innerHTML = ikon('wifiOff') + 'Tersimpan di HP'; document.getElementById('uj-offline').hidden = navigator.onLine; }
    }
    async function kirim(otomatis) {
      if (S.terkirim || S.mengirim) return;
      if (!otomatis) {
        const kosong = soal.filter((s) => !terjawab(s)).length, ragu = soal.filter((s) => S.ragu[s.id_soal]).length;
        const ok = await UI.konfirmasi((kosong ? '<b>' + kosong + ' soal belum dijawab.</b> ' : 'Semua soal sudah dijawab. ') + (ragu ? ragu + ' soal ditandai ragu-ragu. ' : '') + 'Jawaban tidak bisa diubah setelah dikirim.', { judul: 'Kirim jawaban?', ok: 'Kirim sekarang' });
        if (!ok) return;
      }
      S.mengirim = true;
      const ov = UI.modal({ title: otomatis ? 'Waktu habis' : 'Mengirim jawaban', wajib: true, body: '<div class="tengah"><span class="spinner spinner-besar"></span><p class="teks-2">Jangan tutup halaman ini…</p></div>' });
      let res = null;
      for (let i = 0; i < 4 && !(res && res.success); i++) {
        res = await API.call('ujian.kirim', { id_percobaan: idP, jawaban: S.jawaban, pindah_tab: S.pindah }, { retry: 2, timeout: 60000 });
        if (!res.success && res.code !== 'NETWORK' && res.code !== 'BUSY' && res.code !== 'SERVER') break;
      }
      ov.close();
      S.mengirim = false;
      if (res && res.success) {
        S.terkirim = true;
        try { localStorage.removeItem(kunciLokal); sessionStorage.setItem('pl_hasil_' + idP, JSON.stringify(res.data)); } catch (e) { /* abaikan */ }
        UI.toast(res.message || 'Jawaban terkirim!', 'ok', { partikel: true });
        App.go('#/hasil/' + idP);
      } else {
        UI.modal({ title: 'Jawaban belum terkirim', body: '<p>' + esc((res && res.message) || 'Koneksi bermasalah.') + '</p><p class="teks-2">Tenang, jawaban Anda tersimpan di HP ini. Periksa sinyal lalu tekan kirim lagi.</p>',
          actions: [{ label: 'Kirim lagi', cls: 'btn-primary', icon: 'refresh', onClick: (m) => { m.close(); kirim(true); } }] });
      }
    }
    function daftarSoal() {
      UI.modal({ title: 'Daftar soal', sheet: true, body: '<div class="nav-soal">' + soal.map((s, i) => '<button class="' + (terjawab(s) ? 'terjawab ' : '') + (S.ragu[s.id_soal] ? 'ragu ' : '') + (i === S.idx ? 'kini' : '') + '" data-i="' + i + '">' + (i + 1) + '</button>').join('') + '</div>' +
        '<p class="legenda-soal"><i class="lg-terjawab"></i>Terjawab <i class="lg-ragu"></i>Ragu-ragu <i class="lg-kosong"></i>Kosong</p>',
        actions: [{ label: 'Selesai & kirim', cls: 'btn-accent', icon: 'send', onClick: (m) => { m.close(); kirim(false); } }],
        onOpen: (el, close) => el.querySelector('.nav-soal').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { S.idx = Number(b.dataset.i); simpanLokal(); tampil(); close(); } }) });
    }
    v.querySelector('[data-prev]').addEventListener('click', () => { if (S.idx > 0) { S.idx--; simpanLokal(); tampil(); window.scrollTo(0, 0); } });
    v.querySelector('[data-next]').addEventListener('click', () => { if (S.idx < soal.length - 1) { S.idx++; simpanLokal(); tampil(); window.scrollTo(0, 0); } else kirim(false); });
    v.querySelector('[data-ragu]').addEventListener('click', () => { const s = soal[S.idx]; S.ragu[s.id_soal] = !S.ragu[s.id_soal]; simpanLokal(); tampil(); });
    v.querySelector('[data-daftar]').addEventListener('click', daftarSoal);
    const tick = () => {
      const sisa = S.batas - API.now();
      elTimer.textContent = UI.durasi(sisa);
      elTimer.classList.toggle('hampir', sisa < 300000);
      if (sisa <= 0 && !S.terkirim) { clearInterval(tTimer); kirim(true); }
    };
    const tTimer = setInterval(tick, 1000);
    tick();
    const jeda = 30000 + Math.floor(Math.random() * 10000);
    const tSimpan = setInterval(simpanServer, jeda);
    const onVis = () => { if (document.visibilityState === 'hidden' && !S.terkirim) { S.pindah++; S.dirty = true; simpanLokal(); simpanServer(); } };
    const onUnload = (e) => { if (!S.terkirim) { simpanLokal(); e.preventDefault(); e.returnValue = ''; } };
    const onOnline = () => { document.getElementById('uj-offline').hidden = true; simpanServer(); };
    const onOffline = () => { document.getElementById('uj-offline').hidden = false; };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    App.onLeave(() => { clearInterval(tTimer); clearInterval(tSimpan); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('beforeunload', onUnload); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); if (!S.terkirim) { simpanLokal(); simpanServer(); } });
    if (D.percobaan.lanjut) UI.toast('Melanjutkan pengerjaan. Jawaban sebelumnya dipulihkan.', 'info');
    tampil();
    if (S.dirty) simpanServer();
  }, 'siswa');

  // ---------------- HASIL ----------------
  App.rute('/hasil/:id', async (p) => {
    const v = App.view();
    v.innerHTML = App.barAtas('Hasil', '#/ujian') + '<div class="konten" id="h-isi">' + UI.skeleton(2) + '</div>';
    const isi = document.getElementById('h-isi');
    const render = (h) => {
      let atas;
      if (h.status === 'menunggu_koreksi' && h.nilai_terlihat) atas = '<div class="hasil-atas">' + UI.orbit(0, 150, '…', 'menunggu') + '<h1>Menunggu koreksi uraian</h1><p class="teks-2">Nilai akhir muncul setelah guru menilai soal uraian.</p></div>';
      else if (!h.nilai_terlihat) atas = '<div class="hasil-atas">' + ikon('lock', 'ik-besar') + '<h1>Jawaban terkirim</h1><p class="teks-2">Nilai akan dirilis oleh guru.</p></div>';
      else {
        const tuntas = h.nilai_akhir >= h.batas_ketuntasan;
        atas = '<div class="hasil-atas">' + UI.orbit(h.nilai_akhir, 160, UI.angka(h.nilai_akhir), 'nilai') + '<h1>' + esc(h.ujian.judul) + '</h1>' + UI.pill(tuntas ? 'tuntas' : 'belum_tuntas') + '</div>';
      }
      let html = atas;
      if (h.ringkas) html += '<div class="stat-tiga"><div class="stat-mini stat-ok"><b class="mono">' + h.ringkas.benar + '</b><span>Benar</span></div><div class="stat-mini stat-bahaya"><b class="mono">' + h.ringkas.salah + '</b><span>Salah</span></div><div class="stat-mini"><b class="mono">' + h.ringkas.kosong + '</b><span>Kosong</span></div></div>';
      if (h.soal) {
        html += '<section><div class="judul-seksi"><h2>Pembahasan</h2></div><div class="tumpuk" id="h-bahas">' + h.soal.map((s, i) => {
          const benar = s.benar === true, uraian = s.tipe === 'uraian';
          const kunciTeks = s.tipe === 'pg' ? ((s.opsi.find((o) => o.k === s.kunci) || {}).t || s.kunci) : s.tipe === 'isian' ? s.kunci.split('|').join(' / ') : '';
          const jawabTeks = s.tipe === 'pg' ? ((s.opsi.find((o) => o.k === s.jawaban) || {}).t || '—') : (s.jawaban || '—');
          return '<details class="kartu bahas"><summary><span class="badge-mono">' + (i + 1) + '</span><span class="bahas-judul potong-1">' + esc(String(s.pertanyaan).slice(0, 90)) + '</span>' + (uraian ? UI.pill('info', 'Skor ' + s.skor + '/' + s.bobot) : UI.pill(benar ? 'tuntas' : 'belum_tuntas', benar ? 'Benar' : 'Salah')) + '</summary>' +
            '<div class="prosa">' + UI.teks(s.pertanyaan) + '<p><b>Jawaban Anda:</b> ' + esc(jawabTeks) + '</p>' + (kunciTeks ? '<p><b>Kunci:</b> ' + esc(kunciTeks) + '</p>' : '') + (s.pembahasan ? '<div class="rumus-well">' + UI.teks(s.pembahasan) + '</div>' : '') + '</div></details>';
        }).join('') + '</div></section>';
      }
      html += '<a class="btn btn-primary btn-penuh" href="#/ujian">Kembali ke daftar ujian</a>';
      isi.innerHTML = html;
      UI.rumus(document.getElementById('h-bahas'));
    };
    let awal = null;
    try { awal = JSON.parse(sessionStorage.getItem('pl_hasil_' + p.id) || 'null'); } catch (e) { awal = null; }
    if (awal) render(awal);
    API.load('ujian.hasil', { id_percobaan: p.id }, render, { maxAge: 5000, force: true, onError: (r) => { if (!awal) isi.innerHTML = UI.kosong('alert', 'Hasil tidak tersedia', r.message); } });
  }, 'siswa');

  // ---------------- PROFIL ----------------
  App.rute('/profil', async () => {
    const v = App.view(), me = App.me;
    v.innerHTML = App.barAtas('Profil', null) + '<div class="konten"><section class="profil-kepala"><label class="avatar-ubah" title="Ganti foto">' + UI.avatar(me.nama, App.fotoSaya(), 'avatar-xl') +
      '<span class="avatar-edit">' + ikon('camera') + '</span><input type="file" accept="image/*" hidden id="f-foto"></label><h1>' + esc(me.nama) + '</h1><p class="mono teks-2">NIS ' + esc(me.nis) + ' · ' + esc(me.nama_kelas || '') + '</p></section><div id="pr-isi">' + UI.skeleton(2) + '</div>' +
      '<div class="daftar kartu menu-profil"><button class="baris-daftar" data-sandi><span class="ikon-bulat">' + ikon('lock') + '</span><span class="bd-isi"><b>Ganti kata sandi</b></span>' + ikon('right') + '</button>' +
      '<button class="baris-daftar" data-semua><span class="ikon-bulat">' + ikon('shield') + '</span><span class="bd-isi"><b>Keluar dari semua perangkat</b><small>Mencabut sesi di HP/laptop lain</small></span>' + ikon('right') + '</button>' +
      '<button class="baris-daftar teks-bahaya" data-keluar><span class="ikon-bulat ikon-bahaya">' + ikon('logout') + '</span><span class="bd-isi"><b>Keluar</b></span></button></div></div>';
    v.querySelector('[data-sandi]').addEventListener('click', () => App.gantiSandi(false));
    v.querySelector('[data-keluar]').addEventListener('click', App.keluar);
    v.querySelector('[data-semua]').addEventListener('click', async () => {
      if (!(await UI.konfirmasi('Semua perangkat (termasuk yang ini) akan keluar dan harus masuk lagi.', { ok: 'Keluar dari semua', bahaya: true }))) return;
      const r = await API.call('auth.keluarSemua', {});
      if (r.success) App.keluarPaksa('Anda keluar dari semua perangkat.');
    });
    document.getElementById('f-foto').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const b = await UI.potongKotak(f, 256);
      const r = await API.upload('profil.unggahFoto', { berkas: { nama: 'foto.png', tipe: 'image/png', base64: b.base64 } });
      if (UI.hasil(r)) { App.me.punyaFoto = true; try { localStorage.setItem('pl_foto_' + me.id_user, b.dataUrl); localStorage.setItem('pl_me', JSON.stringify(App.me)); } catch (x) { /* abaikan */ } UI.$$('.avatar-xl, .sidebar-profil .avatar').forEach((el) => { el.innerHTML = '<img src="' + b.dataUrl + '" alt="">'; }); }
    });
    API.load('nilai.saya', {}, (d) => {
      const k = d.kehadiran, persenMat = d.progres.total ? Math.round(d.progres.selesai / d.progres.total * 100) : 0;
      document.getElementById('pr-isi').innerHTML = '<div class="grid-2 grid-rapat"><section class="kartu stat-kartu"><span class="label-caps">Kehadiran</span><b class="angka-besar mono">' + (k.persen === '' ? '–' : UI.angka(k.persen, 0) + '%') + '</b><span class="teks-2 kecil">' + k.rekap.hadir + ' hadir · ' + (k.rekap.izin + k.rekap.sakit) + ' izin/sakit · ' + k.rekap.alfa + ' alfa</span><div id="pr-hadir"></div></section>' +
        '<section class="kartu stat-kartu"><span class="label-caps">Rata-rata nilai</span><b class="angka-besar mono">' + UI.angka(d.rata_rata) + '</b><span class="teks-2 kecil">Batas ketuntasan ' + d.batas_ketuntasan + ' · materi ' + persenMat + '% selesai</span></section></div>' +
        '<section class="kartu"><div class="judul-seksi"><h2>Nilai saya</h2></div><div class="daftar">' +
        (d.tugas.filter((t) => t.nilai !== '').concat(d.ujian.filter((u) => u.percobaan)).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).map((x) =>
          '<div class="baris-daftar"><span class="ikon-bulat">' + ikon(x.jenis === 'tugas' ? 'clipboard' : 'timer') + '</span><span class="bd-isi"><b>' + esc(x.judul) + '</b><small>' + esc(UI.tgl(x.tanggal)) + (x.komentar ? ' · “' + esc(x.komentar) + '”' : '') + '</small></span>' +
          (x.nilai !== '' ? '<b class="mono nilai-pill ' + ((x.persen !== undefined ? x.persen : x.nilai) >= d.batas_ketuntasan ? 'ok' : 'bahaya') + '">' + UI.angka(x.nilai) + '</b>' : (x.terlihat === false ? UI.pill('info', 'Belum dirilis') : UI.pill(x.status))) + '</div>').join('') || '<p class="teks-2">Belum ada nilai.</p>') + '</div></section>' +
        (k.riwayat.length ? '<section class="kartu"><div class="judul-seksi"><h2>Riwayat kehadiran</h2></div><div class="daftar">' + k.riwayat.slice(0, 10).map((a) => '<div class="baris-daftar"><span class="bd-isi"><b>' + esc(a.topik) + '</b><small>' + esc(UI.tgl(a.tanggal, 'lengkap')) + (a.keterangan ? ' · ' + esc(a.keterangan) : '') + '</small></span>' + UI.pill(a.status) + '</div>').join('') + '</div></section>' : '');
      if (k.mingguan.length) Grafik.batang(document.getElementById('pr-hadir'), k.mingguan.map((w) => ({ label: UI.tgl(w.minggu, 'singkat'), nilai: w.persen })), { tinggi: 140, satuan: '%', judul: 'Kehadiran per minggu' });
    }, { maxAge: 30000 });
  }, 'siswa');
})();
