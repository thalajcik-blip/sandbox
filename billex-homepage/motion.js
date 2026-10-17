/* One pause switch for every animation on the page (WCAG 2.2.2 Pause, Stop,
   Hide: the demos loop forever, so visitors need a way to stop them).

   Each animated demo gets a small button in its toolbar; all of them drive
   the same state, so pausing one pauses everything. The choice is kept in
   localStorage for the next visit. The loop scripts read
   BillexMotion.paused and subscribe with BillexMotion.onChange(); CSS
   animations stop through html[data-motion="paused"] (design-system.css).

   With prefers-reduced-motion nothing animates, so no buttons are added.
   Load before the animation scripts (all defer, so document order holds). */
window.BillexMotion = (function () {
  var KEY = 'billex-motion';
  var listeners = [];
  var buttons = [];
  var paused = false;

  try { paused = localStorage.getItem(KEY) === 'paused'; } catch (e) { /* storage blocked */ }

  function apply() {
    if (paused) document.documentElement.setAttribute('data-motion', 'paused');
    else document.documentElement.removeAttribute('data-motion');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.title = paused ? 'Spustiť animácie' : 'Pozastaviť animácie';
    });
  }

  function set(value) {
    if (value === paused) return;
    paused = value;
    try { localStorage.setItem(KEY, paused ? 'paused' : 'running'); } catch (e) { /* storage blocked */ }
    apply();
    listeners.forEach(function (fn) { fn(paused); });
  }

  var ICON =
    '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g class="motion-pause"><rect x="2" y="1.5" width="2.6" height="9" rx="1"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1"/></g>' +
      '<path class="motion-play" d="M3 1.8v8.4c0 .6.6.9 1.1.6l6.5-4.2c.5-.3.5-.9 0-1.2L4.1 1.2C3.6.9 3 1.2 3 1.8z"/>' +
    '</svg>';

  function addButton(container) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'motion-toggle';
    // fixed name + aria-pressed: "Pozastaviť animácie, stlačené" once paused
    b.setAttribute('aria-label', 'Pozastaviť animácie');
    b.innerHTML = ICON;
    b.addEventListener('click', function () { set(!paused); });
    container.appendChild(b);
    buttons.push(b);
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-motion-toggle]').forEach(addButton);
  }
  apply();

  return {
    get paused() { return paused; },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
