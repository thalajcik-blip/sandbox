/* Digitálny poštár — one invoice's journey. See route.css.
   Rows carry data-at (the stop where they become known) and optionally
   data-check (ms of "Overujem" before the verdict). */
(function () {
  var card = document.querySelector('[data-route]');
  if (!card) return;

  var map = card.querySelector('.route-map');
  var stops = card.querySelectorAll('.route-stops li');
  var rows = Array.prototype.slice.call(card.querySelectorAll('.shot-row[data-at]'));
  var replay = card.querySelector('[data-replay]');

  var TRAVEL = 900;      // ms per leg, matches --travel in route.css
  var START_DELAY = 300;
  var run = 0;           // bumping this cancels a sequence in flight

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

  function reset() {
    // snap back without animating (the envelope would otherwise fly home)
    card.classList.add('no-motion');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { card.classList.remove('no-motion'); });
    });
    card.classList.remove('is-final', 'is-moving', 'is-delivered', 'is-stamped', 'is-thud');
    stops.forEach(function (s) { s.classList.remove('is-on'); });
    rows.forEach(function (r) { r.classList.remove('is-check', 'is-in'); r.classList.add('is-wait'); });
    setP(0);
    replay.hidden = true;
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

  function play() {
    var id = ++run;
    reset();
    wait(START_DELAY, id).then(function () {
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
      return wait(700, id);
    }).then(function () {
      replay.hidden = false;
    }).catch(function () { /* cancelled by a newer run */ });
  }

  replay.addEventListener('click', function () {
    play();
    card.setAttribute('tabindex', '-1');
    card.focus({ preventScroll: true });
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  reset();

  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    play();
  }, { threshold: 0.5 });
  io.observe(card);
})();
