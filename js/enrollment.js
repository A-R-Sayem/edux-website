/**
 * EduX — enrollment form
 * ------------------------------------------------------------------
 * What this file does:
 *   1. Builds the Class / Subject / Batch controls from js/config.js
 *   2. Validates the form in the browser (friendly, instant feedback)
 *   3. Sends the request to the Google Apps Script web app
 *   4. Keeps what the visitor typed if something goes wrong
 *
 * IMPORTANT: browser validation is only for convenience. The real checks
 * happen again on the server in backend/Code.gs.
 *
 * How we talk to Apps Script (see README "Why text/plain?"):
 *   We POST JSON as Content-Type "text/plain". That counts as a CORS
 *   "simple request", so the browser does not send a pre-flight OPTIONS
 *   request (which Apps Script cannot answer). The web app's response is
 *   readable by the page, so we can show a real success/failure message
 *   instead of guessing.
 */
(function () {
  'use strict';

  var C = window.EDUX_CONFIG;
  var form = document.getElementById('enroll-form');
  if (!C || !form) return;

  var E = C.enrollment;
  var DRAFT_KEY = 'edux:enroll-draft:v1';
  var FIELD_IDS = ['studentName', 'studentPhone', 'guardianName', 'guardianPhone', 'classLevel', 'batch', 'school', 'message'];

  var el = {
    alert: document.getElementById('form-alert'),
    submit: document.getElementById('submit-btn'),
    label: document.getElementById('submit-label'),
    classSel: document.getElementById('classLevel'),
    batchField: document.getElementById('batch-field'),
    batchSel: document.getElementById('batch'),
    subjectsField: document.getElementById('subjects-field'),
    subjectsList: document.getElementById('subjects-list'),
    message: document.getElementById('message'),
    count: document.getElementById('message-count'),
    honeypot: document.getElementById('website'),
    consent: document.getElementById('consent'),
    success: document.getElementById('success-panel'),
    ref: document.getElementById('success-ref'),
  };

  var state = {
    submitting: false,
    done: false,
    // One token per enrollment attempt. If the network drops and the visitor
    // taps "Submit" again, the server recognises the token and does NOT
    // create a duplicate row.
    token: makeToken(),
    openedAt: Date.now(),
  };

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */
  function makeToken() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      var a = new Uint8Array(16);
      crypto.getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) {
      return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    }
  }
  function byId(id) { return document.getElementById(id); }
  function activeClasses() { return C.classes.filter(function (c) { return c.enabled; }); }
  function findClass(value) {
    return activeClasses().filter(function (c) { return c.value === value; })[0] || null;
  }
  function toAsciiDigits(s) {
    // Accept Bangla digits too (e.g. ০১৭১২৩৪৫৬৭৮)
    return String(s).replace(/[০-৯]/g, function (d) { return String(d.charCodeAt(0) - 0x09E6); });
  }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /**
   * Bangladesh mobile numbers. Accepts 01XXXXXXXXX, +8801XXXXXXXXX,
   * 8801XXXXXXXXX (spaces, dashes and brackets ignored). Operator digit 3-9.
   * Returns the local 11-digit form (01XXXXXXXXX) or null.
   */
  function normalizePhone(value) {
    var s = toAsciiDigits(value).replace(/[\s\-().]/g, '');
    if (/^(\+?880)1[3-9]\d{8}$/.test(s)) return '0' + s.replace(/^\+?880/, '');
    if (/^01[3-9]\d{8}$/.test(s)) return s;
    return null;
  }

  /* ------------------------------------------------------------------
     Build the dynamic controls from config
  ------------------------------------------------------------------ */
  function buildClassOptions() {
    activeClasses().forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.value;
      o.textContent = c.level + (c.badge ? ' — ' + c.badge : '');
      el.classSel.appendChild(o);
    });
  }

  function buildDependentControls(keepSubjects) {
    var cls = findClass(el.classSel.value);
    var previous = keepSubjects || [];

    // Subjects (only if confirmed subjects exist for this class)
    el.subjectsList.innerHTML = '';
    var subjects = cls && cls.subjects ? cls.subjects : [];
    el.subjectsField.hidden = subjects.length === 0;
    subjects.forEach(function (name, i) {
      var label = document.createElement('label');
      label.className = 'check';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'subjects';
      input.value = name;
      input.id = 'subject-' + i;
      input.checked = previous.indexOf(name) !== -1;
      var span = document.createElement('span');
      span.textContent = name;
      label.appendChild(input);
      label.appendChild(span);
      el.subjectsList.appendChild(label);
    });

    // Batch (only if batches are configured for this class)
    var batches = cls && cls.batches ? cls.batches : [];
    var chosen = el.batchSel.value;
    while (el.batchSel.options.length > 1) el.batchSel.remove(1);
    batches.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.value;
      o.textContent = b.label;
      el.batchSel.appendChild(o);
    });
    el.batchSel.value = batches.some(function (b) { return b.value === chosen; }) ? chosen : '';
    el.batchField.hidden = batches.length === 0;
  }

  /* ------------------------------------------------------------------
     Reading the form
  ------------------------------------------------------------------ */
  function selectedSubjects() {
    return Array.prototype.map.call(el.subjectsList.querySelectorAll('input:checked'), function (i) { return i.value; });
  }
  function collect() {
    return {
      studentName: clean(byId('studentName').value),
      studentPhone: byId('studentPhone').value,
      guardianName: clean(byId('guardianName').value),
      guardianPhone: byId('guardianPhone').value,
      classLevel: el.classSel.value,
      subjects: selectedSubjects(),
      school: clean(byId('school').value),
      batch: el.batchSel.value,
      message: el.message.value.replace(/\r\n/g, '\n').trim(),
      consent: el.consent.checked,
    };
  }

  /* ------------------------------------------------------------------
     Validation
  ------------------------------------------------------------------ */
  function validate(d) {
    var err = {};
    var nameOk = function (n) { return n.length >= 2 && n.length <= 80 && /[A-Za-zঀ-৿]/.test(n); };

    if (!d.studentName) err.studentName = "Please enter the student's full name.";
    else if (!nameOk(d.studentName)) err.studentName = 'Please enter a valid name (2–80 characters, with letters).';

    if (!clean(d.studentPhone)) err.studentPhone = "Please enter the student's phone number.";
    else if (!normalizePhone(d.studentPhone)) err.studentPhone = 'Enter a valid Bangladesh mobile number, like 01XXXXXXXXX or +8801XXXXXXXXX.';

    if (!d.guardianName) err.guardianName = "Please enter the guardian's name.";
    else if (!nameOk(d.guardianName)) err.guardianName = 'Please enter a valid name (2–80 characters, with letters).';

    if (!clean(d.guardianPhone)) err.guardianPhone = "Please enter the guardian's phone number.";
    else if (!normalizePhone(d.guardianPhone)) err.guardianPhone = 'Enter a valid Bangladesh mobile number, like 01XXXXXXXXX or +8801XXXXXXXXX.';

    var cls = findClass(d.classLevel);
    if (!d.classLevel) err.classLevel = 'Please choose a class.';
    else if (!cls) err.classLevel = 'Please choose one of the listed classes.';

    if (cls && cls.subjects && cls.subjects.length && d.subjects.length === 0) err.subjects = 'Please choose at least one subject.';
    if (cls && cls.batches && cls.batches.length && d.batch &&
        !cls.batches.some(function (b) { return b.value === d.batch; })) err.batch = 'Please choose one of the listed batches.';

    if (d.school.length > 120) err.school = 'Please keep this under 120 characters.';
    if (d.message.length > E.messageMaxLength) err.message = 'Please keep your message under ' + E.messageMaxLength + ' characters.';
    if (!d.consent) err.consent = 'Please tick the box so we can contact you about enrollment.';
    return err;
  }

  function fieldWrap(name) { return form.querySelector('[data-field="' + name + '"]'); }
  function setError(name, message) {
    var wrap = fieldWrap(name);
    if (!wrap) return;
    var msg = byId(name + '-error');
    wrap.classList.toggle('has-error', !!message);
    if (msg) msg.textContent = message || '';
    var ctrl = wrap.querySelector('input:not([type=checkbox]), select, textarea') || wrap.querySelector('input[type=checkbox]');
    if (ctrl) {
      if (message) ctrl.setAttribute('aria-invalid', 'true');
      else ctrl.removeAttribute('aria-invalid');
    }
  }
  var ALL_NAMES = ['studentName', 'studentPhone', 'guardianName', 'guardianPhone', 'classLevel', 'subjects', 'batch', 'school', 'message', 'consent'];
  function showErrors(errors) {
    ALL_NAMES.forEach(function (n) { setError(n, errors[n] || ''); });
  }
  function focusFirst(errors) {
    for (var i = 0; i < ALL_NAMES.length; i++) {
      var n = ALL_NAMES[i];
      if (errors[n]) {
        var wrap = fieldWrap(n);
        var ctrl = wrap && wrap.querySelector('input, select, textarea');
        if (ctrl) { ctrl.focus(); if (ctrl.scrollIntoView) ctrl.scrollIntoView({ block: 'center' }); }
        return;
      }
    }
  }
  // moveFocus=false when a field already received focus (screen readers still hear role="alert").
  function showBanner(message, moveFocus) {
    el.alert.textContent = message;
    el.alert.hidden = false;
    if (moveFocus === false) return;
    if (el.alert.scrollIntoView) el.alert.scrollIntoView({ block: 'center' });
    el.alert.focus();
  }
  function clearBanner() { el.alert.hidden = true; el.alert.textContent = ''; }

  // Validate a single field when the visitor leaves it (not while typing)
  FIELD_IDS.forEach(function (id) {
    var node = byId(id);
    if (!node) return;
    node.addEventListener('blur', function () {
      if (state.submitting) return;
      var errs = validate(collect());
      if (node.value || fieldWrap(id).classList.contains('has-error')) setError(id, errs[id] || '');
    });
    var evt = node.tagName === 'SELECT' ? 'change' : 'input';
    node.addEventListener(evt, function () { if (fieldWrap(id).classList.contains('has-error')) setError(id, validate(collect())[id] || ''); });
  });
  el.consent.addEventListener('change', function () { if (el.consent.checked) setError('consent', ''); });
  el.subjectsList.addEventListener('change', function () { if (selectedSubjects().length) setError('subjects', ''); });

  /* ------------------------------------------------------------------
     Draft persistence (survives a failed submit or an accidental refresh)
  ------------------------------------------------------------------ */
  function saveDraft() {
    try {
      var d = collect();
      delete d.consent;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) { /* storage blocked: fine, the form itself still keeps values */ }
  }
  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } }
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  /* ------------------------------------------------------------------
     Submitting
  ------------------------------------------------------------------ */
  function setLoading(on) {
    state.submitting = on;
    el.submit.disabled = on;
    el.submit.setAttribute('aria-busy', String(on));
    el.submit.classList.toggle('is-loading', on);
    el.label.textContent = on ? 'Sending…' : 'Submit enrollment request';
  }

  function showSuccess(submissionId) {
    state.done = true;
    clearDraft();
    form.hidden = true;
    if (submissionId) {
      el.ref.textContent = 'Reference: ' + submissionId;
      el.ref.hidden = false;
    }
    el.success.hidden = false;
    el.success.focus();
    if (el.success.scrollIntoView) el.success.scrollIntoView({ block: 'center' });
  }

  function handleServerReply(reply) {
    if (reply && reply.ok) { showSuccess(reply.submissionId); return; }
    var code = reply && reply.code;
    if (code === 'VALIDATION' && reply.errors) {
      showErrors(reply.errors);
      focusFirst(reply.errors);
      showBanner('Please check the highlighted fields and try again.', false);
    } else if (code === 'RATE_LIMITED') {
      showBanner('We have received several requests recently. Please wait a little while and try again, or contact us directly.');
    } else {
      showBanner((reply && reply.message) || 'Sorry, we could not save your request. Please try again in a moment.');
    }
  }

  function send(data) {
    if (!E.endpoint) {
      console.warn('EduX: set enrollment.endpoint in js/config.js to your Apps Script Web App URL.');
      showBanner('Online enrollment is not available just yet. Please contact us directly using the details in the Contact section.');
      return;
    }
    clearBanner();
    setLoading(true);

    var payload = {
      clientToken: state.token,
      studentName: data.studentName,
      studentPhone: normalizePhone(data.studentPhone),
      guardianName: data.guardianName,
      guardianPhone: normalizePhone(data.guardianPhone),
      classLevel: data.classLevel,
      subjects: data.subjects,
      school: data.school,
      batch: data.batch,
      message: data.message,
      consent: data.consent === true,
      website: el.honeypot.value, // honeypot: must stay empty
      elapsedMs: Date.now() - state.openedAt, // lightweight bot signal (easy to fake; not security)
    };

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, E.requestTimeoutMs);

    fetch(E.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // "simple request": no CORS pre-flight
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var reply;
        try { reply = JSON.parse(text); } catch (e) {
          // Usually means Apps Script returned a Google sign-in/error HTML page
          // because the Web App is not deployed with "Anyone" access.
          console.error('EduX: the enrollment service returned something that is not JSON. Check the Apps Script deployment access ("Anyone").');
          throw new Error('BAD_RESPONSE');
        }
        return reply;
      })
      .then(function (reply) {
        clearTimeout(timer);
        setLoading(false);
        handleServerReply(reply);
      })
      .catch(function (err) {
        clearTimeout(timer);
        setLoading(false);
        console.error('EduX enrollment submit failed:', err && err.message);
        // Data stays in the form (and in the draft); the same token is reused on retry.
        showBanner(
          err && err.message === 'BAD_RESPONSE'
            ? 'The enrollment service sent an unexpected reply. Your information is still here. Please try again later or contact us directly.'
            : 'We could not reach the server. Your information is still here, so please check your connection and press Submit again.'
        );
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.submitting || state.done) return; // blocks double-clicks / double-taps
    clearBanner();

    var data = collect();
    var errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) {
      focusFirst(errors);
      showBanner('Please fix the highlighted fields and submit again.', false);
      return;
    }
    // Honeypot filled => almost certainly a bot. Pretend all is well, send nothing.
    if (el.honeypot.value) { showSuccess(''); return; }
    send(data);
  });

  /* ------------------------------------------------------------------
     Message counter + start-up
  ------------------------------------------------------------------ */
  function updateCount() { el.count.textContent = el.message.value.length + ' / ' + E.messageMaxLength; }
  el.message.addEventListener('input', updateCount);
  el.message.setAttribute('maxlength', String(E.messageMaxLength));

  el.classSel.addEventListener('change', function () { buildDependentControls(selectedSubjects()); });

  buildClassOptions();

  // Restore draft, then let ?class=... from a "Enroll" button win for the class
  var draft = loadDraft();
  if (draft) {
    FIELD_IDS.forEach(function (id) { if (draft[id] != null && byId(id) && id !== 'batch') byId(id).value = draft[id]; });
  }
  var wanted = new URLSearchParams(location.search).get('class');
  if (wanted) {
    var match = activeClasses().filter(function (c) { return c.id === wanted || c.value === wanted; })[0];
    if (match) el.classSel.value = match.value;
  }
  buildDependentControls(draft && draft.subjects);
  if (draft && draft.batch) el.batchSel.value = draft.batch;
  updateCount();
})();
