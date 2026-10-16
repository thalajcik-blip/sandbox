/* Hero — live inbox feed. See hero-live.css.
   POOL[0..4] are the five rows already in the markup; the feed continues
   from POOL[5] and wraps. With 12 invoices and at most 6 rows in the DOM,
   the same invoice is never on screen twice. Due dates and years in
   `meta` are dates.js tokens, so they are always relative to today. The
   loop only runs while the box is on screen. */
(function () {
  var card = document.querySelector('[data-inbox]');
  if (!card) return;
  var list = card.querySelector('[data-list]');

  var ROWS = 5;
  var EVERY = 2600;      // ms between arrivals
  var ENTER = 500;       // ms, matches the height transition
  var CHECK_OK = 900;    // ms of "Kontrolujem" before a clean verdict
  var CHECK_WARN = 1400; // a little longer when something is found

  var OK = { dot: 'ok', badge: 'g', text: 'V poriadku' };
  var POOL = [
    { who: 'Palivá Východ, a.s.', meta: '{YYYY}/004512 · splatnosť {+14}', amt: '1 344,24 €', v: { dot: 'hi', badge: 'w', text: 'Zmena účtu' } },
    { who: 'Stavebniny Juh s.r.o.', meta: 'FA{YY}-0881 · splatnosť {+10}', amt: '4 902,00 €', v: { dot: 'mid', badge: 'w', text: 'Duplicita' } },
    { who: 'Telekom Plus, a.s.', meta: '9261140088 · splatnosť {+17}', amt: '96,48 €', v: OK },
    { who: 'Kancelárske potreby s.r.o.', meta: '{YY}0900117 · splatnosť {+21}', amt: '213,90 €', v: OK },
    { who: 'Pekáreň Lipa s.r.o.', meta: '{YYYY}/0219 · splatnosť {+7}', amt: '58,30 €', v: OK },
    { who: 'Energia Stred, a.s.', meta: '7300912284 · splatnosť {+15}', amt: '412,75 €', v: OK },
    { who: 'Stavby Orava s.r.o.', meta: 'FA-{YYYY}-118 · splatnosť {+30}', amt: '2 760,00 €', v: { dot: 'hi', badge: 'w', text: 'Účet mimo FS' } },
    { who: 'Autoservis Kováč', meta: '{YY}-0412 · splatnosť {+14}', amt: '389,00 €', v: OK },
    { who: 'IT Služby Tatry s.r.o.', meta: '{YYYY}100 · splatnosť {+21}', amt: '1 180,00 €', v: OK },
    { who: 'Logistika Dunaj s.r.o.', meta: 'LD{YY}-3307 · splatnosť {+12}', amt: '1 905,60 €', v: { dot: 'mid', badge: 'w', text: 'Duplicita' } },
    { who: 'Čistiareň Biela', meta: '0921/{YY} · splatnosť {+7}', amt: '74,20 €', v: OK },
    { who: 'Tlačiareň Prešov s.r.o.', meta: 'TP-{YY}-551 · splatnosť {+14}', amt: '640,00 €', v: OK }
  ];

  var next = ROWS;
  var timer = null;
  var fill = window.BillexDates.fill;

  // the rows already in the markup get today's dates too
  Array.prototype.forEach.call(list.children, function (li, i) {
    li.querySelector('.who small').textContent = fill(POOL[i].meta);
  });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function makeRow(item) {
    var li = el('li', 'shot-row inbox-row is-entering is-checking');
    li.appendChild(el('span', 'dot ' + item.v.dot));
    var who = el('span', 'who', item.who);
    who.appendChild(el('small', '', fill(item.meta)));
    li.appendChild(who);
    var pill = el('span', 'badge c');
    pill.appendChild(el('i'));
    pill.appendChild(document.createTextNode('Kontrolujem'));
    li.appendChild(pill);
    li.appendChild(el('span', 'badge ' + item.v.badge, item.v.text));
    li.appendChild(el('span', 'amt', item.amt));
    return li;
  }

  function arrive() {
    var item = POOL[next % POOL.length];
    next++;
    var li = makeRow(item);
    list.insertBefore(li, list.firstChild);
    void li.offsetHeight;
    li.classList.remove('is-entering');

    // the row pushed past the last slot is now outside the box
    setTimeout(function () {
      while (list.children.length > ROWS) list.lastElementChild.remove();
    }, ENTER + 50);

    setTimeout(function () {
      li.classList.remove('is-checking');
      li.classList.add('is-resolved');
    }, ENTER + (item.v === OK ? CHECK_OK : CHECK_WARN));
  }

  // One timeout chain, so arrivals stay exactly EVERY apart even when the
  // loop is paused and resumed; the first comes soon after the box shows up.
  function tick() {
    arrive();
    timer = setTimeout(tick, EVERY);
  }
  function start() {
    if (timer) return;
    timer = setTimeout(tick, 600);
  }
  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) { start(); return; }

  var visible = false;
  new IntersectionObserver(function (entries) {
    visible = entries[entries.length - 1].isIntersecting;
    visible && !document.hidden ? start() : stop();
  }, { threshold: 0.2 }).observe(card);

  document.addEventListener('visibilitychange', function () {
    visible && !document.hidden ? start() : stop();
  });
})();
