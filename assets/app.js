/* Precepta website — light interactions. No dependencies. */
(function () {
  "use strict";

  // Where "Get started" sends people: the Precepta console (the product repo).
  // Override order: window.PRECEPTA_CONSOLE → /api/config.consoleUrl → default.
  var CONSOLE_URL = window.PRECEPTA_CONSOLE || "http://127.0.0.1:8000/console";

  // "Get started" → the console.
  function wireGetStarted() {
    function go(e) { e.preventDefault(); window.location.href = CONSOLE_URL; }
    document.querySelectorAll("[data-console]").forEach(function (el) {
      el.setAttribute("href", CONSOLE_URL);
      el.addEventListener("click", go);
    });
    // Pull the real console URL from the backend if it's configured there.
    if (document.querySelector("[data-console]")) {
      fetch("/api/config").then(function (r) { return r.json(); }).then(function (cfg) {
        if (cfg && cfg.consoleUrl) {
          CONSOLE_URL = cfg.consoleUrl;
          document.querySelectorAll("[data-console]").forEach(function (el) { el.setAttribute("href", CONSOLE_URL); });
        }
      }).catch(function () {});
    }
  }

  // The 15-day trial signup (secondary CTA) → the trial page / Google flow.
  function wireTrial() {
    document.querySelectorAll("[data-google]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (typeof window.startGoogleTrial === "function") { e.preventDefault(); window.startGoogleTrial(); }
        else if (!el.closest("[data-trial-page]")) { e.preventDefault(); window.location.href = "start.html"; }
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
    wireTrial();
    wireDocScroll();
    wireYear();
  });
})();
