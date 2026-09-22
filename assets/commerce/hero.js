import { CommerceTimeline } from './timeline.mjs';
const hero=document.querySelector('[data-commerce-hero]');
if(hero) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const live=hero.querySelector('.commerce-live');
  const poster=hero.querySelector('.glass-artwork');
  const viewport=hero.querySelector('.commerce-canvas');
  const panels=[...hero.querySelectorAll('[data-commerce-panel]')];
  const panelShell=hero.querySelector('.commerce-panel-stack');
  const count=new Set(panels.map(p=>p.dataset.commerceScene)).size;
  const tour=new CommerceTimeline(count,6,1.15);
  let world,loading=false,failed=false,disposed=false,userPaused=false,focusPaused=false,hoverPaused=false,visible=true,frame=0,last=0,sceneTime=0,current;
  function showPanel(){
    const index=tour.index;
    // A business can demonstrate more than one product without adding more floors.
    const options=panels.filter(p=>Number(p.dataset.commerceScene)===index);
    const lap=Math.floor(Math.round(tour.position)/count);
    const panel=options[((lap%options.length)+options.length)%options.length];
    if(panel!==current){
      current=panel;hero.dataset.business=String(index);hero.dataset.activePanel=panel.dataset.commercePanel;
      panels.forEach(p=>{p.hidden=p!==panel;});
    }
    const p=tour.progress;
    const angle=tour.traveling?(p<.5?-8+p*156:-86+(p-.5)*156):-8;
    panelShell.style.setProperty('--panel-turn',`${angle}deg`);
    panelShell.style.opacity=tour.traveling?String(.3+.7*Math.abs(2*p-1)):'1';
  }
  function playing(){return !userPaused&&!focusPaused&&!hoverPaused&&!reduced.matches&&visible&&!document.hidden;}
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function paint(){showPanel();world?.render(sceneTime,tour);}
  function settle(){if(tour.traveling){tour.select(tour.index,true);paint();}}
  function tick(now){
    frame=0;
    if(!world||!playing()){last=0;return;}
    const dt=last?Math.min(.1,(now-last)/1000):0;
    last=now;sceneTime+=dt;tour.advance(dt);paint();frame=requestAnimationFrame(tick);
  }
  function resume(){if(world&&playing()&&!frame)frame=requestAnimationFrame(tick);else if(!playing())stop();}
  function fail(){
    failed=true;stop();world?.dispose();world=null;live.hidden=true;poster.hidden=false;
    hero.classList.remove('commerce-ready');hero.dataset.commerceState='fallback';hero.removeAttribute('tabindex');
  }
  async function load(){
    if(world||loading||failed||disposed)return;loading=true;
    try {
      const {createCommerceWorld}=await import('./world.js?v=20260922e');
      if(disposed)return;
      live.hidden=false;world=createCommerceWorld(viewport);paint();
      hero.classList.add('commerce-ready');hero.dataset.commerceState='ready';poster.hidden=true;
      hero.setAttribute('tabindex','0');hero.setAttribute('role','region');hero.setAttribute('aria-describedby','commerce-help');
      world.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();},{once:true});
      resume();
    }catch(error){fail();console.warn('Commerce scene unavailable; using the static artwork.',error);}
    loading=false;
  }
  hero.addEventListener('keydown',event=>{
    if(event.target!==hero||!world)return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();
      // Absolute positions preserve which set of panels is showing on subsequent laps.
      tour.source=tour.position;tour.target=Math.round(tour.position)+(event.key==='ArrowRight'?1:-1);
      tour.position=tour.target;tour.traveling=false;tour.elapsed=tour.dwell=0;paint();
    }else if(event.code==='Space'){
      event.preventDefault();userPaused=playing();focusPaused=false;hoverPaused=false;settle();resume();
    }
  });
  hero.addEventListener('focusin',()=>{focusPaused=true;settle();resume();});
  hero.addEventListener('focusout',event=>{if(!hero.contains(event.relatedTarget)){focusPaused=false;resume();}});
  live.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hoverPaused=true;settle();resume();}});
  live.addEventListener('pointerleave',()=>{hoverPaused=false;resume();});
  reduced.addEventListener('change',()=>{if(reduced.matches)settle();paint();resume();});
  document.addEventListener('visibilitychange',resume);
  const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)load();resume();},{threshold:.08});
  visibility.observe(hero);
  addEventListener('pagehide',event=>{stop();if(!event.persisted){disposed=true;visibility.disconnect();world?.dispose();world=null;}});
  addEventListener('pageshow',()=>resume());
}
