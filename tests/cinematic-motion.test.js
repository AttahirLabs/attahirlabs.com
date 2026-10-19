const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../assets/cinema/motion.js'),'utf8');

// A small DOM/media event harness exercises the actual runtime without a browser or network.
class Target {
  constructor(){this.listeners={};}
  addEventListener(name,fn){(this.listeners[name] ||= []).push(fn);}
  dispatch(name,event={}){for(const fn of this.listeners[name] || [])fn(event);}
}
class Element extends Target {
  constructor(rect={top:50,left:0,width:600,height:300}){
    super();this.dataset={};this.attributes={};this.styles={};this.rect=rect;this.children={};this.ancestors={};
    this.style={setProperty:(name,value)=>{this.styles[name]=value;}};
    const classes=new Set();this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle:(name,value)=>{if(value)classes.add(name);else classes.delete(name);}};
  }
  getBoundingClientRect(){return {...this.rect,bottom:this.rect.top+this.rect.height,right:this.rect.left+this.rect.width};}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name] ?? null;}
  removeAttribute(name){delete this.attributes[name];}
  querySelectorAll(selector){return this.children[selector] || [];}
  querySelector(selector){return this.querySelectorAll(selector)[0] || null;}
  closest(selector){return this.ancestors[selector] || null;}
}
function harness(options={}){
  const window = new Target();
  const document = new Target();document.readyState=options.loading?'loading':'complete';document.hidden=false;document.baseURI='https://attahirlabs.com/apps/';
  const root=new Element();document.documentElement=root;document.body=new Element();
  const reveal=new Element(options.revealOffscreen?{top:2200,left:0,width:600,height:200}:undefined);
  const depth=new Element();const button=new Element();const label={textContent:''};button.children['[data-cinema-label]']=[label];
  const stage=new Element();const world=new Element();world.dataset.cinemaActive='true';
  const video=new Element(options.videoOffscreen?{top:2200,left:0,width:600,height:300}:undefined);
  video.parentElement=stage;video.ancestors['[data-cinema-stage]']=stage;video.ancestors['[data-cinema-world]']=world;
  video.dataset.src=options.mediaURL || '/assets/cinema/district-loop.mp4';if(options.mobileSrc)video.dataset.mobileSrc=options.mobileSrc;
  video.controls=Boolean(options.controls);video.paused=true;video.loads=0;video.plays=0;video.pauses=0;
  Object.defineProperty(video,'src',{get(){return this.attributes.src;},set(value){this.attributes.src=value;}});
  video.load=()=>{video.loads++;};
  video.play=()=>{video.plays++;if(options.rejectPlayback)return Promise.reject(Error('autoplay blocked'));video.paused=false;video.dispatch('play');video.dispatch('playing');return Promise.resolve();};
  video.pause=()=>{video.pauses++;video.paused=true;video.dispatch('pause');};
  const journey=new Element({top:0,left:0,width:1200,height:2800});
  const worlds=[new Element(),new Element()];worlds.forEach((el,i)=>{el.dataset.cinemaWorld=String(i);});
  const steps=[new Element(),new Element(),new Element()];steps.forEach((el,i)=>{el.dataset.cinemaStepLabel=String(i);});
  journey.children['[data-cinema-world]']=worlds;journey.children['[data-cinema-step-label]']=steps;
  const nodes={'[data-cinematic-reveal]':[reveal],'[data-cinematic-depth]':[depth],'[data-cinema-toggle]':[button],'[data-cinema-video]':[video],'[data-cinema-journey]':[journey]};
  document.querySelectorAll=selector=>nodes[selector] || [];
  document.querySelector=selector=>document.querySelectorAll(selector)[0] || null;
  const storage=new Map(options.savedPreference?[['attahirlabs-motion',options.savedPreference]]:[]);
  const media=new Map();
  function matchMedia(query){
    if(options.failInitialization)throw Error('media capability failed');
    if(!media.has(query)){const target=new Target();target.matches=query.includes('prefers-reduced-motion')?Boolean(options.reduced):query.includes('pointer: fine');target.set=value=>{target.matches=value;target.dispatch('change');};media.set(query,target);}
    return media.get(query);
  }
  const frames=new Map();let id=0;
  const context={window,document,navigator:{connection:{saveData:Boolean(options.saveData)}},location:{origin:'https://attahirlabs.com'},URL,
    innerWidth:options.width || 1200,innerHeight:800,matchMedia,
    localStorage:{getItem:key=>{if(options.blockStorage)throw Error('blocked');return storage.get(key) ?? null;},setItem:(key,value)=>{if(options.blockStorage)throw Error('blocked');storage.set(key,value);}},
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),
    addEventListener:window.addEventListener.bind(window),console};
  const observers=[];
  if(options.observers){
    class Observer{constructor(callback){this.callback=callback;this.targets=new Set();observers.push(this);}observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}disconnect(){this.targets.clear();}}
    context.IntersectionObserver=Observer;window.IntersectionObserver=Observer;
  }
  const runtime=vm.createContext(context);vm.runInContext(source,runtime);
  const flush=()=>{let count=0;while(frames.size){if(++count>20)throw Error('unbounded animation scheduling');const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn());}};
  flush();
  return {window,document,root,reveal,depth,button,label,video,stage,world,journey,worlds,steps,storage,media,observers,flush,
    event:(name,value={})=>{window.dispatch(name,value);flush();},
    click:()=>{button.dispatch('click');flush();},
    reduced:value=>{media.get('(prefers-reduced-motion: reduce)').set(value);flush();},
    visibility:hidden=>{document.hidden=hidden;document.dispatch('visibilitychange');flush();}};
}

