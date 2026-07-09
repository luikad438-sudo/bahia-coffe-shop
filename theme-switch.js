/* ============================================================
   Style switcher for the preview page.
   Swaps the active theme stylesheet and remembers the choice.
   ============================================================ */
(function () {
  'use strict';

  var THEMES = {
    glass:     { file: 'theme-glass.css',     color: '#F7F1E7' },
    editorial: { file: 'theme-editorial.css', color: '#F3ECE0' },
    noir:      { file: 'theme-noir.css',      color: '#14100B' }
  };
  var STORAGE_KEY = 'bahia-theme';

  var link = document.getElementById('theme-css');
  var meta = document.querySelector('meta[name="theme-color"]');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-theme]'));

  function apply(name) {
    var t = THEMES[name] || THEMES.glass;
    if (link) link.setAttribute('href', t.file);
    if (meta) meta.setAttribute('content', t.color);
    document.documentElement.setAttribute('data-theme', name);
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-theme') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem(STORAGE_KEY, name); } catch (e) {}
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-theme')); });
  });

  var saved;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  apply(saved && THEMES[saved] ? saved : 'glass');
})();
