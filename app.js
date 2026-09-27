(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const telegram = /^[A-Za-z0-9_]{5,32}$/.test(config.telegram || '') ? config.telegram : 'LinofskiyWayyy';

  document.querySelectorAll('a[href="https://t.me/LinofskiyWayyy"]').forEach(link => {
    link.href = `https://t.me/${telegram}`;
    if (link.textContent.trim() === '@LinofskiyWayyy ↗') link.textContent = `@${telegram} ↗`;
  });

  const leadForm = document.querySelector('#lead-form');
  const leadStatus = document.querySelector('#lead-status');

  async function submitLead(form) {
    const submit = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      name: data.name,
      contact: data.contact,
      projectType: data.projectType,
      task: data.task,
      budget: data.budget,
      website: data.website,
      consent: data.consent === 'on'
    };

    submit.disabled = true;
    submit.innerHTML = 'Сохраняю заявку… <span>↗</span>';
    form.dataset.state = 'loading';
    leadStatus.textContent = 'Проверяю данные и сохраняю заявку.';

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Не удалось отправить заявку.');

      form.dataset.state = 'success';
      form.reset();
      submit.innerHTML = 'Заявка отправлена <span>✓</span>';
      leadStatus.textContent = `Спасибо! Заявка №${result.requestId} сохранена. Я свяжусь с вами по указанному контакту.`;
    } catch (error) {
      form.dataset.state = 'error';
      submit.disabled = false;
      submit.innerHTML = 'Попробовать снова <span>↗</span>';
      leadStatus.textContent = `${error.message} Можно написать напрямую в Telegram.`;
    }
  }

  leadForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!leadForm.reportValidity()) return;
    submitLead(leadForm);
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }), { threshold: .08 });
    document.querySelectorAll('.section-title,.project-meta,.process-grid li,.price-card').forEach(element => {
      element.classList.add('reveal');
      observer.observe(element);
    });
  }

  const caseVideo = document.querySelector('#case-motion');
  const caseToggle = document.querySelector('#case-motion-toggle');
  if (caseVideo && caseToggle) {
    caseToggle.addEventListener('click', () => {
      if (caseVideo.paused) caseVideo.play().catch(() => {});
      else caseVideo.pause();
    });
    caseVideo.addEventListener('play', () => {
      caseToggle.textContent = 'Пауза';
      caseToggle.setAttribute('aria-pressed', 'true');
    });
    caseVideo.addEventListener('pause', () => {
      caseToggle.textContent = 'Смотреть движение';
      caseToggle.setAttribute('aria-pressed', 'false');
    });
  }

  if (leadForm && document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'stage_website_request',
        title: 'Заполнить заявку на сайт',
        description: 'Заполняет видимую форму заявки. Не отправляет её: посетитель проверяет данные и нажимает кнопку сам.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 80 },
            contact: { type: 'string', minLength: 1, maxLength: 160 },
            projectType: { type: 'string', enum: ['Лендинг', 'Сайт компании', 'Редизайн сайта', 'Пока не определился'] },
            task: { type: 'string', minLength: 15, maxLength: 1800 },
            budget: { type: 'string', enum: ['25–40 тыс. ₽', '40–70 тыс. ₽', 'Более 70 тыс. ₽', 'Хочу обсудить'] }
          },
          required: ['name', 'contact', 'projectType', 'task'],
          additionalProperties: false
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(input) {
          for (const [name, value] of Object.entries(input || {})) {
            const field = leadForm.elements.namedItem(name);
            if (field && typeof value === 'string') field.value = value;
          }
          leadForm.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
          leadForm.querySelector('[name="name"]')?.focus();
          return { status: 'form_ready', submitted: false };
        }
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch {}
    addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
