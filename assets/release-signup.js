(() => {
  document.querySelectorAll('[data-release-signup]').forEach(form => {
    const status = form.querySelector('[role="status"]');
    const button = form.querySelector('button');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      button.disabled = true;
      button.textContent = 'Saving…';
      status.textContent = '';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(form.action, {
          method: 'POST', body: new URLSearchParams(new FormData(form)),
          signal: controller.signal, credentials: 'same-origin'
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.message || 'Please try again later.');
        status.textContent = result.message;
        form.reset();
      } catch (error) {
        status.textContent = error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError
          ? 'We couldn’t confirm your signup. Please try again.' : error.message;
      } finally {
        clearTimeout(timeout);
        button.disabled = false;
        button.textContent = 'Notify me at launch';
      }
    });
  });
})();
