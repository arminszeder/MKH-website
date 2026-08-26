/* MKH Werk — site interactions.
   Vanilla, no build step. Every block bails out quietly if its markup is absent,
   so the same file can be loaded by adatkezeles.html too. */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------------------- header -- */

  var header = $('#siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --------------------------------------------------------- mobile nav -- */

  var nav = $('#nav');
  var navToggle = $('#navToggle');
  if (nav && navToggle) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    };

    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after tapping a link, and whenever we grow past the mobile breakpoint.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setNav(false);
    });
  }

  /* ------------------------------------------------- active nav section -- */

  var navLinks = $$('.nav a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* -------------------------------------------------------- reveal on scroll */

  var reveals = $$('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ------------------------------------------------------------ filters -- */

  var filterBar = $('#filters');
  var grid = $('#grid');
  var emptyMsg = $('#galleryEmpty');

  if (filterBar && grid) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;

      var cat = btn.dataset.cat;
      $$('.filter', filterBar).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });

      var visible = 0;
      $$('.card', grid).forEach(function (card) {
        var show = cat === 'Mind' || card.dataset.cat === cat;
        card.hidden = !show;
        if (show) {
          visible++;
          // Re-run the reveal so filtered-in cards do not appear pre-faded.
          card.classList.add('is-in');
        }
      });

      if (emptyMsg) emptyMsg.hidden = visible > 0;
    });
  }

  /* ----------------------------------------------------------- lightbox -- */

  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('#lightboxImg');
    var lbCat = $('#lightboxCat');
    var lbTitle = $('#lightboxTitle');
    var lbLine = $('#lightboxLine');
    var lbPrev = $('#lightboxPrev');
    var lbNext = $('#lightboxNext');
    var lbClose = $('#lightboxClose');
    var lastFocus = null;
    var index = -1;

    // Only images in currently-visible cards take part in prev/next.
    var shots = function () {
      return $$('[data-lightbox]').filter(function (b) {
        var card = b.closest('.card');
        return !card || !card.hidden;
      });
    };

    var paint = function (btn) {
      lbImg.src = btn.dataset.src;
      lbImg.alt = btn.dataset.title || '';
      lbCat.textContent = btn.dataset.cat || '';
      lbTitle.textContent = btn.dataset.title || '';
      lbLine.textContent = btn.dataset.line || '';
    };

    var open = function (btn) {
      var list = shots();
      index = list.indexOf(btn);
      paint(btn);

      var many = list.length > 1;
      lbPrev.hidden = !many;
      lbNext.hidden = !many;

      lb.hidden = false;
      document.body.classList.add('is-locked');
      lastFocus = document.activeElement;
      lbClose.focus();
    };

    var close = function () {
      lb.hidden = true;
      document.body.classList.remove('is-locked');
      lbImg.src = '';
      if (lastFocus) lastFocus.focus();
    };

    var step = function (delta) {
      var list = shots();
      if (!list.length) return;
      index = (index + delta + list.length) % list.length;
      paint(list[index]);
    };

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lightbox]');
      if (btn) { e.preventDefault(); open(btn); }
    });

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lbNext.addEventListener('click', function (e) { e.stopPropagation(); step(1); });

    // Click the backdrop (but not the image or controls) to dismiss.
    lb.addEventListener('click', function (e) {
      if (e.target === lb) close();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { step(-1); }
      else if (e.key === 'ArrowRight') { step(1); }
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog while it is open.
        var f = [lbClose, lbPrev, lbNext].filter(function (el) { return !el.hidden; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* ------------------------------------------------- before/after slider -- */

  var compare = $('#compare');
  if (compare) {
    var handle = $('#compareHandle');
    var dragging = false;

    var setPos = function (pct) {
      pct = Math.max(0, Math.min(100, pct));
      compare.style.setProperty('--pos', pct + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pct)));
      handle.setAttribute('aria-valuetext', Math.round(pct) + '% — utána');
      // The hint lives in the caption panel, so mark the card, not the image.
      var card = compare.closest('.card') || compare;
      card.classList.add('is-touched');
    };

    var track = function (clientX) {
      var r = compare.getBoundingClientRect();
      if (!r.width) return;
      setPos(((clientX - r.left) / r.width) * 100);
    };

    compare.addEventListener('pointerdown', function (e) {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      track(e.clientX);
    });

    compare.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      e.preventDefault();
      track(e.clientX);
    });

    ['pointerup', 'pointercancel'].forEach(function (evt) {
      compare.addEventListener(evt, function (e) {
        dragging = false;
        if (compare.hasPointerCapture(e.pointerId)) compare.releasePointerCapture(e.pointerId);
      });
    });

    handle.addEventListener('click', function (e) { e.preventDefault(); });

    handle.addEventListener('keydown', function (e) {
      // Not `|| 50` — a legitimate 0 is falsy and would snap back to the middle.
      var now = parseFloat(handle.getAttribute('aria-valuenow'));
      if (isNaN(now)) now = 50;
      var big = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') { setPos(now - big); }
      else if (e.key === 'ArrowRight') { setPos(now + big); }
      else if (e.key === 'Home') { setPos(0); }
      else if (e.key === 'End') { setPos(100); }
      else { return; }
      e.preventDefault();
    });
  }

  /* --------------------------------------------------------------- misc -- */

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
