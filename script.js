function setLang(lang) {
  document.querySelectorAll('[data-en]').forEach(function(el) {
    var val = el.dataset.en;
    if (lang === 'sr' && el.dataset.sr) val = el.dataset.sr;
    if (lang === 'ru' && el.dataset.ru) val = el.dataset.ru;
    el.textContent = val;
  });
  document.querySelectorAll('.lang-switch button').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  localStorage.setItem('brewslee-lang', lang);
  document.documentElement.lang = lang;
}

document.addEventListener('DOMContentLoaded', function() {
  var saved   = localStorage.getItem('brewslee-lang');
  var browser = (navigator.language || '').toLowerCase();
  var isSr    = browser.startsWith('sr') || browser.startsWith('hr') ||
                browser.startsWith('bs') || browser.startsWith('cnr');
  var isRu    = browser.startsWith('ru');
  setLang(saved || (isRu ? 'ru' : (isSr ? 'sr' : 'en')));
});
