import { CommerceTimeline } from './timeline.mjs';
const hero=document.querySelector('[data-commerce-hero]');
if(hero) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const live=hero.querySelector('.commerce-live');
  const poster=hero.querySelector('.glass-artwork');
  const viewport=hero.querySelector('.commerce-canvas');
  const panels=[...hero.querySelectorAll('[data-commerce-panel]')];
  const choices=[...hero.querySelectorAll('[data-commerce-select]')];
  const toggle=hero.querySelector('[data-commerce-pause]');
  const panelShell=hero.querySelector('.commerce-panel-stack');
  const caption=hero.querySelector('[data-commerce-caption]');
  const labels=['Café · Web design','Warehouse · StockClearance','Grocer · ShelfLife','Homewares · TariffShield'];
  const tour=new CommerceTimeline();
  let world,loading=false,failed=false,disposed=false,toggleWasPlaying=false,userPaused=false,focusPaused=false,visible=true,frame=0,last=0,sceneTime=0,current=-1;
  function showPanel(){
    const index=tour.index;
    if(index!==current){
      current=index;hero.dataset.business=String(index);
      panels.forEach((p,i)=>{p.hidden=i!==index;});
      choices.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      caption.textContent=labels[index];
    }
    const p=tour.progress;
    const angle=tour.traveling?(p<.5?-8+p*156:-86+(p-.5)*156):-8;
    panelShell.style.setProperty('--panel-turn',`${angle}deg`);
    panelShell.style.opacity=tour.traveling?String(.3+.7*Math.abs(2*p-1)):'1';
    hero.style.setProperty('--tour-progress',`${tour.traveling?0:Math.min(1,tour.dwell/tour.hold)}`);
  }
  function playing(){return !userPaused&&!focusPaused&&!reduced.matches&&visible&&!document.hidden;}
  function labelButton(){
    toggle.textContent=playing()?'Pause':'Play';
    toggle.setAttribute('aria-label',playing()?'Pause business animation':'Play business animation');
    toggle.disabled=reduced.matches;
    if(reduced.matches){toggle.textContent='Motion off';toggle.setAttribute('aria-label','Animation disabled by your reduced motion preference');}
  }
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function paint(){showPanel();world?.render(sceneTime,tour);}
  function settle(){if(tour.traveling){tour.select(tour.index,true);paint();}}
  function tick(now){
    frame=0;
    if(!world||!playing()){last=0;return;}
    // A capped clock avoids jumps after scrolling away or backgrounding the tab.
    const dt=last?Math.min(.1,(now-last)/1000):0;
    if(last&&dt<1/30){frame=requestAnimationFrame(tick);return;}
    last=now;sceneTime+=dt;tour.advance(dt);paint();frame=requestAnimationFrame(tick);
  }
  function resume(){labelButton();if(world&&playing()&&!frame)frame=requestAnimationFrame(tick);else if(!playing())stop();}
  function fail(){
    failed=true;stop();world?.dispose();world=null;live.hidden=true;poster.hidden=false;
    hero.classList.remove('commerce-ready');hero.dataset.commerceState='fallback';
  }
  async function load(){
    if(world||loading||failed||disposed)return;loading=true;
    try {
      // Kept separate so the readable homepage and poster render before the 3D bundle.
      const {createCommerceWorld}=await import('./world.js');
      if(disposed)return;
      live.hidden=false;world=createCommerceWorld(viewport);paint();
      hero.classList.add('commerce-ready');hero.dataset.commerceState='ready';poster.hidden=true;
      world.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();},{once:true});
      resume();
    }catch(error){fail();console.warn('Commerce scene unavailable; using the static artwork.',error);}
    loading=false;
  }
  choices.forEach((button,i)=>button.addEventListener('click',()=>{tour.select(i,reduced.matches||userPaused||focusPaused);paint();resume();}));
  // Remember the pointer intent before focus itself pauses the carousel.
  toggle.addEventListener('pointerdown',()=>{toggleWasPlaying=playing();});
  toggle.addEventListener('click',event=>{
    const wantsPlay=event.detail ? !toggleWasPlaying : !playing();
    userPaused=!wantsPlay;focusPaused=false;if(userPaused)settle();resume();
  });
  live.addEventListener('focusin',()=>{focusPaused=true;settle();resume();});
  live.addEventListener('focusout',event=>{if(!live.contains(event.relatedTarget)){focusPaused=false;resume();}});
  reduced.addEventListener('change',()=>{if(reduced.matches&&tour.traveling)tour.select(tour.index,true);paint();resume();});
  document.addEventListener('visibilitychange',resume);
  const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)load();resume();},{threshold:.08});
  visibility.observe(hero);
  addEventListener('pagehide',event=>{stop();if(!event.persisted){disposed=true;visibility.disconnect();world?.dispose();world=null;}});
  addEventListener('pageshow',()=>resume());
}
