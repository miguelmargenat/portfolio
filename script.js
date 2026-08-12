/* MARGENAT. — v2 · interacción y motion
   Usa GSAP + ScrollTrigger + Lenis si están disponibles (CDN),
   con degradación elegante a IntersectionObserver. */
(function(){
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST   = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis= typeof window.Lenis !== 'undefined';
  const reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- PRELOADER ---------------- */
  const pre = document.querySelector('.preloader');
  function finishLoad(){
    document.body.classList.remove('loading');
    if(pre){
      pre.classList.add('done');
      setTimeout(()=>pre.remove(),1100);
    }
    startIntro();
  }
  if(pre && !reduce){
    document.body.classList.add('loading');
    const count = pre.querySelector('.pl-count');
    const bar = pre.querySelector('.pl-bar');
    const words = pre.querySelectorAll('.pl-word span');
    words.forEach((w,i)=>{ if(hasGSAP) gsap.to(w,{y:'0%',duration:.9,delay:.1+i*.08,ease:'power3.out'}); else w.style.transform='translateY(0)'; });
    let n=0;
    const iv=setInterval(()=>{
      n+=Math.floor(Math.random()*9)+3; if(n>100)n=100;
      if(count)count.textContent=n; if(bar)bar.style.width=n+'%';
      if(n>=100){clearInterval(iv);setTimeout(finishLoad,350);}
    },90);
  } else {
    if(pre) pre.remove();
    document.body.classList.remove('loading');
    document.addEventListener('DOMContentLoaded',startIntro);
    startIntro();
  }

  /* ---------------- SMOOTH SCROLL (Lenis) ---------------- */
  let lenis=null;
  if(hasLenis && !reduce){
    lenis=new Lenis({duration:1.1,smoothWheel:true});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf);}
    requestAnimationFrame(raf);
    if(hasST){lenis.on('scroll',ScrollTrigger.update);}
  }

  /* ---------------- CURSOR ---------------- */
  if(window.matchMedia('(hover:hover)').matches){
    document.body.classList.add('has-cursor');
    const cur=document.createElement('div');
    cur.className='cursor';
    cur.innerHTML='<span class="clabel"></span>';
    document.body.appendChild(cur);
    const label=cur.querySelector('.clabel');
    let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my;
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
    (function loop(){cx+=(mx-cx)*.2;cy+=(my-cy)*.2;cur.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;requestAnimationFrame(loop)})();
    const grow=(txt)=>{cur.classList.add('big');label.textContent=txt||'';};
    const shrink=()=>{cur.classList.remove('big');label.textContent='';};
    document.querySelectorAll('a,button,.card,.exp-tile').forEach(el=>{
      const t=el.dataset.cursor|| (el.classList.contains('card')||el.classList.contains('exp-tile')?'Ver':'');
      el.addEventListener('mouseenter',()=>grow(t));
      el.addEventListener('mouseleave',shrink);
    });
  }

  /* ---------------- NAV MOBILE ---------------- */
  const toggle=document.querySelector('.navtoggle');
  const links=document.querySelector('nav .links');
  if(toggle&&links){
    toggle.addEventListener('click',()=>{links.classList.toggle('open');toggle.classList.toggle('open');});
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
  }

  /* ---------------- INTRO + SCROLL ANIMATIONS ---------------- */
  function startIntro(){
    if(startIntro._done) return; startIntro._done=true;

    /* photo scale-in + clip */
    const ph=document.querySelector('.intro-photo img');
    if(ph){ if(hasGSAP&&!reduce){gsap.to(ph,{scale:1,duration:1.6,ease:'power3.out'});} else {ph.style.transform='scale(1)';} }

    /* intro text lines */
    document.querySelectorAll('.intro-text .line-mask > *').forEach((el,i)=>{
      if(hasGSAP&&!reduce){gsap.to(el,{y:'0%',duration:1,delay:.15+i*.12,ease:'power3.out'});}
      else {el.style.transform='translateY(0)';}
    });

    if(!hasST||reduce){ basicReveals(); }
    else { gsapReveals(); }

    initMarquee();
    initVideo();
  }

  /* ---------------- REVEALS (fallback) ---------------- */
  function basicReveals(){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.14});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
    document.querySelectorAll('.clip-img').forEach(el=>{
      const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.style.transition='clip-path 1.2s cubic-bezier(.16,1,.3,1)';e.target.style.clipPath='inset(0 0 0% 0)';o.unobserve(e.target);}}),{threshold:.2});
      o.observe(el);
    });
  }

  /* ---------------- REVEALS (GSAP) ---------------- */
  function gsapReveals(){
    /* Las tarjetas de Portfolio entran escalonadas, como una sola secuencia,
       en vez de disparar cada una por su cuenta. */
    const cards=gsap.utils.toArray('.cards .card.reveal');
    if(cards.length){
      gsap.fromTo(cards,{y:46,opacity:0},{y:0,opacity:1,duration:1,ease:'power3.out',
        stagger:.12,scrollTrigger:{trigger:cards[0].parentNode,start:'top 85%'}});
    }
    gsap.utils.toArray('.reveal').forEach(el=>{
      if(el.matches('.cards .card'))return;
      gsap.fromTo(el,{y:46,opacity:0},{y:0,opacity:1,duration:1,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 85%'}});
    });
    gsap.utils.toArray('.clip-img').forEach(el=>{
      gsap.fromTo(el,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.3,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 82%'}});
    });
    /* parallax */
    gsap.utils.toArray('[data-parallax]').forEach(el=>{
      const amt=parseFloat(el.dataset.parallax)||0.15;
      gsap.to(el,{yPercent:-amt*100,ease:'none',
        scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
    });
    /* stagger chips */
    gsap.utils.toArray('.chips').forEach(row=>{
      gsap.fromTo(row.children,{y:18,opacity:0},{y:0,opacity:1,duration:.6,stagger:.05,ease:'power2.out',
        scrollTrigger:{trigger:row,start:'top 88%'}});
    });
    /* section headings word rise */
    gsap.utils.toArray('.shead h2').forEach(h=>{
      gsap.fromTo(h,{y:30,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:h,start:'top 88%'}});
    });
  }

  /* ---------------- MARQUEE (reactivo a scroll) ---------------- */
  function initMarquee(){
    const strip=document.querySelector('.strip .track');
    if(!strip)return;
    let base= -0.6, cur=base, target=base, x=0, w=strip.scrollWidth/2;
    if(lenis){lenis.on('scroll',({velocity})=>{target=base - Math.min(Math.abs(velocity),40)*0.12*Math.sign(velocity||1);});}
    (function tick(){
      cur+=(target-cur)*.06; target+=(base-target)*.04;
      x+=cur; if(x<=-w)x+=w; if(x>0)x-=w;
      strip.style.transform=`translateX(${x}px)`;
      requestAnimationFrame(tick);
    })();
  }

  /* ---------------- VIDEO autoplay ---------------- */
  function initVideo(){
    const vid=document.getElementById('reelVideo');
    const vwrap=document.getElementById('videoWrap');
    const sbtn=document.getElementById('soundToggle');
    if(!vid)return;

    const vio=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ vid.play().then(()=>vwrap&&vwrap.classList.add('playing')).catch(()=>{}); }
      else{ vid.pause(); vwrap&&vwrap.classList.remove('playing'); }
    }),{threshold:.45});
    vio.observe(vid);

    /* El sonido se alterna: el botón enciende, y volver a tocar el video
       lo silencia. El botón vuelve a aparecer cuando queda muteado. */
    function pintarSonido(){
      if(!sbtn)return;
      sbtn.classList.toggle('hidden',!vid.muted);
      const ic=sbtn.querySelector('.ic');
      if(ic)ic.textContent=vid.muted?'🔊':'🔇';
    }

    if(sbtn){
      sbtn.addEventListener('click',e=>{
        e.stopPropagation();
        vid.muted=!vid.muted;
        if(!vid.muted)vid.volume=1;
        vid.play().catch(()=>{});
        pintarSonido();
      });
    }

    /* clic sobre el video: silencia si está sonando, y lo enciende si no */
    if(vwrap){
      vwrap.style.cursor='pointer';
      vwrap.addEventListener('click',e=>{
        if(e.target.closest('.sound-cta'))return;
        vid.muted=!vid.muted;
        if(!vid.muted)vid.volume=1;
        vid.play().catch(()=>{});
        pintarSonido();
      });
    }
  }

  /* ---------------- YOUTUBE (fachada con miniatura) ----------------
     Los embeds de YouTube fallan con error 143 al abrir el sitio como
     archivo local (file://). Mostramos la miniatura y sólo cargamos el
     reproductor cuando hay un origen válido; si no, abrimos YouTube. */
  function initYouTube(scope){
    const local = location.protocol === 'file:';

    /* Fuera de file://: el video se reproduce solo (muteado, en loop) apenas
       entra en pantalla. El autoplay con sonido lo bloquea el navegador. */
    if(!local){
      const vio=new IntersectionObserver(es=>es.forEach(e=>{
        if(!e.isIntersecting)return;
        const box=e.target, id=box.dataset.yt;
        if(id&&!box.dataset.ready){
          box.dataset.ready='1';
          box.classList.add('playing');
          box.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id
            +'?autoplay=1&mute=1&loop=1&playlist='+id+'&controls=0&modestbranding=1&rel=0&playsinline=1" '
            +'title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
            +'<button class="yt-open" aria-label="Ver en YouTube">Ver con sonido ↗</button>';
          box.querySelector('.yt-open').addEventListener('click',ev=>{
            ev.stopPropagation();
            window.open('https://www.youtube.com/watch?v='+id,'_blank','noopener');
          });
        }
        vio.unobserve(box);
      }),{threshold:.25});
      scope.querySelectorAll('.ytf').forEach(b=>vio.observe(b));
      return;
    }

    scope.querySelectorAll('.ytf').forEach(box=>{
      const id=box.dataset.yt;
      if(!id||box.dataset.ready)return;
      box.dataset.ready='1';
      /* Miniatura: si se define data-poster se usa esa imagen propia.
         Si no, se piden las de YouTube de mayor a menor calidad. */
      const candidates = box.dataset.poster
        ? [box.dataset.poster]
        : ['maxresdefault.jpg','sddefault.jpg','hqdefault.jpg']
            .map(f=>'https://i.ytimg.com/vi/'+id+'/'+f);
      const img=document.createElement('img');
      img.alt='';
      const btn=document.createElement('button');
      btn.className='yt-play'; btn.setAttribute('aria-label','Reproducir video'); btn.textContent='▶';
      box.append(img,btn);
      let c=0;
      img.addEventListener('error',()=>{
        if(++c<candidates.length) img.src=candidates[c];
        else img.style.display='none';
      });
      img.src=candidates[0];
      box.addEventListener('click',()=>{
        if(local){
          window.open('https://www.youtube.com/watch?v='+id,'_blank','noopener');
          return;
        }
        box.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" '
          +'title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
          +'allowfullscreen></iframe>';
      });
    });
  }

  /* ---------------- PROJECT OVERLAY ---------------- */
  const overlay=document.getElementById('projectOverlay');
  if(overlay){
    const titleEl=overlay.querySelector('.po-title');
    const metaEl=overlay.querySelector('.po-meta');
    const bodyEl=overlay.querySelector('.po-body');
    const toolsEl=overlay.querySelector('.po-tools');
    const iconEl=overlay.querySelector('.po-icon');
    const embedEl=overlay.querySelector('.po-embed');
    const heroEl=overlay.querySelector('.po-hero');
    const subheroEl=overlay.querySelector('.po-subhero');
    const closeBtn=overlay.querySelector('.po-close');
    let heroTimer=null, subTimer=null, subCoverTimer=null;

    /* subheader de fotos: mismo tratamiento que la página de Calzado */
    function buildSubhero(list,eyebrow,htitle){
      if(!subheroEl)return;
      clearInterval(subTimer);
      if(!list||!list.length){subheroEl.innerHTML='';subheroEl.classList.remove('on');overlay.classList.remove('hero-title');return;}
      subheroEl.classList.add('on');
      let txt='';
      if(eyebrow||htitle){
        overlay.classList.add('hero-title');
        const lines=(htitle||'').split('|');
        txt='<div class="sh-txt">'
          +(eyebrow?'<span class="sh-eye">'+eyebrow+'</span>':'')
          +(htitle?'<h2 class="sh-h">'+lines[0]+(lines[1]?'<br><em>'+lines[1]+'</em>':'')+'</h2>':'')
          +'</div>';
      } else { overlay.classList.remove('hero-title'); }
      subheroEl.innerHTML=list.map((src,i)=>'<img src="'+src.trim()+'" alt=""'+(i===0?' class="on"':'')+'>').join('')
        +'<span class="sh-veil"></span>'
        +'<span class="corner tl"></span><span class="corner tr"></span>'
        +'<span class="corner bl"></span><span class="corner br"></span>'
        +'<span class="sh-sweep"><i></i></span>'
        +txt
        +'<span class="sh-dots">'+list.map((_,i)=>'<b'+(i===0?' class="on"':'')+'></b>').join('')+'</span>';
      const imgs=subheroEl.querySelectorAll('img');
      const dots=subheroEl.querySelectorAll('.sh-dots b');
      const sweep=subheroEl.querySelector('.sh-sweep');
      let i=0;
      function go(n){
        imgs[i].classList.remove('on'); dots[i].classList.remove('on');
        i=(n+imgs.length)%imgs.length;
        imgs[i].classList.add('on'); dots[i].classList.add('on');
        sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go');
      }
      function start(){clearInterval(subTimer);subTimer=setInterval(()=>go(i+1),3600);}
      if(imgs.length>1)start();
      subheroEl.onclick=e=>{if(e.target.tagName!=='B'){go(i+1);start();}};
      dots.forEach((d,n)=>d.addEventListener('click',e=>{e.stopPropagation();go(n);start();}));
    }

    /* header del panel: logo de la marca o fotos */
    function buildPanelLogo(src){
      if(!heroEl)return;
      clearInterval(heroTimer);
      heroEl.className='po-hero on logo';
      heroEl.innerHTML='<div class="bp-grid"></div><img src="'+src+'" alt="Logo">';
    }
    function buildPanelHero(list){
      if(!heroEl)return;
      clearInterval(heroTimer);
      heroEl.className='po-hero';
      if(!list||!list.length){heroEl.innerHTML='';return;}
      heroEl.classList.add('on');
      heroEl.innerHTML=list.map((src,i)=>'<img src="'+src.trim()+'" alt=""'+(i===0?' class="on"':'')+'>').join('')
        +'<span class="po-hero-fade"></span>';
      const imgs=heroEl.querySelectorAll('img');
      if(imgs.length<2)return;
      let i=0;
      heroTimer=setInterval(()=>{
        imgs[i].classList.remove('on');
        i=(i+1)%imgs.length;
        imgs[i].classList.add('on');
      },3600);
    }

    let reels=[], reelIdx=0, embedObserver=null;

    function setupLazyEmbeds(){
      if(embedObserver)embedObserver.disconnect();
      embedObserver=new IntersectionObserver(es=>es.forEach(e=>{
        if(!e.isIntersecting)return;
        const slot=e.target;
        if(!slot.dataset.loaded){
          slot.dataset.loaded='1';
          slot.innerHTML='<blockquote class="instagram-media" data-instgrm-permalink="'+slot.dataset.url+'" data-instgrm-version="14" style="width:100%!important;min-width:0!important;margin:0"></blockquote>';
          if(window.instgrm&&window.instgrm.Embeds){window.instgrm.Embeds.process();}
        }
        embedObserver.unobserve(slot);
      }),{root:overlay,rootMargin:'400px 0px',threshold:.01});
      embedEl.querySelectorAll('.ig-slot').forEach(s=>embedObserver.observe(s));
    }

    const lb=document.getElementById('reelLightbox');
    const lbContent=lb?lb.querySelector('.lb-content'):null;
    function renderReel(){
      if(!lbContent)return;
      lbContent.innerHTML='<blockquote class="instagram-media" data-instgrm-permalink="'+reels[reelIdx]+'" data-instgrm-version="14" style="width:100%;min-width:0;margin:0 auto"></blockquote>';
      if(window.instgrm&&window.instgrm.Embeds){window.instgrm.Embeds.process();}
    }
    function renderModels(s,idx){
      const carousel='<div class="car-head"><span class="car-hint">Elegí un modelo para ver sus fotos y ficha</span></div>'
        +'<div class="car-track">'+s.models.map((x,i)=>
            '<button class="car-item'+(i===idx?' on':'')+'" data-m="'+i+'">'
             +'<span class="car-img"><img src="'+(x.png||x.images[0])+'" alt="'+x.name+'" loading="lazy"></span>'
             +'<span class="car-name">'+x.name+'</span>'
             +'<span class="car-disc">'+x.disc+'</span>'
             +'<span class="car-cta">Ver fotos ↗</span>'
            +'</button>').join('')+'</div>';
      if(idx<0) return '<div class="mdl-wrap">'+carousel+'</div>';
      const m=s.models[idx];
      return '<div class="mdl-wrap">'+carousel
        +'<div class="mdl-detail">'
          +'<div class="mdl-head"><span class="mdl-name">Zapatilla '+m.disc+' Volta '+m.name+'</span><button class="mdl-close" aria-label="Cerrar modelo">✕</button></div>'
          +'<div class="mdl-specs">'+m.specs.map(sp=>'<div class="mdl-row"><span class="mk">'+sp.k+'</span><span class="mv">'+sp.v+'</span></div>').join('')+'</div>'
          +'<div class="mdl-gal">'+m.images.map(src=>'<img src="'+src+'" alt="'+m.name+'" loading="lazy">').join('')+'</div>'
        +'</div></div>';
    }

    function bindModels(s){
      const holder=lbContent.querySelector('.mdl-holder');
      if(!holder)return;
      const redraw=i=>{holder.innerHTML=renderModels(s,i);bindModels(s);};
      holder.querySelectorAll('.car-item').forEach(t=>{
        t.addEventListener('click',()=>{
          redraw(+t.dataset.m);
          const d=lbContent.querySelector('.mdl-detail');
          if(d)d.scrollIntoView({behavior:'smooth',block:'nearest'});
        });
      });
      const cl=holder.querySelector('.mdl-close');
      if(cl)cl.addEventListener('click',()=>redraw(-1));
    }

    function startHeroSlides(){
      const box=lbContent.querySelector('.sd-hero');
      if(!box)return;
      const imgs=box.querySelectorAll('img');
      if(imgs.length<2)return;
      let i=0;
      clearInterval(box._iv);
      box._iv=setInterval(()=>{
        imgs[i].classList.remove('on');
        i=(i+1)%imgs.length;
        imgs[i].classList.add('on');
      },3600);
    }

    function openSub(s){
      if(!lb||!lbContent)return;
      lb.classList.add('open','wide');
      lbContent.innerHTML=
        '<div class="sub-detail">'
        +((s.heroImages&&s.heroImages.length)
            ? '<div class="sd-hero slides">'+s.heroImages.map((src,i)=>'<img src="'+src+'" alt="'+s.title+'"'+(i===0?' class="on"':'')+' loading="lazy">').join('')+'</div>'
            : (s.hero?'<div class="sd-hero"><img src="'+s.hero+'" alt="'+s.title+'" loading="lazy"></div>':''))
        +'<h3>'+s.title+'</h3>'
        +'<div class="sd-meta">'
          +[['Propósito',s.purpose],['Programas',s.software],['Duración',s.time]]
             .filter(([,v])=>v&&String(v).trim())
             .map(([k,v])=>'<span><b>'+k+'</b>'+v+'</span>').join('')
        +'</div>'
        +'<div class="sd-body">'+s.body+'</div>'
        +(s.stats?'<div class="sd-stats">'+s.stats.map(t=>'<div><b>'+t.k+'</b><span>'+t.v+'</span></div>').join('')+'</div>':'')
        +(s.models?'<div class="mdl-holder">'+renderModels(s,-1)+'</div>':'')
        +(s.video?'<div class="sd-video"><video src="'+s.video+'" controls loop playsinline preload="metadata"'+(s.thumb?' poster="'+s.thumb+'"':'')+'></video></div>':'')
        +(s.embed?'<div class="sd-embed"'+(s.video?' hidden':'')+'><iframe src="'+s.embed+'" allowfullscreen frameborder="0" allow="clipboard-write; fullscreen" loading="lazy"></iframe></div>':'')
        +(s.link?'<a class="sd-link" href="'+s.link+'" target="_blank" rel="noopener">Ver en Behance ↗</a>':'')
        +'<div class="sd-imgs">'+((s.images||[]).map(src=>'<img src="'+src+'" alt="'+s.title+'" loading="lazy">').join(''))+'</div>'
        +'</div>';
      if(s.models)bindModels(s);
      startHeroSlides();
      const sv=lbContent.querySelector('.sd-video video');
      if(sv){
        sv.addEventListener('error',()=>{
          const box=lbContent.querySelector('.sd-video');
          const emb=lbContent.querySelector('.sd-embed');
          if(box)box.remove();
          if(emb)emb.hidden=false;
        });
      }
      lbContent.scrollTop=0;
    }
    function openReel(i){ if(!lb)return; reelIdx=i; lb.classList.add('open'); renderReel(); }
    function closeReel(){ if(!lb)return; lb.classList.remove('open','wide'); if(lbContent)lbContent.innerHTML=''; }
    function stepReel(n){ if(!reels.length)return; reelIdx=(reelIdx+n+reels.length)%reels.length; renderReel(); }
    if(lb){
      lb.querySelector('.lb-close').addEventListener('click',closeReel);
      lb.querySelector('.prev').addEventListener('click',()=>stepReel(-1));
      lb.querySelector('.next').addEventListener('click',()=>stepReel(1));
      lb.addEventListener('click',e=>{if(e.target===lb)closeReel();});
    }
    function openProject(card){
      const d=card.dataset;
      /* si el proyecto tiene página propia, se navega directo */
      if(d.href){ window.location.href=d.href; return; }
      titleEl.textContent=d.title; metaEl.textContent=d.meta;
      if(d.logo) buildPanelLogo(d.logo);
      else buildPanelHero(d.hero?d.hero.split(','):null);
      buildSubhero(d.subhero?d.subhero.split(','):null,d.eyebrow,d.htitle);
      const secEl=overlay.querySelector('.po-sectitle');
      if(secEl){ secEl.textContent=d.sectitle||''; secEl.classList.toggle('on',!!d.sectitle); }
      bodyEl.innerHTML=d.body;

      /* Los videos salen del cuerpo y se cuelgan del panel para quedar
         siempre al final, después de la grilla de proyectos. */
      const inner=overlay.querySelector('.po-inner');
      inner.querySelectorAll('.po-vids').forEach(v=>v.remove());
      const vids=bodyEl.querySelector('.rolevids');
      if(vids){ vids.classList.add('po-vids'); inner.appendChild(vids); }

      initYouTube(bodyEl);
      if(vids) initYouTube(vids);
      toolsEl.innerHTML=d.tools.split(',').map(t=>`<span class="tool">${t.trim()}</span>`).join('');
      const ic=card.querySelector('.card-icon'); iconEl.innerHTML=ic?ic.innerHTML:'';
      const galleryEl=overlay.querySelector('.po-gallery');
      if(embedEl){
        const list=(d.embeds?d.embeds.split(','):(d.embed?[d.embed]:[])).map(u=>u.trim()).filter(Boolean);
        const subs=(d.subs&&window.SUBPROJECTS&&window.SUBPROJECTS[d.subs])?window.SUBPROJECTS[d.subs]:null;
        if(subs){
          reels=[];
          overlay.classList.remove('reels');
          overlay.classList.add('has-subs');
          embedEl.className='po-embed sub-grid';
          embedEl.innerHTML=subs.map((s,i)=>{
            /* "covers" permite una secuencia de fotos en la portada;
               si no está, se usa una sola imagen como antes.
               Cada cover puede ser la ruta sola, o {src,pos} cuando esa foto
               necesita otro encuadre: las placas de calza traen el cuerpo a la
               derecha y el texto a la izquierda, así que se anclan a la derecha
               para que el recorte no se coma la prenda. */
            const seq=(s.covers&&s.covers.length)?s.covers:null;
            const rutaDe=c=>(typeof c==='string')?c:c.src;
            const cover=seq?rutaDe(seq[0]):(s.thumb||s.hero||((s.images&&s.images[0])||''));
            const alt=(s.images&&s.images[0])||s.hero||'';
            /* el título puede traer un <br> para partirlo en dos renglones;
               en el alt de la foto va sin etiquetas */
            const tPlano=s.title.replace(/<br\s*\/?>/gi,' ');
            const imgTag=seq
              ? seq.map((c,n)=>'<img src="'+rutaDe(c)+'" alt="'+tPlano+'" loading="lazy"'
                  +(n===0?' class="on"':'')
                  +((typeof c!=='string'&&c.pos)?' style="object-position:'+c.pos+'"':'')
                  +' onerror="this.remove()">').join('')
              : (cover
                ? '<img src="'+cover+'" alt="'+tPlano+'" loading="lazy"'
                  +(alt&&alt!==cover?' onerror="this.onerror=null;this.src=\''+alt+'\'"':'')+'>'
                : '');
            return '<button class="sub-tile'+(cover?'':' noimg')+'" data-i="'+i+'">'
              +'<span class="st-img'+(seq&&seq.length>1?' seq':'')
                +(s.fit==='contain'?' fit':'')
                +(s.fit==='contain-claro'?' fit claro':'')
                +(s.fit==='claro'?' claro':'')+'">'+imgTag+'</span>'
              +'<span class="st-fade"></span>'
              +'<span class="st-info"><span class="st-t">'+s.title+'</span></span>'
              +'<span class="st-cue">↗</span>'
              +'<span class="corner tl"></span><span class="corner tr"></span>'
              +'<span class="corner bl"></span><span class="corner br"></span></button>';
          }).join('');
          /* Turno de las portadas con secuencia. Todas avanzan a la vez,
             como las tarjetas grandes de Portfolio. */
          clearInterval(subCoverTimer);
          const seqs=[...embedEl.querySelectorAll('.st-img.seq')].map(box=>({
            imgs:[...box.querySelectorAll('img')], i:0
          }));
          if(seqs.length){
            subCoverTimer=setInterval(()=>{
              seqs.forEach(s=>{
                if(s.imgs.length<2)return;
                s.imgs[s.i].classList.remove('on');
                s.i=(s.i+1)%s.imgs.length;
                s.imgs[s.i].classList.add('on');
              });
            },3600);
          }

          embedEl.querySelectorAll('.sub-tile').forEach(t=>t.addEventListener('click',()=>{
            const s=subs[+t.dataset.i];
            if(s.href){ window.location.href=s.href; return; }
            openSub(s);
          }));
          if(galleryEl)galleryEl.style.display='none';
        } else if(list.length){
          reels=list;
          overlay.classList.remove('has-subs');
          overlay.classList.add('reels');
          embedEl.className='po-embed embed-grid';
          embedEl.innerHTML=list.map((u,i)=>'<div class="ig-cell"><div class="ig-slot" data-url="'+u+'"></div><button class="ig-expand" data-i="'+i+'" aria-label="Ampliar video">⤢</button></div>').join('');
          embedEl.querySelectorAll('.ig-expand').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openReel(+b.dataset.i);}));
          setupLazyEmbeds();
          if(galleryEl)galleryEl.style.display='none';
        } else {
          reels=[];
          overlay.classList.remove('reels','has-subs');
          embedEl.className='po-embed';
          embedEl.innerHTML='';
          if(galleryEl)galleryEl.style.display='';
        }
      }
      overlay.classList.add('open'); document.body.style.overflow='hidden'; if(lenis)lenis.stop();
    }
    function closeProject(){
      clearInterval(heroTimer); clearInterval(subTimer);
      if(heroEl){heroEl.innerHTML='';heroEl.className='po-hero';}
      if(subheroEl){subheroEl.innerHTML='';subheroEl.classList.remove('on');}
      overlay.classList.remove('has-subs','hero-title');
      closeReel();
      if(embedObserver)embedObserver.disconnect();
      overlay.classList.remove('open');
      overlay.classList.remove('reels');
      document.body.style.overflow='';
      if(embedEl){embedEl.querySelectorAll('video').forEach(v=>v.pause());embedEl.innerHTML='';embedEl.className='po-embed';}
      const g=overlay.querySelector('.po-gallery'); if(g)g.style.display='';
      overlay.scrollTop=0;
      if(lenis)lenis.start();
    }
    document.querySelectorAll('.card').forEach(c=>{
      c.addEventListener('click',()=>openProject(c));
      c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(c);}});
    });

    /* ---- llegar directo a una ficha desde afuera ----
       Las tarjetas con data-href tienen página propia y se linkean derecho.
       Volta no: vive en este overlay. Para que el índice pueda mandar ahí sin
       escala, experiencia.html#volta abre esa ficha sola al cargar.
       El nombre del ancla es el data-subs de la tarjeta. */
    (function(){
      const ancla=decodeURIComponent(location.hash.slice(1));
      if(!ancla)return;
      const tarjeta=[...document.querySelectorAll('.card')]
        .find(c=>c.dataset.subs===ancla && !c.dataset.href);
      if(!tarjeta)return;

      const abrir=()=>{
        openProject(tarjeta);
        /* se saca el ancla de la barra de direcciones: si no, al cerrar la
           ficha y recargar volvería a abrirse sola */
        if(history.replaceState)history.replaceState(null,'',location.pathname);
      };

      /* si todavía está corriendo el preloader, se espera a que termine */
      if(document.body.classList.contains('loading')){
        const obs=new MutationObserver(()=>{
          if(document.body.classList.contains('loading'))return;
          obs.disconnect(); setTimeout(abrir,400);
        });
        obs.observe(document.body,{attributes:true,attributeFilter:['class']});
      }else{
        setTimeout(abrir,120);
      }
    })();
    closeBtn.addEventListener('click',closeProject);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeProject();});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ if(lb&&lb.classList.contains('open'))closeReel(); else closeProject(); }
      else if(lb&&lb.classList.contains('open')){ if(e.key==='ArrowRight')stepReel(1); else if(e.key==='ArrowLeft')stepReel(-1); }
    });
  }

  /* ---------------- TRAYECTORIA: se dibuja al bajar ----------------
     El riel se pinta de naranja según cuánto se recorrió de la sección, y
     cada hito se enciende cuando pasa la línea de disparo. Todo se calcula
     leyendo posiciones, no con ScrollTrigger, para que siga andando aunque
     el CDN de GSAP no cargue.

     La línea de disparo está al 62% del alto de la ventana: un poco más
     abajo del medio, así el hito se enciende cuando ya se está mirando y no
     cuando todavía asoma por abajo. */
  const tray=document.querySelector('.tray');
  if(tray && !reduce){
    const riel=tray.querySelector('.tr-riel');
    const via=riel&&riel.querySelector('.via');
    const avance=riel&&riel.querySelector('.avance');
    const medida=riel&&riel.querySelector('.medida');
    const hitos=[...tray.querySelectorAll('.tr-hito, .tr-flecha')];
    const boton=tray.querySelector('.tr-cv .btn');
    let pedido=false;
    let largo=0, largoBajada=0, yPrimero=0, yLazo=0;

    /* Arma el recorrido: baja recto por el eje desde el primer hito y al
       llegar al botón lo rodea con un contorno paralelo a la pastilla.
       Se recalcula al cambiar el tamaño y al cargar las fuentes, porque el
       alto y el ancho del contenido cambian. */
    function medirRiel(){
      if(!riel||!boton||!hitos.length)return;
      const caja=tray.getBoundingClientRect();
      const rel=el=>{const r=el.getBoundingClientRect();
        return {x:r.left-caja.left,y:r.top-caja.top,w:r.width,h:r.height};};

      riel.setAttribute('viewBox','0 0 '+Math.round(caja.width)+' '+Math.round(caja.height));

      const eje=parseFloat(getComputedStyle(tray).getPropertyValue('--eje'))||6;
      const x=eje+.5;                       /* el centro del punto de cada hito */
      const b=rel(boton);
      const cy=b.y+b.h/2, R=b.h/2+14;       /* la vuelta, paralela a la pastilla */
      const x1=b.x+b.h/2, x2=b.x+b.w-b.h/2;
      const entrada=x1-R;
      /* en pantallas angostas la curva de entrada no se puede ir tan a la
         izquierda: se quedaría fuera de la pantalla */
      const tiron=Math.min(52,Math.max(0,entrada-4));

      yPrimero=rel(hitos[0]).y+12;
      yLazo=cy;

      const bajada='M'+x+','+yPrimero
        +' L'+x+','+(cy-70)
        +' C'+x+','+(cy-24)+' '+(entrada-tiron)+','+(cy-30)+' '+entrada+','+cy;
      const vuelta=' A'+R+','+R+' 0 0 0 '+x1+','+(cy+R)
        +' L'+x2+','+(cy+R)
        +' A'+R+','+R+' 0 0 0 '+(x2+R)+','+cy
        +' A'+R+','+R+' 0 0 0 '+x2+','+(cy-R)
        +' L'+x1+','+(cy-R)
        +' A'+R+','+R+' 0 0 0 '+entrada+','+cy;

      medida.setAttribute('d',bajada);
      largoBajada=medida.getTotalLength();
      via.setAttribute('d',bajada+vuelta);
      avance.setAttribute('d',bajada+vuelta);
      largo=avance.getTotalLength();
      avance.style.strokeDasharray=largo;
      avance.style.strokeDashoffset=largo;
    }

    function pintarTrayectoria(){
      pedido=false;
      const disparo=window.innerHeight*.62;

      if(avance&&largo>0){
        /* El avance sale del mayor de dos medidas, así siempre es continuo y
           siempre termina de cerrarse:

           · la bajada, al ritmo del scroll, hasta donde arranca la vuelta;
           · el final de la página, que es lo que dibuja la vuelta.

           Hace falta la segunda porque el botón queda muy abajo: con la
           página scrolleada a fondo su centro sigue estando por debajo de la
           línea de disparo, así que sólo con la primera la vuelta no se
           dibujaría nunca. */
        const caja=tray.getBoundingClientRect();
        const y=disparo-caja.top;
        const tope=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
        const scroll=window.scrollY||document.documentElement.scrollTop;

        const parte=largoBajada/largo;
        const porBajada=Math.max(0,Math.min(1,(y-yPrimero)/Math.max(1,yLazo-yPrimero)))*parte;
        const porFinal=1-(tope-scroll)/420;

        const p=Math.max(0,Math.min(1,Math.max(porBajada,porFinal)));
        avance.style.strokeDashoffset=largo*(1-p);
      }
      /* una vez encendido se queda: si no, titila al subir y bajar */
      hitos.forEach(h=>{
        if(!h.classList.contains('on') && h.getBoundingClientRect().top+10 < disparo){
          h.classList.add('on');
        }
      });
    }

    /* mismo patrón que la barra de progreso de ui.js: un solo repintado por
       cuadro, aunque el scroll dispare veinte eventos */
    addEventListener('scroll',()=>{
      if(pedido)return;
      pedido=true;
      requestAnimationFrame(pintarTrayectoria);
    },{passive:true});
    addEventListener('resize',()=>{medirRiel();pintarTrayectoria();},{passive:true});
    /* las fuentes cambian el alto del texto al terminar de cargar */
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{medirRiel();pintarTrayectoria();});
    medirRiel();
    pintarTrayectoria();
  }

})();
