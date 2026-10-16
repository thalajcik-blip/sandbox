/* Digitálny poštár — one invoice's journey, looped. See route.css.
   Rows carry data-at (the stop where they become known) and optionally
   data-check (ms of "Overujem" before the verdict). The loop only runs
   while the card is on screen and the tab is visible; when it pauses
   mid-way it restarts from the beginning. */
(function () {
  var card = document.querySelector('[data-route]');
  if (!card) return;

  var map = card.querySelector('.route-map');
  var stops = card.querySelectorAll('.route-stops li');
  var rows = Array.prototype.slice.call(card.querySelectorAll('.shot-row[data-at]'));
  var stopTimes = card.querySelectorAll('.route-stops small');
  var received = card.querySelector('[data-received]');
  var stampDate = card.querySelector('[data-stamp] span');
  var D = window.BillexDates;

  var TRAVEL = 900;      // ms per leg, matches --travel in route.css
  var HOLD = 3000;       // stamped receipt stays up this long
  var FADE = 350;        // matches the .is-fading opacity transition
  var run = 0;           // bumping this cancels the loop in flight
  var running = false;

  rows.forEach(function (row) {
    var ph = document.createElement('span');
    ph.className = 'route-ph';
    row.appendChild(ph);
  });

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject(); }, ms);
    });
  }

  function setP(p) { map.style.setProperty('--p', p); }

  // The journey happens "now": delivered at about the moment the envelope
  // reaches the inbox in this round (~4 s in), through the postman 13 s
  // before that and sent 20 s before. Shown times are never in the future.
  var LEGS = [-20, -13, 0];
  var ARRIVE = 4000;     // ms from round start to the envelope's arrival
  function setTimes() {
    var arrive = Date.now() + ARRIVE;
    var at = LEGS.map(function (s) { return new Date(arrive + s * 1000); });
    stopTimes.forEach(function (el, i) { el.textContent = D.hms(at[i]); });
    received.textContent = D.dots(at[2]) + ' ' + D.hms(at[2]);
    stampDate.textContent = D.spaced(at[2]) + ' · ' + D.hm(at[2]);
  }

  // Back to the empty receipt in one frame, without transitions
  function reset() {
    card.classList.add('no-motion');
    card.classList.remove('is-final', 'is-moving', 'is-delivered', 'is-stamped', 'is-thud');
    stops.forEach(function (s) { s.classList.remove('is-on'); });
    rows.forEach(function (r) { r.classList.remove('is-check', 'is-in'); r.classList.add('is-wait'); });
    setP(0);
    setTimes();
    void card.offsetHeight;
    card.classList.remove('no-motion');
  }

  function reach(i) { stops[i].classList.add('is-on'); }

  function resolve(row) {
    row.classList.remove('is-wait', 'is-check');
    row.classList.add('is-in');
  }

  // Rows at a stop are checked one after another
  function checkRows(at, id) {
    return rows.filter(function (r) { return +r.getAttribute('data-at') === at; })
      .reduce(function (chain, row) {
        return chain.then(function () {
          var ms = +row.getAttribute('data-check') || 0;
          if (!ms) { resolve(row); return wait(120, id); }
          row.classList.remove('is-wait');
          row.classList.add('is-check');
          return wait(ms, id).then(function () { resolve(row); });
        });
      }, Promise.resolve());
  }

  function travel(p, id) {
    card.classList.add('is-moving');
    setP(p);
    return wait(TRAVEL, id).then(function () { card.classList.remove('is-moving'); });
  }

  // One round: fade in empty, travel, stamp, hold, fade out
  function cycle(id) {
    reset();
    card.classList.remove('is-fading');
    return wait(FADE, id).then(function () {
      reach(0);
      return checkRows(0, id);
    }).then(function () {
      return wait(350, id);
    }).then(function () {
      return travel(0.5, id);
    }).then(function () {
      reach(1);
      return checkRows(1, id);
    }).then(function () {
      return wait(300, id);
    }).then(function () {
      return travel(1, id);
    }).then(function () {
      reach(2);
      card.classList.add('is-delivered');
      return checkRows(2, id);
    }).then(function () {
      return wait(350, id);
    }).then(function () {
      card.classList.add('is-stamped');
      return wait(190, id);    // the moment the stamp hits the paper
    }).then(function () {
      card.classList.add('is-thud');
      return wait(HOLD, id);
    }).then(function () {
      card.classList.add('is-fading');
      return wait(FADE, id);
    });
  }

  function start() {
    if (running) return;
    running = true;
    var id = ++run;
    // flat loop rather than recursion, so promises don't pile up over hours
    (function loop() { cycle(id).then(loop, function () { /* stopped */ }); })();
  }
  function stop() {
    if (!running) return;
    running = false;
    run++;
  }

  setTimes();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) { start(); return; }

  var visible = false;
  function update() { visible && !document.hidden ? start() : stop(); }
  new IntersectionObserver(function (entries) {
    visible = entries[entries.length - 1].isIntersecting;
    update();
  }, { threshold: 0.3 }).observe(card);
  document.addEventListener('visibilitychange', update);
})();
