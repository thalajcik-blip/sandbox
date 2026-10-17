/* Staggered reveal on scroll. Each child of a [data-reveal] container fades
   and rises in the first time it scrolls into view, once. Children that
   enter together (a desktop row, or the whole grid) are staggered in DOM
   order; on a phone, where the grid is taller than the screen, each card
   comes in as you reach it rather than all at once off screen.

   Nothing is hidden until this script runs, so without JS the content is
   simply there. It is skipped under prefers-reduced-motion and when the
   visitor has paused animations (motion.js). The per-card delay is set as
   --d; the styles are in design-system.css. */
(function () {
  var groups = document.querySelectorAll('[data-reveal]');
  if (!groups.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.BillexMotion && window.BillexMotion.paused) return;

  var STEP = 70;   // ms between cards entering in the same batch
  var items = [];

  var io = new IntersectionObserver(function (entries) {
    var entering = entries.filter(function (e) { return e.isIntersecting; })
      .map(function (e) { return e.target; })
      .sort(function (a, b) { return items.indexOf(a) - items.indexOf(b); });
    entering.forEach(function (el, i) {
      io.unobserve(el);
      el.style.setProperty('--d', i * STEP + 'ms');
      el.classList.add('is-in');
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

  groups.forEach(function (group) {
    group.classList.add('reveal-ready');   // hides children that are not .is-in yet
    Array.prototype.forEach.call(group.children, function (child) {
      items.push(child);
      io.observe(child);
    });
  });

  // pausing animations before everything is reached shows the rest at once
  if (window.BillexMotion) {
    window.BillexMotion.onChange(function (paused) {
      if (!paused) return;
      io.disconnect();
      groups.forEach(function (group) { group.classList.add('reveal-instant'); });
      items.forEach(function (el) { el.classList.add('is-in'); });
    });
  }
})();
