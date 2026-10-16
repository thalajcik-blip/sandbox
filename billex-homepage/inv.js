/* Fakturácia — self-filling invoice, endless loop. See inv.css.
   Each round opens on a large IČO field centred in the card; once the
   number is typed, the field glides up and shrinks into its place in the
   invoice (a FLIP: the field stays in its final spot in the layout and is
   only transformed, so nothing below it moves). The loop only runs while the card is on screen and the tab is visible;
   when it pauses mid-way it restarts from an empty invoice. */
(function () {
  var card = document.querySelector('[data-inv]');
  if (!card) return;

  var body = card.querySelector('.body');
  var input = card.querySelector('.inv-input');
  var caption = card.querySelector('.inv-intro-label');
  var ico = card.querySelector('[data-inv-ico]');
  var company = card.querySelector('[data-inv-step="company"]');
  var lines = Array.prototype.slice.call(card.querySelectorAll('[data-inv-step="line"]'));
  var send = card.querySelector('[data-inv-step="send"]');
  var total = card.querySelector('[data-inv-total]');

  var ICO = ico.textContent;
  var TOTAL = +total.getAttribute('data-inv-total');
  var TYPE_MS = 85;      // per digit
  var SETTLE_MS = 650;   // matches the .inv-input transform transition
  var SEARCH_MS = 700;   // register lookup
  var LINE_MS = 230;     // between invoice lines
  var COUNT_MS = 650;    // total count-up
  var HOLD_MS = 3200;    // finished invoice stays up this long
  var FADE_MS = 350;     // matches .inv .body opacity transition

  var money = new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var run = 0;           // bumping this cancels the loop in flight
  var running = false;

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject(); }, ms);
    });
  }

  // Transform that takes the input from its place in the invoice to the
  // middle of the card at intro size; the caption sits just above it.
  function placeIntro() {
    input.style.transform = '';
    var b = body.getBoundingClientRect();
    var r = input.getBoundingClientRect();
    var scale = window.innerWidth <= 560 ? 1.4 : 1.7;
    var cy = b.height / 2 + 16;                      // input centre, from body top
    var dx = (b.left + b.width / 2) - (r.left + r.width / 2);
    var dy = (b.top + cy) - (r.top + r.height / 2);
    input.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';
    caption.style.top = (cy - r.height * scale / 2 - 14) + 'px';
  }

  function reset() {
    card.classList.add('no-motion');
    card.classList.add('is-intro');
    placeIntro();
    card.classList.remove('is-typing');
    ico.textContent = '';
    company.classList.remove('is-search');
    [company, send].concat(lines).forEach(function (el) {
      el.classList.remove('is-in');
      el.classList.add('is-pending');
    });
    total.textContent = money.format(0) + ' €';
    void card.offsetHeight;
    card.classList.remove('no-motion');
  }

  function countUp(id) {
    return new Promise(function (resolve, reject) {
      var t0 = performance.now();
      function tick(now) {
        if (id !== run) return reject();
        var k = Math.min(1, (now - t0) / COUNT_MS);
        total.textContent = money.format(TOTAL * (1 - Math.pow(1 - k, 3))) + ' €';
        if (k < 1) requestAnimationFrame(tick); else resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  function cycle(id) {
    reset();
    card.classList.remove('is-fading');
    var chain = wait(FADE_MS + 250, id).then(function () { card.classList.add('is-typing'); });
    ICO.split('').forEach(function (ch) {
      chain = chain.then(function () {
        ico.textContent += ch;
        return wait(TYPE_MS, id);
      });
    });
    return chain.then(function () {
      return wait(350, id);
    }).then(function () {
      // glide into place
      card.classList.remove('is-typing', 'is-intro');
      input.style.transform = '';
      return wait(SETTLE_MS + 100, id);
    }).then(function () {
      company.classList.remove('is-pending');
      company.classList.add('is-search');
      return wait(SEARCH_MS, id);
    }).then(function () {
      company.classList.remove('is-search');
      return lines.reduce(function (c, line, i) {
        return c.then(function () { return wait(i ? LINE_MS : LINE_MS + 120, id); })
          .then(function () { line.classList.remove('is-pending'); });
      }, Promise.resolve());
    }).then(function () {
      return countUp(id);
    }).then(function () {
      return wait(150, id);
    }).then(function () {
      send.classList.remove('is-pending');
      send.classList.add('is-in');
      return wait(HOLD_MS, id);
    }).then(function () {
      card.classList.add('is-fading');
      return wait(FADE_MS, id);
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
    card.classList.remove('is-fading');
  }

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
