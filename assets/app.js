/* Precepta website — light interactions. No dependencies. */
(function () {
  "use strict";

  // Google "Get started" → trial. Real auth is wired to a backend later; for now
  // route to the trial signup page (or trigger GIS if configured on that page).
  function wireGetStarted() {
    document.querySelectorAll("[data-google]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        // On the trial page, a real Google Identity Services flow takes over
        // (window.startGoogleTrial). Elsewhere, send the user to the trial page.
        if (typeof window.startGoogleTrial === "function") {
          e.preventDefault();
          window.startGoogleTrial();
        } else if (!el.closest("[data-trial-page]")) {
          e.preventDefault();
          window.location.href = "start.html";
        }
      });
    });
  }

  // Docs: highlight the section in view.
  function wireDocScroll() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".docnav a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var t = document.getElementById(id);
      if (t) map[id] = a;
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("on"); });
          var a = map[en.target.id];
          if (a) a.classList.add("on");
        }
      });
    }, { rootMargin: "-72px 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { obs.observe(document.getElementById(id)); });
  }

  // Footer year.
  function wireYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireGetStarted();
    wireDocScroll();
    wireYear();
  });
})();
