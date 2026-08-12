/* ============================================================
   Detalles de uso compartidos por todas las páginas:
   · barra de progreso de scroll
   · botón para volver arriba
   · deslizar con el dedo dentro del visor de zoom
   El marcado se inserta desde acá para no repetirlo en cada HTML.
   ============================================================ */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- barra de progreso ---------- */
  const barra=document.createElement('div');
  barra.className='scrollbar';
  barra.innerHTML='<i></i>';
  document.body.appendChild(barra);
  const relleno=barra.querySelector('i');

  /* ---------- volver arriba ---------- */
  const subir=document.createElement('button');
  subir.className='totop';
  subir.type='button';
  subir.setAttribute('aria-label','Volver arriba');
  subir.textContent='↑';
  document.body.appendChild(subir);
  subir.addEventListener('click',()=>{
    window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
  });

  let pendiente=false;
  function pintar(){
    pendiente=false;
    const alto=document.documentElement.scrollHeight-window.innerHeight;
    const y=window.scrollY||document.documentElement.scrollTop;
    const pct=alto>0?Math.min(100,(y/alto)*100):0;
    relleno.style.width=pct+'%';
    subir.classList.toggle('on', y>window.innerHeight*.9);
  }
  window.addEventListener('scroll',()=>{
    if(pendiente)return;
    pendiente=true;
    requestAnimationFrame(pintar);
  },{passive:true});
  window.addEventListener('resize',pintar,{passive:true});
  pintar();

  /* ---------- submenú de Portfolio en el menú de celular ----------
     En celular, "Portfolio" se abre y muestra los cuatro proyectos. En
     escritorio no cambia nada: el submenú queda oculto por CSS.
     Se arma desde acá para no repetirlo en las quince páginas. */
  (function(){
    const enlace=document.querySelector('nav .links a[href$="experiencia.html"]');
    if(!enlace||document.querySelector('.navsub'))return;

    const PROYECTOS=[
      ['Volta','experiencia.html#volta'],
      ['Vehículos Ugarte','ugarte.html'],
      ['Impresión 3D','impresion-3d.html'],
      ['Renders','renders.html']
    ];

    /* el enlace y su lista quedan envueltos en un contenedor */
    const caja=document.createElement('div');
    caja.className='navgroup';
    enlace.parentNode.insertBefore(caja,enlace);
    caja.appendChild(enlace);

    const flecha=document.createElement('button');
    flecha.className='navmas';
    flecha.type='button';
    flecha.setAttribute('aria-label','Ver los proyectos');
    flecha.setAttribute('aria-expanded','false');
    flecha.textContent='+';
    caja.appendChild(flecha);

    const sub=document.createElement('div');
    sub.className='navsub';
    sub.innerHTML=PROYECTOS.map(([t,h])=>'<a href="'+h+'">'+t+'</a>').join('');
    caja.appendChild(sub);

    flecha.addEventListener('click',e=>{
      e.preventDefault(); e.stopPropagation();
      const abierto=caja.classList.toggle('open');
      flecha.setAttribute('aria-expanded',abierto?'true':'false');
      flecha.textContent=abierto?'−':'+';
    });
  })();

  /* ---------- deslizar en el visor de zoom ----------
     Cada página tiene su propio visor con distinta clase, pero todos
     comparten un botón de anterior y otro de siguiente. Se busca cualquiera
     de los dos y se simula el clic al arrastrar. */
  const VISORES='.pz-zoom, .ug-zoom, .lf-zoom, .in-zoom, .cp-zoom';
  document.querySelectorAll(VISORES).forEach(visor=>{
    const prev=visor.querySelector('.z-prev, .zp');
    const next=visor.querySelector('.z-next, .zn');
    if(!prev||!next)return;

    let x0=null,y0=null;
    visor.addEventListener('touchstart',e=>{
      if(e.touches.length!==1)return;
      x0=e.touches[0].clientX; y0=e.touches[0].clientY;
    },{passive:true});

    visor.addEventListener('touchend',e=>{
      if(x0===null)return;
      const t=e.changedTouches[0];
      const dx=t.clientX-x0, dy=t.clientY-y0;
      x0=null;
      /* sólo cuenta si el gesto fue claramente horizontal */
      if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.4)return;
      (dx<0?next:prev).click();
    },{passive:true});
  });
})();
