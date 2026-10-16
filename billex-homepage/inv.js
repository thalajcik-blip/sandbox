/* Fakturácia — self-filling editor + feature views. See inv.css. */
(function () {
  var card = document.querySelector('[data-inv]');
  if (!card) return;

  var title = card.querySelector('[data-inv-title]');
  var back = card.querySelector('[data-inv-back]');
  var replay = card.querySelector('[data-inv-replay]');
  var ico = card.querySelector('[data-inv-ico]');
  var company = card.querySelector('[data-inv-step="company"]');
  var lines = card.querySelectorAll('[data-inv-step="line"]');
  var send = card.querySelector('[data-inv-step="send"]');
  var total = card.querySelector('[data-inv-total]');
  var buttons = document.querySelectorAll('[data-inv-list] [data-show]');

  var ICO = ico.textContent;
  var TOTAL = +total.getAttribute('data-inv-total');
  var TYPE_MS = 75;      // per digit
  var SEARCH_MS = 700;   // register lookup
  var LINE_MS = 230;     // between invoice lines
  var COUNT_MS = 650;    // total count-up

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var current = 'editor';
  var run = 0;           // bumping this cancels an editor run in flight

  function view(name) { return card.querySelector('[data-view="' + name + '"]'); }

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject(); }, ms);
    });
  }

  function snap(fn) {
    card.classList.add('no-motion');
    fn();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { card.classList.remove('no-motion'); });
    });
  }

  // ── Editor ───────────────────────────────────────────────────────────────
  function editorReset() {
    card.classList.remove('is-typing');
    ico.textContent = '';
    company.classList.remove('is-search');
    [company, send].concat(Array.prototype.slice.call(lines)).forEach(function (el) {
      el.classList.remove('is-in');
      el.classList.add('is-pending');
    });
    total.textContent = money.format(0) + ' €';
    replay.hidden = true;
  }

  function editorFinal() {
    card.classList.remove('is-typing');
    ico.textContent = ICO;
    company.classList.remove('is-search');
    [company, send].concat(Array.prototype.slice.call(lines)).forEach(function (el) {
      el.classList.remove('is-pending', 'is-in');
    });
    total.textContent = money.format(TOTAL) + ' €';
  }

  function countUp(id) {
    return new Promise(function (resolve, reject) {
      var t0 = performance.now();
      function tick(now) {
        if (id !== run) return reject();
        var k = Math.min(1, (now - t0) / COUNT_MS);
        var eased = 1 - Math.pow(1 - k, 3);
        total.textContent = money.format(TOTAL * eased) + ' €';
        if (k < 1) requestAnimationFrame(tick); else resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  function playEditor() {
    var id = ++run;
    snap(editorReset);
    var chain = wait(450, id).then(function () { card.classList.add('is-typing'); });
    ICO.split('').forEach(function (ch) {
      chain = chain.then(function () {
        ico.textContent += ch;
        return wait(TYPE_MS, id);
      });
    });
    chain.then(function () {
      return wait(220, id);
    }).then(function () {
      card.classList.remove('is-typing');
      company.classList.remove('is-pending');
      company.classList.add('is-search');
      return wait(SEARCH_MS, id);
    }).then(function () {
      company.classList.remove('is-search');
      var c = wait(LINE_MS + 120, id);
      Array.prototype.forEach.call(lines, function (line, i) {
        c = c.then(function () {
          line.classList.remove('is-pending');
          return wait(i === lines.length - 1 ? 0 : LINE_MS, id);
        });
      });
      return c;
    }).then(function () {
      return countUp(id);
    }).then(function () {
      return wait(150, id);
    }).then(function () {
      send.classList.remove('is-pending');
      send.classList.add('is-in');
      return wait(500, id);
    }).then(function () {
      if (current === 'editor') replay.hidden = false;
    }).catch(function () { /* cancelled */ });
  }

  // ── Views ────────────────────────────────────────────────────────────────
  function show(name) {
    if (name === current) return;
    var from = view(current);
    var to = view(name);

    if (current === 'editor') { run++; editorFinal(); }   // stop a run mid-way

    from.classList.add('is-off');
    from.inert = true;
    to.classList.remove('is-off');
    to.inert = false;
    to.classList.add('is-entering', 'is-stagger');
    void to.offsetHeight;
    to.classList.remove('is-entering');
    setTimeout(function () { to.classList.remove('is-stagger'); }, 700);

    current = name;
    title.textContent = to.getAttribute('data-title');
    back.hidden = name === 'editor';
    replay.hidden = name !== 'editor';
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-show') === name ? 'true' : 'false');
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-show');
      show(current === name ? 'editor' : name);
      // single-column layout: the preview sits below the list
      var r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        card.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  });
  back.addEventListener('click', function () { show('editor'); });
  replay.addEventListener('click', playEditor);

  if (reduced || !('IntersectionObserver' in window)) return;

  snap(editorReset);
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    if (current === 'editor') playEditor();
  }, { threshold: 0.5 });
  io.observe(card);
})();
