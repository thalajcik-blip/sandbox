/* Dates for the demo animations, computed from today so the page never
   looks stale. Load before the animation scripts (they all use defer,
   which keeps document order).

   fill() understands three tokens in a string:
     {YYYY}  current year            2026
     {YY}    current year, 2 digits  26
     {+N}    day and month N days from today, Slovak style   "21. 9."

   Elements with data-fill="…" get their text from fill() on load. */
window.BillexDates = (function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function inDays(n) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);   // midday: no DST edge cases when adding days
    d.setDate(d.getDate() + n);
    return d;
  }

  function fill(s) {
    var y = String(new Date().getFullYear());
    return s
      .replace(/\{YYYY\}/g, y)
      .replace(/\{YY\}/g, y.slice(2))
      .replace(/\{\+(\d+)\}/g, function (_, n) {
        var d = inDays(+n);
        return d.getDate() + '. ' + (d.getMonth() + 1) + '.';
      });
  }

  return {
    fill: fill,
    // 07.09.2026
    dots: function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); },
    // 07. 09. 2026
    spaced: function (d) { return pad(d.getDate()) + '. ' + pad(d.getMonth() + 1) + '. ' + d.getFullYear(); },
    // 08:14:22
    hms: function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); },
    // 08:14
    hm: function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  };
})();

document.querySelectorAll('[data-fill]').forEach(function (el) {
  el.textContent = window.BillexDates.fill(el.getAttribute('data-fill'));
});
