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

function setTab(tabName, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var panel = document.getElementById('tab-' + tabName);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  localStorage.setItem('brewslee-tab', tabName);
}

/* Telegram Login Widget callback */
function onTelegramAuth(user) {
  fetch('/.netlify/functions/check-member', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var loginEl = document.getElementById('order-login');
    var formEl  = document.getElementById('order-form');
    if (data.is_member) {
      if (loginEl) loginEl.style.display = 'none';
      if (formEl)  formEl.style.display  = 'block';
      var greet = document.getElementById('order-greeting');
      if (greet) greet.textContent = 'Hi, ' + user.first_name + ' 👋 What can we get you?';
    } else {
      if (loginEl) {
        loginEl.innerHTML =
          '<p style="color:var(--muted);font-size:14px;margin:0 0 12px;">Hey ' + user.first_name +
          ' — you\'re not in the club yet.</p>' +
          '<a class="btn btn-primary" href="https://t.me/brewslee_bar_bot" target="_blank" rel="noopener">' +
          '🐉 Join BrewsLee Club</a>';
      }
    }
  })
  .catch(function() {
    /* If the function isn't deployed yet, fall back gracefully */
    var loginEl = document.getElementById('order-login');
    if (loginEl) {
      loginEl.innerHTML =
        '<p style="color:var(--muted);font-size:14px;margin:0 0 12px;">Open the bot to place your order.</p>' +
        '<a class="btn btn-primary" href="https://t.me/brewslee_bar_bot" target="_blank" rel="noopener">' +
        '📲 Open BrewsLee Bot</a>';
    }
  });
}

/* Build Telegram deep-link with order items */
function sendOrder() {
  var items = Array.from(document.querySelectorAll('.order-check:checked'))
    .map(function(cb) { return '• ' + cb.dataset.item; });
  if (items.length === 0) {
    alert('Select at least one item.');
    return;
  }
  var note = (document.getElementById('order-note') || {}).value || '';
  var msg  = '🍺 Order:\n' + items.join('\n');
  if (note.trim()) msg += '\n📝 ' + note.trim();
  /* Encode into Telegram deep-link start param (max 64 chars base64) */
  var encoded = btoa(unescape(encodeURIComponent(msg))).slice(0, 60).replace(/[+/=]/g, '');
  gtag('event', 'click_send_order', { event_category: 'order', event_label: items.length + '_items' });
  window.open('https://t.me/brewslee_bar_bot?start=order_' + encoded, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
  /* Restore language */
  var savedLang = localStorage.getItem('brewslee-lang');
  var browser   = (navigator.language || '').toLowerCase();
  var isSr = browser.startsWith('sr') || browser.startsWith('hr') ||
             browser.startsWith('bs') || browser.startsWith('cnr');
  var isRu = browser.startsWith('ru');
  setLang(savedLang || (isRu ? 'ru' : (isSr ? 'sr' : 'en')));

  /* Restore active tab */
  var savedTab = localStorage.getItem('brewslee-tab') || 'drinks';
  setTab(savedTab, document.querySelector('.tab-btn[data-tab="' + savedTab + '"]'));

  /* Generate QR code */
  var qrEl = document.getElementById('qr-canvas');
  if (qrEl && typeof QRCode !== 'undefined') {
    new QRCode(qrEl, {
      text: 'https://brewsleebar.me',
      width: 84,
      height: 84,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
});
