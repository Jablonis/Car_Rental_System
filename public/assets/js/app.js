document.addEventListener("DOMContentLoaded", function () {

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        nav.classList.remove("is-open");
      });
    }
  }
  var page = document.body.getAttribute("data-page");
  if (page) {
    var menuLinks = document.querySelectorAll(".nav-link");
    for (var j = 0; j < menuLinks.length; j++) {
      if (menuLinks[j].getAttribute("data-page") === page) {
        menuLinks[j].classList.add("is-active");
      }
    }
  }
  var faqButtons = document.querySelectorAll(".faq-item");
  for (var k = 0; k < faqButtons.length; k++) {
    faqButtons[k].addEventListener("click", function () {
      var content = this.nextElementSibling;
      if (!content || !content.classList.contains("faq-content")) return;

      content.classList.toggle("is-open");

      var icon = this.querySelector(".faq-icon");
      if (icon) icon.textContent = content.classList.contains("is-open") ? "–" : "+";
    });
  }
  var search = document.getElementById("carSearch");
  var list = document.getElementById("carList");
  var noRes = document.getElementById("noResults");

  if (search && list) {
    search.addEventListener("input", function () {
      var q = search.value.toLowerCase().trim();
      var cards = list.querySelectorAll(".car-card");
      var visible = 0;

      for (var c = 0; c < cards.length; c++) {
        var name = (cards[c].getAttribute("data-name") || "").toLowerCase();
        var text = cards[c].textContent.toLowerCase();
        var ok = (q === "") || name.indexOf(q) !== -1 || text.indexOf(q) !== -1;

        cards[c].style.display = ok ? "" : "none";
        if (ok) visible++;
      }

      if (noRes) noRes.hidden = visible !== 0;
    });
  }
var toggles = document.querySelectorAll(".car-toggle");
  for (var t = 0; t < toggles.length; t++) {
    toggles[t].addEventListener("click", function () {
      var card = this.closest(".car-card");
      if (!card) return;
      var details = card.querySelector(".car-details");
      if (!details) return;

      details.classList.toggle("is-visible");
      this.textContent = details.classList.contains("is-visible") ? "Skryť detaily" : "Zobraziť detaily";
    });
  }
  var form = document.getElementById("contactForm");
  var previewBox = document.getElementById("previewBox");
  var previewText = document.getElementById("previewText");

  if (form && previewBox && previewText) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.elements["name"] ? form.elements["name"].value : "";
      var email = form.elements["email"] ? form.elements["email"].value : "";
      var car = form.elements["car"] ? form.elements["car"].value : "";
      var msg = form.elements["message"] ? form.elements["message"].value : "";

      previewText.style.whiteSpace = "pre-line";
      previewText.textContent =
        "Meno: " + name + "\n" +
        "E-mail: " + email + "\n" +
        (car ? "Auto: " + car + "\n" : "") +
        "\nSpráva: " + msg;

      previewBox.hidden = false;
      form.reset();
    });
  }

  var revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  var counterItems = document.querySelectorAll(".js-counter");
  if (counterItems.length) {
    var animateCounter = function (el) {
      var target = Number(el.getAttribute("data-counter") || "0");
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1600;
      var start = null;

      var step = function (timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(target * eased);
        el.textContent = value.toLocaleString("en-US") + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString("en-US") + suffix;
        }
      };

      window.requestAnimationFrame(step);
    };

    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (!entry.target.dataset.counted) {
          entry.target.dataset.counted = "true";
          animateCounter(entry.target);
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counterItems.forEach(function (item) {
      counterObserver.observe(item);
    });
  }

  var parallaxItems = document.querySelectorAll("[data-parallax]");
  if (parallaxItems.length && window.innerWidth >= 1024) {
    var updateParallax = function () {
      var scrollY = window.scrollY;
      parallaxItems.forEach(function (item) {
        var speed = Number(item.getAttribute("data-parallax") || "0.08");
        item.style.transform = "translate3d(0, " + (scrollY * speed) + "px, 0) scale(1.04)";
      });
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
  }
  var topBtn = document.getElementById("backToTop");
  if (topBtn) {
    window.addEventListener("scroll", function () {
      topBtn.style.display = window.scrollY > 300 ? "block" : "none";
    });

    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Filter toggle for mobile
  var filterToggle = document.getElementById("filterToggle");
  var filterForm = document.getElementById("filterForm");
  var filterGrid = document.querySelector(".filter-grid");
  var filterActions = document.querySelector(".filter-actions");

  if (filterToggle && filterGrid) {
    filterToggle.addEventListener("click", function () {
      filterGrid.classList.toggle("is-open");
      filterToggle.classList.toggle("collapsed");
      if (filterActions) filterActions.classList.toggle("is-open");
    });
  }



  var karToggle = document.querySelector('.kar-nav-toggle');
  var karLinks = document.querySelector('.kar-nav-links');
  var karActions = document.querySelector('.kar-nav-actions');
  if (karToggle && karLinks) {
    karToggle.addEventListener('click', function () {
      karLinks.classList.toggle('is-open');
      if (karActions) karActions.classList.toggle('is-open');
    });
  }

  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    revealEls.forEach(function(el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('is-visible'); });
  }

  var counterEls = document.querySelectorAll('.js-count');
  if (counterEls.length) {
    var startedCounters = new WeakSet();
    var startCount = function(el) {
      if (startedCounters.has(el)) return;
      startedCounters.add(el);
      var target = Number(el.getAttribute('data-count') || 0);
      var duration = 1400;
      var start = null;
      var suffix = el.getAttribute('data-suffix') || '';
      var formatter = function(value) { return Math.round(value).toLocaleString('en-US') + suffix; };
      var tick = function(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatter(target * eased);
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            startCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      counterEls.forEach(function(el) { counterObserver.observe(el); });
    } else {
      counterEls.forEach(startCount);
    }
  }

  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    var updateParallax = function() {
      var scrollY = window.scrollY || window.pageYOffset;
      parallaxEls.forEach(function(el) {
        var speed = Number(el.getAttribute('data-parallax') || 0.05);
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = (window.innerHeight / 2 - center) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0) scale(1.03)';
      });
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax);
  }

});