(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ShippingCalculator = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DIMENSIONAL_DIVISOR = 139; // Retail carrier dimensional-weight divisor for inches/pounds.
  const HANDLING_BUFFER = 1.5; // Small packaging/label buffer included in the retail benchmark.
  const RANGE_SPREAD = 0.22; // Retail quotes vary by carrier, discount availability, and fuel surcharge.
  const RANGE_TOP_BUFFER = 2;

  const ZONES = {
    domestic: {
      label: 'Domestic',
      base: { Economy: 7.75, Standard: 10.5, Express: 18.5 },
      perLb: { Economy: 0.62, Standard: 0.88, Express: 1.35 },
      windows: { Economy: '5–8 business days', Standard: '2–5 business days', Express: '1–2 business days' }
    },
    crossBorder: {
      label: 'Cross-border',
      base: { Economy: 14, Standard: 18, Express: 31 },
      perLb: { Economy: 1.05, Standard: 1.35, Express: 2.15 },
      windows: { Economy: '6–10 business days', Standard: '3–7 business days', Express: '2–4 business days' }
    },
    international: {
      label: 'International',
      base: { Economy: 26, Standard: 38, Express: 62 },
      perLb: { Economy: 2.35, Standard: 3.25, Express: 5.4 },
      windows: { Economy: '8–15 business days', Standard: '5–10 business days', Express: '3–6 business days' }
    }
  };

  const SPEED_PREFERENCES = {
    economy: { Economy: 0.9, Standard: 0.98, Express: 1.03 },
    balanced: { Economy: 1, Standard: 1, Express: 1 },
    urgent: { Economy: 1.04, Standard: 1.08, Express: 1.12 }
  };

  const VALUE_SURCHARGE_BRACKETS = [
    { min: 0, rate: 0 },
    { min: 250, rate: 0.01 },
    { min: 500, rate: 0.015 },
    { min: 1000, rate: 0.02 },
    { min: 2500, rate: 0.025 }
  ];

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeCountry(country) {
    return String(country || '').trim().toUpperCase();
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function dimensionalWeight({ length, width, height }) {
    const l = Math.max(0, toNumber(length));
    const w = Math.max(0, toNumber(width));
    const h = Math.max(0, toNumber(height));
    if (!l || !w || !h) return 0;
    return Math.ceil((l * w * h) / DIMENSIONAL_DIVISOR);
  }

  function billableWeight(input) {
    return Math.max(1, Math.ceil(Math.max(toNumber(input.weight), dimensionalWeight(input))));
  }

  function selectZone(originCountry, originPostal, destinationCountry, destinationPostal) {
    const origin = normalizeCountry(originCountry);
    const destination = normalizeCountry(destinationCountry);
    if (!origin || !destination) return 'international';
    if (origin === destination) return 'domestic';
    const northAmerica = new Set(['CA', 'US', 'MX']);
    if (northAmerica.has(origin) && northAmerica.has(destination)) return 'crossBorder';
    return 'international';
  }

  function valueSurcharge(orderValue) {
    const value = Math.max(0, toNumber(orderValue));
    const bracket = VALUE_SURCHARGE_BRACKETS.reduce((active, candidate) => value >= candidate.min ? candidate : active, VALUE_SURCHARGE_BRACKETS[0]);
    return value * bracket.rate;
  }

  function estimateShipping(input) {
    const zone = selectZone(input.originCountry, input.originPostal, input.destinationCountry, input.destinationPostal);
    const zoneConfig = ZONES[zone];
    const weight = billableWeight(input);
    const preference = SPEED_PREFERENCES[input.speedPreference] || SPEED_PREFERENCES.balanced;
    const surcharge = valueSurcharge(input.orderValue);

    const estimates = ['Economy', 'Standard', 'Express'].map((service) => {
      const baseEstimate = (zoneConfig.base[service] + (zoneConfig.perLb[service] * weight) + HANDLING_BUFFER + surcharge) * preference[service];
      const low = roundMoney(baseEstimate);
      const high = roundMoney(baseEstimate * (1 + RANGE_SPREAD) + RANGE_TOP_BUFFER);
      return {
        service,
        low,
        high,
        window: zoneConfig.windows[service]
      };
    });

    return {
      zone,
      zoneLabel: zoneConfig.label,
      billableWeight: weight,
      dimensionalWeight: dimensionalWeight(input),
      estimates
    };
  }

  return {
    DIMENSIONAL_DIVISOR,
    HANDLING_BUFFER,
    ZONES,
    SPEED_PREFERENCES,
    dimensionalWeight,
    billableWeight,
    selectZone,
    estimateShipping
  };
});
