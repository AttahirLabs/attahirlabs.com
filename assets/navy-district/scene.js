(() => {
  'use strict';

  function initialize() {
    const body = document.body;
    if (!body) return;

    const cleanups = [];
    const revealItems = [...document.querySelectorAll('[data-reveal]')];
    const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
    const motionLabels = [...document.querySelectorAll('[data-motion-label]')];
    const videos = [...document.querySelectorAll('[data-cafe-video]')].map(video => ({
      video, manual: false, userPaused: false, internalPause: false,
    }));
    const parallaxItems = [...document.querySelectorAll('[data-parallax]')].map(element => ({
      element, visible: false, x: 0, y: 0,
    }));
    const query = value => typeof window.matchMedia === 'function' ? window.matchMedia(value) : null;
    const reducedMotion = query('(prefers-reduced-motion: reduce)');
    const finePointer = query('(min-width: 960px) and (hover: hover) and (pointer: fine)');
    const isReduced = () => Boolean(reducedMotion && reducedMotion.matches);
    let userPaused = false;
    let suspended = false;
    let destroyed = false;
    let observers = [];
    let parallaxFrame = 0;
    let viewportFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const listen = (target, type, handler, options) => {
      if (!target) return;
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    };
    const watchQuery = (media, handler) => {
      if (!media) return;
      if (typeof media.addEventListener === 'function') listen(media, 'change', handler);
      else if (typeof media.addListener === 'function') {
        media.addListener(handler);
        cleanups.push(() => media.removeListener(handler));
      }
    };
    const paused = () => userPaused || isReduced();
    const showAllReveals = () => revealItems.forEach(item => item.classList.add('is-visible'));
    const inViewport = element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
        && rect.top < window.innerHeight && rect.left < window.innerWidth;
    };
    const focus = element => {
      if (!element || !element.isConnected || typeof element.focus !== 'function') return;
      try { element.focus({ preventScroll: true }); } catch (_) { element.focus(); }
    };

    const menuButton = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');
    const setMenuOpen = open => {
      if (!menu || !menuButton) return;
      menu.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    };
    if (menu && menuButton) {
      setMenuOpen(false);
      listen(menuButton, 'click', event => {
        event.preventDefault();
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
      });
      listen(menu, 'click', event => {
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (link && menu.contains(link)) setMenuOpen(false);
      });
      listen(document, 'click', event => {
        if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
      });
      listen(document, 'keydown', event => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
          event.preventDefault();
          setMenuOpen(false);
          focus(menuButton);
        }
      });
    }

    const videoIsVisible = state => {
      const dialog = state.video.closest('dialog');
      return !suspended && !document.hidden && (!dialog || dialog.open) && inViewport(state.video);
    };
    const pauseVideo = (state, resetManual = true) => {
      if (resetManual) state.manual = false;
      if (!state.video.paused) {
        state.internalPause = true;
        state.video.pause();
      }
    };
    const loadVideo = state => {
      const video = state.video;
      if (video.getAttribute('src')) return true;
      const source = video.dataset.src;
      if (!source) return false;
      // Only the local page's media is eligible; no external requests/imports.
      try {
        const url = new URL(source, document.baseURI);
        if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== window.location.origin) return false;
      } catch (_) { return false; }
      video.preload = 'metadata';
      video.setAttribute('src', source);
      video.load();
      return true;
    };
    const reconcileVideo = state => {
      if (!videoIsVisible(state)) {
        pauseVideo(state);
        return;
      }
      if (paused()) {
        // Native controls may deliberately play this detail scene even while
        // ambient motion is paused. Visibility always takes precedence.
        if (!state.manual) pauseVideo(state, false);
        return;
      }
      if (!loadVideo(state) || state.userPaused || state.manual || !state.video.paused) return;
      try {
        const promise = state.video.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      } catch (_) { /* Native controls remain available if autoplay is blocked. */ }
    };
    const reconcileVideos = () => videos.forEach(reconcileVideo);
    videos.forEach(state => {
      const video = state.video;
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = false;
      video.setAttribute('playsinline', '');
      listen(video, 'play', () => {
        state.internalPause = false;
        state.manual = true;
        state.userPaused = false;
        if (!videoIsVisible(state)) pauseVideo(state);
      });
      listen(video, 'pause', () => {
        if (state.internalPause) { state.internalPause = false; return; }
        state.manual = false;
        state.userPaused = true;
      });
    });

    const dialog = document.querySelector('#cafe-dialog');
    let sceneOpener = null;
    const dialogClosed = () => {
      videos.filter(state => state.video.closest('dialog') === dialog).forEach(state => {
        pauseVideo(state);
        state.userPaused = false;
      });
      const opener = sceneOpener;
      sceneOpener = null;
      focus(opener);
    };
    const closeScene = () => {
      if (!dialog || !dialog.open) return;
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); dialogClosed(); }
    };
    if (dialog) {
      document.querySelectorAll('[data-scene-open]').forEach(button => {
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', dialog.id);
        listen(button, 'click', event => {
          event.preventDefault();
          if (dialog.open) return;
          sceneOpener = button;
          setMenuOpen(false);
          try {
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', '');
          } catch (_) { sceneOpener = null; return; }
          // This is an intentional request for the real local Unreal scene.
          // Reduced-motion users get native controls, without automatic play.
          videos.filter(state => state.video.closest('dialog') === dialog).forEach(state => {
            state.manual = false;
            state.userPaused = false;
            loadVideo(state);
            reconcileVideo(state);
          });
          if (typeof dialog.showModal !== 'function') focus(dialog.querySelector('[data-scene-close]'));
        });
      });
      dialog.querySelectorAll('[data-scene-close]').forEach(button => listen(button, 'click', closeScene));
      listen(dialog, 'click', event => { if (event.target === dialog) closeScene(); });
      listen(dialog, 'close', dialogClosed);
      if (typeof dialog.close !== 'function') listen(document, 'keydown', event => {
        if (event.key === 'Escape' && dialog.open) { event.preventDefault(); closeScene(); }
      });
    }

    const parallaxEnabled = () => !suspended && !document.hidden && !paused()
      && Boolean(finePointer && finePointer.matches);
    const resetParallax = () => {
      if (parallaxFrame) window.cancelAnimationFrame(parallaxFrame);
      parallaxFrame = 0;
      parallaxItems.forEach(item => {
        item.x = 0; item.y = 0;
        item.element.style.setProperty('--parallax-x', '0px');
        item.element.style.setProperty('--parallax-y', '0px');
      });
    };
    const tickParallax = () => {
      parallaxFrame = 0;
      if (!parallaxEnabled()) { resetParallax(); return; }
      let moving = false;
      parallaxItems.forEach(item => {
        if (!item.visible) return;
        const targetX = pointerActive ? pointerX : 0;
        const targetY = pointerActive ? pointerY : 0;
        item.x += (targetX - item.x) * 0.14;
        item.y += (targetY - item.y) * 0.14;
        item.element.style.setProperty('--parallax-x', `${item.x.toFixed(3)}px`);
        item.element.style.setProperty('--parallax-y', `${item.y.toFixed(3)}px`);
        moving = moving || Math.abs(targetX - item.x) > 0.02 || Math.abs(targetY - item.y) > 0.02;
      });
      if (moving) parallaxFrame = window.requestAnimationFrame(tickParallax);
    };
    const queueParallax = () => {
      if (!parallaxFrame && parallaxEnabled() && parallaxItems.some(item => item.visible)) {
        parallaxFrame = window.requestAnimationFrame(tickParallax);
      }
    };
    listen(window, 'pointermove', event => {
      if (!parallaxEnabled() || (event.pointerType && event.pointerType !== 'mouse')) return;
      pointerActive = true;
      pointerX = Math.max(-6, Math.min(6, (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 12));
      pointerY = Math.max(-6, Math.min(6, (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 12));
      queueParallax();
    }, { passive: true });
    listen(document.documentElement, 'pointerleave', () => {
      pointerActive = false;
      queueParallax();
    });

    const syncMotion = () => {
      const label = isReduced() ? 'Reduced motion' : paused() ? 'Resume motion' : 'Pause motion';
      body.dataset.motion = paused() ? 'paused' : 'playing';
      motionLabels.forEach(element => { element.textContent = label; });
      motionButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(paused()));
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-disabled', String(isReduced()));
        if ('disabled' in button) button.disabled = isReduced();
      });
      if (paused()) {
        pointerActive = false;
        resetParallax();
        videos.forEach(state => pauseVideo(state));
      }
      reconcileVideos();
    };
    motionButtons.forEach(button => listen(button, 'click', event => {
      event.preventDefault();
      if (isReduced()) return;
      userPaused = !userPaused;
      syncMotion();
    }));
    watchQuery(reducedMotion, () => {
      if (isReduced()) showAllReveals();
      syncMotion();
    });
    watchQuery(finePointer, () => { resetParallax(); pointerActive = false; });

    const disconnectObservers = () => {
      observers.forEach(observer => observer.disconnect());
      observers = [];
    };
    const refreshViewport = () => {
      viewportFrame = 0;
      if (suspended || destroyed) return;
      if (isReduced()) showAllReveals();
      else revealItems.forEach(item => { if (inViewport(item)) item.classList.add('is-visible'); });
      parallaxItems.forEach(item => {
        item.visible = inViewport(item.element);
        if (!item.visible) {
          item.x = 0; item.y = 0;
          item.element.style.setProperty('--parallax-x', '0px');
          item.element.style.setProperty('--parallax-y', '0px');
        }
      });
      reconcileVideos();
    };
    const queueViewport = () => {
      if (!viewportFrame && !suspended && !destroyed) viewportFrame = window.requestAnimationFrame(refreshViewport);
    };
    const connectObservers = () => {
      disconnectObservers();
      refreshViewport();
      if (typeof window.IntersectionObserver !== 'function') {
        showAllReveals();
        return;
      }
      try {
        const revealObserver = new IntersectionObserver(entries => {
          try {
            entries.forEach(entry => {
              if (entry.isIntersecting || isReduced()) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
              }
            });
          } catch (_) { showAllReveals(); revealObserver.disconnect(); }
        }, { threshold: 0.06 });
        if (!isReduced()) revealItems.filter(item => !item.classList.contains('is-visible')).forEach(item => revealObserver.observe(item));
        observers.push(revealObserver);
        const videoObserver = new IntersectionObserver(() => reconcileVideos(), { threshold: 0.01 });
        videos.forEach(state => videoObserver.observe(state.video));
        observers.push(videoObserver);
        const parallaxObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const item = parallaxItems.find(candidate => candidate.element === entry.target);
            if (!item) return;
            item.visible = entry.isIntersecting;
            if (!item.visible) {
              item.x = 0; item.y = 0;
              item.element.style.setProperty('--parallax-x', '0px');
              item.element.style.setProperty('--parallax-y', '0px');
            }
          });
        });
        parallaxItems.forEach(item => parallaxObserver.observe(item.element));
        observers.push(parallaxObserver);
      } catch (_) { disconnectObservers(); showAllReveals(); }
    };
    listen(window, 'scroll', queueViewport, { passive: true });
    listen(window, 'resize', queueViewport, { passive: true });
    listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        resetParallax();
        videos.forEach(state => pauseVideo(state));
      } else refreshViewport();
    });
    listen(window, 'error', showAllReveals);
    listen(window, 'unhandledrejection', showAllReveals);
    listen(window, 'pagehide', event => {
      suspended = true;
      disconnectObservers();
      resetParallax();
      if (viewportFrame) window.cancelAnimationFrame(viewportFrame);
      viewportFrame = 0;
      videos.forEach(state => pauseVideo(state));
      // Keep listeners for BFCache; pageshow reconnects observers exactly once.
      if (!event.persisted) {
        destroyed = true;
        cleanups.splice(0).forEach(cleanup => cleanup());
      }
    });
    listen(window, 'pageshow', event => {
      if (!event.persisted || destroyed) return;
      suspended = false;
      pointerActive = false;
      connectObservers();
      syncMotion();
    });

    syncMotion();
    connectObservers();
    document.documentElement.classList.add('js');
  }

  const start = () => {
    try { initialize(); }
    catch (_) {
      document.querySelectorAll('[data-reveal]').forEach(item => item.classList.add('is-visible'));
      document.documentElement.classList.remove('js');
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
