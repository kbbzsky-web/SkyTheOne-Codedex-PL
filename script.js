// ============================
// Interaktionen und Effekte – sanfte Verbesserungen
// ============================

(() => {
  // Kopfbereich beim Scrollen anpassen (Hintergrund und Schatten)
  const header = document.getElementById('site-header');
  const onScroll = () => {
    const s = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', s > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Sanftes Scrollen mit Versatz, damit der feste Kopfbereich nichts überdeckt
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length === 1) return; // nur "#"
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const headerRect = header.getBoundingClientRect();
    const offset = headerRect.height + 8; // kleiner zusätzlicher Abstand
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    // Fokus nach dem Scrollen setzen (Barrierefreiheit)
    setTimeout(() => target.setAttribute('tabindex', '-1'), 0);
    setTimeout(() => target.focus({ preventScroll: true }), 400);
  });

  // Elemente beim Scrollen sanft einblenden
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          obs.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Ersatzlösung, falls Beobachter nicht unterstützt
    revealEls.forEach((el) => el.classList.add('reveal-in'));
  }

  // Formular: einfache Prüfung und Bestätigungs-Hinweis
  const form = document.getElementById('bestellformular');
  const toast = document.getElementById('toast');
  const submitBtn = document.getElementById('submitBtn');

  // Feld: Bestellnummer – eigene Fehlermeldung in Deutsch
  const orderNumberInput = document.getElementById('orderNumber');
  const orderNumberError = document.getElementById('orderNumberError');

  function validateOrderNumber() {
    if (!orderNumberInput) return true;
    const raw = orderNumberInput.value.trim();
    const n = Number(raw);

    const invalid = !raw || !Number.isFinite(n) || n < 45 || n > 60;

    if (invalid) {
      const msg = 'Bitte eine Zahl zwischen 45 und 60 eingeben.';
      orderNumberInput.setCustomValidity(msg);
      if (orderNumberError) orderNumberError.textContent = msg;
      return false;
    } else {
      orderNumberInput.setCustomValidity('');
      if (orderNumberError) orderNumberError.textContent = '';
      return true;
    }
  }

  if (orderNumberInput) {
    // Bei Eingabe und Verlassen des Feldes prüfen
    orderNumberInput.addEventListener('input', validateOrderNumber);
    orderNumberInput.addEventListener('blur', () => {
      validateOrderNumber();
      orderNumberInput.reportValidity();
    });
  }

  function showToast(message = 'Aktion erfolgreich!') {
    toast.textContent = message;
    toast.classList.add('show');
    // Automatisches Ausblenden
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function disableSubmit(disabled) {
    submitBtn.disabled = disabled;
    submitBtn.style.opacity = disabled ? 0.7 : 1;
    submitBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  if (form) {
    // Namen aus lokalem Speicher vorbefüllen (kleiner Komfort)
    const savedName = localStorage.getItem('revweb_name');
    if (savedName) {
      const nameEl = form.querySelector('#name');
      if (nameEl && !nameEl.value) nameEl.value = savedName;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Eigene Prüfung für Bestellnummer zuerst ausführen
      const orderOk = validateOrderNumber();

      // Browserprüfung aktivieren
      if (!orderOk || !form.checkValidity()) {
        // Fehlermeldungen anzeigen
        if (orderNumberInput && !orderOk) orderNumberInput.reportValidity();
        form.reportValidity();
        return;
      }

      disableSubmit(true);

      // Senden nur simulieren; kann später durch echte Schnittstelle ersetzt werden
      const formData = new FormData(form);
      const name = (formData.get('name') || '').toString().trim();
      localStorage.setItem('revweb_name', name);

      setTimeout(() => {
        showToast(`Danke${name ? ', ' + name : ''}! Deine Bestellung ist eingegangen.`);
        form.reset();
        // nach Reset erneut prüfen, um Fehlermeldungen zu leeren
        validateOrderNumber();
        disableSubmit(false);
      }, 900);
    });
  }
})();