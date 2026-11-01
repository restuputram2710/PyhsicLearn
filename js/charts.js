/* Grafik SVG ringan (tanpa pustaka): batang, garis, histogram, batang horizontal.
 * Lebar mengikuti wadah (piksel nyata) sehingga teks tetap terbaca di HP. */
(function () {
  const esc = (s) => UI.esc(s);
  const observers = new WeakMap();
  function pasang(el, gambar) {
    if (!el) return;
    const render = () => { el.innerHTML = gambar(Math.max(260, el.clientWidth || 560)); };
    render();
    if (window.ResizeObserver && !observers.has(el)) {
      let w = el.clientWidth;
      const ro = new ResizeObserver(UI.debounce(() => { if (Math.abs(el.clientWidth - w) > 12) { w = el.clientWidth; render(); } }, 150));
      ro.observe(el); observers.set(el, ro);
    }
  }
  function skala(maks) { const langkah = maks <= 10 ? 2 : maks <= 50 ? 10 : 20; const t = []; for (let v = 0; v <= maks; v += langkah) t.push(v); return t; }
  const kosong = (pesan) => '<div class="grafik-kosong">' + ikon('barChart') + '<span>' + esc(pesan || 'Belum ada data untuk ditampilkan.') + '</span></div>';

  /** Batang vertikal. data: [{label, nilai}] · o: {maks, batas, satuan, tinggi} */
  function batang(el, data, o) {
    o = o || {};
    if (!data || !data.length || data.every((d) => d.nilai === '' || d.nilai === null)) { el.innerHTML = kosong(o.kosong); return; }
    pasang(el, (W) => {
      const H = o.tinggi || 240, kiri = 40, bawah = 44, atas = 22, kanan = 12, maks = o.maks || 100;
      const lebar = W - kiri - kanan, tinggi = H - atas - bawah, slot = lebar / data.length, bw = Math.min(46, slot * 0.58);
      const y = (v) => atas + tinggi - (v / maks) * tinggi;
      let s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.judul || 'Grafik batang') + '">';
      skala(maks).forEach((t) => { s += '<line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g-grid"/><text x="' + (kiri - 8) + '" y="' + (y(t) + 4) + '" class="g-sumbu" text-anchor="end">' + t + '</text>'; });
      data.forEach((d, i) => {
        const v = Number(d.nilai), cx = kiri + slot * i + slot / 2, ada = d.nilai !== '' && !isNaN(v);
        const bawahBatas = ada && o.batas !== undefined && v < o.batas;
        if (ada) {
          s += '<g><title>' + esc(d.label + ': ' + UI.angka(v) + (o.satuan || '')) + '</title><rect x="' + (cx - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + Math.max(2, atas + tinggi - y(v)) + '" rx="6" class="' + (bawahBatas ? 'g-batang-bahaya' : 'g-batang') + '"/>' +
            '<text x="' + cx + '" y="' + (y(v) - 6) + '" text-anchor="middle" class="g-nilai' + (bawahBatas ? ' g-nilai-bahaya' : '') + '">' + UI.angka(v) + '</text></g>';
        } else s += '<text x="' + cx + '" y="' + (atas + tinggi - 6) + '" text-anchor="middle" class="g-sumbu">–</text>';
        const lab = String(d.label || ''), pendek = lab.length > Math.max(6, Math.floor(slot / 7)) ? lab.slice(0, Math.max(5, Math.floor(slot / 7) - 1)) + '…' : lab;
        s += '<text x="' + cx + '" y="' + (H - bawah + 18) + '" text-anchor="middle" class="g-label"><title>' + esc(lab) + '</title>' + esc(pendek) + '</text>';
      });
      if (o.batas !== undefined) s += '<line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(o.batas) + '" y2="' + y(o.batas) + '" class="g-batas"/><text x="' + (W - kanan) + '" y="' + (y(o.batas) - 6) + '" text-anchor="end" class="g-batas-teks">Batas ' + o.batas + '</text>';
      return s + '</svg>' + (o.batas !== undefined && data.some((d) => d.nilai !== '' && d.nilai < o.batas) ? '<p class="grafik-legenda"><i class="lg lg-bahaya"></i>Di bawah batas ketuntasan <i class="lg lg-ok"></i>Mencapai batas</p>' : '');
    });
  }

  /** Garis dengan area. data: [{label, nilai}] */
  function garis(el, data, o) {
    o = o || {};
    if (!data || !data.length) { el.innerHTML = kosong(o.kosong); return; }
    pasang(el, (W) => {
      const H = o.tinggi || 220, kiri = 40, bawah = 40, atas = 22, kanan = 18, maks = o.maks || 100;
      const lebar = W - kiri - kanan, tinggi = H - atas - bawah, n = data.length;
      const x = (i) => kiri + (n === 1 ? lebar / 2 : (lebar * i) / (n - 1)), y = (v) => atas + tinggi - (Math.max(0, Math.min(maks, v)) / maks) * tinggi;
      let s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.judul || 'Grafik garis') + '"><defs><linearGradient id="gArea' + (o.id || '') + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="g-area-atas"/><stop offset="1" class="g-area-bawah"/></linearGradient></defs>';
      skala(maks).forEach((t) => { s += '<line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g-grid"/><text x="' + (kiri - 8) + '" y="' + (y(t) + 4) + '" class="g-sumbu" text-anchor="end">' + t + '</text>'; });
      const pts = data.map((d, i) => [x(i), y(Number(d.nilai) || 0)]);
      s += '<path d="M' + pts[0][0] + ' ' + (atas + tinggi) + ' L' + pts.map((p) => p.join(' ')).join(' L') + ' L' + pts[n - 1][0] + ' ' + (atas + tinggi) + 'Z" fill="url(#gArea' + (o.id || '') + ')"/>';
      s += '<path d="M' + pts.map((p) => p.join(' ')).join(' L') + '" class="g-garis"/>';
      if (o.batas !== undefined) s += '<line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(o.batas) + '" y2="' + y(o.batas) + '" class="g-batas"/>';
      const tiap = Math.ceil(n / Math.max(2, Math.floor(lebar / 70)));
      data.forEach((d, i) => {
        const akhir = i === n - 1;
        s += '<g><title>' + esc(d.label + ': ' + UI.angka(d.nilai) + (o.satuan || '')) + '</title><circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (akhir ? 6 : 4) + '" class="' + (akhir ? 'g-titik-akhir' : 'g-titik') + '"/></g>';
        if (i % tiap === 0 || akhir) s += '<text x="' + pts[i][0] + '" y="' + (H - bawah + 18) + '" text-anchor="middle" class="g-label">' + esc(d.label) + '</text>';
      });
      const last = data[n - 1];
      s += '<text x="' + Math.min(pts[n - 1][0], W - kanan - 4) + '" y="' + (pts[n - 1][1] - 12) + '" text-anchor="end" class="g-nilai">' + UI.angka(last.nilai) + (o.satuan || '') + '</text>';
      return s + '</svg>';
    });
  }

  /** Histogram sebaran nilai 0–100 (10 kelompok). */
  function histogram(el, sebaran, o) {
    o = o || {};
    const total = (sebaran || []).reduce((a, b) => a + b, 0);
    if (!total) { el.innerHTML = kosong('Belum ada nilai untuk penilaian ini.'); return; }
    pasang(el, (W) => {
      const H = o.tinggi || 220, kiri = 34, bawah = 40, atas = 20, kanan = 10, maks = Math.max(2, Math.max.apply(null, sebaran));
      const lebar = W - kiri - kanan, tinggi = H - atas - bawah, slot = lebar / 10;
      const y = (v) => atas + tinggi - (v / maks) * tinggi;
      let s = '<svg class="grafik" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sebaran nilai">';
      [0, Math.ceil(maks / 2), maks].forEach((t) => { s += '<line x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g-grid"/><text x="' + (kiri - 6) + '" y="' + (y(t) + 4) + '" class="g-sumbu" text-anchor="end">' + t + '</text>'; });
      sebaran.forEach((v, i) => {
        const x0 = kiri + slot * i + 2, bahaya = o.batas !== undefined && (i + 1) * 10 <= o.batas;
        if (v) s += '<g><title>' + (i * 10) + '–' + (i === 9 ? 100 : i * 10 + 9) + ': ' + v + ' siswa</title><rect x="' + x0 + '" y="' + y(v) + '" width="' + (slot - 4) + '" height="' + (atas + tinggi - y(v)) + '" rx="4" class="' + (bahaya ? 'g-batang-bahaya' : 'g-batang') + '"/><text x="' + (x0 + (slot - 4) / 2) + '" y="' + (y(v) - 5) + '" text-anchor="middle" class="g-nilai">' + v + '</text></g>';
        s += '<text x="' + (kiri + slot * i + slot / 2) + '" y="' + (H - bawah + 16) + '" text-anchor="middle" class="g-label">' + (i * 10) + '</text>';
      });
      if (o.batas !== undefined) { const bx = kiri + (o.batas / 100) * lebar; s += '<line x1="' + bx + '" x2="' + bx + '" y1="' + atas + '" y2="' + (atas + tinggi) + '" class="g-batas"/><text x="' + (bx + 4) + '" y="' + (atas + 10) + '" class="g-batas-teks">Batas ' + o.batas + '</text>'; }
      return s + '<text x="' + (W - kanan) + '" y="' + (H - 6) + '" text-anchor="end" class="g-sumbu">rentang nilai</text></svg>';
    });
  }

  /** Batang horizontal: [{label, nilai}] dalam persen. */
  function horizontal(el, data, o) {
    o = o || {};
    if (!data || !data.length) { el.innerHTML = kosong(o.kosong); return; }
    el.innerHTML = '<div class="hbar">' + data.map((d) => '<div class="hbar-baris"><span class="hbar-label" title="' + esc(d.label) + '">' + esc(d.label) + '</span>' +
      '<span class="hbar-jalur"><span style="width:' + Math.max(0, Math.min(100, d.nilai)) + '%"></span></span><span class="hbar-nilai">' + UI.angka(d.nilai, 0) + (o.satuan || '%') + '</span></div>').join('') + '</div>';
  }

  window.Grafik = { batang, garis, histogram, horizontal };
})();