(async()=>{
  const normal=harness();
  assert.equal(normal.document.body.dataset.cinemaMotion,'playing');
  assert.equal(normal.video.loads,1,'visible same-origin media loads once');
  assert.equal(normal.video.paused,false);
  assert.equal(normal.stage.dataset.cinemaReady,'true','actual playing event enables the video surface');
  normal.click();
  assert.equal(normal.video.paused,true);assert.equal(normal.storage.get('attahirlabs-motion'),'paused');
  assert.equal(normal.button.getAttribute('aria-pressed'),'true');assert.equal(normal.label.textContent,'Resume motion');
  const persisted=harness({savedPreference:normal.storage.get('attahirlabs-motion')});
  assert.equal(persisted.video.loads,0,'saved pause prevents even the automatic media download');
  assert.equal(persisted.document.body.dataset.cinemaMotion,'paused');
  persisted.click();assert.equal(persisted.video.paused,false);assert.equal(persisted.storage.get('attahirlabs-motion'),'playing');

  const reduced=harness({reduced:true,revealOffscreen:true});
  assert.equal(reduced.video.loads,0);assert.equal(reduced.button.disabled,true);assert.equal(reduced.label.textContent,'Reduced motion');
  assert.equal(reduced.reveal.dataset.cinematicVisible,'true','reduced motion reveals offscreen content too');
  reduced.click();assert.equal(reduced.video.loads,0,'the button cannot override the OS preference');
  assert.equal(reduced.depth.styles['--cinema-x'],'0');
  reduced.reduced(false);assert.equal(reduced.video.paused,false);reduced.reduced(true);assert.equal(reduced.video.paused,true);
  const dataSaver=harness({saveData:true});assert.equal(dataSaver.video.loads,0,'data saver keeps the poster without downloading media');
  assert.equal(dataSaver.stage.dataset.cinemaReady,undefined);

  const visibility=harness({videoOffscreen:true});assert.equal(visibility.video.loads,0);
  visibility.video.rect.top=100;visibility.event('scroll');assert.equal(visibility.video.paused,false);
  visibility.visibility(true);assert.equal(visibility.video.paused,true,'background tabs stop ambient video');
  visibility.visibility(false);assert.equal(visibility.video.paused,false);
  visibility.video.rect.top=2000;visibility.event('scroll');assert.equal(visibility.video.paused,true,'offscreen video is suspended');
  visibility.video.rect.top=100;visibility.world.dataset.cinemaActive='false';visibility.event('scroll');assert.equal(visibility.video.paused,true,'inactive scene media does not keep playing');
  visibility.world.dataset.cinemaActive='true';visibility.event('scroll');assert.equal(visibility.video.paused,false);
  visibility.event('pagehide',{persisted:true});assert.equal(visibility.video.paused,true,'back-forward cache pagehide stops media');
  visibility.event('pageshow');assert.equal(visibility.video.paused,false,'back-forward restore rechecks preferences and visibility');
  const failure=harness();failure.video.dispatch('error');failure.event('scroll');
  assert.equal(failure.stage.dataset.cinemaReady,'false');assert.equal(failure.video.dataset.ready,'false');
  const plays=failure.video.plays;failure.event('resize');assert.equal(failure.video.plays,plays,'failed media does not retry in a loop');
  const playbackOptions={rejectPlayback:true};
  const rejected=harness(playbackOptions);await Promise.resolve();assert.equal(rejected.stage.dataset.cinemaReady,'false','blocked playback leaves the poster available');
  const blockedPlayCount=rejected.video.plays;
  for(let index=0;index<12;index++){
    rejected.event('pointermove',{clientX:100+index*30,clientY:100,pointerType:'mouse'});
    rejected.event('scroll');
  }
  assert.equal(rejected.video.plays,blockedPlayCount,'blocked autoplay cannot retry on every pointer/scroll animation frame');
  // An intentional pause/resume is a new user request, and may retry after the
  // browser's playback policy changes. It must not leave the scene stuck forever.
  rejected.click();assert.equal(rejected.document.body.dataset.cinemaMotion,'paused');
  playbackOptions.rejectPlayback=false;
  rejected.click();await Promise.resolve();
  assert.ok(rejected.video.plays>blockedPlayCount,'explicit resume retries previously blocked media');
  assert.equal(rejected.video.paused,false);assert.equal(rejected.stage.dataset.cinemaReady,'true');
  for(const mediaURL of ['https://external.example/movie.mp4','javascript:alert(1)','data:video/mp4;base64,AAAA'])assert.equal(harness({mediaURL}).video.loads,0,'ambient media cannot request another origin or scheme');
  assert.equal(harness({width:390,mobileSrc:'/assets/cinema/district-mobile.mp4'}).video.src,'/assets/cinema/district-mobile.mp4');

  const observed=harness({observers:true,revealOffscreen:true});assert.equal(observed.reveal.dataset.cinematicVisible,undefined);
  observed.event('error');assert.equal(observed.reveal.dataset.cinematicVisible,'true','runtime errors fail open for reading content');
  const initFailure=harness({failInitialization:true,revealOffscreen:true});
  assert.equal(initFailure.root.classList.contains('cinema-ready'),false);assert.equal(initFailure.reveal.dataset.cinematicVisible,'true','initialization failure never hides content');
  const blocked=harness({blockStorage:true});assert.equal(blocked.video.paused,false,'unavailable optional storage does not break the site');blocked.click();assert.equal(blocked.video.paused,true);
  const loading=harness({loading:true});assert.equal(loading.root.classList.contains('cinema-ready'),false);loading.document.dispatch('DOMContentLoaded');loading.flush();assert.equal(loading.root.classList.contains('cinema-ready'),true);

  const journey=harness();
  for(const [top,expected]of [[900,0],[0,0],[-800,1],[-1600,2],[-20000,2]]){
    journey.journey.rect.top=top;journey.event('scroll');
    const progress=Number(journey.journey.styles['--journey-progress']);assert.ok(Number.isFinite(progress)&&progress>=0&&progress<=1);
    assert.equal(Number(journey.journey.dataset.cinemaStep),expected,'journey selects a bounded phase');
    assert.equal(journey.steps.filter(step=>step.getAttribute('aria-current')==='step').length,1,'one current journey label');
    assert.equal(journey.steps[expected].getAttribute('aria-current'),'step');
    assert.equal(journey.worlds.filter(world=>world.dataset.cinemaActive==='true').length,1,'only the current world is active');
  }
  journey.journey.rect.height=300;journey.event('resize');assert.ok(Number.isFinite(Number(journey.journey.styles['--journey-progress'])),'short journeys cannot divide by zero');
  journey.event('pointermove',{clientX:99999,clientY:-99999,pointerType:'mouse'});
  assert.equal(Number(journey.depth.styles['--cinema-x']),1);assert.equal(Number(journey.depth.styles['--cinema-y']),-1);
  journey.click();assert.equal(Number(journey.depth.styles['--cinema-x']),0);assert.equal(Number(journey.depth.styles['--cinema-scroll']),0);
  const pausedJourney=harness();pausedJourney.journey.rect.top=-800;pausedJourney.event('scroll');
  assert.equal(pausedJourney.journey.dataset.cinemaStep,'1','exercise the desktop middle chapter before pausing');
  pausedJourney.click();assert.equal(pausedJourney.journey.dataset.cinemaStep,'2','paused motion uses the readable static final chapter');
  for(const top of [900,0,-800,-20000]){
    pausedJourney.journey.rect.top=top;pausedJourney.event('scroll');
    assert.equal(pausedJourney.journey.dataset.cinemaStep,'2','scrolling cannot restart journey choreography while paused');
    assert.equal(pausedJourney.steps[2].getAttribute('aria-current'),'step');
  }
  console.log('Cinematic motion: persisted pause, OS/data preferences, media visibility/lifecycle, safe loading, fail-open content and bounded journey phases passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
