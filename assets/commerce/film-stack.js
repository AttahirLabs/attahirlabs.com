// Rendered miniature rooms use the same six-stop elevator timeline as the
// storefront and app cards. Only the central film plays; the adjacent floors
// remain poster images until they arrive in view.
const films = [
  ["cafe", "Café and coffee shop"],
  ["warehouse", "Warehouse and fulfillment"],
  ["boutique", "Fashion boutique"],
  ["grocery", "Neighborhood grocery"],
  ["florist", "Florist shop"],
  ["homewares", "Homewares showroom"],
];

export function createCommerceWorld(host) {
  const floors = films.map(([id, label]) => {
    const floor = document.createElement('div');
    floor.className = 'commerce-film-floor';
    floor.setAttribute('aria-hidden', 'true');
    const aperture = document.createElement('div');
    aperture.className = 'commerce-film-window';
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.loop = false;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = `/assets/commerce/films/${id}.webp`;
    video.src = `/assets/commerce/films/${id}.mp4`;
    video.setAttribute('aria-label', label);
    video.setAttribute('disablepictureinpicture', '');
    aperture.append(video);
    floor.append(aperture);
    host.append(floor);
    return {floor, video, pending: false, active: false, failed: false};
  });
  let disposed = false;

  function pause() {
    floors.forEach(({video}) => video.pause());
  }

  function render(_time, timeline, canPlay = true) {
    if (disposed) return;
    const width = host.getBoundingClientRect().width * (innerWidth < 681 ? .61 : .55);
    const spacing = width * .75 + 5;
    floors.forEach((entry, index) => {
      const {floor, video} = entry;
      const offset = timeline.offset(index);
      const visible = Math.abs(offset) < 1.7;
      floor.hidden = !visible;
      if (visible) {
        floor.style.transform = `translate3d(0, ${offset * spacing}px, 0) translateY(-50%)`;
        floor.style.zIndex = String(4 - Math.round(Math.abs(offset)));
      }
      const active = visible && Math.abs(offset) < .48;
      if (active && !entry.active) {
        video.currentTime = 0;
        entry.active = true;
      } else if (!active) {
        entry.active = false;
      }
      if (active && canPlay && video.paused && !video.ended && !entry.pending && !entry.failed) {
        entry.pending = true;
        video.play().catch(() => { entry.failed = Boolean(video.error); }).finally(() => { entry.pending = false; });
      } else if ((!active || !canPlay) && !video.paused) {
        video.pause();
      }
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    pause();
    floors.forEach(({floor, video}) => {
      video.removeAttribute('src');
      video.load();
      floor.remove();
    });
  }

  return {render, pause, dispose};
}
