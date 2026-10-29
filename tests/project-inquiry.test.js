const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/project-inquiry.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'web-design/start/index.html'), 'utf8');
const { projectDraft } = require('../assets/project-inquiry.js');

function readDraft(values) {
  const draft = projectDraft(values);
  const uri = new URL(draft.url);
  assert.equal(uri.protocol, 'mailto:');
  assert.equal(uri.pathname, 'support@attahirlabs.com', 'visitor input cannot change the recipient');
  assert.deepEqual([...uri.searchParams.keys()], ['subject', 'body'], 'visitor input cannot add mail headers');
  return { ...draft, uri };
}

const special = readDraft({
  name: 'A & B + Partners',
  email: 'person+project@example.com',
  service: 'shopify-setup',
  website: 'https://example.com/?one=1&two=2#shop',
  brief: 'A café 🌿\nShop pages? #launch & a 10% offer = yes.',
});
assert.equal(special.uri.searchParams.get('subject'), 'Website project enquiry — Shopify store setup');
assert.equal(special.uri.searchParams.get('body'), special.body, 'email clients receive the entered punctuation and Unicode');
for (const value of ['A & B + Partners', 'person+project@example.com', 'https://example.com/?one=1&two=2#shop', 'A café 🌿\nShop pages? #launch & a 10% offer = yes.']) {
  assert.ok(special.body.includes(value));
}
const optional = readDraft({ name: 'Visitor', email: 'visitor@example.com', service: 'website-design', brief: 'A new website.' });
assert.ok(optional.body.includes('Business: Not provided'));
assert.ok(optional.body.includes('Current website: Not provided'));
assert.ok(optional.body.includes('Budget range: Not sure yet'));
assert.ok(optional.body.includes('Ideal timing: Flexible / not provided'));
assert.doesNotMatch(optional.body, /undefined|null/);

for (const service of ['__proto__', 'constructor', 'website-design\r\nBcc: other@example.com', '', null]) {
  const draft = readDraft({ service });
  assert.equal(draft.uri.searchParams.get('subject'), 'Website project enquiry — Something else / help choosing');
}
const headers = readDraft({
  name: 'Visitor\r\nBcc: other@example.com\u0000\u001f',
  email: 'person@example.com?cc=other@example.com&bcc=third@example.com',
  service: 'other',
  brief: 'Body text\u0000\nNext line',
});
assert.match(headers.body, /Name: Visitor Bcc: other@example\.com /);
assert.doesNotMatch(headers.body, /\u0000|\u001f/);
assert.ok(headers.body.includes('Body text\nNext line'));

for (const name of ['name', 'email', 'business', 'website', 'budget', 'timeline', 'brief']) {
  const tag = html.match(new RegExp(`<(?:input|textarea)\\b[^>]*\\bname="${name}"[^>]*>`))?.[0];
  assert.ok(tag, `${name}: form field exists`);
  const limit = Number(tag.match(/maxlength="(\d+)"/)?.[1]);
  assert.ok(limit > 0 && limit <= 1500, `${name}: field has a useful native length bound`);
  const draft = readDraft({ [name]: 'x'.repeat(limit + 50) });
  assert.ok(!draft.body.includes('x'.repeat(limit + 1)), `${name}: draft also bounds scripted values`);
}
for (const values of [{ name: 'x'.repeat(99) + '😀' }, { brief: '\ud800' }, { brief: 'x'.repeat(1499) + '🌿' }]) {
  assert.doesNotThrow(() => readDraft(values), 'truncated or malformed Unicode must not break the form');
}

