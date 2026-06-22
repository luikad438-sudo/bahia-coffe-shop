/* ============================================================
   BAHIA'S COFFEE SHOP - script.js (v2)
   Nav, reveal, counters, scroll-spy, form, marquee a11y,
   image fallback, magnetic buttons, card tilt, hero parallax
   ============================================================ */

(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. Sticky navbar ---------- */
  const navbar = $('#navbar');
  const onScrollNav = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- 2. Mobile menu ---------- */
  const hamburger = $('#hamburger');
  const navLinks  = $('#nav-links');
  const closeMenu = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  };
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach((l) => l.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); });

  /* ---------- 3. Scroll reveal ---------- */
  const revealEls = $$('[data-reveal]');
  const revealVisibleNow = () => {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        el.classList.add('visible');
      }
    });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }
  requestAnimationFrame(revealVisibleNow);
  window.addEventListener('load', revealVisibleNow, { once: true });
  window.setTimeout(revealVisibleNow, 300);

  /* ---------- 4. Animated counters ---------- */
  const counters = $$('.stat-number[data-count]');
  const runCounter = (el) => {
    const target   = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix   = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const duration = 1600, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((el) => {
      const d = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = parseFloat(el.dataset.count).toFixed(d) + (el.dataset.suffix || '');
    });
  }

  /* ---------- 5. Active nav link (scroll spy) ---------- */
  const sections = $$('section[id]');
  const anchors  = $$('.nav-link');
  const linkFor  = (id) => anchors.find((a) => a.getAttribute('href') === `#${id}`);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          anchors.forEach((a) => a.classList.remove('active'));
          const a = linkFor(e.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- 6. Contact form ---------- */
  const form = $('#contact-form');
  const successMsg = $('#form-success');
  const validators = {
    name:    (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    phone:   (v) => (/^[+]?[\d\s().-]{7,}$/.test(v.trim()) ? '' : 'Please enter a valid phone number.'),
    message: (v) => (v.trim().length >= 5 ? '' : 'Please enter a short message.'),
  };
  const setState = (field, err) => {
    const row = field.closest('.form-row');
    const eEl = $(`[data-error-for="${field.id}"]`);
    if (err) { row.classList.add('invalid'); field.setAttribute('aria-invalid', 'true'); if (eEl) eEl.textContent = err; }
    else     { row.classList.remove('invalid'); field.removeAttribute('aria-invalid'); if (eEl) eEl.textContent = ''; }
    return !err;
  };
  const validate = (f) => (validators[f.name] ? setState(f, validators[f.name](f.value)) : true);

  if (form) {
    const fields = $$('input, textarea', form);
    const submitBtn = $('button[type="submit"]', form);
    const submitDefault = submitBtn ? submitBtn.textContent : '';
    fields.forEach((f) => {
      f.addEventListener('blur', () => validate(f));
      f.addEventListener('input', () => { if (f.closest('.form-row').classList.contains('invalid')) validate(f); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true, firstBad = null;
      fields.forEach((f) => { const v = validate(f); if (!v && !firstBad) firstBad = f; ok = ok && v; });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      successMsg.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Sending...';
      }
      window.clearTimeout(form._submitT);
      form._submitT = window.setTimeout(() => {
        successMsg.hidden = false;
        form.reset();
        fields.forEach((f) => setState(f, ''));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = submitDefault;
        }
        window.clearTimeout(form._t);
        form._t = window.setTimeout(() => { successMsg.hidden = true; }, 6000);
      }, reduceMotion ? 0 : 450);
    });
  }

  /* ---------- 7. Back to top ---------- */
  const toTop = $('#to-top');
  const onScrollTop = () => toTop.classList.toggle('show', window.scrollY > 600);
  window.addEventListener('scroll', onScrollTop, { passive: true });
  onScrollTop();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- 8. Image fallback (never show a broken-image icon) ---------- */
  $$('img.photo').forEach((img) => {
    const fail = () => { img.classList.add('img-broken'); img.removeAttribute('src'); };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail(); // already failed before listener attached
  });

  /* ---------- 9. Magnetic buttons (desktop, motion-safe) ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      const strength = 0.3;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    /* ---------- 10. Card tilt ---------- */
    $$('.tilt').forEach((card) => {
      const max = 7; // deg
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- 11. Hero parallax ---------- */
  const heroPhoto = $('#heroPhoto');
  if (heroPhoto && !reduceMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 600);
        heroPhoto.style.transform = `translateY(${y * 0.06}px) scale(1.04)`;
        ticking = false;
      });
    }, { passive: true });
  }
})();
