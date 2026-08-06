/* ==========================================================================
   ESCUELA DE EMPRENDEDORES — comportamiento de /escuela/
   - Recalcula los estados de la agenda en el navegador (el sitio es estático,
     así que sin esto las etiquetas quedarían congeladas en la fecha del build).
   - Filtros de la agenda.
   - Contadores de impacto (una sola vez, respetando prefers-reduced-motion).
   - Envío real de los dos formularios contra /api/contacto.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '/api/contacto';
  var TZ = 'America/Argentina/Buenos_Aires';
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STATUS_LABELS = {
    proximo: 'Próximamente',
    hoy: 'Comienza hoy',
    'en-curso': 'Ya comenzó',
    'inscripciones-abiertas': 'Inscripciones abiertas',
    consultar: 'Consultar disponibilidad',
    'cupos-completos': 'Cupos completos',
    finalizado: 'Finalizado'
  };

  /** Fecha de hoy en Argentina como 'YYYY-MM-DD', sin depender del huso del visitante. */
  function todayInArgentina() {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  // ------------------------------------------------------------------------
  // 1. Estados de la agenda
  // ------------------------------------------------------------------------
  function refreshStatuses() {
    var today = todayInArgentina();

    document.querySelectorAll('[data-course]').forEach(function (card) {
      var tag = card.querySelector('[data-status-tag]');
      if (!tag) return;

      var override = card.getAttribute('data-status-override');
      var start = card.getAttribute('data-start');
      var status;

      if (override) {
        status = override;
      } else if (!start) {
        return;
      } else if (start > today) {
        status = 'proximo';
      } else if (start === today) {
        status = 'hoy';
      } else {
        // Nunca se marca "finalizado" automáticamente: no conocemos la duración.
        status = 'en-curso';
      }

      Object.keys(STATUS_LABELS).forEach(function (key) {
        tag.classList.remove('esc-tag--' + key);
      });
      tag.classList.add('esc-tag--' + status);
      tag.textContent = STATUS_LABELS[status];
    });
  }

  // ------------------------------------------------------------------------
  // 2. Próxima actividad destacada
  // ------------------------------------------------------------------------
  function refreshNextCourse() {
    var holder = document.getElementById('escuela-data');
    var card = document.getElementById('proximo-curso');
    if (!holder || !card) return;

    var courses;
    try {
      courses = JSON.parse(holder.textContent);
    } catch (e) {
      return;
    }
    if (!Array.isArray(courses) || !courses.length) return;

    var today = todayInArgentina();
    var next = courses
      .filter(function (c) { return c.startDate >= today; })
      .sort(function (a, b) {
        if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
        return a.time.localeCompare(b.time);
      })[0];

    // Si el destacado renderizado en el build sigue siendo el correcto, no se toca.
    if (next && card.getAttribute('data-course-id') === next.id) return;

    if (!next) {
      card.classList.add('esc-next__empty');
      card.innerHTML =
        '<p class="esc-next__when">Próximamente anunciaremos nuevos cursos. ' +
        'Seguinos en <strong>@goyaemprendedores</strong> para enterarte primero.</p>';
      return;
    }

    var parts = next.startDate.split('-');
    var months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    var dayLabel = next.dateLabel.charAt(0).toUpperCase() + next.dateLabel.slice(1);
    var kind = next.type === 'masterclass' ? 'Próxima masterclass' : 'Próximo curso';

    card.setAttribute('data-course-id', next.id);
    card.classList.remove('esc-next__empty');
    card.innerHTML =
      '<div class="esc-next__grid">' +
        '<div class="esc-next__date" aria-hidden="true">' +
          '<span class="esc-next__day">' + parts[2] + '</span>' +
          '<span class="esc-next__month">' + months[parseInt(parts[1], 10) - 1] + '</span>' +
        '</div>' +
        '<div class="esc-next__body">' +
          '<p class="esc-next__label">' + kind + '</p>' +
          '<h3 class="esc-next__name" id="proximo-curso-name">' + escapeHtml(next.name) + '</h3>' +
          '<p class="esc-next__when"><time datetime="' + next.startDate + '">' + escapeHtml(dayLabel) +
            '</time> · ' + escapeHtml(next.time) + ' h</p>' +
          '<div class="esc-next__actions">' +
            '<a href="' + encodeURI(next.whatsappUrl) + '" class="esc-btn esc-btn--whatsapp" ' +
              'target="_blank" rel="noopener noreferrer" ' +
              'aria-label="Consultar por WhatsApp sobre ' + escapeHtml(next.name) + '">Consultar por WhatsApp</a>' +
            '<a href="' + encodeURI(next.instagramUrl) + '" class="esc-btn esc-btn--outline-light" ' +
              'target="_blank" rel="noopener noreferrer" ' +
              'aria-label="Ver la publicación de ' + escapeHtml(next.name) + ' en Instagram">Ver publicación</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ------------------------------------------------------------------------
  // 3. Filtros de la agenda
  // ------------------------------------------------------------------------
  function initFilters() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.esc-filter'));
    if (!buttons.length) return;

    var list = document.getElementById('agenda-lista');
    if (!list) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter') || 'todos';

        buttons.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });

        list.querySelectorAll('.esc-course').forEach(function (card) {
          var show = true;
          if (filter.indexOf('mes:') === 0) {
            show = card.getAttribute('data-month') === filter.slice(4);
          } else if (filter.indexOf('tipo:') === 0) {
            show = card.getAttribute('data-type') === filter.slice(5);
          }
          card.hidden = !show;
        });

        // Oculta los encabezados de mes que se quedaron sin cursos visibles.
        list.querySelectorAll('.esc-month').forEach(function (month) {
          var visible = month.querySelectorAll('.esc-course:not([hidden])').length;
          month.hidden = visible === 0;
        });
      });
    });
  }

  // ------------------------------------------------------------------------
  // 4. Contadores de impacto
  // ------------------------------------------------------------------------
  function initCounters() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-count-to]'));
    if (!nodes.length) return;

    // Con movimiento reducido o sin IntersectionObserver se muestra el valor final.
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function (node) {
        node.textContent = (node.getAttribute('data-suffix') || '') + node.getAttribute('data-count-to');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Se anima una sola vez.
        observer.unobserve(entry.target);
        animate(entry.target);
      });
    }, { threshold: 0.4 });

    nodes.forEach(function (node) {
      node.textContent = (node.getAttribute('data-suffix') || '') + '0';
      observer.observe(node);
    });

    function animate(node) {
      var target = parseInt(node.getAttribute('data-count-to'), 10) || 0;
      var suffix = node.getAttribute('data-suffix') || '';
      var duration = 1200;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = suffix + Math.round(target * eased).toLocaleString('es-AR');
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }
  }

  // ------------------------------------------------------------------------
  // 5. Formularios
  // ------------------------------------------------------------------------
  var VALIDATORS = {
    nombre: function (v) {
      if (!v) return 'Ingresá tu nombre y apellido.';
      if (v.length < 3) return 'El nombre es demasiado corto.';
      if (v.length > 120) return 'El nombre es demasiado largo.';
      return '';
    },
    celular: function (v) {
      if (!v) return 'Ingresá un número de celular para poder contactarte.';
      var digits = v.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        return 'Ingresá un número válido (entre 8 y 15 dígitos).';
      }
      return '';
    },
    email: function (v) {
      if (!v) return '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Revisá el correo electrónico.';
      if (v.length > 160) return 'El correo es demasiado largo.';
      return '';
    },
    curso: function (v) {
      if (!v) return 'Elegí el curso que te interesa.';
      return '';
    },
    oficio: function (v) {
      if (!v) return 'Contanos qué te gustaría enseñar.';
      if (v.length > 200) return 'El texto es demasiado largo.';
      return '';
    }
  };

  function initForms() {
    document.querySelectorAll('[data-escuela-form]').forEach(function (form) {
      var kind = form.getAttribute('data-escuela-form');
      var button = form.querySelector('[data-submit]');
      var status = form.querySelector('[data-status]');
      var sending = false;

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (sending) return;

        var data = collect(form);
        var errors = validate(form, data);

        if (Object.keys(errors).length) {
          paintErrors(form, errors);
          setStatus(status, 'error', 'Revisá los campos marcados y volvé a intentar.');
          var firstField = form.querySelector('[aria-invalid="true"]');
          if (firstField) firstField.focus();
          return;
        }

        paintErrors(form, {});
        sending = true;
        lock(button, true);
        setStatus(status, 'loading', 'Enviando tus datos…');

        var payload = Object.assign({}, data, {
          tipo: kind === 'formador' ? 'escuela-formador' : 'escuela-alumno',
          origen: window.location.pathname
        });

        var token = form.querySelector('[name="cf-turnstile-response"]');
        if (token && token.value) payload['cf-turnstile-response'] = token.value;

        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; })
              .then(function (body) { return { ok: response.ok, body: body }; });
          })
          .then(function (result) {
            // Sólo se declara éxito cuando el servidor lo confirma.
            if (result.ok && result.body && result.body.ok === true) {
              setStatus(
                status,
                'success',
                kind === 'formador'
                  ? '¡Gracias! Recibimos tu propuesta y te vamos a contactar.'
                  : '¡Listo! Recibimos tus datos y te vamos a contactar a la brevedad.'
              );
              form.reset();
              resetTurnstile();
            } else {
              // Los datos cargados se conservan para que se pueda reintentar.
              setStatus(
                status,
                'error',
                (result.body && result.body.error) ||
                  'No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.'
              );
            }
          })
          .catch(function () {
            setStatus(
              status,
              'error',
              'No pudimos conectarnos. Revisá tu conexión e intentá otra vez, o escribinos por WhatsApp.'
            );
          })
          .then(function () {
            sending = false;
            lock(button, false);
          });
      });

      // Limpia el error de un campo apenas se corrige.
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        field.addEventListener('input', function () {
          if (field.getAttribute('aria-invalid') === 'true') {
            field.removeAttribute('aria-invalid');
            var msg = form.querySelector('[data-error-for="' + field.name + '"]');
            if (msg) {
              msg.textContent = '';
              msg.removeAttribute('data-visible');
            }
          }
        });
      });
    });
  }

  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    data.consentimiento = !!form.querySelector('[name="consentimiento"]:checked');
    return data;
  }

  function validate(form, data) {
    var errors = {};
    Object.keys(VALIDATORS).forEach(function (name) {
      if (!form.querySelector('[name="' + name + '"]')) return;
      var message = VALIDATORS[name](data[name] || '');
      if (message) errors[name] = message;
    });
    if (!data.consentimiento) {
      errors.consentimiento = 'Necesitamos tu autorización para poder contactarte.';
    }
    return errors;
  }

  function paintErrors(form, errors) {
    form.querySelectorAll('[data-error-for]').forEach(function (node) {
      var name = node.getAttribute('data-error-for');
      var field = form.querySelector('[name="' + name + '"]');
      var message = errors[name];

      if (message) {
        node.textContent = message;
        node.setAttribute('data-visible', 'true');
        if (field) field.setAttribute('aria-invalid', 'true');
      } else {
        node.textContent = '';
        node.removeAttribute('data-visible');
        if (field) field.removeAttribute('aria-invalid');
      }
    });
  }

  function lock(button, locked) {
    if (!button) return;
    if (locked) {
      button.dataset.label = button.textContent;
      button.textContent = 'Enviando…';
      button.disabled = true;
    } else {
      if (button.dataset.label) button.textContent = button.dataset.label;
      button.disabled = false;
    }
  }

  function setStatus(node, state, message) {
    if (!node) return;
    node.setAttribute('data-state', state);
    node.textContent = message;
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      window.turnstile.reset();
    }
  }

  // ------------------------------------------------------------------------
  function init() {
    refreshStatuses();
    refreshNextCourse();
    initFilters();
    initCounters();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
