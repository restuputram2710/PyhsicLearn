/* =====================================================================
 * Halaman GURU (2/2): bank soal, ujian (penyusun & pantau), laporan,
 * detail siswa, pengaturan (identitas, tema, lokasi, keamanan, sistem).
 * ===================================================================== */
(function () {
  const esc = UI.esc, G = window.GuruUI;
  const TIPE_SOAL = [['pg', 'Pilihan ganda'], ['isian', 'Isian singkat'], ['uraian', 'Uraian']];
  const LABEL_TIPE = { pg: 'PG', isian: 'ISIAN', uraian: 'URAIAN' };
  const PILL_TINGKAT = { mudah: 'ok', sedang: 'info', sulit: 'warn' };

  // =================================================================
  // BANK SOAL
  // =================================================================
  function formSoal(s, onSaved) {
    s = s || { tipe: 'pg', topik: 'Mekanika', tingkat_kesulitan: 'sedang', bobot: 1, opsi: [], kunci: '' };
    let tipe = s.tipe, gambar = null;
    const opsi = 'ABCDE'.split('').map((k) => (s.opsi.find((o) => o.k === k) || { k, t: '' }));
    UI.modal({ title: s.id_soal ? 'Ubah soal' : 'Soal baru', wide: true, body: '<form class="form"><div class="field"><span>Tipe soal</span>' + UI.segmen('tipe', TIPE_SOAL, tipe) + '</div>' +
      '<div class="grid-3"><label class="field"><span>Topik</span><select name="topik">' + G.opsiTopik(s.topik) + '</select></label><label class="field"><span>Tingkat</span><select name="tingkat_kesulitan">' + ['mudah', 'sedang', 'sulit'].map((t) => '<option' + (t === s.tingkat_kesulitan ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label><label class="field"><span>Bobot</span><input type="number" name="bobot" min="1" max="100" value="' + s.bobot + '"></label></div>' +
      '<div class="grid-2 grid-atas"><div><label class="field"><span>Pertanyaan</span><textarea name="pertanyaan" id="sf-q" rows="5" required>' + esc(s.pertanyaan || '') + '</textarea>' + G.rumusBantu('sf-q') + '</label>' +
      '<label class="field"><span>Gambar pendukung <em>(opsional)</em></span><input type="file" name="gbr" accept="image/*">' + (s.gambar_url ? '<label class="cek"><input type="checkbox" name="hapusGambar" value="1"> Hapus gambar lama</label>' : '') + '</label>' +
      '<div id="sf-jawab"></div><label class="field"><span>Pembahasan</span><textarea name="pembahasan" id="sf-p" rows="3">' + esc(s.pembahasan || '') + '</textarea></label></div>' +
      '<div class="field"><span>Pratinjau siswa</span><div class="kartu kartu-soal pratinjau"><div class="prosa" id="sf-pv"></div>' + (s.gambar_url ? '<img class="soal-gambar" src="' + esc(s.gambar_url) + '" alt="" referrerpolicy="no-referrer">' : '') + '<div id="sf-pv-opsi"></div></div></div></div></form>',
      actions: [{ label: 'Batal' }, { label: 'Simpan soal', cls: 'btn-primary', icon: 'save', onClick: simpan }],
      onOpen: (el) => {
        const jawab = () => {
          const box = el.querySelector('#sf-jawab');
          if (tipe === 'pg') box.innerHTML = '<div class="field"><span>Opsi jawaban — pilih kunci</span><div class="opsi-edit">' + opsi.map((o) => '<label class="opsi-edit-baris"><input type="radio" name="kunci" value="' + o.k + '"' + (s.kunci === o.k ? ' checked' : '') + ' aria-label="Kunci ' + o.k + '"><b class="mono">' + o.k + '</b><input name="opsi_' + o.k + '" value="' + esc(o.t) + '" placeholder="' + (o.k === 'E' ? 'Opsi E (opsional)' : 'Opsi ' + o.k) + '"></label>').join('') + '</div></div>';
          else if (tipe === 'isian') box.innerHTML = '<label class="field"><span>Kunci jawaban</span><input name="kunci" class="mono" value="' + esc(s.tipe === 'isian' ? s.kunci : '') + '" placeholder="5 m/s²|5"><small>Pisahkan beberapa jawaban benar dengan tanda |. Huruf besar/kecil dan spasi diabaikan.</small></label>';
          else box.innerHTML = '<label class="field"><span>Rubrik / kunci penilaian</span><textarea name="kunci" rows="3" placeholder="Poin yang harus ada dalam jawaban">' + esc(s.tipe === 'uraian' ? s.kunci : '') + '</textarea><small>Hanya terlihat guru saat mengoreksi.</small></label>';
          pv();
        };
        const pv = UI.debounce(() => {
          const q = el.querySelector('#sf-q').value, box = el.querySelector('#sf-pv');
          box.innerHTML = q ? UI.teks(q) : '<span class="teks-2">Pertanyaan tampil di sini.</span>'; UI.rumus(box);
          const o = el.querySelector('#sf-pv-opsi');
          o.innerHTML = tipe === 'pg' ? '<div class="opsi">' + 'ABCDE'.split('').map((k) => { const i = el.querySelector('[name=opsi_' + k + ']'); return i && i.value ? '<div class="opsi-item ' + (el.querySelector('[name=kunci]:checked') && el.querySelector('[name=kunci]:checked').value === k ? 'dipilih' : '') + '"><span class="opsi-huruf">' + k + '</span><span class="opsi-teks">' + esc(i.value) + '</span></div>' : ''; }).join('') + '</div>' : tipe === 'isian' ? '<div class="input-palsu">Jawaban singkat…</div>' : '<div class="input-palsu tinggi">Jawaban uraian…</div>';
          UI.rumus(o);
        }, 200);
        UI.pasangSegmen(el, 'tipe', (x) => { tipe = x; jawab(); });
        G.pasangRumus(el, 'sf-q');
        el.addEventListener('input', pv);
        el.addEventListener('change', pv);
        el.querySelector('[name=gbr]').addEventListener('change', async (e) => { if (e.target.files[0]) gambar = await UI.kompresGambar(e.target.files[0], 1400, 0.85); });
        jawab();
      } });
    async function simpan(x) {
      const o = G.form(x.el);
      const d = { id_soal: s.id_soal, tipe, topik: o.topik, tingkat_kesulitan: o.tingkat_kesulitan, bobot: Number(o.bobot), pertanyaan: o.pertanyaan, pembahasan: o.pembahasan, kunci: o.kunci || '', hapusGambar: !!o.hapusGambar };
      if (tipe === 'pg') d.opsi = 'ABCDE'.split('').map((k) => ({ k, t: o['opsi_' + k] || '' }));
      if (gambar) d.gambar = { nama: gambar.nama, tipe: gambar.tipe, base64: gambar.base64 };
      await UI.sibuk(x.btn, async () => { const r = gambar ? await API.upload('soal.simpan', d) : await API.call('soal.simpan', d); if (UI.hasil(r)) { x.close(); onSaved && onSaved(r.data); } });
    }
  }
  G.formSoal = formSoal;

  App.rute('/g/soal', async () => {
    App.judul('Bank Soal', 'Simpan sekali, pakai berulang kali');
    const v = App.view();
    const st = { soal: [], cari: '', topik: '', tipe: '', tingkat: '' };
    v.innerHTML = '<div class="konten-lebar"><section class="kartu"><div class="toolbar"><div class="cari cari-terang"><span>' + ikon('search') + '</span><input id="bs-cari" placeholder="Cari isi soal" aria-label="Cari soal"></div>' +
      '<select id="bs-topik" aria-label="Topik">' + G.opsiTopik('', 'Semua topik') + '</select><select id="bs-tipe" aria-label="Tipe"><option value="">Semua tipe</option>' + TIPE_SOAL.map((t) => '<option value="' + t[0] + '">' + t[1] + '</option>').join('') + '</select>' +
      '<select id="bs-tingkat" aria-label="Tingkat"><option value="">Semua tingkat</option><option>mudah</option><option>sedang</option><option>sulit</option></select><span class="toolbar-isi"></span>' +
      '<button class="btn btn-ghost" data-impor>' + ikon('upload') + 'Impor templat</button><button class="btn btn-primary" data-baru>' + ikon('plus') + 'Soal baru</button></div><div id="bs-isi">' + UI.skeleton(4, 'baris') + '</div></section></div>';
    function render() {
      const kata = st.cari.toLowerCase();
      const list = st.soal.filter((s) => (!st.topik || s.topik === st.topik) && (!st.tipe || s.tipe === st.tipe) && (!st.tingkat || s.tingkat_kesulitan === st.tingkat) && (!kata || s.pertanyaan.toLowerCase().indexOf(kata) > -1));
      const el = document.getElementById('bs-isi');
      el.innerHTML = list.length ? '<p class="kecil teks-2">' + list.length + ' dari ' + st.soal.length + ' soal</p><div class="tumpuk">' + list.map((s) => '<article class="kartu-soal-ringkas"><div class="ksr-kepala"><span class="badge-mono">' + LABEL_TIPE[s.tipe] + '</span><span class="chip-topik-label">' + ikonTopik(s.topik) + esc(s.topik) + '</span>' + UI.pill(PILL_TINGKAT[s.tingkat_kesulitan], s.tingkat_kesulitan) + '<span class="mono kecil teks-2">bobot ' + s.bobot + (s.dipakai ? ' · dipakai ' + s.dipakai + '×' : '') + '</span><span class="sel-aksi"><button class="btn-ikon" data-ubah="' + esc(s.id_soal) + '" aria-label="Ubah">' + ikon('edit') + '</button><button class="btn-ikon" data-hapus="' + esc(s.id_soal) + '" aria-label="Hapus">' + ikon('trash') + '</button></span></div>' +
        '<div class="prosa potong-3">' + UI.teks(s.pertanyaan) + '</div>' + (s.tipe === 'pg' ? '<p class="kecil teks-2">Kunci: <b class="mono">' + esc(s.kunci) + '</b> · ' + esc((s.opsi.find((o) => o.k === s.kunci) || {}).t || '') + '</p>' : s.tipe === 'isian' ? '<p class="kecil teks-2">Kunci: <b class="mono">' + esc(s.kunci.split('|').join(' / ')) + '</b></p>' : '') + '</article>').join('') + '</div>'
        : UI.kosong('layers', st.soal.length ? 'Tidak ada soal yang cocok' : 'Bank soal masih kosong', st.soal.length ? '' : 'Tambahkan soal pilihan ganda, isian, atau uraian — lengkap dengan rumus dan gambar.', '<button class="btn btn-primary" data-baru>' + ikon('plus') + 'Soal baru</button>');
      UI.rumus(el);
    }
    async function muat(paksa) { const r = await API.load('soal.list', {}, (d) => { st.soal = d; render(); }, { force: !!paksa, maxAge: 30000 }); if (!r.success) document.getElementById('bs-isi').innerHTML = UI.kosong('alert', 'Gagal memuat', r.message); }
    function impor() {
      let baris = null;
      UI.modal({ title: 'Impor soal dari templat', wide: true, body: '<ol class="langkah"><li>Unduh templat, isi di Excel/Google Sheets (satu baris = satu soal).</li><li>Simpan sebagai .xlsx atau .csv, lalu pilih berkasnya di bawah.</li><li>Periksa hasil pratinjau, lalu impor.</li></ol>' +
        '<button class="btn btn-tipis" data-templat>' + ikon('download') + 'Unduh templat CSV</button>' + G.dropzone('is', 'Pilih berkas soal (.xlsx / .csv)', '.csv,.xlsx,.xls') + '<div id="is-hasil"></div>',
        actions: [{ label: 'Tutup' }, { label: 'Impor soal valid', cls: 'btn-primary', icon: 'upload', onClick: async (m) => {
          if (!baris) return UI.toast('Pilih berkas terlebih dahulu.', 'error');
          await UI.sibuk(m.btn, async () => { const r = await API.call('soal.impor', { baris }); if (UI.hasil(r)) { m.close(); muat(true); } });
        } }],
        onOpen: (el) => {
          el.querySelector('[data-templat]').addEventListener('click', () => UI.unduhCSV('templat-soal-physicslearn.csv', [['topik', 'tipe', 'pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e', 'kunci', 'bobot', 'pembahasan', 'tingkat'],
            ['Mekanika', 'pg', 'Benda 2 kg didorong gaya 10 N. Percepatannya?', '2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²', '', 'B', '2', 'a = F/m = 5 m/s²', 'mudah'],
            ['Optik', 'isian', 'Satuan indeks bias adalah…', '', '', '', '', '', 'tidak ada|tanpa satuan', '1', 'Indeks bias tidak bersatuan', 'sedang'],
            ['Termodinamika', 'uraian', 'Jelaskan hukum I termodinamika.', '', '', '', '', '', 'Q = ΔU + W', '3', '', 'sulit']]));
          G.pasangDropzone(el, 'is', async (f) => {
            try {
              baris = await UI.bacaTabel(f);
              const r = await API.call('soal.impor', { baris, dryRun: true });
              el.querySelector('#is-hasil').innerHTML = r.success ? '<p class="' + (r.data.valid ? 'teks-ok' : 'teks-bahaya') + '">' + ikon(r.data.valid ? 'checkCircle' : 'alert') + '<b>' + r.data.valid + ' soal valid</b> dari ' + baris.length + ' baris.</p>' + (r.data.galat.length ? '<details class="peringatan" open><summary>' + r.data.galat.length + ' baris bermasalah</summary><ul>' + r.data.galat.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul></details>' : '') : '<p class="teks-bahaya">' + esc(r.message) + '</p>';
            } catch (e) { UI.toast(e.message, 'error'); }
          });
        } });
    }
    v.addEventListener('click', async (e) => {
      if (e.target.closest('[data-baru]')) return formSoal(null, () => muat(true));
      if (e.target.closest('[data-impor]')) return impor();
      const u = e.target.closest('[data-ubah]'); if (u) return formSoal(st.soal.find((s) => s.id_soal === u.dataset.ubah), () => muat(true));
      const h = e.target.closest('[data-hapus]');
      if (h && await UI.konfirmasi('Hapus soal ini dari bank soal?', { ok: 'Hapus', bahaya: true })) { const r = await API.call('soal.hapus', { id_soal: h.dataset.hapus }); if (UI.hasil(r)) muat(true); }
    });
    document.getElementById('bs-cari').addEventListener('input', UI.debounce((e) => { st.cari = e.target.value.trim(); render(); }, 200));
    ['topik', 'tipe', 'tingkat'].forEach((k) => document.getElementById('bs-' + k).addEventListener('change', (e) => { st[k] = e.target.value; render(); }));
    muat(false);
  }, 'guru');

  // =================================================================
  // UJIAN — daftar
  // =================================================================
  App.rute('/g/ujian', async () => {
    App.judul('Ujian & Latihan', 'Susun dari bank soal, nilai otomatis');
    const v = App.view();
    const st = { kelas: [], ujian: [], fKelas: '' };
    v.innerHTML = '<div class="konten-lebar"><section class="kartu"><div class="toolbar"><select id="gu-kelas" aria-label="Kelas"><option value="">Semua kelas</option></select><span class="toolbar-isi"></span><a class="btn btn-primary" href="#/g/ujian/baru">' + ikon('plus') + 'Ujian baru</a></div><div id="gu-isi">' + UI.skeleton(4, 'baris') + '</div></section></div>';
    function render() {
      const list = st.ujian.filter((u) => !st.fKelas || u.id_kelas === st.fKelas);
      document.getElementById('gu-isi').innerHTML = list.length ? '<div class="tabel-wadah"><table class="tabel tabel-responsif"><thead><tr><th>Judul</th><th>Kelas</th><th>Jadwal</th><th>Pengerjaan</th><th>Rata-rata</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' + list.map((u) =>
        '<tr><td data-label="Judul">' + UI.pill(u.jenis) + ' <b>' + esc(u.judul) + '</b>' + (u.menunggu_koreksi ? ' <span class="pill pill-warn">' + u.menunggu_koreksi + ' perlu koreksi</span>' : '') + '<br><small class="teks-2 mono">' + u.jumlah_soal + ' soal · ' + u.durasi_menit + ' menit · ' + u.maks_percobaan + '× percobaan · ' + (u.mode_nilai === 'setelah' ? (u.nilai_dirilis ? 'nilai dirilis' : 'nilai belum dirilis') : 'nilai langsung') + '</small></td>' +
        '<td data-label="Kelas">' + esc(u.nama_kelas) + '</td><td data-label="Jadwal" class="mono kecil">' + esc(UI.tgl(u.mulai, 'lengkap')) + '<br>s.d. ' + esc(UI.tgl(u.selesai, 'lengkap')) + '<br>' + UI.pill(u.jendela) + '</td>' +
        '<td data-label="Pengerjaan" class="mono">' + u.jumlah_percobaan + (u.mengerjakan ? ' <small class="teks-warn">(' + u.mengerjakan + ' aktif)</small>' : '') + '</td><td data-label="Rata-rata" class="mono">' + UI.angka(u.rata_rata) + '</td><td data-label="Status">' + UI.pill(u.status) + '</td>' +
        '<td data-label="Aksi" class="sel-aksi"><a class="btn btn-tipis" href="#/g/ujian/' + esc(u.id_ujian) + '/pantau">' + ikon('eye') + 'Pantau</a><a class="btn-ikon" href="#/g/ujian/' + esc(u.id_ujian) + '/ubah" aria-label="Ubah">' + ikon('edit') + '</a><button class="btn-ikon" data-hapus="' + esc(u.id_ujian) + '" aria-label="Hapus">' + ikon('trash') + '</button></td></tr>').join('') + '</tbody></table></div>'
        : UI.kosong('timer', 'Belum ada ujian', 'Susun latihan atau ujian dari bank soal. Nilai pilihan ganda & isian dihitung otomatis.', '<a class="btn btn-primary" href="#/g/ujian/baru">' + ikon('plus') + 'Ujian baru</a>');
    }
    async function muat(paksa) {
      const [k, u] = await Promise.all([API.load('kelas.list', {}, null, { maxAge: 60000 }), API.load('ujian.list', {}, null, { force: !!paksa, maxAge: 15000 })]);
      st.kelas = k.success ? k.data : []; st.ujian = u.success ? u.data : [];
      document.getElementById('gu-kelas').innerHTML = '<option value="">Semua kelas</option>' + G.opsiKelas(st.kelas, st.fKelas);
      render();
    }
    v.addEventListener('click', async (e) => {
      const h = e.target.closest('[data-hapus]'); if (!h) return;
      const u = st.ujian.find((x) => x.id_ujian === h.dataset.hapus);
      const el = await UI.konfirmasi('Hapus <b>' + esc(u.judul) + '</b>?', { ok: 'Hapus', bahaya: true, extra: u.jumlah_percobaan ? '<label class="cek"><input type="checkbox" data-paksa> Hapus beserta ' + u.jumlah_percobaan + ' pengerjaan dan nilainya</label>' : '' });
      if (!el) return;
      const r = await API.call('ujian.hapus', { id_ujian: u.id_ujian, paksa: el !== true && el.querySelector('[data-paksa]') && el.querySelector('[data-paksa]').checked });
      if (UI.hasil(r)) muat(true);
    });
    document.getElementById('gu-kelas').addEventListener('change', (e) => { st.fKelas = e.target.value; render(); });
    muat(false);
  }, 'guru');

  // =================================================================
  // UJIAN — penyusun (3 langkah)
  // =================================================================
  async function penyusun(p) {
    const edit = !!p.id;
    App.judul(edit ? 'Ubah Ujian' : 'Ujian Baru', 'Info · pilih soal · pengaturan');
    const v = App.view();
    v.innerHTML = '<div class="konten-lebar">' + UI.skeleton(3) + '</div>';
    const [k, s, u] = await Promise.all([API.load('kelas.list', {}, null, { maxAge: 60000 }), API.load('soal.list', {}, null, { maxAge: 30000 }), edit ? API.call('ujian.detailGuru', { id_ujian: p.id }) : Promise.resolve({ success: true, data: null })]);
    if (!u.success) { v.innerHTML = '<div class="konten-lebar">' + UI.kosong('alert', 'Ujian tidak ditemukan', u.message) + '</div>'; return; }
    const kelas = k.data || [], bank = s.data || [];
    const now = new Date(); now.setMinutes(0, 0, 0); now.setHours(now.getHours() + 1);
    const U = u.data || { jenis: 'latihan', id_kelas: kelas[0] && kelas[0].id_kelas, soal_ids: [], durasi_menit: 60, mulai: now.toISOString(), selesai: new Date(now.getTime() + 7 * 86400000).toISOString(), maks_percobaan: 1, acak_soal: true, acak_opsi: true, mode_nilai: 'langsung' };
    const st = { langkah: 1, pilih: U.soal_ids.slice(), f: { topik: '', tipe: '', cari: '' } };
    const byId = {}; bank.forEach((x) => { byId[x.id_soal] = x; });
    v.innerHTML = '<div class="konten-lebar"><a class="tautan" href="#/g/ujian">' + ikon('left') + 'Semua ujian</a><div class="stepper" id="up-step"></div><form id="up-form" class="kartu form">' +
      '<div data-l="1"><h2>1 · Informasi</h2><label class="field"><span>Judul</span><input name="judul" value="' + esc(U.judul || '') + '" placeholder="cth. Ulangan Harian Dinamika" required></label>' +
      '<div class="grid-3"><div class="field"><span>Jenis</span>' + UI.segmen('jenis', [['latihan', 'Latihan'], ['ujian', 'Ujian']], U.jenis) + '</div><label class="field"><span>Kelas</span><select name="id_kelas">' + G.opsiKelas(kelas, U.id_kelas) + '</select></label><label class="field"><span>Topik utama</span><select name="topik">' + G.opsiTopik(U.topik, '— campuran —') + '</select></label></div>' +
      '<p class="catatan">' + ikon('info') + '<b>Latihan</b>: nilai & pembahasan langsung tampil setelah selesai. <b>Ujian</b>: tampil nilai sesuai pengaturan di langkah 3.</p></div>' +
      '<div data-l="2" hidden><h2>2 · Pilih soal</h2><div class="grid-penyusun"><div class="kartu kartu-dalam"><div class="toolbar"><div class="cari cari-terang"><span>' + ikon('search') + '</span><input data-f="cari" placeholder="Cari soal" aria-label="Cari soal"></div><select data-f="topik" aria-label="Topik">' + G.opsiTopik('', 'Semua topik') + '</select><select data-f="tipe" aria-label="Tipe"><option value="">Semua tipe</option>' + TIPE_SOAL.map((t) => '<option value="' + t[0] + '">' + t[1] + '</option>').join('') + '</select><button type="button" class="btn btn-tipis" data-soal-baru>' + ikon('plus') + 'Soal baru</button></div><div id="up-bank" class="daftar daftar-gulir"></div></div>' +
      '<div class="kartu kartu-dalam"><div class="judul-seksi"><h3>Soal terpilih</h3><span class="chip mono" id="up-total"></span></div><div id="up-pilih" class="daftar daftar-gulir"></div></div></div></div>' +
      '<div data-l="3" hidden><h2>3 · Pengaturan</h2><div class="grid-3"><label class="field"><span>Mulai</span><input type="datetime-local" name="mulai" value="' + esc(UI.isoLokal(U.mulai)) + '"></label><label class="field"><span>Selesai</span><input type="datetime-local" name="selesai" value="' + esc(UI.isoLokal(U.selesai)) + '"></label><label class="field"><span>Durasi pengerjaan (menit)</span><input type="number" name="durasi_menit" min="5" max="600" value="' + U.durasi_menit + '"></label></div>' +
      '<div class="grid-3"><label class="field"><span>Maks. percobaan</span><input type="number" name="maks_percobaan" min="1" max="20" value="' + U.maks_percobaan + '"></label><div class="field"><span>Acak</span><label class="cek"><input type="checkbox" name="acak_soal" value="1"' + (U.acak_soal ? ' checked' : '') + '> Urutan soal</label><label class="cek"><input type="checkbox" name="acak_opsi" value="1"' + (U.acak_opsi ? ' checked' : '') + '> Urutan opsi PG</label></div>' +
      '<div class="field"><span>Tampil nilai (ujian)</span>' + UI.segmen('mode', [['langsung', 'Langsung'], ['setelah', 'Setelah dirilis']], U.mode_nilai) + '</div></div>' +
      '<p class="catatan">' + ikon('shield') + 'Jawaban siswa tersimpan otomatis di HP dan server tiap ±30 detik. Saat waktu habis, jawaban terkirim otomatis. Perpindahan tab dicatat untuk Anda, tanpa memblokir siswa.</p></div>' +
      '<div class="aksi-baris aksi-akhir"><button type="button" class="btn btn-ghost" data-mundur>' + ikon('left') + 'Kembali</button><span class="toolbar-isi"></span><button type="button" class="btn btn-ghost" data-simpan="draf">' + ikon('save') + 'Simpan draf</button><button type="button" class="btn btn-primary" data-maju>Lanjut ' + ikon('right') + '</button><button type="button" class="btn btn-primary" data-simpan="terbit" hidden>' + ikon('send') + 'Terbitkan</button></div></form></div>';
    let jenis = U.jenis, mode = U.mode_nilai;
    UI.pasangSegmen(v, 'jenis', (x) => { jenis = x; });
    UI.pasangSegmen(v, 'mode', (x) => { mode = x; });
    const langkah = (n) => {
      st.langkah = n;
      UI.$$('[data-l]', v).forEach((el) => { el.hidden = Number(el.dataset.l) !== n; });
      document.getElementById('up-step').innerHTML = ['Informasi', 'Pilih soal', 'Pengaturan'].map((t, i) => '<button type="button" class="' + (i + 1 === n ? 'aktif' : i + 1 < n ? 'lewat' : '') + '" data-ke="' + (i + 1) + '"><b>' + (i + 1) + '</b>' + t + '</button>').join('');
      v.querySelector('[data-mundur]').disabled = n === 1;
      v.querySelector('[data-maju]').hidden = n === 3; v.querySelector('[data-simpan="terbit"]').hidden = n !== 3;
      if (n === 2) renderBank();
    };
    function renderBank() {
      const kata = st.f.cari.toLowerCase();
      const list = bank.filter((x) => (!st.f.topik || x.topik === st.f.topik) && (!st.f.tipe || x.tipe === st.f.tipe) && (!kata || x.pertanyaan.toLowerCase().indexOf(kata) > -1));
      document.getElementById('up-bank').innerHTML = list.map((x) => '<label class="baris-daftar baris-soal"><input type="checkbox" data-id="' + esc(x.id_soal) + '"' + (st.pilih.indexOf(x.id_soal) > -1 ? ' checked' : '') + '><span class="badge-mono">' + LABEL_TIPE[x.tipe] + '</span><span class="bd-isi"><b class="potong-2">' + esc(x.pertanyaan) + '</b><small>' + esc(x.topik) + ' · ' + x.tingkat_kesulitan + ' · bobot ' + x.bobot + '</small></span></label>').join('') || UI.kosong('layers', 'Tidak ada soal', 'Tambah soal baru atau ubah filter.');
      const total = st.pilih.reduce((a, id) => a + (byId[id] ? byId[id].bobot : 0), 0);
      document.getElementById('up-total').textContent = st.pilih.length + ' soal · ' + total + ' poin';
      document.getElementById('up-pilih').innerHTML = st.pilih.map((id, i) => byId[id] ? '<div class="baris-daftar"><span class="badge-mono">' + (i + 1) + '</span><span class="bd-isi"><b class="potong-1">' + esc(byId[id].pertanyaan) + '</b><small>' + LABEL_TIPE[byId[id].tipe] + ' · bobot ' + byId[id].bobot + '</small></span><span class="sel-aksi"><button type="button" class="btn-ikon btn-ikon-kecil" data-up="' + i + '" aria-label="Naikkan"' + (i === 0 ? ' disabled' : '') + '>' + ikon('arrowUp') + '</button><button type="button" class="btn-ikon btn-ikon-kecil" data-down="' + i + '" aria-label="Turunkan"' + (i === st.pilih.length - 1 ? ' disabled' : '') + '>' + ikon('arrowDown') + '</button><button type="button" class="btn-ikon btn-ikon-kecil" data-buang="' + i + '" aria-label="Keluarkan">' + ikon('x') + '</button></span></div>' : '').join('') || '<p class="teks-2 kecil">Centang soal di sebelah kiri.</p>';
    }
    v.addEventListener('change', (e) => {
      const c = e.target.closest('[data-id]');
      if (c) { const id = c.dataset.id, i = st.pilih.indexOf(id); if (c.checked && i < 0) st.pilih.push(id); if (!c.checked && i > -1) st.pilih.splice(i, 1); renderBank(); }
      const f = e.target.closest('[data-f]'); if (f && f.tagName === 'SELECT') { st.f[f.dataset.f] = f.value; renderBank(); }
    });
    v.addEventListener('input', UI.debounce((e) => { const f = e.target.closest('[data-f="cari"]'); if (f) { st.f.cari = f.value.trim(); renderBank(); } }, 200));
    v.addEventListener('click', async (e) => {
      const t = e.target;
      const ke = t.closest('[data-ke]'); if (ke) return langkah(Number(ke.dataset.ke));
      if (t.closest('[data-maju]')) { if (st.langkah === 1 && !v.querySelector('[name=judul]').value.trim()) return UI.toast('Isi judul terlebih dahulu.', 'error'); return langkah(st.langkah + 1); }
      if (t.closest('[data-mundur]')) return langkah(st.langkah - 1);
      if (t.closest('[data-soal-baru]')) return G.formSoal(null, async (d) => { const r = await API.load('soal.list', {}, null, { force: true }); bank.splice(0, bank.length, ...(r.data || [])); bank.forEach((x) => { byId[x.id_soal] = x; }); if (d && d.id_soal) st.pilih.push(d.id_soal); renderBank(); });
      const up = t.closest('[data-up]'); if (up) { const i = Number(up.dataset.up); st.pilih.splice(i - 1, 0, st.pilih.splice(i, 1)[0]); return renderBank(); }
      const dn = t.closest('[data-down]'); if (dn) { const i = Number(dn.dataset.down); st.pilih.splice(i + 1, 0, st.pilih.splice(i, 1)[0]); return renderBank(); }
      const bu = t.closest('[data-buang]'); if (bu) { st.pilih.splice(Number(bu.dataset.buang), 1); return renderBank(); }
      const sim = t.closest('[data-simpan]');
      if (sim) {
        const o = G.form(document.getElementById('up-form'));
        const d = { id_ujian: p.id, judul: o.judul, id_kelas: o.id_kelas, topik: o.topik, jenis, soal_ids: st.pilih, durasi_menit: Number(o.durasi_menit), mulai: o.mulai ? new Date(o.mulai).toISOString() : '', selesai: o.selesai ? new Date(o.selesai).toISOString() : '',
          maks_percobaan: Number(o.maks_percobaan), acak_soal: !!o.acak_soal, acak_opsi: !!o.acak_opsi, mode_nilai: mode, status: sim.dataset.simpan };
        if (!d.judul) { langkah(1); return UI.toast('Isi judul terlebih dahulu.', 'error'); }
        if (d.status === 'terbit' && !d.soal_ids.length) { langkah(2); return UI.toast('Pilih minimal satu soal.', 'error'); }
        await UI.sibuk(sim, async () => { const r = await API.call('ujian.simpanGuru', d); if (UI.hasil(r)) App.go('#/g/ujian'); });
      }
    });
    langkah(1);
  }
  App.rute('/g/ujian/baru', () => penyusun({}), 'guru');
  App.rute('/g/ujian/:id/ubah', (p) => penyusun(p), 'guru');

  // =================================================================
  // UJIAN — pantau & koreksi uraian
  // =================================================================
  App.rute('/g/ujian/:id/pantau', async (p) => {
    App.judul('Pantau Ujian', 'Pengerjaan langsung & koreksi uraian');
    const v = App.view();
    v.innerHTML = '<div class="konten-lebar"><a class="tautan" href="#/g/ujian">' + ikon('left') + 'Semua ujian</a><div id="pt">' + UI.skeleton(3) + '</div></div>';
    const el = document.getElementById('pt');
    let data = null;
    function render(d) {
      data = d;
      const u = d.ujian, s = d.siswa;
      const n = { belum: s.filter((x) => x.status === 'belum').length, aktif: s.filter((x) => x.status === 'mengerjakan').length, selesai: s.filter((x) => ['selesai', 'dinilai'].indexOf(x.status) > -1).length, koreksi: d.koreksi.filter((x) => x.status === 'menunggu_koreksi').length };
      const nilai = s.filter((x) => x.nilai_terbaik !== '').map((x) => x.nilai_terbaik), rata = nilai.length ? nilai.reduce((a, b) => a + b, 0) / nilai.length : '';
      el.innerHTML = '<div class="judul-seksi"><div><span class="label-caps">' + esc(u.nama_kelas) + ' · ' + u.jumlah_soal + ' soal · ' + u.durasi_menit + ' menit</span><h1 class="judul-halaman">' + UI.pill(u.jenis) + ' ' + esc(u.judul) + '</h1></div>' +
        (u.mode_nilai === 'setelah' && u.jenis === 'ujian' ? '<button class="btn ' + (u.nilai_dirilis ? 'btn-ghost' : 'btn-accent') + '" data-rilis="' + (u.nilai_dirilis ? '0' : '1') + '">' + ikon(u.nilai_dirilis ? 'eyeOff' : 'send') + (u.nilai_dirilis ? 'Tarik rilis nilai' : 'Rilis nilai ke siswa') + '</button>' : '') + '</div>' +
        '<div class="grid-stat"><div class="kartu stat-kartu"><span>Sedang mengerjakan</span><b class="angka-besar mono">' + n.aktif + '</b></div><div class="kartu stat-kartu"><span>Selesai</span><b class="angka-besar mono">' + n.selesai + '<small>/' + s.length + '</small></b></div><div class="kartu stat-kartu ' + (n.koreksi ? 'stat-warn' : '') + '"><span>Perlu koreksi uraian</span><b class="angka-besar mono">' + n.koreksi + '</b></div><div class="kartu stat-kartu"><span>Rata-rata nilai</span><b class="angka-besar mono">' + UI.angka(rata) + '</b></div></div>' +
        '<section class="kartu"><div class="judul-seksi"><h2>Siswa</h2><span class="label-caps">' + (u.jendela === 'berlangsung' ? '<i class="denyut"></i>Diperbarui tiap 20 detik' : UI.pill(u.jendela)) + '</span></div><div class="tabel-wadah"><table class="tabel tabel-responsif"><thead><tr><th>Nama</th><th>Status</th><th>Terjawab</th><th>Sisa waktu</th><th>Pindah tab</th><th>Nilai</th><th></th></tr></thead><tbody>' + s.map((x) =>
          '<tr><td data-label="Nama"><b>' + esc(x.nama) + '</b><br><small class="mono teks-2">' + esc(x.nis) + (x.percobaan > 1 ? ' · ' + x.percobaan + ' percobaan' : '') + '</small></td><td data-label="Status">' + UI.pill(x.status === 'belum' ? 'netral' : x.status, x.status === 'belum' ? 'Belum mulai' : null) + '</td><td data-label="Terjawab" class="mono">' + (x.status === 'belum' ? '–' : x.terjawab + '/' + u.jumlah_soal) + '</td>' +
          '<td data-label="Sisa" class="mono">' + (x.status === 'mengerjakan' ? UI.durasi(x.sisa_ms) : '–') + '</td><td data-label="Pindah tab" class="mono ' + (x.pindah_tab >= 3 ? 'teks-warn' : '') + '">' + (x.status === 'belum' ? '–' : x.pindah_tab) + '</td><td data-label="Nilai" class="mono"><b>' + UI.angka(x.nilai_terbaik) + '</b></td><td>' + (x.id_percobaan && x.status !== 'mengerjakan' ? '<button class="btn btn-tipis" data-lihat="' + esc(x.id_percobaan) + '">Jawaban</button>' : '') + '</td></tr>').join('') + '</tbody></table></div></section>' +
        (d.koreksi.length ? '<section class="kartu"><div class="judul-seksi"><h2>Koreksi uraian</h2><span class="teks-2 kecil">' + n.koreksi + ' menunggu</span></div><div class="tumpuk">' + d.koreksi.map((k) =>
          '<form class="kartu kartu-dalam form-koreksi" data-p="' + esc(k.id_percobaan) + '"><div class="judul-seksi"><div><b>' + esc(k.nama) + '</b> <small class="mono teks-2">' + esc(k.nis) + ' · skor otomatis ' + k.skor_otomatis + '</small></div>' + UI.pill(k.status) + '</div>' + k.uraian.map((q) =>
            '<div class="koreksi-item"><div class="prosa kecil">' + UI.teks(q.pertanyaan) + '</div>' + (q.rubrik ? '<p class="kecil teks-2"><b>Rubrik:</b> ' + esc(q.rubrik) + '</p>' : '') + '<blockquote class="jawaban-siswa">' + (esc(q.jawaban) || '<em>Tidak dijawab</em>') + '</blockquote>' +
            '<label class="field field-inline"><span>Skor</span><span class="input-satuan"><input type="number" name="' + esc(q.id_soal) + '" min="0" max="' + q.bobot + '" step="0.5" value="' + esc(q.skor) + '" class="mono" required><em>/ ' + q.bobot + '</em></span></label></div>').join('') +
            '<button class="btn btn-primary" type="submit">' + ikon('save') + 'Simpan nilai</button></form>').join('') + '</div></section>' : '');
      UI.rumus(el);
    }
    async function muat(paksa) { const r = await API.load('ujian.pantau', { id_ujian: p.id }, render, { force: !!paksa, maxAge: 8000, batch: false }); if (!r.success && !data) el.innerHTML = UI.kosong('alert', 'Ujian tidak ditemukan', r.message); }
    el.addEventListener('submit', async (e) => {
      const f = e.target.closest('.form-koreksi'); if (!f) return; e.preventDefault();
      const skor = {}; UI.$$('input[type=number]', f).forEach((i) => { skor[i.name] = i.value; });
      await UI.sibuk(f.querySelector('[type=submit]'), async () => { const r = await API.call('ujian.nilaiUraian', { id_percobaan: f.dataset.p, skor }); if (UI.hasil(r)) muat(true); });
    });
    el.addEventListener('click', async (e) => {
      const ri = e.target.closest('[data-rilis]');
      if (ri) { const rilis = ri.dataset.rilis === '1'; if (rilis && !(await UI.konfirmasi('Rilis nilai ke semua siswa? Siswa juga akan melihat pembahasan.', { ok: 'Rilis nilai' }))) return; const r = await API.call('ujian.rilis', { id_ujian: p.id, rilis }); if (UI.hasil(r)) muat(true); return; }
      const li = e.target.closest('[data-lihat]');
      if (li) {
        const r = await API.call('ujian.hasil', { id_percobaan: li.dataset.lihat });
        if (!r.success) return UI.toast(r.message, 'error');
        const h = r.data;
        UI.modal({ title: (h.siswa ? h.siswa.nama : 'Jawaban') + ' · nilai ' + UI.angka(h.nilai_akhir), wide: true, body: '<p class="kecil teks-2 mono">Mulai ' + esc(UI.tgl(h.mulai, 'lengkap')) + ' · selesai ' + esc(UI.tgl(h.selesai, 'jam')) + ' · pindah tab ' + h.jumlah_pindah_tab + '×</p><div class="tumpuk" id="pt-jaw">' + (h.soal || []).map((s, i) =>
          '<div class="kartu kartu-dalam"><div class="ksr-kepala"><span class="badge-mono">' + (i + 1) + '</span>' + (s.tipe === 'uraian' ? UI.pill('info', 'Skor ' + s.skor + '/' + s.bobot) : UI.pill(s.benar ? 'tuntas' : 'belum_tuntas', s.benar ? 'Benar' : 'Salah')) + '</div><div class="prosa kecil">' + UI.teks(s.pertanyaan) + '</div><p class="kecil"><b>Jawaban:</b> ' + esc(s.tipe === 'pg' ? ((s.opsi.find((o) => o.k === s.jawaban) || {}).t || '—') : (s.jawaban || '—')) + (s.tipe !== 'uraian' ? ' · <b>Kunci:</b> ' + esc(s.tipe === 'pg' ? ((s.opsi.find((o) => o.k === s.kunci) || {}).t || s.kunci) : s.kunci.split('|').join(' / ')) : '') + '</p></div>').join('') + '</div>',
          onOpen: (m) => UI.rumus(m.querySelector('#pt-jaw')) });
      }
    });
    await muat(false);
    const t = setInterval(() => { if (document.visibilityState === 'visible' && data && data.ujian.jendela === 'berlangsung') muat(true); }, 20000);
    App.onLeave(() => clearInterval(t));
  }, 'guru');

  // =================================================================
  // LAPORAN
  // =================================================================
  App.rute('/g/laporan', async (p, q) => {
    App.judul('Laporan', 'Grafik ringkasan & rekap nilai yang bisa dicari');
    const v = App.view();
    const st = { kelas: [], idKelas: q.kelas || '', data: null, f: { jenis: '', topik: '', dari: '', sampai: '', status: '', cari: '' }, urut: { kol: 'nama', arah: 1 }, hist: '' };
    v.innerHTML = '<div class="konten-lebar"><section class="kartu"><div class="toolbar toolbar-wrap"><label class="field-inline"><span class="label-caps">Kelas</span><select id="lp-kelas" aria-label="Kelas"></select></label>' +
      '<select data-f="jenis" aria-label="Jenis penilaian"><option value="">Semua penilaian</option><option value="tugas">Tugas/LKPD</option><option value="ujian">Ujian</option><option value="latihan">Latihan</option></select>' +
      '<select data-f="topik" aria-label="Topik">' + G.opsiTopik('', 'Semua topik') + '</select><label class="field-inline"><span class="label-caps">Dari</span><input type="date" data-f="dari"></label><label class="field-inline"><span class="label-caps">Sampai</span><input type="date" data-f="sampai"></label>' +
      '<select data-f="status" aria-label="Status ketuntasan"><option value="">Semua status</option><option value="tuntas">Tuntas</option><option value="belum">Belum tuntas</option></select></div></section><div id="lp-isi" class="tumpuk-seksi">' + UI.skeleton(3) + '</div></div>';
    const isi = document.getElementById('lp-isi');
    function kolomTersaring() {
      const f = st.f, dari = f.dari ? new Date(f.dari + 'T00:00:00').getTime() : 0, sampai = f.sampai ? new Date(f.sampai + 'T23:59:59').getTime() : Infinity;
      return st.data.kolom.filter((k) => (!f.jenis || k.jenis === f.jenis) && (!f.topik || k.topik === f.topik) && (!k.tanggal || (new Date(k.tanggal).getTime() >= dari && new Date(k.tanggal).getTime() <= sampai)));
    }
    function render() {
      const d = st.data, kol = kolomTersaring(), batas = d.batas_ketuntasan, kata = st.f.cari.toLowerCase();
      const baris = d.baris.map((b) => { const vals = kol.map((k) => b.nilai[k.id]).filter((x) => x !== undefined); const rr = vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : ''; return Object.assign({}, b, { rr, tuntas2: rr === '' ? null : rr >= batas }); })
        .filter((b) => (!kata || (b.nama + ' ' + b.nis).toLowerCase().indexOf(kata) > -1) && (!st.f.status || (st.f.status === 'tuntas' ? b.tuntas2 === true : b.tuntas2 === false)));
      const u = st.urut;
      baris.sort((a, b) => { const x = u.kol === 'nama' ? a.nama : u.kol === 'rr' ? (a.rr === '' ? -1 : a.rr) : u.kol === 'hadir' ? (a.persen_hadir === '' ? -1 : a.persen_hadir) : (a.nilai[u.kol] === undefined ? -1 : a.nilai[u.kol]); const y = u.kol === 'nama' ? b.nama : u.kol === 'rr' ? (b.rr === '' ? -1 : b.rr) : u.kol === 'hadir' ? (b.persen_hadir === '' ? -1 : b.persen_hadir) : (b.nilai[u.kol] === undefined ? -1 : b.nilai[u.kol]); return (x > y ? 1 : x < y ? -1 : 0) * u.arah; });
      const ringkas = d.ringkas.filter((r) => kol.some((k) => k.id === r.id));
      if (!st.hist || !ringkas.some((r) => r.id === st.hist)) st.hist = (ringkas.filter((r) => r.jumlah).slice(-1)[0] || ringkas[0] || {}).id || '';
      const rH = ringkas.find((r) => r.id === st.hist);
      const avgKelas = baris.filter((b) => b.rr !== '').map((b) => b.rr), hadirArr = d.baris.filter((b) => b.persen_hadir !== '').map((b) => b.persen_hadir);
      const panah = (k) => st.urut.kol === k ? (st.urut.arah > 0 ? ' ↑' : ' ↓') : '';
      isi.innerHTML = '<div class="grid-stat"><div class="kartu stat-kartu"><span>Siswa</span><b class="angka-besar mono">' + d.baris.length + '</b><small>' + kol.length + ' penilaian dalam filter</small></div><div class="kartu stat-kartu"><span>Rata-rata kelas</span><b class="angka-besar mono">' + UI.angka(avgKelas.length ? avgKelas.reduce((a, b) => a + b, 0) / avgKelas.length : '') + '</b><small>Batas ketuntasan ' + batas + '</small></div>' +
        '<div class="kartu stat-kartu"><span>Tuntas</span><b class="angka-besar mono">' + baris.filter((b) => b.tuntas2).length + '<small>/' + baris.filter((b) => b.tuntas2 !== null).length + '</small></b><small>siswa bernilai</small></div><div class="kartu stat-kartu"><span>Rata-rata kehadiran</span><b class="angka-besar mono">' + (hadirArr.length ? UI.angka(hadirArr.reduce((a, b) => a + b, 0) / hadirArr.length, 0) + '%' : '–') + '</b><small>' + d.jumlah_sesi + ' sesi selesai</small></div></div>' +
        '<div class="grid-2"><section class="kartu"><h2>Rata-rata per penilaian</h2><div id="lp-g1" class="grafik-wadah"></div></section><section class="kartu"><div class="judul-seksi"><h2>Sebaran nilai</h2>' + (ringkas.length ? '<select id="lp-hist" aria-label="Pilih penilaian">' + ringkas.map((r) => '<option value="' + esc(r.id) + '"' + (r.id === st.hist ? ' selected' : '') + '>' + esc(r.judul) + '</option>').join('') + '</select>' : '') + '</div><div id="lp-g2" class="grafik-wadah"></div>' + (rH ? '<p class="kecil teks-2 mono">n=' + rH.jumlah + ' · min ' + UI.angka(rH.min) + ' · maks ' + UI.angka(rH.maks) + ' · tuntas ' + rH.tuntas + '</p>' : '') + '</section>' +
        '<section class="kartu"><h2>Kehadiran per minggu</h2><p class="kecil teks-2">Dari sesi yang sudah ditutup</p><div id="lp-g3" class="grafik-wadah"></div></section><section class="kartu"><h2>Progres materi — 10 terendah</h2><p class="kecil teks-2">Siswa yang mungkin butuh pendampingan (' + d.jumlah_materi + ' materi terbit)</p><div id="lp-g4"></div></section></div>' +
        '<section class="kartu"><div class="toolbar"><h2>Rekap nilai</h2><span class="toolbar-isi"></span><div class="cari cari-terang"><span>' + ikon('search') + '</span><input id="lp-cari" value="' + esc(st.f.cari) + '" placeholder="Cari nama atau NIS" aria-label="Cari siswa"></div><button class="btn btn-ghost" data-ekspor>' + ikon('download') + 'Ekspor CSV (Excel)</button></div>' +
        '<div class="tabel-wadah tabel-matriks"><table class="tabel"><thead><tr><th class="lengket" data-urut="nama">Nama' + panah('nama') + '</th>' + kol.map((k) => '<th data-urut="' + esc(k.id) + '" title="' + esc(k.judul + ' · ' + UI.tgl(k.tanggal)) + '"><span class="label-caps">' + esc(k.jenis) + '</span><br>' + esc(k.judul.length > 16 ? k.judul.slice(0, 15) + '…' : k.judul) + panah(k.id) + '</th>').join('') + '<th data-urut="rr">Rata-rata' + panah('rr') + '</th><th data-urut="hadir">Hadir' + panah('hadir') + '</th><th>Status</th></tr></thead><tbody>' +
        (baris.map((b) => '<tr><td class="lengket"><a href="#/g/siswa/' + esc(b.id_siswa) + '"><b>' + esc(b.nama) + '</b></a><br><small class="mono teks-2">' + esc(b.nis) + '</small></td>' + kol.map((k) => { const n = b.nilai[k.id]; return '<td class="mono ' + (n === undefined ? 'teks-2' : n >= batas ? 'sel-ok' : 'sel-bahaya') + '">' + (n === undefined ? '–' : UI.angka(n)) + '</td>'; }).join('') +
          '<td class="mono"><b>' + UI.angka(b.rr) + '</b></td><td class="mono">' + (b.persen_hadir === '' ? '–' : UI.angka(b.persen_hadir, 0) + '%') + '</td><td>' + (b.tuntas2 === null ? UI.pill('netral', 'Belum ada nilai') : UI.pill(b.tuntas2 ? 'tuntas' : 'belum_tuntas')) + '</td></tr>').join('') || '<tr><td colspan="99" class="teks-2">Tidak ada siswa yang cocok.</td></tr>') + '</tbody></table></div></section>';
      Grafik.batang(document.getElementById('lp-g1'), ringkas.map((r) => ({ label: r.judul, nilai: r.rata_rata })), { batas, judul: 'Rata-rata per penilaian', kosong: ringkas.length ? 'Belum ada nilai yang masuk.' : 'Belum ada penilaian dalam filter ini.' });
      Grafik.histogram(document.getElementById('lp-g2'), rH ? rH.sebaran : [], { batas });
      Grafik.garis(document.getElementById('lp-g3'), d.tren_kehadiran.map((t) => ({ label: UI.tgl(t.minggu, 'singkat'), nilai: t.persen })), { satuan: '%', id: 'lp', kosong: 'Belum ada sesi yang ditutup.' });
      Grafik.horizontal(document.getElementById('lp-g4'), d.baris.slice().sort((a, b) => a.progres - b.progres).slice(0, 10).map((b) => ({ label: b.nama, nilai: b.progres })), { kosong: 'Belum ada siswa.' });
      const pilihHist = document.getElementById('lp-hist');
      if (pilihHist) pilihHist.addEventListener('change', (e) => { st.hist = e.target.value; render(); });
      document.getElementById('lp-cari').addEventListener('input', UI.debounce((e) => { st.f.cari = e.target.value.trim(); render(); const c = document.getElementById('lp-cari'); c.focus(); c.setSelectionRange(c.value.length, c.value.length); }, 300));
      isi.querySelector('[data-ekspor]').addEventListener('click', () => {
        const desimal = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
        const kepala = ['NIS', 'Nama'].concat(kol.map((k) => k.judul + ' (' + k.jenis + ')'), ['Rata-rata', 'Kehadiran %', 'Status']);
        const isiBaris = baris.map((b) => [b.nis, b.nama].concat(
          kol.map((k) => (b.nilai[k.id] === undefined ? '' : desimal(b.nilai[k.id]))),
          [b.rr === '' ? '' : desimal(b.rr), b.persen_hadir, b.tuntas2 === null ? '' : (b.tuntas2 ? 'Tuntas' : 'Belum tuntas')]));
        UI.unduhCSV('rekap-nilai-' + d.kelas.nama_kelas.replace(/\s+/g, '-') + '.csv', [kepala].concat(isiBaris));
      });
      UI.$$('[data-urut]', isi).forEach((th) => th.addEventListener('click', () => { const k = th.dataset.urut; st.urut = { kol: k, arah: st.urut.kol === k ? -st.urut.arah : (k === 'nama' ? 1 : -1) }; render(); }));
    }
    async function muatKelas() {
      const r = await API.load('kelas.list', {}, null, { maxAge: 60000 });
      st.kelas = r.success ? r.data : [];
      if (!st.kelas.length) { isi.innerHTML = UI.kosong('school', 'Belum ada kelas', 'Buat kelas dan tambahkan siswa terlebih dahulu.', '<a class="btn btn-primary" href="#/g/kelas">Kelas & Siswa</a>'); return; }
      if (!st.idKelas) st.idKelas = st.kelas.slice().sort((x, y) => (y.jumlah_siswa || 0) - (x.jumlah_siswa || 0))[0].id_kelas;
      document.getElementById('lp-kelas').innerHTML = G.opsiKelas(st.kelas, st.idKelas);
      muatData();
    }
    async function muatData() {
      isi.innerHTML = UI.skeleton(3);
      const r = await API.load('laporan.data', { id_kelas: st.idKelas }, (d) => { st.data = d; render(); }, { maxAge: 30000 });
      if (!r.success && !st.data) isi.innerHTML = UI.kosong('alert', 'Laporan gagal dimuat', r.message);
    }
    document.getElementById('lp-kelas').addEventListener('change', (e) => { st.idKelas = e.target.value; st.data = null; muatData(); });
    UI.$$('[data-f]', v).forEach((el) => el.addEventListener('change', () => { st.f[el.dataset.f] = el.value; if (st.data) render(); }));
    muatKelas();
  }, 'guru');

  // =================================================================
  // DETAIL SISWA
  // =================================================================
  App.rute('/g/siswa/:id', async (p) => {
    App.judul('Detail Siswa', 'Nilai, kehadiran, dan progres');
    const v = App.view();
    v.innerHTML = '<div class="konten-lebar"><a class="tautan" href="javascript:history.back()">' + ikon('left') + 'Kembali</a><div id="ds">' + UI.skeleton(3) + '</div></div>';
    const el = document.getElementById('ds');
    const r = await API.load('siswa.detail', { id_user: p.id }, (d) => {
      const pr = d.profil, k = d.kehadiran, persenMat = d.progres.total ? Math.round(d.progres.selesai / d.progres.total * 100) : 0;
      el.innerHTML = '<section class="kartu profil-baris">' + UI.avatar(pr.nama, '', 'avatar-xl') + '<div><h1 class="judul-halaman">' + esc(pr.nama) + '</h1><p class="mono teks-2">NIS ' + esc(pr.nis) + ' · ' + esc(pr.nama_kelas) + (pr.email ? ' · ' + esc(pr.email) : '') + '</p><p class="kecil teks-2">Masuk terakhir: ' + (pr.login_terakhir ? esc(UI.tgl(pr.login_terakhir, 'lengkap')) : 'belum pernah') + ' · ' + UI.pill(pr.status) + '</p></div></section>' +
        '<div class="grid-stat"><div class="kartu stat-kartu"><span>Rata-rata nilai</span><b class="angka-besar mono">' + UI.angka(d.rata_rata) + '</b><small>Batas ' + d.batas_ketuntasan + '</small></div><div class="kartu stat-kartu"><span>Kehadiran</span><b class="angka-besar mono">' + (k.persen === '' ? '–' : UI.angka(k.persen, 0) + '%') + '</b><small>' + k.rekap.hadir + ' hadir · ' + k.rekap.alfa + ' alfa</small></div><div class="kartu stat-kartu"><span>Progres materi</span><b class="angka-besar mono">' + persenMat + '%</b><small>' + d.progres.selesai + '/' + d.progres.total + ' materi</small></div></div>' +
        '<section class="kartu"><h2>Tren nilai</h2><div id="ds-tren" class="grafik-wadah"></div></section>' +
        '<div class="grid-2"><section class="kartu"><h2>Nilai</h2><div class="daftar">' + d.tugas.map((t) => '<div class="baris-daftar"><span class="ikon-bulat">' + ikon('clipboard') + '</span><span class="bd-isi"><b>' + esc(t.judul) + '</b><small>' + esc(UI.tgl(t.tanggal)) + '</small></span>' + (t.nilai !== '' ? '<b class="mono nilai-pill ' + (t.persen >= d.batas_ketuntasan ? 'ok' : 'bahaya') + '">' + UI.angka(t.nilai) + '</b>' : UI.pill(t.status)) + '</div>').join('') +
        d.ujian.map((u) => '<div class="baris-daftar"><span class="ikon-bulat">' + ikon('timer') + '</span><span class="bd-isi"><b>' + esc(u.judul) + '</b><small>' + esc(u.jenis) + ' · ' + u.percobaan + ' percobaan</small></span>' + (u.nilai !== '' ? '<b class="mono nilai-pill ' + (u.nilai >= d.batas_ketuntasan ? 'ok' : 'bahaya') + '">' + UI.angka(u.nilai) + '</b>' : UI.pill(u.status === 'belum' ? 'netral' : u.status, u.status === 'belum' ? 'Belum' : null)) + '</div>').join('') + '</div></section>' +
        '<section class="kartu"><h2>Riwayat kehadiran</h2><div class="daftar">' + (k.riwayat.map((a) => '<div class="baris-daftar"><span class="bd-isi"><b>' + esc(a.topik) + '</b><small>' + esc(UI.tgl(a.tanggal, 'lengkap')) + (a.keterangan ? ' · ' + esc(a.keterangan) : '') + '</small></span>' + UI.pill(a.status) + '</div>').join('') || '<p class="teks-2">Belum ada data.</p>') + '</div></section></div>';
      Grafik.garis(document.getElementById('ds-tren'), d.tren.map((t) => ({ label: UI.tgl(t.tanggal, 'singkat'), nilai: t.nilai })), { batas: d.batas_ketuntasan, id: 'ds', kosong: 'Belum ada nilai.' });
      if (pr.punyaFoto) API.call('profil.foto', { id_user: pr.id_user }).then((f) => { if (f.success && f.data.dataUrl) { const a = el.querySelector('.avatar-xl'); if (a) a.innerHTML = '<img src="' + f.data.dataUrl + '" alt="">'; } });
    }, { maxAge: 20000 });
    if (!r.success) el.innerHTML = UI.kosong('alert', 'Siswa tidak ditemukan', r.message);
  }, 'guru');

  // =================================================================
  // PENGATURAN
  // =================================================================
  App.rute('/g/pengaturan', async (p, q) => {
    App.judul('Pengaturan', 'Identitas, tema, lokasi, keamanan, sistem');
    const v = App.view();
    let tab = q.tab || 'identitas';
    const st = { cfg: null, lokasi: [], rahasia: null, sistem: null };
    v.innerHTML = '<div class="konten-lebar"><div class="tab-vertikal"><nav class="tab-nav" id="pg-nav" aria-label="Bagian pengaturan">' + [['identitas', 'image', 'Identitas'], ['tema', 'star', 'Tema warna'], ['lokasi', 'pin', 'Lokasi'], ['akademik', 'school', 'Akademik'], ['keamanan', 'shield', 'Keamanan'], ['sistem', 'database', 'Sistem']].map((t) => '<button data-tab="' + t[0] + '">' + ikon(t[1]) + '<span>' + t[2] + '</span></button>').join('') + '</nav><section class="kartu" id="pg-isi">' + UI.skeleton(3) + '</section></div></div>';
    const isi = document.getElementById('pg-isi');
    async function simpanCfg(nilai, btn) {
      return UI.sibuk(btn, async () => {
        const r = await API.call('pengaturan.simpan', { nilai });
        if (UI.hasil(r)) { App.cfg = r.data; try { localStorage.setItem('pl_cfg', JSON.stringify(r.data)); } catch (e) { /* abaikan */ } App.terapkanTema(App.cfg); Object.assign(st.cfg, nilai); }
        return r;
      }, 'Menyimpan…');
    }
    const T = {};
    T.identitas = () => {
      const c = st.cfg;
      let logo512 = null, logo192 = null, img = null;
      isi.innerHTML = '<h2>Identitas aplikasi</h2><div class="grid-2 grid-atas"><form class="form" id="pi-form"><label class="field"><span>Nama aplikasi</span><input name="nama_aplikasi" maxlength="40" value="' + esc(c.nama_aplikasi) + '" required><small><span data-hitung>' + c.nama_aplikasi.length + '</span>/40 karakter · tampil di header, login, splash, dan judul tab</small></label>' +
        '<label class="field"><span>Tagline</span><input name="tagline" maxlength="80" value="' + esc(c.tagline) + '"></label><div class="grid-2"><label class="field"><span>Nama sekolah</span><input name="nama_sekolah" value="' + esc(c.nama_sekolah || '') + '"></label><label class="field"><span>Nama guru</span><input name="nama_guru" value="' + esc(c.nama_guru || '') + '"></label></div>' +
        '<div class="field"><span>Logo (PNG/JPG/WebP, maks 2 MB)</span>' + G.dropzone('logo', 'Pilih gambar logo', 'image/png,image/jpeg,image/webp') + '</div><div id="pi-potong" hidden><div class="potong-wadah"><canvas id="pi-canvas" width="240" height="240"></canvas><div class="potong-kontrol"><label class="field"><span>Perbesar</span><input type="range" id="pi-zoom" min="1" max="3" step="0.05" value="1"></label><label class="field"><span>Geser kiri–kanan</span><input type="range" id="pi-gx" min="-1" max="1" step="0.05" value="0"></label><label class="field"><span>Geser atas–bawah</span><input type="range" id="pi-gy" min="-1" max="1" step="0.05" value="0"></label></div></div></div>' +
        '<div class="aksi-baris"><button type="submit" class="btn btn-primary">' + ikon('save') + 'Simpan identitas</button>' + (c.logo_thumb_url ? '<button type="button" class="btn btn-ghost" data-hapus-logo>' + ikon('trash') + 'Logo default</button>' : '') + '</div></form>' +
        '<div><span class="label-caps">Pratinjau</span><div class="pratinjau-identitas" id="pi-pv"></div><div class="thumb-pratinjau"><figure><span id="pi-512"></span><figcaption class="mono kecil">512 px · header & splash</figcaption></figure><figure><span id="pi-192"></span><figcaption class="mono kecil">192 px · ikon tab</figcaption></figure></div></div></div>';
      const f = document.getElementById('pi-form');
      const pv = () => {
        const nama = f.nama_aplikasi.value || 'PhysicsLearn', logoHtml = logo512 ? '<img class="logo-mark" src="' + logo512.dataUrl + '" alt="">' : App.logo();
        document.getElementById('pi-pv').innerHTML = '<div class="pv-hero">' + logoHtml + '<div><b>' + esc(nama) + '</b><small>' + esc(f.tagline.value) + '</small></div></div><div class="pv-kartu"><b>Masuk</b><span class="pv-input"></span><span class="pv-input"></span><span class="pv-tombol"></span></div>';
        document.getElementById('pi-512').innerHTML = logoHtml; document.getElementById('pi-192').innerHTML = logo192 ? '<img class="logo-mark" src="' + logo192.dataUrl + '" alt="">' : App.logo();
        f.querySelector('[data-hitung]').textContent = f.nama_aplikasi.value.length;
      };
      const potong = async () => {
        if (!img) return;
        const z = Number(document.getElementById('pi-zoom').value), gx = Number(document.getElementById('pi-gx').value), gy = Number(document.getElementById('pi-gy').value);
        logo512 = await UI.potongKotak(img, 512, z, gx, gy); logo192 = await UI.potongKotak(img, 192, z, gx, gy);
        const cv = document.getElementById('pi-canvas'), ctx = cv.getContext('2d'), im = new Image();
        im.onload = () => { ctx.clearRect(0, 0, 240, 240); ctx.drawImage(im, 0, 0, 240, 240); }; im.src = logo512.dataUrl;
        pv();
      };
      G.pasangDropzone(isi, 'logo', async (file) => {
        if (/svg/i.test(file.type)) return UI.toast('Logo SVG tidak diizinkan. Gunakan PNG, JPG, atau WebP.', 'error');
        if (file.size > 2 * 1048576) return UI.toast('Logo maksimal 2 MB.', 'error');
        img = await UI.muatGambar(file); document.getElementById('pi-potong').hidden = false; potong();
      });
      ['pi-zoom', 'pi-gx', 'pi-gy'].forEach((id) => document.getElementById(id).addEventListener('input', UI.debounce(potong, 80)));
      f.addEventListener('input', pv);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const o = G.form(f), btn = f.querySelector('[type=submit]');
        if (o.nama_aplikasi.length < 3) return UI.toast('Nama aplikasi minimal 3 karakter.', 'error');
        const r = await simpanCfg({ nama_aplikasi: o.nama_aplikasi, tagline: o.tagline, nama_sekolah: o.nama_sekolah, nama_guru: o.nama_guru }, btn);
        if (r && r.success && logo512) {
          const rl = await API.upload('pengaturan.logo', { logo: { nama: 'logo.png', tipe: 'image/png', base64: logo512.base64 }, favicon: { nama: 'favicon.png', tipe: 'image/png', base64: logo192.base64 } });
          if (UI.hasil(rl, 'Logo diperbarui.')) { App.cfg = rl.data; localStorage.setItem('pl_cfg', JSON.stringify(rl.data)); App.terapkanTema(App.cfg); st.cfg = Object.assign(st.cfg, rl.data); logo512 = null; }
        }
        const brand = document.querySelector('.sidebar .brand'); if (brand) brand.innerHTML = App.logo() + '<span><b>' + esc(App.nama()) + '</b><small>PORTAL GURU</small></span>';
      });
      const hl = isi.querySelector('[data-hapus-logo]');
      if (hl) hl.addEventListener('click', async () => { const r = await API.call('pengaturan.logo', { hapus: true }); if (UI.hasil(r)) { App.cfg = r.data; localStorage.setItem('pl_cfg', JSON.stringify(r.data)); st.cfg = Object.assign(st.cfg, r.data); App.terapkanTema(App.cfg); T.identitas(); } });
      pv();
    };
    T.tema = () => {
      const c = st.cfg;
      isi.innerHTML = '<h2>Tema warna</h2><p class="teks-2">Pilih tema bernuansa fisika atau atur warna sendiri. Berlaku untuk semua pengguna saat aplikasi dimuat ulang.</p><div class="preset-grid">' + Object.keys(App.PRESET_TEMA).map((k) => { const t = App.PRESET_TEMA[k]; return '<button class="preset ' + (c.mode_tema === k ? 'aktif' : '') + '" data-preset="' + k + '"><span class="preset-warna"><i style="background:' + t.primer + '"></i><i style="background:' + t.sekunder + '"></i><i style="background:' + t.aksen + '"></i></span><b>' + esc(t.nama) + '</b>' + (t.gelap ? '<small>Mode gelap</small>' : '') + '</button>'; }).join('') + '</div>' +
        '<form class="form" id="pt-form"><div class="grid-3">' + [['warna_primer', 'Primer'], ['warna_sekunder', 'Sekunder (navy)'], ['warna_aksen', 'Aksen (elektron)']].map((w) => '<label class="field"><span>' + w[1] + '</span><span class="warna-input"><input type="color" name="' + w[0] + '" value="' + esc(c[w[0]]) + '"><code>' + esc(c[w[0]]) + '</code></span></label>').join('') + '</div>' +
        '<div id="pt-kontras"></div><div class="aksi-baris"><button type="submit" class="btn btn-primary">' + ikon('save') + 'Simpan tema</button><button type="button" class="btn btn-ghost" data-default>Kembalikan ke default</button></div></form>';
      const f = document.getElementById('pt-form');
      let mode = c.mode_tema;
      const cek = () => {
        const p = f.warna_primer.value, a = f.warna_aksen.value, n = f.warna_sekunder.value;
        UI.$$('.warna-input code', f).forEach((el, i) => { el.textContent = [p, n, a][i].toUpperCase(); });
        const k1 = UI.kontras(p, '#FFFFFF'), k2 = UI.kontras(a, '#1B3A6B'), gelap = App.PRESET_TEMA[mode] && App.PRESET_TEMA[mode].gelap;
        const bad = (!gelap && k1 < 4.5) || k2 < 4.5;
        document.getElementById('pt-kontras').innerHTML = '<div class="alert ' + (bad ? 'alert-warn' : 'alert-ok') + '">' + ikon(bad ? 'alert' : 'checkCircle') + '<span>Kontras teks putih di atas primer <b class="mono">' + k1.toFixed(1) + ':1</b> · teks navy di atas aksen <b class="mono">' + k2.toFixed(1) + ':1</b>. ' + (bad ? 'Kurang dari 4,5:1 — teks bisa sulit dibaca.' : 'Memenuhi batas keterbacaan 4,5:1.') + '</span></div>';
        App.terapkanTema(Object.assign({}, c, { warna_primer: p, warna_sekunder: n, warna_aksen: a, mode_tema: mode }));
      };
      isi.querySelector('.preset-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (!b) return; mode = b.dataset.preset; const t = App.PRESET_TEMA[mode]; f.warna_primer.value = t.primer; f.warna_sekunder.value = t.sekunder; f.warna_aksen.value = t.aksen; UI.$$('.preset', isi).forEach((x) => x.classList.toggle('aktif', x === b)); cek(); });
      f.addEventListener('input', () => { if (!App.PRESET_TEMA[mode] || f.warna_primer.value.toUpperCase() !== App.PRESET_TEMA[mode].primer.toUpperCase()) mode = App.PRESET_TEMA[mode] && App.PRESET_TEMA[mode].gelap ? mode : 'kustom'; cek(); });
      f.addEventListener('submit', (e) => { e.preventDefault(); simpanCfg({ warna_primer: f.warna_primer.value.toUpperCase(), warna_sekunder: f.warna_sekunder.value.toUpperCase(), warna_aksen: f.warna_aksen.value.toUpperCase(), mode_tema: mode }, f.querySelector('[type=submit]')); });
      isi.querySelector('[data-default]').addEventListener('click', () => { isi.querySelector('[data-preset="biru-elektron"]').click(); });
      App.onLeave(() => App.terapkanTema(App.cfg));
      cek();
    };
    T.lokasi = () => {
      isi.innerHTML = '<h2>Lokasi belajar</h2><p class="teks-2">Sesi absensi hanya bisa dibuka bila GPS guru berada di dalam radius salah satu lokasi ini.</p><div class="daftar" id="pl-list">' + (st.lokasi.map((l) => '<div class="baris-daftar"><span class="ikon-bulat">' + ikon('pin') + '</span><span class="bd-isi"><b>' + esc(l.nama_lokasi) + '</b><small class="mono">' + l.lat.toFixed(5) + ', ' + l.lng.toFixed(5) + ' · radius ' + l.radius_m + ' m · akurasi maks ' + l.akurasi_maks_m + ' m</small></span><span class="sel-aksi"><button class="btn-ikon" data-ubah="' + esc(l.id_lokasi) + '" aria-label="Ubah">' + ikon('edit') + '</button><button class="btn-ikon" data-hapus="' + esc(l.id_lokasi) + '" aria-label="Hapus">' + ikon('trash') + '</button></span></div>').join('') || '<p class="teks-2">Belum ada lokasi.</p>') + '</div>' +
        '<form class="form kartu kartu-dalam" id="pl-form"><h3 id="pl-judul">Tambah lokasi</h3><input type="hidden" name="id_lokasi"><div class="grid-2 grid-atas"><div><label class="field"><span>Nama lokasi</span><input name="nama_lokasi" placeholder="cth. Lab Fisika 1" required></label>' +
        '<button type="button" class="btn btn-ghost btn-penuh" data-gps>' + ikon('pin') + 'Gunakan lokasi saat ini</button><p class="kecil teks-2" id="pl-akur">Berdiri di tengah ruang kelas lalu tekan tombol di atas.</p>' +
        '<div class="grid-2"><label class="field"><span>Lintang</span><input name="lat" class="mono" inputmode="decimal" required></label><label class="field"><span>Bujur</span><input name="lng" class="mono" inputmode="decimal" required></label></div>' +
        '<label class="field"><span>Radius izin: <b class="mono" id="pl-r">100 m</b></span><input type="range" name="radius_m" min="20" max="500" step="10" value="100"></label><label class="field"><span>Akurasi GPS maksimal (m)</span><input type="number" name="akurasi_maks_m" min="10" max="500" value="50"></label></div>' +
        '<div class="radar-wadah" id="pl-radar"></div></div><div class="aksi-baris"><button type="submit" class="btn btn-primary">' + ikon('save') + 'Simpan lokasi</button><button type="reset" class="btn btn-ghost">Batal</button></div></form>' +
        '<form class="form" id="pl-opsi"><h3>Aturan sesi</h3><div class="grid-2"><label class="field"><span>Durasi sesi default (menit)</span><input type="number" name="durasi_sesi_menit" min="10" max="300" value="' + esc(st.cfg.durasi_sesi_menit) + '"></label><label class="cek cek-besar"><input type="checkbox" name="gps_wajib_siswa" value="Y"' + (st.cfg.gps_wajib_siswa === 'Y' ? ' checked' : '') + '><span><b>GPS wajib untuk siswa</b><small class="teks-2">Siswa juga harus berada di dalam radius saat menekan Hadir.</small></span></label></div><button class="btn btn-primary" type="submit">' + ikon('save') + 'Simpan aturan</button></form>';
      const f = document.getElementById('pl-form');
      const radar = () => {
        const lat = Number(f.lat.value), lng = Number(f.lng.value), r = Number(f.radius_m.value);
        document.getElementById('pl-r').textContent = r + ' m';
        document.getElementById('pl-radar').innerHTML = !isNaN(lat) && f.lat.value ? G.radarSVG({ lok: { lat, lng, nama_lokasi: f.nama_lokasi.value || 'Titik lokasi' }, radius: r, posisi: null }) : '<div class="grafik-kosong">' + ikon('radar') + '<span>Radar tampil setelah koordinat diisi.</span></div>';
      };
      f.addEventListener('input', radar);
      f.addEventListener('reset', () => setTimeout(() => { f.id_lokasi.value = ''; document.getElementById('pl-judul').textContent = 'Tambah lokasi'; radar(); }, 0));
      f.querySelector('[data-gps]').addEventListener('click', (e) => UI.sibuk(e.currentTarget, async () => {
        try { const g = await UI.gps(); f.lat.value = g.lat.toFixed(6); f.lng.value = g.lng.toFixed(6); document.getElementById('pl-akur').innerHTML = 'Akurasi saat ini <b class="mono">±' + g.akurasi + ' m</b>' + (g.akurasi > 30 ? ' — tunggu sebentar lalu tekan lagi untuk hasil lebih tepat.' : ' — bagus.'); radar(); }
        catch (err) { UI.toast(err.message, 'error'); }
      }, 'Membaca GPS…'));
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const o = G.form(f);
        await UI.sibuk(f.querySelector('[type=submit]'), async () => { const r = await API.call('lokasi.simpan', o); if (UI.hasil(r)) muat(true, 'lokasi'); });
      });
      document.getElementById('pl-opsi').addEventListener('submit', (e) => { e.preventDefault(); const o = G.form(e.target); simpanCfg({ durasi_sesi_menit: o.durasi_sesi_menit, gps_wajib_siswa: o.gps_wajib_siswa ? 'Y' : 'N' }, e.target.querySelector('[type=submit]')); });
      document.getElementById('pl-list').addEventListener('click', async (e) => {
        const u = e.target.closest('[data-ubah]');
        if (u) { const l = st.lokasi.find((x) => x.id_lokasi === u.dataset.ubah); f.id_lokasi.value = l.id_lokasi; f.nama_lokasi.value = l.nama_lokasi; f.lat.value = l.lat; f.lng.value = l.lng; f.radius_m.value = l.radius_m; f.akurasi_maks_m.value = l.akurasi_maks_m; document.getElementById('pl-judul').textContent = 'Ubah lokasi'; radar(); f.scrollIntoView({ behavior: 'smooth' }); }
        const h = e.target.closest('[data-hapus]');
        if (h && await UI.konfirmasi('Hapus lokasi ini?', { ok: 'Hapus', bahaya: true })) { const r = await API.call('lokasi.hapus', { id_lokasi: h.dataset.hapus }); if (UI.hasil(r)) muat(true, 'lokasi'); }
      });
      radar();
    };
    T.akademik = () => {
      const c = st.cfg;
      isi.innerHTML = '<h2>Akademik</h2><form class="form" id="pa-form"><div class="grid-3"><label class="field"><span>Tahun ajaran</span><input name="tahun_ajaran" value="' + esc(c.tahun_ajaran) + '"></label><label class="field"><span>Semester</span><select name="semester"><option' + (c.semester === 'Ganjil' ? ' selected' : '') + '>Ganjil</option><option' + (c.semester === 'Genap' ? ' selected' : '') + '>Genap</option></select></label><label class="field"><span>Batas ketuntasan</span><input type="number" name="batas_ketuntasan" min="0" max="100" value="' + esc(c.batas_ketuntasan) + '"></label></div>' +
        '<div class="grid-2"><label class="field"><span>Ukuran maks dokumen & gambar (MB)</span><input type="number" name="ukuran_maks_dokumen_mb" min="1" max="25" value="' + esc(c.ukuran_maks_dokumen_mb) + '"></label><label class="field"><span>Ukuran maks video (MB)</span><input type="number" name="ukuran_maks_video_mb" min="1" max="35" value="' + esc(c.ukuran_maks_video_mb) + '"><small>Unggahan melewati Apps Script; video besar sebaiknya lewat tautan YouTube.</small></label></div><button class="btn btn-primary" type="submit">' + ikon('save') + 'Simpan</button></form>';
      document.getElementById('pa-form').addEventListener('submit', (e) => { e.preventDefault(); simpanCfg(G.form(e.target), e.target.querySelector('[type=submit]')); });
    };
    T.keamanan = () => {
      const rh = st.rahasia;
      isi.innerHTML = '<h2>Keamanan</h2><section class="kartu kartu-dalam"><h3>' + GOOGLE_G + ' Login dengan Google</h3><p class="teks-2 kecil">Isi OAuth Client ID (jenis Web application) dari Google Cloud Console. Tambahkan alamat GitHub Pages Anda di <b>Authorized JavaScript origins</b>. Disimpan di Script Properties dan hanya ditampilkan tersamar.</p>' +
        '<form class="form" id="pk-g"><label class="field"><span>Client ID ' + (rh.GOOGLE_CLIENT_ID.ada ? UI.pill('ok', 'Aktif') : UI.pill('netral', 'Belum diisi')) + '</span><input name="nilai" type="password" autocomplete="off" placeholder="' + esc(rh.GOOGLE_CLIENT_ID.samar || 'xxxxxxxx.apps.googleusercontent.com') + '"></label><div class="aksi-baris"><button class="btn btn-primary" type="submit">' + ikon('save') + 'Simpan Client ID</button>' + (rh.GOOGLE_CLIENT_ID.ada ? '<button class="btn btn-ghost" type="button" data-hapus-gid>Nonaktifkan</button>' : '') + '</div></form></section>' +
        (App.me.darurat ? '' : '<section class="kartu kartu-dalam"><h3>' + ikon('lock') + 'Sandi akun guru</h3><button class="btn btn-ghost" data-sandi>Ganti kata sandi</button></section>') +
        '<section class="kartu kartu-dalam"><h3>' + ikon('shield') + 'Akses darurat</h3><p class="teks-2 kecil">Dipakai bila akun guru terkunci. Halaman: <code>' + esc(location.origin + location.pathname) + '#/darurat</code> (tidak ditautkan di mana pun).' + (rh.darurat.terkunci ? ' ' + UI.pill('warn', 'Sedang terkunci') : '') + '</p><form class="form" id="pk-d"><label class="field"><span>Sandi darurat baru</span><input name="baru" type="password" autocomplete="new-password" minlength="12"><small>Minimal 12 karakter, huruf dan angka. Sesi darurat lama dicabut.</small></label><button class="btn btn-primary" type="submit">' + ikon('key') + 'Ganti sandi darurat</button></form></section>' +
        '<section class="kartu kartu-dalam"><h3>' + ikon('logout') + 'Sesi</h3><p class="teks-2 kecil">Keluarkan akun guru dari semua perangkat (termasuk yang ini).</p><button class="btn btn-danger" data-semua>Keluar dari semua perangkat</button></section>';
      document.getElementById('pk-g').addEventListener('submit', async (e) => { e.preventDefault(); const val = e.target.nilai.value.trim(); if (!val) return UI.toast('Isi Client ID.', 'error'); await UI.sibuk(e.submitter, async () => { const r = await API.call('rahasia.simpan', { kunci: 'GOOGLE_CLIENT_ID', nilai: val }); if (UI.hasil(r)) { e.target.nilai.value = ''; muat(true, 'keamanan'); } }); });
      const hg = isi.querySelector('[data-hapus-gid]'); if (hg) hg.addEventListener('click', async () => { if (!(await UI.konfirmasi('Nonaktifkan login Google? Siswa tetap bisa masuk dengan NIS dan sandi.', { ok: 'Nonaktifkan' }))) return; const r = await API.call('rahasia.simpan', { kunci: 'GOOGLE_CLIENT_ID', nilai: '__HAPUS__' }); if (UI.hasil(r)) muat(true, 'keamanan'); });
      const sb = isi.querySelector('[data-sandi]'); if (sb) sb.addEventListener('click', () => App.gantiSandi(false));
      document.getElementById('pk-d').addEventListener('submit', async (e) => { e.preventDefault(); const val = e.target.baru.value; if (val.length < 12 || !/[A-Za-z]/.test(val) || !/\d/.test(val)) return UI.toast('Minimal 12 karakter berisi huruf dan angka.', 'error'); await UI.sibuk(e.submitter, async () => { const r = await API.call('keamanan.gantiDarurat', { baru: val }); if (UI.hasil(r)) e.target.reset(); }); });
      isi.querySelector('[data-semua]').addEventListener('click', async () => { if (!(await UI.konfirmasi('Semua sesi guru akan dicabut.', { ok: 'Keluar dari semua', bahaya: true }))) return; const r = await API.call('auth.keluarSemua', {}); if (r.success) App.keluarPaksa('Anda keluar dari semua perangkat.'); });
    };
    T.sistem = () => {
      const s = st.sistem, persen = s.drive_batas ? s.drive_terpakai / s.drive_batas * 100 : 0;
      isi.innerHTML = '<h2>Sistem</h2><div class="grid-2"><section class="kartu kartu-dalam"><span class="label-caps">Penyimpanan Google Drive</span><b class="angka-besar mono">' + UI.ukuran(s.drive_terpakai) + '</b><small class="teks-2">dari ' + (s.drive_batas ? UI.ukuran(s.drive_batas) : '–') + '</small>' + UI.progres(persen, persen > 85 ? 'bar-bahaya' : '') + '</section>' +
        '<section class="kartu kartu-dalam"><span class="label-caps">Cadangan database</span><b>' + (s.cadangan_terakhir ? esc(UI.tgl(s.cadangan_terakhir, 'lengkap')) : 'Belum pernah') + '</b><small class="teks-2">Otomatis tiap Minggu 02.00 · 8 salinan terakhir disimpan</small><button class="btn btn-ghost" data-cadangan>' + ikon('database') + 'Buat cadangan sekarang</button></section></div>' +
        '<div class="tabel-wadah"><table class="tabel"><tbody><tr><th>Versi backend</th><td class="mono">' + esc(s.versi) + '</td></tr><tr><th>Trigger</th><td>' + (s.trigger.length ? s.trigger.map((t) => '<span class="chip mono">' + esc(t) + '</span>').join(' ') : '<span class="teks-warn">Belum ada — jalankan setupAppEnvironment()</span>') + '</td></tr><tr><th>Pemanas server (keepWarm)</th><td>' + (s.keep_warm ? UI.pill('ok', 'Aktif · 5 menit') : UI.pill('netral', 'Dimatikan')) + (s.warm_terakhir ? ' <small class="teks-2">terakhir ' + esc(UI.relatif(s.warm_terakhir.at)) + '</small>' : '') + '</td></tr>' +
        '<tr><th>Jumlah data</th><td class="mono kecil">' + Object.keys(s.jumlah).map((k) => k.replace('_', ' ') + ' ' + s.jumlah[k]).join(' · ') + '</td></tr><tr><th>Tautan</th><td><a href="' + esc(s.spreadsheet_url) + '" target="_blank" rel="noopener">Spreadsheet database</a> · <a href="' + esc(s.folder_url) + '" target="_blank" rel="noopener">Folder Drive</a></td></tr></tbody></table></div>' +
        '<section><div class="judul-seksi"><h3>Log aktivitas</h3><button class="btn btn-tipis" data-log>' + ikon('refresh') + 'Muat</button></div><ul class="linimasa" id="ps-log"></ul></section>';
      isi.querySelector('[data-cadangan]').addEventListener('click', (e) => UI.sibuk(e.currentTarget, async () => { const r = await API.call('sistem.cadangan', {}); if (UI.hasil(r)) muat(true, 'sistem'); }, 'Menyalin…'));
      const log = async () => { const r = await API.call('log.list', { n: 60 }); document.getElementById('ps-log').innerHTML = r.success ? r.data.map((a) => '<li><b>' + esc(a.aksi.replace(/_/g, ' ').toLowerCase()) + '</b><span>' + esc(a.detail || '') + '</span><small class="mono">' + esc(UI.tgl(a.waktu, 'lengkap')) + ' · ' + esc(a.nama) + '</small></li>').join('') : ''; };
      isi.querySelector('[data-log]').addEventListener('click', log);
      log();
    };
    function tampil() {
      UI.$$('#pg-nav button').forEach((b) => b.classList.toggle('aktif', b.dataset.tab === tab));
      if (!st.cfg) return;
      T[tab]();
    }
    async function muat(paksa, ke) {
      const [a, b, c] = await Promise.all([API.load('pengaturan.get', {}, null, { force: !!paksa, maxAge: 20000 }), API.load('rahasia.status', {}, null, { force: !!paksa, maxAge: 20000 }), API.load('sistem.status', paksa ? { _fresh: true } : {}, null, { force: !!paksa, maxAge: 60000 })]);
      if (!a.success) { isi.innerHTML = UI.kosong('alert', 'Pengaturan gagal dimuat', a.message); return; }
      st.cfg = a.data.pengaturan; st.lokasi = a.data.lokasi; st.rahasia = b.data; st.sistem = c.data;
      if (ke) tab = ke;
      tampil();
    }
    document.getElementById('pg-nav').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; history.replaceState(null, '', '#/g/pengaturan?tab=' + tab); tampil(); });
    tampil();
    muat(false);
  }, 'guru');
})();
