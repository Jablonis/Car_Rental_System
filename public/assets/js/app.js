document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function bindToggle(buttonSelector, navSelector) {
    var btn = document.querySelector(buttonSelector);
    var nav = document.querySelector(navSelector);
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      btn.classList.toggle('is-open');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
      });
    });
  }

  bindToggle('.nav-toggle', '.main-nav');
  bindToggle('.kar-nav-toggle', '.kar-hero-nav');

  var page = document.body.getAttribute('data-page');
  if (page) {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      if (link.getAttribute('data-page') === page) link.classList.add('is-active');
    });
  }

  var header = document.querySelector('.site-header');
  if (header) {
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset) > 20);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  document.querySelectorAll('.faq-item').forEach(function (button) {
    button.addEventListener('click', function () {
      var content = button.nextElementSibling;
      if (!content || !content.classList.contains('faq-content')) return;
      content.classList.toggle('is-open');
      var icon = button.querySelector('.faq-icon');
      if (icon) icon.textContent = content.classList.contains('is-open') ? '–' : '+';
    });
  });

  var search = document.getElementById('carSearch');
  var list = document.getElementById('carList');
  var noRes = document.getElementById('noResults');
  if (search && list) {
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim();
      var cards = list.querySelectorAll('.car-card');
      var visible = 0;
      cards.forEach(function (card) {
        var name = (card.getAttribute('data-name') || '').toLowerCase();
        var text = (card.textContent || '').toLowerCase();
        var ok = q === '' || name.indexOf(q) !== -1 || text.indexOf(q) !== -1;
        card.style.display = ok ? '' : 'none';
        if (ok) visible++;
      });
      if (noRes) noRes.hidden = visible !== 0;
    });
  }

  document.querySelectorAll('.car-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var card = toggle.closest('.car-card');
      if (!card) return;
      var details = card.querySelector('.car-details');
      if (!details) return;
      details.classList.toggle('is-visible');
      toggle.textContent = details.classList.contains('is-visible') ? 'Skryť detaily' : 'Zobraziť detaily';
    });
  });

  var form = document.getElementById('contactForm');
  var previewBox = document.getElementById('previewBox');
  var previewText = document.getElementById('previewText');
  if (form && previewBox && previewText) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements['name'] ? form.elements['name'].value : '';
      var email = form.elements['email'] ? form.elements['email'].value : '';
      var car = form.elements['car'] ? form.elements['car'].value : '';
      var msg = form.elements['message'] ? form.elements['message'].value : '';
      previewText.style.whiteSpace = 'pre-line';
      previewText.textContent = 'Meno: ' + name + '\nE-mail: ' + email + '\n' + (car ? 'Auto: ' + car + '\n' : '') + '\nSpráva: ' + msg;
      previewBox.hidden = false;
      form.reset();
    });
  }

  var revealEls = document.querySelectorAll('[data-reveal], .reveal-up, .reveal-fade');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible', 'reveal-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible', 'reveal-visible'); });
  }

  function animateCount(el) {
    var target = Number(el.getAttribute('data-count') || el.getAttribute('data-counter') || 0);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  var counterEls = document.querySelectorAll('.js-count, .js-counter');
  if (counterEls.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (!entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCount(entry.target);
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    counterEls.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counterEls.forEach(animateCount);
  }

  var wordRevealEls = document.querySelectorAll('[data-word-reveal]');
  wordRevealEls.forEach(function (el) {
    if (!el.dataset.prepared) {
      var words = (el.textContent || '').trim().split(/\s+/).filter(Boolean);
      if (!words.length) return;
      el.innerHTML = '';
      el.classList.add('word-reveal');
      words.forEach(function (word, idx) {
        var span = document.createElement('span');
        span.textContent = word;
        el.appendChild(span);
        if (idx !== words.length - 1) {
          el.appendChild(document.createTextNode(' '));
        }
      });
      el.dataset.prepared = 'true';
    }

    var spans = Array.from(el.querySelectorAll('span'));
    var updateWords = function () {
      var rect = el.getBoundingClientRect();
      var viewH = window.innerHeight || document.documentElement.clientHeight;
      var progress = (viewH - rect.top) / (viewH + rect.height * 0.35);
      progress = Math.max(0, Math.min(1, progress));
      var revealValue = progress * spans.length;

      spans.forEach(function (span, index) {
        var local = Math.max(0, Math.min(1, revealValue - index));
        var gray = 110;
        var white = 245;
        var channel = Math.round(gray + (white - gray) * local);
        span.style.color = 'rgb(' + channel + ',' + channel + ',' + channel + ')';
        span.style.opacity = String(0.34 + local * 0.66);
        span.style.transform = 'translateY(' + ((1 - local) * 10) + 'px)';
      });
    };

    updateWords();
    window.addEventListener('scroll', updateWords, { passive: true });
    window.addEventListener('resize', updateWords);
  });

  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    var updateParallax = function () {
      var scrollY = window.scrollY || window.pageYOffset;
      parallaxEls.forEach(function (el) {
        var speed = Number(el.getAttribute('data-parallax') || 0.04);
        el.style.transform = 'translate3d(0,' + (scrollY * speed) + 'px,0) scale(1.02)';
      });
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  var topBtn = document.getElementById('backToTop');
  if (topBtn) {
    window.addEventListener('scroll', function () {
      topBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var filterToggle = document.getElementById('filterToggle');
  var filterGrid = document.querySelector('.filter-grid');
  var filterActions = document.querySelector('.filter-actions');
  if (filterToggle && filterGrid) {
    filterToggle.addEventListener('click', function () {
      filterGrid.classList.toggle('is-open');
      filterToggle.classList.toggle('collapsed');
      if (filterActions) filterActions.classList.toggle('is-open');
    });
  }
});
