(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AttahirAnalytics = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  const contract = Object.freeze({
    surface_viewed: { required: ['surface', 'surface_group'], optional: [] },
    cta_clicked: { required: ['surface', 'placement', 'destination_type'], optional: [] },
    tool_started: { required: ['surface', 'tool_name'], optional: [] },
    tool_completed: { required: ['surface', 'tool_name', 'result_band'], optional: [] },
    tool_failed: { required: ['surface', 'tool_name', 'error_code'], optional: [] },
    contact_intent: { required: ['surface', 'placement'], optional: ['app_name'] },
    tool_to_app_referral: {
      required: ['surface', 'placement', 'tool_name', 'app_name'],
      optional: []
    }
  });

  const enums = Object.freeze({
    surface: new Set(['duty_calculator', 'shipping_calculator', 'access_checker']),
    surface_group: new Set(['tool']),
    placement: new Set(['nav', 'result_cta', 'tool_result']),
    destination_type: new Set([
      'apps_hub',
      'app_page',
      'shopify_app_store',
      'contact',
      'tool',
      'blog'
    ]),
    app_name: new Set([
      'tariffshield',
      'stockclearance',
      'shelflife',
      'accessshield',
      'storechangelog',
      'warrantytracker'
    ]),
    tool_name: new Set(['duty_calculator', 'shipping_calculator', 'access_checker']),
    result_band: new Set([
      'low',
      'medium',
      'high',
      'very_high',
      'not_available',
      'excellent_80_100',
      'needs_work_50_79',
      'poor_0_49'
    ]),
    error_code: new Set([
      'validation',
      'rate_limited',
      'network',
      'upstream',
      'timeout',
      'unknown'
    ])
  });

  const prohibitedKeyParts = new Set([
    'url',
    'domain',
    'shop',
    'email',
    'ip',
    'user',
    'agent',
    'query',
    'search',
    'text',
    'product',
    'order',
    'customer',
    'hs',
    'code',
    'referrer',
    'exception',
    'stack',
    'secret',
    'token',
    'input',
    'value',
    'issue',
    'finding',
    'description'
  ]);

  function normalizedKeyParts(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  function containsProhibitedKey(params, allowedKeys) {
    return Object.keys(params).some((key) => {
      if (allowedKeys.has(key)) return false;
      return normalizedKeyParts(key).some((part) => prohibitedKeyParts.has(part));
    });
  }

  function gtagTransport(name, params) {
    if (typeof root.gtag === 'function') root.gtag('event', name, params);
  }

  function createAnalytics(options) {
    let transport = options && Object.prototype.hasOwnProperty.call(options, 'transport')
      ? options.transport
      : gtagTransport;
    const seen = new Set();

    function validate(name, params) {
      const rule = contract[name];
      if (!rule || !params || typeof params !== 'object' || Array.isArray(params)) return null;
      const allowedKeys = new Set([...rule.required, ...rule.optional]);
      if (containsProhibitedKey(params, allowedKeys)) return null;

      const clean = {};
      for (const key of rule.required) {
        const value = params[key];
        if (typeof value !== 'string' || !value || !enums[key]?.has(value)) return null;
        clean[key] = value;
      }
      for (const key of rule.optional) {
        if (params[key] === undefined || params[key] === null || params[key] === '') continue;
        if (typeof params[key] !== 'string' || !enums[key]?.has(params[key])) return null;
        clean[key] = params[key];
      }
      return { name, params: clean };
    }

    function emit(name, params) {
      const event = validate(name, params);
      if (!event) return null;
      try {
        if (typeof transport === 'function') transport(event.name, event.params);
      } catch (_) {
        // Analytics must never affect navigation or tool behavior.
      }
      return event;
    }

    function once(actionKey, name, params) {
      if (typeof actionKey !== 'string' || !actionKey || seen.has(actionKey)) return null;
      const event = emit(name, params);
      if (event) seen.add(actionKey);
      return event;
    }

    return {
      emit,
      once,
      validate,
      setTransport(next) {
        transport = next;
      }
    };
  }

  function dutyResultBand(ratePercent) {
    const rate = Number.parseFloat(String(ratePercent));
    if (!Number.isFinite(rate)) return 'not_available';
    if (rate <= 5) return 'low';
    if (rate <= 15) return 'medium';
    if (rate <= 30) return 'high';
    return 'very_high';
  }

  function shippingResultBand(lowestEstimate) {
    const amount = Number(lowestEstimate);
    if (!Number.isFinite(amount)) return 'not_available';
    if (amount <= 20) return 'low';
    if (amount <= 50) return 'medium';
    return 'high';
  }

  function surfaceFromPath(pathname) {
    const path = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
    if (path === '/duty') return 'duty_calculator';
    if (path === '/shipping') return 'shipping_calculator';
    if (path === '/tools/access-checker') return 'access_checker';
    return null;
  }

  function datasetKey(key) {
    return 'analytics' + key
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  const analytics = createAnalytics({});

  function bindDom(doc, location) {
    if (!doc || !location) return;
    const surface = surfaceFromPath(location.pathname);
    if (surface) {
      analytics.once(
        `surface:${surface}`,
        'surface_viewed',
        { surface, surface_group: 'tool' }
      );
    }

    doc.addEventListener('click', function (event) {
      const element = event.target?.closest?.('[data-analytics-event]');
      if (!element) return;
      const name = element.dataset.analyticsEvent;
      const rule = contract[name];
      if (!rule) return;
      const params = {};
      for (const key of [...rule.required, ...rule.optional]) {
        const value = element.dataset[datasetKey(key)];
        if (value !== undefined) params[key] = value;
      }
      analytics.emit(name, params);
    });
  }

  analytics.createAnalytics = createAnalytics;
  analytics.dutyResultBand = dutyResultBand;
  analytics.shippingResultBand = shippingResultBand;
  analytics.surfaceFromPath = surfaceFromPath;
  analytics.bindDom = bindDom;
  analytics.EVENTS = Object.freeze(Object.keys(contract));

  if (root.document && root.location) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => bindDom(root.document, root.location));
    } else {
      bindDom(root.document, root.location);
    }
  }

  return analytics;
});
