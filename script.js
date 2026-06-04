/* ==============================================
   OBSERVATORIO - script.js
   Header scroll, menú móvil, animaciones,
   formulario de contacto y newsletter
   ============================================== */

(function () {
  'use strict';

  /* ---------- Year en footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header con sombra al hacer scroll ---------- */
  const header = document.getElementById('siteHeader');
  function onScroll() {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Animaciones suaves al hacer scroll (IntersectionObserver) ---------- */
  // Sólo se aplica si el navegador soporta IO y el usuario no prefiere
  // movimiento reducido. Fallback: contenido siempre visible.
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReduced) {
    const revealEls = document.querySelectorAll(
      '.section-head, .pillar, .member-card, .pub-card, .consejo-intro, .consejo-members, .disclaimer-box, .contacto-left, .contacto-form'
    );
    revealEls.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

    revealEls.forEach(el => io.observe(el));

    // Failsafe: si algo no se mostró en 4 segundos, mostrarlo de todos modos
    setTimeout(() => {
      revealEls.forEach(el => el.classList.add('visible'));
    }, 4000);
  }

  /* ---------- Formulario de contacto ---------- */
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');

  if (form && feedback) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        nombre: form.nombre.value.trim(),
        institucion: form.institucion.value.trim(),
        correo: form.correo.value.trim(),
        asunto: form.asunto.value.trim(),
        mensaje: form.mensaje.value.trim()
      };

      // Validación simple
      if (!data.nombre || !data.correo || !data.asunto || !data.mensaje) {
        showFeedback('error', 'Por favor completa todos los campos requeridos.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
        showFeedback('error', 'El correo electrónico no parece válido.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';

      // Enviar vía Netlify Forms
      let sentByPhp = false;
      try {
        const resp = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'form-name': 'contacto',
            nombre: data.nombre,
            institucion: data.institucion,
            correo: data.correo,
            asunto: data.asunto,
            mensaje: data.mensaje
          }).toString()
        });
        if (resp.ok) sentByPhp = true;
      } catch (err) {
        sentByPhp = false;
      }

      if (sentByPhp) {
        showFeedback('success',
          'Gracias por contactar al Observatorio sobre Derecho de Género y Seguridad Jurídica. Tu mensaje ha sido recibido correctamente.'
        );
        form.reset();
      } else {
        // Respaldo: abrir cliente de correo con mailto a ambas destinatarias
        const subject = encodeURIComponent('[Observatorio] ' + data.asunto);
        const bodyText =
          'Nombre: ' + data.nombre + '\n' +
          'Institución: ' + (data.institucion || '—') + '\n' +
          'Correo: ' + data.correo + '\n\n' +
          'Mensaje:\n' + data.mensaje;
        const body = encodeURIComponent(bodyText);
        const mailto =
          'mailto:a_marquez@uadec.edu.mx,margarita-guajardo@uadec.edu.mx' +
          '?subject=' + subject + '&body=' + body;

        window.location.href = mailto;
        showFeedback('success',
          'Gracias por contactar al Observatorio sobre Derecho de Género y Seguridad Jurídica. Tu mensaje ha sido recibido correctamente.'
        );
        form.reset();
      }

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  }

  function showFeedback(type, text) {
    if (!feedback) return;
    feedback.className = 'form-feedback show ' + type;
    feedback.textContent = text;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- Newsletter → Formspree ---------- */
  window.handleNewsletter = async function (e) {
    e.preventDefault();
    const form  = e.target;
    const input = form.querySelector('input[type="email"]');
    const msg   = document.getElementById('newsletterMsg');
    const btn   = form.querySelector('button');

    if (!input || !input.value) return false;

    btn.disabled = true;
    if (msg) { msg.textContent = 'Enviando…'; msg.style.color = 'rgba(255,255,255,0.7)'; }

    try {
      const resp = await fetch('https://formspree.io/f/mzdqbyad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: input.value })
      });

      if (resp.ok) {
        if (msg) { msg.textContent = '¡Gracias! Te avisaremos de cada nueva publicación.'; msg.style.color = 'var(--gold-light)'; }
        input.value = '';
      } else {
        if (msg) { msg.textContent = 'Hubo un error. Intenta de nuevo.'; msg.style.color = '#ffaaaa'; }
      }
    } catch (err) {
      if (msg) { msg.textContent = 'Sin conexión. Intenta de nuevo.'; msg.style.color = '#ffaaaa'; }
    }

    btn.disabled = false;
    return false;
  };

})();
