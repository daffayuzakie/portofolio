/**
 * formValidation.js
 * Client-side-only validation with per-field inline errors, plus a
 * simulated submit (replace the TODO with a real request when you have
 * an endpoint — Formspree, a serverless function, your own backend, etc).
 */
export function initFormValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');

  const validators = {
    name: (value) => value.trim().length > 1 || 'Enter your name.',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address.',
    message: (value) => value.trim().length > 9 || 'A few more words would help.',
  };

  function validateField(field) {
    const wrapper = field.closest('.form-field');
    const errorEl = wrapper.querySelector('.field-error');
    const result = validators[field.name](field.value);
    const isValid = result === true;

    wrapper.classList.toggle('is-invalid', !isValid);
    errorEl.textContent = isValid ? '' : result;
    return isValid;
  }

  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    // Clear the error as soon as the field becomes valid again, without
    // waiting for another blur — feels far less punitive while typing.
    field.addEventListener('input', () => {
      if (field.closest('.form-field').classList.contains('is-invalid')) {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fields = Array.from(form.querySelectorAll('input, textarea'));
    const allValid = fields.map(validateField).every(Boolean);

    if (!allValid) {
      status.textContent = 'Please fix the highlighted fields.';
      status.dataset.state = 'error';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    status.textContent = '';
    delete status.dataset.state;

    try {
      // TODO: replace this simulated delay with a real request, e.g.:
      // const res = await fetch('https://your-endpoint', { method: 'POST', body: new FormData(form) });
      // if (!res.ok) throw new Error('Request failed');
      await new Promise((resolve) => setTimeout(resolve, 900));

      status.textContent = "Thanks — I'll get back to you soon.";
      status.dataset.state = 'success';
      form.reset();
    } catch (error) {
      status.textContent = 'Something went wrong — please try again.';
      status.dataset.state = 'error';
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}
