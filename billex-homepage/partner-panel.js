(function () {
  var panel = document.querySelector('[data-partner-panel]');
  if (!panel || !('IntersectionObserver' in window)) return;

  var checks = Array.from(panel.querySelectorAll('.aml-list li'));
  if (!checks.length) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var timer = null;
  var nextCheck = 0;
  var visible = false;

  function clearHighlight() {
    checks.forEach(function (check) { check.classList.remove('is-active'); });
  }

  function highlightNext() {
    clearHighlight();
    if (nextCheck === checks.length) {
      nextCheck = 0;
      timer = window.setTimeout(highlightNext, 2400);
      return;
    }
    checks[nextCheck].classList.add('is-active');
    nextCheck += 1;
    timer = window.setTimeout(highlightNext, 1500);
  }

  function update() {
    if (visible && !document.hidden && !motion.matches) {
      if (timer === null) timer = window.setTimeout(highlightNext, 600);
    } else {
      window.clearTimeout(timer);
      timer = null;
      nextCheck = 0;
      clearHighlight();
    }
  }

  new IntersectionObserver(function (entries) {
    visible = entries[entries.length - 1].isIntersecting;
    update();
  }, { threshold: 0.2 }).observe(panel);

  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
})();
