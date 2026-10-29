(() => {
  'use strict';

  const services = Object.freeze({
    'website-design': 'Website design',
    'shopify-setup': 'Shopify store setup',
    'storefront-redesign': 'Storefront redesign',
    other: 'Something else / help choosing',
  });
  const limits = Object.freeze({ name: 100, email: 254, business: 120, website: 400, budget: 100, timeline: 100, brief: 1500 });

  function uriComponent(value) {
    // A length bound can cut a surrogate pair; replace isolated halves before encoding.
    let safe = '';
    for (const character of value) {
      const point = character.codePointAt(0);
      safe += point >= 0xd800 && point <= 0xdfff ? '\uFFFD' : character;
    }
    return encodeURIComponent(safe);
  }

  function projectDraft(values) {
    const value = name => String(values[name] || '').trim().slice(0, limits[name] || 100);
    const singleLine = name => value(name).replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ');
    const service = Object.prototype.hasOwnProperty.call(services, values.service) ? services[values.service] : services.other;
    const body = [
      'Hello Attahir Labs,',
      '',
      'I would like to discuss a project.',
      '',
      `Name: ${singleLine('name')}`,
      `Email: ${singleLine('email')}`,
      `Service: ${service}`,
      `Business: ${singleLine('business') || 'Not provided'}`,
      `Current website: ${singleLine('website') || 'Not provided'}`,
      `Budget range: ${singleLine('budget') || 'Not sure yet'}`,
      `Ideal timing: ${singleLine('timeline') || 'Flexible / not provided'}`,
      '',
      'Project brief:',
      value('brief').replace(/\u0000/g, ''),
    ].join('\n');
    const subject = `Website project enquiry — ${service}`;
    return {
      body,
      url: `mailto:support@attahirlabs.com?subject=${uriComponent(subject)}&body=${uriComponent(body)}`,
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { projectDraft };
  if (typeof document === 'undefined') return;

  const form = document.querySelector('[data-project-inquiry]');
  if (!form) return;
  const status = form.querySelector('[data-inquiry-status]');
  const copyButton = form.querySelector('[data-inquiry-copy]');
  const manualCopy = form.querySelector('[data-inquiry-manual]');
  const copyText = form.querySelector('[data-inquiry-copy-text]');
  const draftFromForm = () => projectDraft(Object.fromEntries(new FormData(form)));
  const validate = () => {
    for (const name of ['name', 'brief']) {
      const field = form.elements.namedItem(name);
      field.setCustomValidity(field.value.trim() ? '' : name === 'name' ? 'Please enter your name.' : 'Please tell us a little about your project.');
    }
    return form.reportValidity();
  };
  form.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate()) return;
    const draft = draftFromForm();
    status.textContent = 'Your email app should open a draft. Review and send it there. If it does not open, use “Copy enquiry instead”.';
    window.location.href = draft.url;
  });

  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    if (!validate()) return;
    const draft = draftFromForm();
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft.body);
      status.textContent = 'Enquiry copied. Paste it into an email to support@attahirlabs.com, then review and send it.';
    } catch (_) {
      manualCopy.hidden = false;
      copyText.value = draft.body;
      copyText.focus();
      copyText.select();
      status.textContent = 'Your browser could not copy the enquiry automatically. Copy the selected text below and email it to support@attahirlabs.com.';
    }
  });
})();
