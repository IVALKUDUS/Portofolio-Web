(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Tema gelap/terang (ingat pilihan) ---- */
  let tema = null;
  try { tema = localStorage.getItem('tema'); } catch (e) {}
  if (!tema) tema = matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang';
  const pasangTema = (t) => {
    if (t === 'gelap') root.dataset.tema = 'gelap'; else delete root.dataset.tema;
    btnTema.textContent = t === 'gelap' ? '☀' : '☾';
    btnTema.setAttribute('aria-label', t === 'gelap' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
    const m = $('meta[name="theme-color"]'); if (m) m.content = t === 'gelap' ? '#0b1030' : '#8fd0ff';
  };
  const btnTema = document.createElement('button');
  btnTema.className = 'tema'; btnTema.type = 'button';
  $('.nav').appendChild(btnTema);
  pasangTema(tema);
  btnTema.addEventListener('click', () => {
    tema = tema === 'gelap' ? 'terang' : 'gelap';
    pasangTema(tema);
    try { localStorage.setItem('tema', tema); } catch (e) {}
  });

  /* ---- Progress bar scroll + tombol naik ---- */
  const bar = document.createElement('div'); bar.className = 'progres'; document.body.prepend(bar);
  const naik = document.createElement('button');
  naik.className = 'naik'; naik.type = 'button'; naik.textContent = '↑'; naik.setAttribute('aria-label', 'Kembali ke atas');
  document.body.appendChild(naik);
  const onScroll = () => {
    const h = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    naik.classList.toggle('tampil', scrollY > 500);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Efek mengetik pada peran ---- */
  const peran = $('.peran');
  if (peran && !reduce) {
    const daftar = ['Web Developer', 'Laravel Developer', 'REST API Builder', 'Lulusan PPLG'];
    peran.setAttribute('aria-label', 'Web Developer');
    const teks = document.createElement('span'), k = document.createElement('span');
    k.className = 'kursor'; k.setAttribute('aria-hidden', 'true'); teks.setAttribute('aria-hidden', 'true');
    peran.textContent = ''; peran.append(teks, k);
    let i = 0, j = 0, hapus = false;
    const ketik = () => {
      const kata = daftar[i];
      teks.textContent = kata.slice(0, j);
      let d = hapus ? 40 : 90;
      if (!hapus && j === kata.length) { hapus = true; d = 1600; }
      else if (hapus && j === 0) { hapus = false; i = (i + 1) % daftar.length; d = 350; }
      else j += hapus ? -1 : 1;
      setTimeout(ketik, d);
    };
    ketik();
  }

  /* ---- Efek miring pada foto mengikuti kursor ---- */
  const foto = $('.foto');
  if (foto && !reduce && matchMedia('(hover: hover)').matches) {
    const hero = $('.hero');
    hero.addEventListener('mousemove', (e) => {
      const r = foto.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      foto.style.transform = `perspective(500px) rotateY(${x * 40}deg) rotateX(${-y * 40}deg) scale(1.05)`;
    });
    hero.addEventListener('mouseleave', () => { foto.style.transform = ''; });
  }

  /* ---- Reveal saat scroll ---- */
  const targetReveal = $$('.hero-teks > *, .visual');
  targetReveal.forEach((el, n) => {
    el.classList.add('reveal');
    if (el.matches('.hero-teks > *')) el.style.setProperty('--tunda', `${(n % 7) * 0.07}s`);
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('tampil'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  targetReveal.forEach((el) => io.observe(el));

  /* ---- Nav aktif sesuai section ---- */
  const links = $$('.nav a');
  const sec = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const so = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('aktif', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sec.forEach((s) => so.observe(s));

  /* ---- Gulir halus seragam untuk semua tautan # dan tombol naik ---- */
  let anim = 0;
  const berhenti = () => { cancelAnimationFrame(anim); root.style.scrollBehavior = ''; };
  const gulir = (tujuan) => {
    cancelAnimationFrame(anim);
    const awal = scrollY, akhir = Math.max(0, Math.min(tujuan, root.scrollHeight - innerHeight)), jarak = akhir - awal;
    if (reduce || Math.abs(jarak) < 2) { scrollTo(0, akhir); return; }
    const dur = Math.min(2400, Math.max(900, Math.abs(jarak) * 0.6));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    root.style.scrollBehavior = 'auto';
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, awal + jarak * ease(t));
      if (t < 1) anim = requestAnimationFrame(step); else root.style.scrollBehavior = '';
    };
    anim = requestAnimationFrame(step);
  };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => addEventListener(ev, berhenti, { passive: true }));
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id.length > 1 ? $(id) : null;
    if (!el) return;
    e.preventDefault();
    gulir(id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - 70);
    history.pushState(null, '', id);
  }));
  naik.addEventListener('click', () => gulir(0));
  addEventListener('scroll', () => {
    if (innerHeight + scrollY >= root.scrollHeight - 4) links.forEach((a, i) => a.classList.toggle('aktif', i === links.length - 1));
  }, { passive: true });

  /* ---- Salin email ---- */
  const mail = $('a[href^="mailto:"]');
  if (mail) {
    const b = document.createElement('button');
    b.className = 'salin'; b.type = 'button'; b.textContent = 'Salin';
    mail.after(b);
    b.addEventListener('click', async () => {
      const alamat = mail.getAttribute('href').replace('mailto:', '');
      try { await navigator.clipboard.writeText(alamat); b.textContent = 'Tersalin ✓'; }
      catch (e) { b.textContent = 'Gagal'; }
      b.classList.add('ok'); setTimeout(() => { b.textContent = 'Salin'; b.classList.remove('ok'); }, 1800);
    });
  }

  /* ---- Galeri slider per peran ---- */
  const demo = $('.demo');
  if (demo) {
    const data = {};
    $$('.layar figure').forEach((fig) => {
      const imgs = $$('img', fig), caps = $$('figcaption', fig);
      data[fig.className.replace('layar-', '')] = imgs.map((im, n) => ({ src: im.src, alt: im.alt, cap: caps[n] ? caps[n].textContent : '' }));
    });
    const layar = $('.layar');
    const sl = document.createElement('div'); sl.className = 'slider';
    sl.innerHTML = `<div class="slider-gambar" role="group" aria-roledescription="carousel" aria-label="Tangkapan layar sistem"></div>
      <button class="slider-nav kiri" type="button" aria-label="Sebelumnya">‹</button>
      <button class="slider-nav kanan" type="button" aria-label="Berikutnya">›</button>
      <div class="slider-info"><p aria-live="polite"></p><div class="titik"></div></div>`;
    layar.appendChild(sl);
    const wadah = $('.slider-gambar', sl), cap = $('.slider-info p', sl), titik = $('.titik', sl);
    let peranAktif = 'admin', idx = 0, timer;

    const render = () => {
      const s = data[peranAktif];
      wadah.innerHTML = s.map((x, n) => `<img src="${x.src}" alt="${x.alt}" class="${n === idx ? 'on' : ''}">`).join('');
      cap.textContent = s[idx].cap;
      titik.innerHTML = s.map((_, n) => `<button type="button" aria-label="Gambar ${n + 1}" class="${n === idx ? 'on' : ''}"></button>`).join('');
      $$('button', titik).forEach((b, n) => b.addEventListener('click', () => { idx = n; render(); reset(); }));
    };
    const geser = (d) => { const n = data[peranAktif].length; idx = (idx + d + n) % n; render(); };
    const reset = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => geser(1), 6000); };
    $('.kiri', sl).addEventListener('click', () => { geser(-1); reset(); });
    $('.kanan', sl).addEventListener('click', () => { geser(1); reset(); });
    $$('input[name="peran"]', demo).forEach((r) => r.addEventListener('change', () => {
      peranAktif = r.id.replace('tab-', ''); idx = 0; render(); reset();
    }));
    sl.addEventListener('mouseenter', () => clearInterval(timer));
    sl.addEventListener('mouseleave', reset);
    // Swipe di layar sentuh
    let x0 = null;
    wadah.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    wadah.addEventListener('touchend', (e) => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { geser(dx < 0 ? 1 : -1); reset(); } x0 = null;
    });
    render(); reset();

    /* Lightbox */
    const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button type="button" aria-label="Tutup">✕</button><img alt=""><p></p>';
    document.body.appendChild(lb);
    const tutup = () => lb.classList.remove('buka');
    wadah.addEventListener('click', () => {
      const x = data[peranAktif][idx];
      $('img', lb).src = x.src; $('img', lb).alt = x.alt; $('p', lb).textContent = x.cap;
      lb.classList.add('buka'); $('button', lb).focus();
    });
    lb.addEventListener('click', (e) => { if (e.target !== $('img', lb)) tutup(); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') tutup();
      if (lb.classList.contains('buka')) return;
      if (e.key === 'ArrowLeft' && sl.matches(':hover, :focus-within')) { geser(-1); reset(); }
      if (e.key === 'ArrowRight' && sl.matches(':hover, :focus-within')) { geser(1); reset(); }
    });
  }

  /* ---- Papan & tali: goyangan kecil, sudut disesuaikan tinggi agar ujung tali tetap menempel ---- */
  const atur = () => {
    const rad = 180 / Math.PI, geser = 2.6;
    $$('.spanduk-besar').forEach((b) => {
      b.style.setProperty('--amp', (Math.atan(geser / b.offsetHeight) * rad).toFixed(3) + 'deg');
      const t = b.nextElementSibling;
      if (t && t.classList.contains('tali-antar')) t.style.setProperty('--sk', (Math.atan(geser / t.getBoundingClientRect().height) * rad).toFixed(3) + 'deg');
    });
  };
  atur();
  addEventListener('load', atur);
  addEventListener('resize', atur);
})();
