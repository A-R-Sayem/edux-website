/**
 * EduX — shared site script
 * Renders the header, footer, founders, courses, "why" cards and contact
 * blocks from js/config.js so the same data is never copied between pages.
 *
 * A page opts in with placeholders such as:
 *   <div data-render="courses"></div>
 *   <div data-render="founders"></div>
 * and tells us how deep it is with <body data-root=""> or <body data-root="../">.
 */
(function () {
  'use strict';

  var C = window.EDUX_CONFIG;
  if (!C) {
    console.error('EduX: js/config.js failed to load.');
    return;
  }
  var ROOT = document.body.getAttribute('data-root') || '';

  /* ---------- helpers ---------- */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function url(path) {
    return /^(https?:|mailto:|tel:|#)/.test(path) ? path : ROOT + path;
  }
  function enabledClasses() {
    return C.classes.filter(function (c) { return c.enabled; });
  }
  function enrollUrl(classId) {
    return url(C.enrollHref) + (classId ? '?class=' + encodeURIComponent(classId) : '');
  }
  function telHref(phone) { return 'tel:' + String(phone).replace(/[^\d+]/g, ''); }
  function waHref(num) { return 'https://wa.me/' + String(num).replace(/\D/g, ''); }

  var ICONS = {
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    rocket: '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2M14 10l-4 4M15 3c3.5 0 6 .5 6 .5s.5 2.5.5 6c0 4.5-4.5 8-8 9l-4.5-4.5C10 10.5 11 3 15 3Z"/><circle cx="15.5" cy="8.5" r="1.3"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  function wordmark() {
    if (C.brand.logoImage) {
      return '<img class="brand__img" src="' + esc(url(C.brand.logoImage)) + '" alt="' + esc(C.brand.name) + '" height="32">';
    }
    return '<span class="wordmark" aria-label="' + esc(C.brand.name) + '">Edu<span>X</span></span>';
  }

  function isCurrent(href) {
    var here = location.pathname.replace(/\/index\.html$/, '/');
    var target = href.split('#')[0];
    if (href.indexOf('#') !== -1) return false; // section links are never "current page"
    if (target === 'index.html') return /\/$/.test(here) || /\/index\.html$/.test(location.pathname);
    return here.slice(-target.length) === target;
  }

  /* ---------- header ---------- */
  function renderHeader(el) {
    var links = C.nav.map(function (item) {
      var cur = isCurrent(item.href) ? ' aria-current="page"' : '';
      return '<li><a href="' + esc(url(item.href)) + '"' + cur + '>' + esc(item.label) + '</a></li>';
    }).join('');
    el.innerHTML =
      '<div class="container nav">' +
      '<a class="brand" href="' + esc(url('index.html')) + '" aria-label="' + esc(C.brand.name) + ' home">' + wordmark() + '</a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu">' +
      '<span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span><span class="nav-toggle__bar"></span></button>' +
      '<nav id="primary-nav" class="nav-menu" aria-label="Primary">' +
      '<ul class="nav-list">' + links + '</ul>' +
      '<a class="btn btn-primary nav-cta" href="' + esc(enrollUrl()) + '">Enroll Now</a>' +
      '</nav></div>';

    var toggle = el.querySelector('.nav-toggle');
    var menu = el.querySelector('.nav-menu');
    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    }
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });

    function onScroll() { el.classList.toggle('is-scrolled', window.scrollY > 12); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- contact items (shared by contact section + footer) ---------- */
  function contactItems() {
    var k = C.contact, items = [];
    if (k.address) items.push({ icon: 'pin', label: 'Location', value: esc(k.address) });
    if (k.phone) items.push({ icon: 'phone', label: 'Phone', value: '<a href="' + esc(telHref(k.phone)) + '">' + esc(k.phone) + '</a>' });
    if (k.whatsapp) items.push({ icon: 'chat', label: 'WhatsApp', value: '<a href="' + esc(waHref(k.whatsapp)) + '" rel="noopener" target="_blank">Message us on WhatsApp</a>' });
    if (k.email) items.push({ icon: 'mail', label: 'Email', value: '<a href="mailto:' + esc(k.email) + '">' + esc(k.email) + '</a>' });
    return items;
  }
  function socialLinks() {
    var names = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok' };
    return Object.keys(names).filter(function (key) { return C.social[key]; }).map(function (key) {
      return '<li><a class="chip" href="' + esc(C.social[key]) + '" target="_blank" rel="noopener noreferrer">' + names[key] + '</a></li>';
    }).join('');
  }

  /* ---------- footer ---------- */
  function renderFooter(el) {
    var quick = C.nav.map(function (i) { return '<li><a href="' + esc(url(i.href)) + '">' + esc(i.label) + '</a></li>'; }).join('');
    var courses = enabledClasses().map(function (c) { return '<li><a href="' + esc(url('pages/courses.html')) + '#' + esc(c.id) + '">' + esc(c.title) + '</a></li>'; }).join('');
    var social = socialLinks();
    var contact = contactItems().map(function (i) { return '<li>' + i.value + '</li>'; }).join('');
    el.innerHTML =
      '<div class="container footer__grid">' +
      '<div class="footer__brand"><a class="brand" href="' + esc(url('index.html')) + '" aria-label="' + esc(C.brand.name) + ' home">' + wordmark() + '</a>' +
      '<p>' + esc(C.brand.tagline) + '</p>' +
      (social ? '<ul class="chips" aria-label="Social media">' + social + '</ul>' : '') + '</div>' +
      '<div><h2 class="footer__title">Quick links</h2><ul class="footer__list">' + quick + '</ul></div>' +
      '<div><h2 class="footer__title">Courses</h2><ul class="footer__list">' + courses + '<li><a href="' + esc(enrollUrl()) + '">Enroll now</a></li></ul></div>' +
      '<div><h2 class="footer__title">Contact</h2><ul class="footer__list">' + contact + '</ul></div>' +
      '</div>' +
      '<div class="container footer__bar"><p>&copy; ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + '. All rights reserved.</p></div>';
  }

  /* ---------- courses ---------- */
  function detail(label, value) {
    var shown = value && value.length ? value : 'Contact us for details';
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(shown) + '</dd></div>';
  }
  function courseCard(c) {
    var subjects = c.subjects && c.subjects.length ? c.subjects.join(', ') : '';
    var batches = c.batches && c.batches.length ? c.batches.map(function (b) { return b.label; }).join(', ') : '';
    var subjectLine = subjects
      ? '<p class="course__subjects"><strong>Subjects:</strong> ' + esc(subjects) + '</p>'
      : '<p class="course__subjects muted">Subjects: contact us for details.</p>';
    return '<article class="card course reveal" id="' + esc(c.id) + '">' +
      '<span class="badge">' + esc(c.badge) + '</span>' +
      '<p class="course__level">' + esc(c.level) + '</p>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p>' + esc(c.description) + '</p>' + subjectLine +
      '<details class="course__more"><summary>Course details</summary>' +
      '<dl>' + detail('Subjects', subjects) + detail('Batches', batches) + detail('Schedule', c.schedule) + detail('Fee', c.fee) + '</dl></details>' +
      '<a class="btn btn-primary" href="' + esc(enrollUrl(c.id)) + '">Enroll in ' + esc(c.level) + '</a>' +
      '</article>';
  }
  function renderCourses(el) {
    var list = enabledClasses();
    el.innerHTML = list.length
      ? list.map(courseCard).join('')
      : '<p class="muted">Programs will be announced soon. Please check back or contact us.</p>';
  }

  /* ---------- founders ---------- */
  function founderCard(f, index) {
    var lazy = index > 0 ? ' loading="lazy"' : '';
    return '<article class="card founder reveal">' +
      '<div class="founder__photo"><img src="' + esc(url(f.photo)) + '" alt="' + esc(f.alt) + '" width="360" height="360"' + lazy + ' decoding="async"></div>' +
      '<h3>' + esc(f.name) + '</h3>' +
      '<p class="founder__field"><span>' + esc(f.fieldLabel) + '</span>' + esc(f.field) + '</p>' +
      '<p class="founder__inst">' + esc(f.institution) + '</p>' +
      (f.credential ? '<p class="founder__cred">' + esc(f.credential) + '</p>' : '') +
      '</article>';
  }
  function renderFounders(el) { el.innerHTML = C.founders.map(founderCard).join(''); }

  /* ---------- why cards ---------- */
  function renderWhy(el) {
    el.innerHTML = C.why.map(function (w) {
      return '<article class="card why reveal"><span class="why__icon">' + icon(w.icon) + '</span><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p></article>';
    }).join('');
  }

  /* ---------- philosophy ---------- */
  function renderPhilosophy(el) {
    el.innerHTML = C.philosophy.map(function (p) {
      return '<li class="phil__step reveal"><span class="phil__num">' + esc(p.step) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></li>';
    }).join('');
  }

  /* ---------- contact section ---------- */
  function renderContact(el) {
    var items = contactItems().map(function (i) {
      return '<li class="contact__item">' + icon(i.icon) + '<div><span class="contact__label">' + esc(i.label) + '</span><p>' + i.value + '</p></div></li>';
    }).join('');
    var social = socialLinks();
    var phoneMissing = !C.contact.phone && !C.contact.whatsapp && !C.contact.email;
    el.innerHTML =
      '<ul class="contact__list">' + items + '</ul>' +
      (phoneMissing ? '<p class="muted contact__note">Phone and email details are coming soon. In the meantime, send an enrollment request and our team will contact you.</p>' : '') +
      (social ? '<ul class="chips" aria-label="Social media">' + social + '</ul>' : '') +
      '<div class="contact__actions">' +
      (C.contact.mapUrl ? '<a class="btn btn-ghost" href="' + esc(C.contact.mapUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(C.contact.mapLabel || 'Open in Google Maps') + '</a>' : '') +
      '<a class="btn btn-primary" href="' + esc(enrollUrl()) + '">Enroll Now</a></div>';
  }

  /* ---------- link rewriting for static buttons ---------- */
  function wireStaticLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-href]'), function (a) {
      var target = a.getAttribute('data-href');
      a.setAttribute('href', target === 'enroll' ? enrollUrl() : url(target));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-brand-wordmark]'), function (n) { n.innerHTML = wordmark(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-tagline]'), function (n) { n.textContent = C.brand.tagline; });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(items, function (n) { io.observe(n); });
  }

  /* ---------- boot ---------- */
  var renderers = {
    header: renderHeader, footer: renderFooter, courses: renderCourses,
    founders: renderFounders, why: renderWhy, philosophy: renderPhilosophy, contact: renderContact,
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-render]'), function (el) {
    var fn = renderers[el.getAttribute('data-render')];
    if (fn) fn(el);
  });
  wireStaticLinks();
  initReveal();

  // Expose small helpers for enrollment.js
  window.EduX = { esc: esc, url: url, enabledClasses: enabledClasses, enrollUrl: enrollUrl };
})();
