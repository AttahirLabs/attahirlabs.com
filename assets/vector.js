/* Progressive enhancement: HTML remains complete with scripting disabled. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('body > nav');
  if (nav) {
    const links = nav.querySelector('.nav-links');
    if (links) {
      links.id = 'primary-links';
      const toggle = document.createElement('button');
      toggle.className = 'menu-toggle';
      toggle.type = 'button';
      toggle.textContent = 'Menu';
      toggle.setAttribute('aria-controls', links.id);
      toggle.setAttribute('aria-expanded', 'false');
      links.before(toggle);
      nav.classList.add('nav-enhanced');
      const close = () => { nav.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; };
      toggle.addEventListener('click', () => { const open = !nav.classList.contains('menu-open'); nav.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Close' : 'Menu'; });
      nav.addEventListener('keydown', e => { if(e.key === 'Escape') { close(); const item = e.target.closest('.nav-item-apps, .nav-item-tools'); if(item) { item.classList.add('menu-dismissed'); item.querySelector('a').focus(); } else toggle.focus(); } });
      nav.querySelectorAll('.nav-item-apps, .nav-item-tools').forEach(item => {
        item.addEventListener('mouseleave', () => item.classList.remove('menu-dismissed'));
        item.addEventListener('focusout', e => { if(!item.contains(e.relatedTarget)) item.classList.remove('menu-dismissed'); });
      });
      links.addEventListener('click', e => { if(e.target.closest('a')) close(); });
      document.addEventListener('click', e => { if(!nav.contains(e.target)) close(); });
      matchMedia('(min-width: 681px)').addEventListener('change', close);
    }
  }
  // Animate on entry, never hide content while waiting for JavaScript or observation.
  const animations = new Set();
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if(reduced.matches) return;
      const animation = entry.target.animate([{opacity:.35,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}], {duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});
      animations.add(animation); animation.finished.finally(() => animations.delete(animation)).catch(() => {});
    }), {threshold:.08});
    document.querySelectorAll('[data-reveal], .feature-grid .card, .setup-grid .card, .post-card, .section-head, .tool-link, .guide-link').forEach(el => observer.observe(el));
  }
  document.querySelectorAll('[data-demo]').forEach(demo => {
    const buttons = [...demo.querySelectorAll('[data-step]')];
    const panels = [...demo.querySelectorAll('[data-panel]')];
    function select(index) { buttons.forEach((b,i) => b.setAttribute('aria-pressed', String(i===index))); panels.forEach((p,i) => p.hidden=i!==index); }
    demo.classList.add('is-enhanced'); select(0);
    buttons.forEach((button,i) => {
      button.addEventListener('click', () => select(i));
      button.addEventListener('keydown', e => { if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return; e.preventDefault(); const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:buttons.length-1))%buttons.length; select(next); buttons[next].focus(); });
    });
  });
  const scenes=[...document.querySelectorAll('[data-depth-scene]')];
  let progress;
  if(document.body.dataset.page==='article') { progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress); }
  let frame=0;
  function update() {
    frame=0;
    const mobile=innerWidth<681;
    scenes.forEach(scene => { const rect=scene.getBoundingClientRect(); if(rect.bottom<0 || rect.top>innerHeight) return; scene.querySelectorAll('[data-depth]').forEach(layer => { const y=reduced.matches||mobile?0:Math.max(-24,Math.min(24,-rect.top*Number(layer.dataset.depth)));layer.style.setProperty('--depth',`${y.toFixed(1)}px`); }); });
    if(progress) {const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):0})`;}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  if(scenes.length||progress){addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();}
  reduced.addEventListener('change',()=>{if(reduced.matches)animations.forEach(a=>a.cancel());scenes.forEach(s=>s.querySelectorAll('[data-depth]').forEach(l=>l.style.setProperty('--depth','0px')));schedule();});
  if(document.body.dataset.page==='article' && 'IntersectionObserver' in window){
    const links=[...document.querySelectorAll('.toc a[href^="#"]')];
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;links.forEach(a=>{if(a.hash===`#${e.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-10% 0px -65% 0px'});
    links.forEach(a=>{const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target)observer.observe(target);});
  }
})();
