(() => {
  const config = window.PORTFOLIO_CONFIG || {};
  const telegram = /^[A-Za-z0-9_]{5,32}$/.test(config.telegram || '') ? config.telegram : 'linovskiywork';
  const arrowUp = '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 19 19 5M7 5h12v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  document.querySelectorAll('a[href="https://t.me/linovskiywork"]').forEach(link => {
    link.href = `https://t.me/${telegram}`;
    if (link.textContent.trim() === '@linovskiywork' && link.firstChild?.nodeType === Node.TEXT_NODE) {
      link.firstChild.textContent = `@${telegram} `;
    }
  });

  const leadForm = document.querySelector('#lead-form');
  const leadStatus = document.querySelector('#lead-status');

  function submitLead(form) {
    const submit = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;

    const message = [
      'Здравствуйте! Хочу обсудить сайт.',
      `Имя: ${data.name}`,
      `Контакт: ${data.contact}`,
      `Формат: ${data.projectType}`,
      `Бюджет: ${data.budget}`,
      `Задача: ${data.task}`
    ].join('\n');
    const link = `https://t.me/${telegram}?text=${encodeURIComponent(message)}`;
    form.dataset.state = 'success';
    submit.innerHTML = `Открыть Telegram снова <span>${arrowUp}</span>`;
    leadStatus.textContent = 'Сообщение подготовлено в Telegram. Нажмите «Отправить» в чате — только после этого я его получу.';
    window.location.assign(link);
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
