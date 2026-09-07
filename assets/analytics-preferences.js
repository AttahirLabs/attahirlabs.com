(function (root) {
  'use strict';
  const status = root.document.getElementById('analytics-preference-status');
  const turnOff = root.document.getElementById('analytics-turn-off');
  const turnOn = root.document.getElementById('analytics-turn-on');
  const storageKey = 'attahir.analytics.disabled';
  if (!status || !turnOff || !turnOn) return;

  function readPreference() {
    try { return { available: true, off: root.localStorage.getItem(storageKey) === 'true' }; }
    catch (_) { return { available: false }; }
  }

  function show(state, saved = false) {
    status.dataset.preference = state;
    turnOff.setAttribute('aria-pressed', String(state === 'off'));
    turnOn.setAttribute('aria-pressed', String(state === 'on'));
    if (state === 'off') {
      status.textContent = (saved ? 'Saved. ' : '') + 'Analytics is off for future visits in this browser on this site address.';
    } else if (state === 'on') {
      status.textContent = (saved ? 'Saved. ' : '') + 'Analytics is allowed for newly loaded pages in this browser on this site address. Other privacy settings may still prevent collection.';
    } else {
      status.textContent = 'Your browser could not save or read this preference. This page does not collect analytics, but other pages may still collect them. Please try again before continuing.';
    }
  }

  turnOff.addEventListener('click', function () {
    if (typeof root.AttahirAnalytics?.disable !== 'function') return show('unavailable');
    root.AttahirAnalytics.disable({ persist: true });
    const readback = readPreference();
    show(readback.available && readback.off ? 'off' : 'unavailable', true);
  });

  turnOn.addEventListener('click', function () {
    try { root.localStorage.removeItem(storageKey); }
    catch (_) { return show('unavailable'); }
    const readback = readPreference();
    // Never initialize analytics here. Only a later document may collect.
    show(readback.available && !readback.off ? 'on' : 'unavailable', true);
  });

  const initial = readPreference();
  show(initial.available ? (initial.off ? 'off' : 'on') : 'unavailable');
})(window);