const formTag = html.match(/<form\b[^>]*data-project-inquiry[^>]*>/)?.[0];
assert.ok(formTag);
assert.match(formTag, /action="mailto:support@attahirlabs\.com\?subject=Website%20project%20enquiry"/);
assert.match(formTag, /method="post"/);
assert.match(formTag, /enctype="text\/plain"/, 'native no-JavaScript fallback remains usable');
for (const name of ['name', 'email', 'service', 'brief']) {
  assert.match(html, new RegExp(`<(?:input|select|textarea)\\b[^>]*name="${name}"[^>]*\\brequired(?:\\s|>)`));
}
assert.match(html, /name="email"[^>]*type="email"/);
for (const name of ['business', 'website', 'budget', 'timeline']) {
  assert.doesNotMatch(html.match(new RegExp(`<input\\b[^>]*name="${name}"[^>]*>`))[0], /\brequired\b/);
}
assert.match(html, /data-inquiry-copy[^>]*hidden/);
assert.match(html, /data-inquiry-status[^>]*role="status"/);
assert.ok(html.includes('Your email app opens a draft for you to review and send.'));
assert.ok(html.includes('Nothing is submitted or stored by this form.'));
assert.doesNotMatch(source, /\bfetch\s*\(|\b(?:localStorage|sessionStorage|dataLayer|AttahirAnalytics)\b/, 'inquiry values have no network, analytics or browser-storage path');

function browser({ values = {}, nativeValid = true, clipboard = 'success' } = {}) {
  const events = {};
  const buttonEvents = {};
  const fields = {};
  const initial = { name: 'Visitor', email: 'visitor@example.com', service: 'website-design', brief: 'A useful website.', business: '', website: '', budget: '', timeline: '', ...values };
  for (const [name, value] of Object.entries(initial)) {
    fields[name] = { value, error: '', setCustomValidity(message) { this.error = message; } };
  }
  const status = { textContent: '' };
  const copyButton = { hidden: true, addEventListener: (name, handler) => { buttonEvents[name] = handler; } };
  const manualCopy = { hidden: true };
  const copyText = { value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const children = { '[data-inquiry-status]': status, '[data-inquiry-copy]': copyButton, '[data-inquiry-manual]': manualCopy, '[data-inquiry-copy-text]': copyText };
  let validityChecks = 0;
  const form = {
    elements: { namedItem: name => fields[name] },
    querySelector: selector => children[selector],
    addEventListener: (name, handler) => { events[name] = handler; },
    reportValidity() { validityChecks++; return nativeValid && !Object.values(fields).some(field => field.error); },
  };
  const navigations = [];
  const writes = [];
  const location = {};
  Object.defineProperty(location, 'href', { set(value) { navigations.push(value); } });
  const trap = () => { throw new Error('Unexpected network, analytics or storage access'); };
  const window = { location, fetch: trap, AttahirAnalytics: { emit: trap }, dataLayer: { push: trap } };
  for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { get: trap });
  const navigator = clipboard === 'missing' ? {} : {
    clipboard: { async writeText(text) { if (clipboard === 'failure') throw new Error('Permission denied'); writes.push(text); } },
  };
  class FormData {
    *[Symbol.iterator]() { for (const [name, field] of Object.entries(fields)) yield [name, field.value]; }
  }
  vm.runInNewContext(source, { document: { querySelector: selector => selector === '[data-project-inquiry]' ? form : null }, window, navigator, FormData, fetch: trap });
  return {
    fields, status, copyButton, manualCopy, copyText, navigations, writes,
    validityChecks: () => validityChecks,
    submit() { let prevented = false; events.submit({ preventDefault() { prevented = true; } }); return prevented; },
    copy: () => buttonEvents.click(),
    input: name => events.input({ target: fields[name] }),
  };
}

(async () => {
  for (const values of [{ name: '  ' }, { brief: '\n\t ' }]) {
    const b = browser({ values });
    assert.equal(b.submit(), true);
    await b.copy();
    assert.equal(b.navigations.length, 0, 'blank required fields never open a draft');
    assert.equal(b.writes.length, 0, 'blank required fields never copy an enquiry');
    const name = Object.keys(values)[0];
    assert.ok(b.fields[name].error);
    b.fields[name].value = 'A corrected value';
    b.input(name);
    assert.equal(b.fields[name].error, '', 'editing clears a stale custom error');
    b.submit();
    assert.equal(b.navigations.length, 1, 'corrected fields can continue');
  }
  const rejected = browser({ nativeValid: false });
  rejected.submit();
  await rejected.copy();
  assert.equal(rejected.validityChecks(), 2, 'email, service and other native validation gate both actions');
  assert.equal(rejected.navigations.length + rejected.writes.length, 0);

  const valid = browser();
  assert.equal(valid.copyButton.hidden, false, 'copy action is enabled only after its handler is installed');
  assert.equal(valid.submit(), true);
  assert.equal(valid.navigations.length, 1);
  assert.equal(new URL(valid.navigations[0]).pathname, 'support@attahirlabs.com');
  assert.ok(new URL(valid.navigations[0]).searchParams.get('body').includes('visitor@example.com'));
  assert.match(valid.status.textContent, /should open a draft/);
  assert.doesNotMatch(valid.status.textContent, /(?:successfully sent|has been sent|enquiry received|submitted successfully)/i);
  assert.equal(valid.fields.brief.value, 'A useful website.', 'email handoff retains the enquiry for fallback copying');
  await valid.copy();
  assert.equal(valid.writes.length, 1);
  assert.ok(valid.writes[0].includes('A useful website.'));
  assert.match(valid.status.textContent, /Enquiry copied/);
  assert.equal(valid.manualCopy.hidden, true);

  for (const clipboard of ['failure', 'missing']) {
    const b = browser({ clipboard });
    await b.copy();
    assert.equal(b.writes.length, 0);
    assert.equal(b.navigations.length, 0, 'copy fallback never opens an email app');
    assert.equal(b.manualCopy.hidden, false);
    assert.ok(b.copyText.value.includes('A useful website.'));
    assert.ok(b.copyText.focused && b.copyText.selected, 'manual fallback is focused and ready to copy');
    assert.match(b.status.textContent, /could not copy/);
    assert.doesNotMatch(b.status.textContent, /Enquiry copied/);
  }
  console.log('Project enquiry: validated email drafts, fixed recipient, safe fields, native fallback, clipboard states and privacy passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
