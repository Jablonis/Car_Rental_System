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

});