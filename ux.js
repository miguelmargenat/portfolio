/* ============================================================
   UX · mejoras de uso (25/11/2026) · componentes aditivos, separados de ui.js.
   Cada bloque se activa solo si la página tiene los elementos que usa.
   ============================================================ */
(function(){
  const EN = document.documentElement.lang === 'en';
  const T = (es, en) => EN ? en : es;
  const PAGE = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  const raf = fn => { let p = false; return () => { if (p) return; p = true; requestAnimationFrame(() => { p = false; fn(); }); }; };

  if (PAGE === 'campeones') document.body.classList.add('ux-campeones');

  /* ---------- 1. ayuda que dice «mouse» donde no hay mouse ---------- */
  if (window.matchMedia('(hover:none)').matches) {
    const viejo = T('Pasá el mouse para frenar · clic para ampliar', 'Hover to pause · click to enlarge');
    document.querySelectorAll('div,p,span').forEach(e => {
      if (!e.children.length && e.textContent.trim() === viejo) e.textContent = T('Tocá una foto para ampliar', 'Tap a photo to enlarge');
    });
  }

  /* ---------- 2. índice fijo con chips (Gravel e Indumentaria) ---------- */
  function indice(items, antesDe) {
    const ref = document.querySelector(antesDe);
    if (!ref || document.querySelector('.ux-idx')) return;
    const nav = document.querySelector('nav');
    if (nav) document.documentElement.style.setProperty('--uxnav', nav.getBoundingClientRect().height + 'px');
    const barra = document.createElement('div');
    barra.className = 'ux-idx';
    barra.setAttribute('role', 'navigation');
    barra.setAttribute('aria-label', T('Secciones de la página', 'Page sections'));
    const objetivos = items.map(it => ({ el: document.querySelector(it[1]), txt: it[0] })).filter(o => o.el);
    objetivos.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = o.txt; o.btn = b;
      b.addEventListener('click', () => {
        const y = o.el.getBoundingClientRect().top + scrollY - (barra.offsetHeight + (nav ? nav.offsetHeight : 66) + 8);
        window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
      barra.appendChild(b);
    });
    ref.parentNode.insertBefore(barra, ref);
    const pintar = raf(() => {
      const linea = (nav ? nav.offsetHeight : 66) + barra.offsetHeight + 40;
      let act = null;
      objetivos.forEach(o => { if (o.el.getBoundingClientRect().top <= linea) act = o; });
      objetivos.forEach(o => o.btn.classList.toggle('on', o === act));
      if (act) barra.scrollTo({ left: act.btn.offsetLeft - 20, behavior: 'auto' });
    });
    addEventListener('scroll', pintar, { passive: true }); addEventListener('resize', pintar, { passive: true });
    pintar();
  }
  if (PAGE === 'gravel') document.body.classList.add('ux-gravel');
  if (PAGE === 'indumentaria') document.body.classList.add('ux-indu');
  if (PAGE === 'gravel') indice([
    [T('Película', 'Film'), '.in-film'], [T('En ruta', 'On the road'), '.in-ruta'], [T('Videos', 'Videos'), '.in-video'],
    [T('Anatomía', 'Anatomy'), '.in-anat'], ['Indómita', '.in-split.inv'], ['Tirrena', '.in-split:not(.inv)']
  ], 'body > .fx-dash');
  if (PAGE === 'indumentaria') indice([
    [T('Videos', 'Videos'), '.in2-top'], [T('En uso', 'In use'), '.uso-wrap'], [T('Femenino', 'Women'), '.iz-stage:nth-of-type(1)'],
    [T('Masculino', 'Men'), '.iz-stage[data-set="1"]'], [T('Manga larga', 'Long sleeve'), '.pl-wrap'], [T('Calzas', 'Bib shorts'), '.pl-wrap:nth-of-type(2)']
  ], '.uso-wrap');

  /* ---------- 3. Ugarte: reels en grilla de 3 y zoom al hacer clic ----------
     Cada reel sigue mostrando su portada de Instagram. El clic abre ese mismo
     reel grande, con flechas para pasar al anterior o al siguiente. */
  (function () {
    const grid = document.getElementById('ugGrid');
    if (!grid) return;
    document.body.classList.add('ux-ugarte');
    const slots = () => [...grid.querySelectorAll('.ug-slot')];
    const box = document.createElement('div');
    box.className = 'ug-zoom ux-reelzoom'; box.id = 'uxReelZoom';
    box.innerHTML = '<button class="zc" aria-label="' + T('Cerrar', 'Close') + '">✕</button>' +
      '<button class="zp" aria-label="' + T('Anterior', 'Previous') + '">‹</button>' +
      '<div class="ux-rzbox"></div>' +
      '<button class="zn" aria-label="' + T('Siguiente', 'Next') + '">›</button><span class="zct"></span>';
    document.body.appendChild(box);
    const caja = box.querySelector('.ux-rzbox'), ct = box.querySelector('.zct');
    let cur = 0;
    function pintar() {
      const s = slots()[cur]; if (!s) return;
      caja.innerHTML = '<blockquote class="instagram-media" data-instgrm-permalink="' + s.dataset.url + '" data-instgrm-version="14" style="width:100%!important;min-width:0!important;margin:0"></blockquote>';
      caja.scrollTop = 0;
      ct.textContent = (cur + 1) + ' / ' + slots().length;
      if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
    }
    function abrir(i) { cur = i; pintar(); box.classList.add('on'); document.body.style.overflow = 'hidden'; }
    function cerrar() { box.classList.remove('on'); document.body.style.overflow = ''; caja.innerHTML = ''; }
    function paso(n) { const t = slots().length; cur = (cur + n + t) % t; pintar(); }
    grid.addEventListener('click', e => {
      const s = e.target.closest('.ug-slot'); if (!s) return;
      abrir(slots().indexOf(s));
    });
    box.querySelector('.zc').addEventListener('click', cerrar);
    box.querySelector('.zp').addEventListener('click', e => { e.stopPropagation(); paso(-1); });
    box.querySelector('.zn').addEventListener('click', e => { e.stopPropagation(); paso(1); });
    box.addEventListener('click', e => { if (e.target === box) cerrar(); });
    document.addEventListener('keydown', e => {
      if (!box.classList.contains('on')) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowRight') paso(1);
      if (e.key === 'ArrowLeft') paso(-1);
    });
  })();

  /* ---------- 3b. Indumentaria: las 6 calzas en una sola línea ---------- */
  (function () {
    const mk = () => document.querySelectorAll('.pl-wrap').forEach(w => {
      if (w.querySelectorAll('.pl-rot').length >= 2) w.classList.add('ux-calzas');
    });
    mk(); setTimeout(mk, 600);
  })();

  /* ---------- 4. Whipper: los chips de color también arriba ---------- */
  (function () {
    const orig = document.getElementById('whColores'), head = document.querySelector('.wh-head');
    if (!orig || !head) return;
    const mk = () => {
      let host = head.querySelector('.ux-prox');
      if (!host) { host = document.createElement('div'); host.className = 'ux-prox'; head.appendChild(host); }
      host.innerHTML = '';
      [...orig.children].forEach((ob, k) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = ob.className; b.innerHTML = ob.innerHTML;
        b.addEventListener('click', () => orig.children[k] && orig.children[k].click());
        host.appendChild(b);
      });
    };
    mk();
    new MutationObserver(mk).observe(orig, { attributes: true, subtree: true, childList: true, attributeFilter: ['class'] });
  })();

  /* ---------- 5. Calzado: las 9 viñetas del rol en tres grupos ---------- */
  (function () {
    const ul = document.querySelector('.pz-bar .pz-lista'), stage = document.querySelector('.pz-stage');
    if (!ul || !stage || document.querySelector('.ux-rol')) return;
    const li = [...ul.children].map(e => e.innerHTML);
    if (li.length !== 9) return;
    const G3 = [
      [T('Investigación y definición', 'Research and definition'), [0, 1, 2]],
      [T('Desarrollo con proveedores', 'Development with suppliers'), [3, 4, 5, 6]],
      [T('Validación y lanzamiento', 'Validation and launch'), [7, 8]]
    ];
    const sec = document.createElement('section');
    sec.className = 'ux-rol';
    sec.innerHTML = '<div class="ux-t">' + T('Mi rol en el proyecto', 'My role in the project') + '</div><div class="ux-rolgrid">' +
      G3.map(g => '<div class="ux-rolcol"><h3>' + g[0] + '</h3><ul>' + g[1].map(i => '<li>' + li[i] + '</li>').join('') + '</ul></div>').join('') + '</div>';
    stage.parentNode.insertBefore(sec, stage.nextSibling);
    ul.remove();
  })();

  /* ---------- 6. SportAce: logo, texto de marca, productos y rol en grupos ---------- */
  (function () {
    const prods = document.getElementById('saProds'), head = document.querySelector('.sa-head'), intro = document.querySelector('.sa-intro');
    if (!prods || !head || !intro || prods.dataset.ux) return;
    const filas = [...intro.querySelectorAll('.sa-fila')];
    if (filas.length < 3) return;
    prods.dataset.ux = '1';
    const marca = filas[0].querySelector('.sa-par'), enfoque = filas[1].querySelector('.sa-par'), rolIn = filas[2].querySelector('.sa-rol-in');
    const tareas = [...filas[2].querySelectorAll('li')].map(l => l.innerHTML);
    if (!marca || !enfoque || !rolIn || tareas.length !== 10) return;
    const G = [
      [T('Investigación y desarrollo', 'Research and development'), [0, 1, 2]],
      [T('Proveedores y diseño', 'Suppliers and design'), [3, 4, 5, 7]],
      [T('Presentación y lanzamiento', 'Presentation and launch'), [6, 8, 9]]
    ];
    /* 1) logo a la izquierda y el texto de la marca a la derecha, en una sola franja */
    document.body.classList.add('ux-sa-page');
    const hero = document.createElement('section');
    hero.className = 'ux-sa-hero';
    head.before(hero);
    hero.appendChild(head);
    const lead = document.createElement('div');
    lead.className = 'ux-sa-lead';
    lead.innerHTML = '<span class="ux-sa-k">' + T('La marca', 'The brand') + '</span><p>' + marca.innerHTML + '</p>';
    hero.appendChild(lead);
    /* 2) los productos, pegados debajo */
    hero.after(prods);
    /* 3) enfoque y rol, con las tareas agrupadas */
    const txt = document.createElement('section');
    txt.className = 'ux-sa-txt';
    txt.innerHTML =
      '<div class="ux-sa-dos">' +
        '<div><span class="ux-sa-k">' + T('El enfoque', 'The approach') + '</span><p>' + enfoque.innerHTML + '</p></div>' +
        '<div><span class="ux-sa-k">' + T('Mi rol', 'My role') + '</span><p>' + rolIn.innerHTML + '</p></div>' +
      '</div>' +
      '<div class="ux-rolgrid">' + G.map(g => '<div class="ux-rolcol"><h3>' + g[0] + '</h3><ul>' + g[1].map(i => '<li>' + tareas[i] + '</li>').join('') + '</ul></div>').join('') + '</div>';
    prods.after(txt);
    /* el bloque original queda en el HTML, oculto en la prueba */
    intro.hidden = true;
    const dash = document.querySelector('body > .fx-dash'); if (dash) dash.style.display = 'none';
    const sep = document.createElement('div'); sep.className = 'ux-sep'; prods.after(sep);
  })();

  /* ---------- 7. Clash: más presencia (numeral, brillo del color, visor grande) ---------- */
  (function () {
    const mods = document.getElementById('clMods');
    if (!mods) return;
    document.body.classList.add('ux-clash');
    const COLOR = { 'naranja': '#e8553a', 'rojo': '#e0343c', 'verde': '#a3bd3f', 'blanco': '#ece9e1', 'full black': '#9a9a9a' };
    mods.querySelectorAll('.cl-mod').forEach(mod => {
      const num = (mod.querySelector('.r') ? mod.querySelector('.r').textContent : '').replace(/[^0-9]/g, '');
      const view = mod.querySelector('.cl-view');
      if (!view) return;
      const n = document.createElement('span');
      n.className = 'cl-num'; n.setAttribute('aria-hidden', 'true'); n.textContent = num + '″';
      view.prepend(n);
      const imgs = [...view.querySelectorAll('img')], btns = [...mod.querySelectorAll('.cl-sel button')];
      const pintar = () => {
        const k = Math.max(0, imgs.findIndex(i => i.classList.contains('on')));
        const nm = btns[k] && btns[k].querySelector('.nm') ? btns[k].querySelector('.nm').textContent.trim().toLowerCase() : '';
        btns.forEach((b, i) => b.classList.toggle('on', i === k));
      };
      new MutationObserver(pintar).observe(view, { attributes: true, subtree: true, attributeFilter: ['class'] });
      /* puntito de color en cada botón */
      btns.forEach(b => {
        const nm = b.querySelector('.nm') ? b.querySelector('.nm').textContent.trim().toLowerCase() : '';
        const d = document.createElement('i'); d.className = 'cl-dot'; d.style.background = COLOR[nm] || '#e8553a';
        const lab = b.querySelector('.nm'); if (lab) lab.prepend(d);
      });
      pintar();
    });
  })();
})();
