/* Partner check — "1 invoice vs. 12 months". See accounts.css.
   The markup ships in the year view (complete without JS). With motion
   allowed, the demo opens on the single invoice, holds it long enough to
   read the caption, then reveals the year unless the visitor has already
   used the switch. */
(function () {
  var demo = document.querySelector('[data-acct-demo]');
  if (!demo) return;

  var HOLD = 1800;  // ms on "1 faktúra" before the year is revealed
  var buttons = demo.querySelectorAll('[data-mode]');
  var touched = false;

  function set(mode) {
    demo.classList.toggle('is-year', mode === 'year');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false');
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      touched = true;
      set(b.getAttribute('data-mode'));
    });
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  demo.classList.add('no-motion');
  set('one');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { demo.classList.remove('no-motion'); });
  });

  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    setTimeout(function () { if (!touched) set('year'); }, HOLD);
  }, { threshold: 0.5 });
  io.observe(demo);
})();
