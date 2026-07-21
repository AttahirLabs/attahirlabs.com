(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AttahirAnalytics = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  const required = Object.freeze({
    surface_viewed: ['surface', 'surface_group'],
    cta_clicked: ['surface', 'placement', 'destination_type'],
    tool_started: ['surface', 'tool_name'],
    tool_completed: ['surface', 'tool_name', 'result_band'],
    tool_failed: ['surface', 'tool_name', 'error_code'],
    blog_cta_clicked: ['source_slug', 'placement', 'destination_type'],
    app_store_outbound: ['surface', 'placement', 'app_name'],
    contact_intent: ['surface', 'placement', 'app_name'],
    tool_to_app_referral: ['surface', 'placement', 'tool_name', 'app_name']
  });
  const enums = Object.freeze({
    surface: new Set(['homepage', 'apps_hub', 'app_tariffshield', 'app_stockclearance', 'app_shelflife', 'app_accessshield', 'app_storechangelog', 'app_warrantytracker', 'blog_post', 'duty_calculator', 'shipping_calculator', 'access_checker']),
    surface_group: new Set(['website', 'app_landing', 'blog', 'tool']),
    placement: new Set(['hero', 'app_card', 'result_cta', 'article_inline', 'article_footer', 'nav', 'final_cta', 'tool_result']),
    destination_type: new Set(['apps_hub', 'app_page', 'shopify_app_store', 'contact', 'tool', 'blog']),
    app_name: new Set(['tariffshield', 'stockclearance', 'shelflife', 'accessshield', 'storechangelog', 'warrantytracker']),
    tool_name: new Set(['duty_calculator', 'shipping_calculator', 'access_checker']),
    result_band: new Set(['low', 'medium', 'high', 'very_high', 'not_available', 'excellent_80_100', 'needs_work_50_79', 'poor_0_49']),
    error_code: new Set(['validation', 'rate_limited', 'network', 'upstream', 'timeout', 'unknown'])
  });
  const prohibited = new Set(['url', 'domain', 'shop', 'email', 'ip', 'user_agent', 'query', 'search', 'text', 'product_id', 'order_id', 'customer_id', 'hs_code', 'referrer', 'exception', 'stack', 'secret', 'token', 'raw_text']);

  function gtagTransport(name, params) {
    if (typeof root.gtag === 'function') root.gtag('event', name, params);
  }

  function createAnalytics(options) {
    let transport = options && Object.prototype.hasOwnProperty.call(options, 'transport') ? options.transport : gtagTransport;
    const seen = new Set();

    function validate(name, params) {
      if (!required[name] || !params || typeof params !== 'object') return null;
      if (Object.keys(params).some((key) => prohibited.has(String(key).toLowerCase()))) return null;
      const clean = {};
      for (const key of required[name]) {
        const value = params[key];
        if (value === undefined || value === null || value === '') return null;
        if (enums[key] && !enums[key].has(value)) return null;
        if (key === 'source_slug' && (!/^[a-z0-9][a-z0-9-]{0,120}$/.test(value))) return null;
        clean[key] = value;
      }
      return { name, params: clean };
    }

    function emit(name, params) {
      const event = validate(name, params);
      if (!event) return null;
      try { if (typeof transport === 'function') transport(event.name, event.params); } catch (_) { /* analytics never breaks product behavior */ }
      return event;
    }

    function once(actionKey, name, params) {
      if (!actionKey || seen.has(actionKey)) return null;
      const event = emit(name, params);
      if (event) seen.add(actionKey);
      return event;
    }

    return { emit, once, validate, setTransport(next) { transport = next; } };
  }

  function sourceSlug(pathname) {
    const match = String(pathname || '').split(/[?#]/, 1)[0].match(/^\/blog\/([a-z0-9][a-z0-9-]*)\/?$/);
    return match ? match[1] : null;
  }

  function classifyPath(pathname) {
    const path = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
    const exact = {
      '/': ['homepage', 'website'], '/apps': ['apps_hub', 'website'],
      '/duty': ['duty_calculator', 'tool'], '/shipping': ['shipping_calculator', 'tool'],
      '/tools/access-checker': ['access_checker', 'tool']
    };
    if (exact[path]) return { surface: exact[path][0], surface_group: exact[path][1] };
    const app = path.match(/^\/apps\/(tariffshield|stockclearance|shelflife|accessshield|storechangelog|warrantytracker)$/);
    if (app) return { surface: `app_${app[1]}`, surface_group: 'app_landing' };
    if (sourceSlug(path)) return { surface: 'blog_post', surface_group: 'blog' };
    return null;
  }

  function classifyBlogDestination(href) {
    try {
      const target = new URL(href, 'https://attahirlabs.com');
      if (target.hostname === 'apps.shopify.com') {
        const app = target.pathname.replace(/^\//, '');
        if (app === 'tariffshield' || app === 'stockclearance') return { destination_type: 'shopify_app_store', app_name: app };
        return null;
      }
      if (target.hostname !== 'attahirlabs.com') return null;
      if (target.pathname === '/contact.html') return { destination_type: 'contact' };
      if (/^\/apps\//.test(target.pathname)) return { destination_type: 'app_page' };
      if (/^\/(duty|shipping|tools\/access-checker)\//.test(target.pathname)) return { destination_type: 'tool' };
      if (/^\/blog\//.test(target.pathname)) return { destination_type: 'blog' };
      return null;
    } catch (_) { return null; }
  }

  const analytics = createAnalytics({});

  function bindDom(doc, location) {
    if (!doc || !location) return;
    const surface = classifyPath(location.pathname);
    if (surface) analytics.once(`view:${location.pathname}`, 'surface_viewed', surface);
    doc.addEventListener('click', function (event) {
      const element = event.target && event.target.closest ? event.target.closest('[data-analytics-event]') : null;
      if (!element && surface && surface.surface === 'blog_post') {
        const link = event.target && event.target.closest ? event.target.closest('a') : null;
        const destination = link && (link.classList.contains('cta-button') || link.closest('.cta-box,.cta-section,.stockclearance-cta')) ? classifyBlogDestination(link.getAttribute('href')) : null;
        if (!destination) return;
        const params = { source_slug: sourceSlug(location.pathname), placement: 'article_inline', destination_type: destination.destination_type };
        analytics.emit('blog_cta_clicked', params);
        if (destination.app_name) analytics.emit('app_store_outbound', { surface: 'blog_post', placement: 'article_inline', app_name: destination.app_name });
        return;
      }
      if (!element) return;
      const name = element.dataset.analyticsEvent;
      const params = {};
      for (const key of (required[name] || [])) {
        const dataKey = `analytics${key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()).replace(/^./, (char) => char.toUpperCase())}`;
        params[key] = element.dataset[dataKey];
      }
      if (name === 'blog_cta_clicked' && !params.source_slug) params.source_slug = sourceSlug(location.pathname);
      analytics.emit(name, params);
    });
  }

  analytics.createAnalytics = createAnalytics;
  analytics.classifyPath = classifyPath;
  analytics.sourceSlug = sourceSlug;
  analytics.classifyBlogDestination = classifyBlogDestination;
  analytics.bindDom = bindDom;
  analytics.EVENTS = Object.freeze(Object.keys(required));
  if (root.document && root.location) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => bindDom(root.document, root.location));
    else bindDom(root.document, root.location);
  }
  return analytics;
});
