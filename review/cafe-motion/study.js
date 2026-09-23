const video = document.getElementById('cafe-film');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function startFilm() {
  if (reducedMotion.matches || document.visibilityState !== 'visible') return;
  video.play().catch(() => {});
}

if (reducedMotion.matches) {
  video.controls = true;
} else {
  video.addEventListener('ended', () => {
    window.setTimeout(() => {
      video.classList.add('fading');
      window.setTimeout(() => {
        video.currentTime = 0;
        video.play().then(() => video.classList.remove('fading')).catch(() => {});
      }, 300);
    }, 1200);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else startFilm();
  });
  startFilm();
}
