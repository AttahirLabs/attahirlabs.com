/* AttahirLabs cinematic motion. Native scrolling and complete HTML stay in control. */
(() => {
  'use strict';
  const start = () => {
    const root = document.documentElement;
    const body = document.body;
    if (!body) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const reveals = [...document.querySelectorAll('[data-cinematic-reveal]')];
    const depth = [...document.querySelectorAll('[data-cinematic-depth]')];
    const journeys = [...document.querySelectorAll('[data-cinema-journey]')];
    const toggles = [...document.querySelectorAll('[data-cinema-toggle]')];
    const videos = [...document.querySelectorAll('[data-cinema-video]')].map(video => ({
      video, failed: false, playBlocked: false, playing: false, manual: false, internalPause: false,
    }));
    const observers = [];
    let userPaused = false;
    let suspended = false;
    let frame = 0;
    let px = 0;
    let py = 0;
    try { userPaused = localStorage.getItem('attahirlabs-motion') === 'paused'; } catch (_) { /* optional preference */ }
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const paused = () => reduced.matches || userPaused || suspended || document.hidden;
    const onScreen = element => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const revealAll = () => reveals.forEach(el => { el.dataset.cinematicVisible = 'true'; });
    const owner = video => video.closest('[data-cinema-stage]') || video.parentElement;
    const pauseVideo = state => {
      if (!state.video.paused) {
        state.internalPause = true;
        state.video.pause();
      }
      state.playing = false;
    };
    const loadVideo = state => {
      const v = state.video;
      if (state.failed) return false;
      if (v.getAttribute('src')) return true;
      const source = innerWidth < 700 && v.dataset.mobileSrc ? v.dataset.mobileSrc : v.dataset.src;
      if (!source) return false;
      try {
        const url = new URL(source, document.baseURI);
        if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return false;
      } catch (_) { return false; }
      v.preload = 'auto';
      v.src = source;
      v.load();
      return true;
    };
    const videoVisible = state => {
      const dialog = state.video.closest('dialog');
      const phase = state.video.closest('[data-cinema-world]');
      return (!dialog || dialog.open) && (!phase || phase.dataset.cinemaActive !== 'false') && onScreen(state.video);
    };
    const syncVideos = () => videos.forEach(state => {
      const v = state.video;
      if (!videoVisible(state) || suspended || document.hidden || state.failed) { pauseVideo(state); state.manual = false; return; }
      if (paused() || saveData) {
        if (!state.manual) pauseVideo(state);
        return;
      }
      if (state.playBlocked || !loadVideo(state) || !v.paused || state.manual) return;
      const playing = v.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => { state.playBlocked = true; owner(v).dataset.cinemaReady = 'false'; });
    });
    videos.forEach(state => {
      const v = state.video;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;
      v.autoplay = false;
      v.addEventListener('playing', () => {
        state.playing = true;
        state.internalPause = false;
        owner(v).dataset.cinemaReady = 'true';
        v.dataset.ready = 'true';
      });
      v.addEventListener('play', () => {
        // Only a media element with native controls can override the ambient preference.
        if (v.controls) state.manual = true;
        if (!videoVisible(state) || document.hidden) pauseVideo(state);
      });
      v.addEventListener('pause', () => {
        state.playing = false;
        if (state.internalPause) state.internalPause = false;
        else if (v.controls) state.manual = true;
      });
      v.addEventListener('error', () => {
        state.failed = true;
        owner(v).dataset.cinemaReady = 'false';
        v.dataset.ready = 'false';
      });
    });
    const syncPreference = () => {
      const isPaused = reduced.matches || userPaused;
      body.dataset.cinemaMotion = isPaused ? 'paused' : 'playing';
      root.dataset.cinemaMotion = body.dataset.cinemaMotion;
      toggles.forEach(button => {
        const label = reduced.matches ? 'Reduced motion' : userPaused ? 'Resume motion' : 'Pause motion';
        button.setAttribute('aria-pressed', String(isPaused));
        button.setAttribute('aria-label', label);
        button.disabled = reduced.matches;
        const target = button.querySelector('[data-cinema-label]');
        if (target) target.textContent = label;
        else button.textContent = label;
      });
      if (isPaused) {
        px = py = 0;
        depth.forEach(el => { el.style.setProperty('--cinema-x', '0'); el.style.setProperty('--cinema-y', '0'); el.style.setProperty('--cinema-scroll', '0'); });
        videos.forEach(state => { state.manual = false; pauseVideo(state); });
      }
      if (reduced.matches) revealAll();
      syncVideos();
      schedule();
    };
    toggles.forEach(button => button.addEventListener('click', () => {
      if (reduced.matches) return;
      userPaused = !userPaused;
      if (!userPaused) videos.forEach(state => { state.playBlocked = false; });
      try { localStorage.setItem('attahirlabs-motion', userPaused ? 'paused' : 'playing'); } catch (_) { /* optional preference */ }
      syncPreference();
    }));
    const updateJourneys = () => journeys.forEach(journey => {
      const r = journey.getBoundingClientRect();
      const range = Math.max(1, r.height - innerHeight);
      const progress = clamp(-r.top / range, 0, 1);
      const step = innerWidth <= 700 || reduced.matches || userPaused ? 2 : progress < .28 ? 0 : progress < .64 ? 1 : 2;
      journey.style.setProperty('--journey-progress', progress.toFixed(4));
      journey.dataset.cinemaStep = String(step);
      journey.querySelectorAll('[data-cinema-world]').forEach(world => {
        world.dataset.cinemaActive = String(Number(world.dataset.cinemaWorld) === (step === 0 ? 0 : 1));
      });
      journey.querySelectorAll('[data-cinema-step-label]').forEach(label => {
        const active = Number(label.dataset.cinemaStepLabel) === step;
        label.dataset.cinemaActive = String(active);
        if (active) label.setAttribute('aria-current', 'step'); else label.removeAttribute('aria-current');
      });
    });
    const update = () => {
      frame = 0;
      if (suspended) return;
      updateJourneys();
      depth.forEach(el => {
        if (!onScreen(el)) return;
        const r = el.getBoundingClientRect();
        const p = clamp((innerHeight / 2 - (r.top + r.height / 2)) / Math.max(innerHeight, r.height), -1, 1);
        el.style.setProperty('--cinema-scroll', paused() ? '0' : p.toFixed(4));
        el.style.setProperty('--cinema-x', !paused() && pointer.matches ? px.toFixed(4) : '0');
        el.style.setProperty('--cinema-y', !paused() && pointer.matches ? py.toFixed(4) : '0');
      });
      if (!('IntersectionObserver' in window)) reveals.forEach(el => { if (onScreen(el)) el.dataset.cinematicVisible = 'true'; });
      syncVideos();
    };
    function schedule() { if (!frame && !suspended) frame = requestAnimationFrame(update); }
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule, {passive:true});
    addEventListener('pointermove', event => {
      if (paused() || !pointer.matches || (event.pointerType && event.pointerType !== 'mouse')) return;
      px = clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
      py = clamp(event.clientY / innerHeight * 2 - 1, -1, 1);
      schedule();
    }, {passive:true});
    document.documentElement.addEventListener('pointerleave', () => { px = py = 0; schedule(); });
    document.addEventListener('visibilitychange', () => { syncVideos(); schedule(); });
    reduced.addEventListener('change', syncPreference);
    pointer.addEventListener('change', () => { px = py = 0; schedule(); });
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.dataset.cinematicVisible = 'true'; revealObserver.unobserve(entry.target); }
      }), {threshold:.04});
      reveals.forEach(el => revealObserver.observe(el));
      observers.push(revealObserver);
      const videoObserver = new IntersectionObserver(schedule, {threshold:.04});
      videos.forEach(state => videoObserver.observe(state.video));
      observers.push(videoObserver);
    } else revealAll();

    // The homepage's ordinary mobile navigation; inner pages retain the existing nav runtime.
    const menu = document.querySelector('[data-cinema-menu]');
    const menuToggle = document.querySelector('[data-cinema-menu-toggle]');
    if (menu && menuToggle) {
      const close = () => { menu.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation'); };
      menuToggle.addEventListener('click', () => {
        const open = menuToggle.getAttribute('aria-expanded') !== 'true';
        menu.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      });
      menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
      document.addEventListener('click', event => { if (!menu.contains(event.target) && !menuToggle.contains(event.target)) close(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('is-open')) { close(); menuToggle.focus({preventScroll:true}); } });
      matchMedia('(min-width: 701px)').addEventListener('change', close);
    }

    // Native dialog keeps keyboard focus, Escape and fallback controls in the browser.
    const dialog = document.querySelector('[data-cinema-dialog]');
    if (dialog) {
      let opener;
      document.querySelectorAll('[data-cinema-open]').forEach(button => button.addEventListener('click', () => {
        opener = button;
        dialog.showModal();
        videos.filter(state => dialog.contains(state.video)).forEach(state => {
          state.playBlocked = false;
          loadVideo(state);
          state.manual = false;
        });
        syncVideos();
      }));
      dialog.querySelectorAll('[data-cinema-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        videos.filter(state => dialog.contains(state.video)).forEach(state => { pauseVideo(state); state.manual = false; });
        if (opener && opener.isConnected) opener.focus({preventScroll:true});
      });
    }
    addEventListener('error', revealAll);
    addEventListener('unhandledrejection', revealAll);
    addEventListener('pagehide', event => {
      suspended = true;
      cancelAnimationFrame(frame);
      frame = 0;
      videos.forEach(pauseVideo);
      if (!event.persisted) observers.forEach(observer => observer.disconnect());
    });
    addEventListener('pageshow', () => { suspended = false; syncPreference(); });
    syncPreference();
    reveals.filter(onScreen).forEach(el => { el.dataset.cinematicVisible = 'true'; });
    root.classList.add('cinema-ready');
    update();
  };
  const initialize = () => {
    try { start(); }
    catch (_) {
      document.documentElement.classList.remove('cinema-ready');
      document.querySelectorAll('[data-cinematic-reveal]').forEach(el => { el.dataset.cinematicVisible = 'true'; });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true}); else initialize();
})();
