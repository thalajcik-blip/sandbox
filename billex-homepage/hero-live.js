/* Hero — live inbox. See hero-live.css for the idea.
   Arrival order is the reverse of the markup order: rows are prepended, so
   the last one in the markup arrives first and the most important warning
   lands on top, last. Arrivals overlap; each row runs its own check. */
(function () {
  var card = document.querySelector('[data-inbox]');
  if (!card) return;

  var live = card.querySelector('[data-live]');
  var list = card.querySelector('[data-list]');
  var count = card.querySelector('[data-count]');
  var foot = card.querySelector('[data-foot]');
  var replay = card.querySelector('[data-replay]');
  var items = Array.prototype.slice.call(list.children);
  var toggles = list.querySelectorAll('button.shot-row');

  var START_DELAY = 400;  // ms after the card comes into view
  var STAGGER = 700;      // ms between two arrivals
  var ENTER = 380;        // ms, matches the grid-template-rows transition
  var OPEN_AFTER = 600;   // ms after the last verdict before the top warning opens

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var run = 0;            // bumping this cancels a sequence in flight
  var userTouched = false;

  // Ghost: the final state, invisible, in the same grid cell as the live
  // layer. It sizes the card, so arrivals and the opening detail never
  // change the card's height.
  var ghost = live.cloneNode(true);
  ghost.classList.add('inbox-ghost');
  ghost.removeAttribute('data-live');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost.querySelectorAll('[data-replay]').forEach(function (el) { el.hidden = false; });
  // no ids or data hooks, so nothing (including later lookups) can hit the copy
  ghost.querySelectorAll('[id], [data-list], [data-empty], [data-foot], [data-replay]').forEach(function (el) {
    ['id', 'data-list', 'data-empty', 'data-foot', 'data-replay'].forEach(function (a) { el.removeAttribute(a); });
  });
  live.parentNode.insertBefore(ghost, live);

  // "Kontrolujem" pill for each row
  items.forEach(function (item) {
    var pill = document.createElement('span');
    pill.className = 'badge c';
    pill.innerHTML = '<i></i>Kontrolujem';
    var verdict = item.querySelector('.badge');
    verdict.parentNode.insertBefore(pill, verdict);
  });

  // Accordion: one explanation open at a time
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      userTouched = true;
      var open = btn.getAttribute('aria-expanded') === 'true';
      toggles.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject(); }, ms);
    });
  }

  function plural(n) {
    return n === 1 ? '1 nová' : n < 5 ? n + ' nové' : n + ' nových';
  }

  function setCount(n) {
    count.textContent = plural(n);
    count.classList.toggle('is-zero', n === 0);
    if (n > 0) {
      count.classList.remove('bump');
      void count.offsetWidth;
      count.classList.add('bump');
    }
  }

  function reset() {
    items.forEach(function (item) {
      item.remove();
      item.classList.remove('is-checking', 'is-resolved', 'is-entering', 'clip');
    });
    toggles.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); b.disabled = true; });
    card.classList.add('is-empty');
    foot.classList.add('is-pending');
    replay.hidden = true;
    setCount(0);
    userTouched = false;
  }

  function showFinal() {
    items.forEach(function (item) {
      item.classList.remove('is-checking', 'is-entering', 'clip');
      list.appendChild(item);
    });
    toggles.forEach(function (b, i) { b.disabled = false; b.setAttribute('aria-expanded', i === 0 ? 'true' : 'false'); });
    card.classList.remove('is-empty');
    foot.classList.remove('is-pending');
    count.textContent = plural(items.length);
    count.classList.remove('is-zero');
  }

  function arrive(item, id) {
    item.classList.add('is-entering', 'clip', 'is-checking');
    list.insertBefore(item, list.firstChild);
    card.classList.remove('is-empty');
    void item.offsetHeight;
    item.classList.remove('is-entering');
    setCount(list.children.length);

    return wait(ENTER, id).then(function () {
      item.classList.remove('clip');
      return wait(+item.getAttribute('data-check') || 800, id);
    }).then(function () {
      item.classList.remove('is-checking');
      item.classList.add('is-resolved');
      var btn = item.querySelector('button.shot-row');
      if (btn) btn.disabled = false;
    });
  }

  function play() {
    var id = ++run;
    reset();
    var order = items.slice().reverse();

    wait(START_DELAY, id).then(function () {
      var checks = order.map(function (item, i) {
        return wait(i * STAGGER, id).then(function () { return arrive(item, id); });
      });
      return Promise.all(checks);
    }).then(function () {
      return wait(OPEN_AFTER, id);
    }).then(function () {
      if (!userTouched) toggles[0].setAttribute('aria-expanded', 'true');
      return wait(250, id);
    }).then(function () {
      foot.classList.remove('is-pending');
      replay.hidden = false;
    }).catch(function () { /* cancelled by a newer run */ });
  }

  replay.addEventListener('click', function () {
    play();
    // keep keyboard focus somewhere sensible while the button is hidden
    card.setAttribute('tabindex', '-1');
    card.focus({ preventScroll: true });
  });

  if (reduced.matches || !('IntersectionObserver' in window)) {
    showFinal();
    return;
  }

  // Empty the card right away so the final state never flashes, then
  // start once it is actually on screen (below the fold on phones).
  card.classList.add('no-motion');
  reset();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { card.classList.remove('no-motion'); });
  });
  var io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) {
      io.disconnect();
      play();
    }
  }, { threshold: 0.3 });
  io.observe(card);
})();
