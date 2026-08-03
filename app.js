(function () {
  'use strict';

  var STORAGE_KEY = 'four-card-streak:v1';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var quoteTexts = Array.prototype.slice.call(document.querySelectorAll('.quote-text'));
  var streakCount = document.getElementById('streakCount');
  var streakPill = document.getElementById('streakPill');
  var installBtn = document.getElementById('installBtn');

  var QUOTE_STATE_KEY = 'four-card-quotes:v1';
  var QUOTES = window.QUOTES || [];
  var quoteState = loadQuoteState();

  function loadQuoteState() {
    try {
      var raw = JSON.parse(localStorage.getItem(QUOTE_STATE_KEY) || '{}');
      return {
        block: Number(raw.block) || 0,
        lastDate: typeof raw.lastDate === 'string' ? raw.lastDate : ''
      };
    } catch (error) {
      return { block: 0, lastDate: '' };
    }
  }

  function saveQuoteState(state) {
    try {
      localStorage.setItem(QUOTE_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      // Storage may be unavailable in private browsing.
    }
  }

  function dateKey(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function shiftDate(key, days) {
    var parts = key.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + days);
    return dateKey(date);
  }

  function dailyQuotes() {
    if (!QUOTES.length) {
      return [];
    }

    var today = dateKey(new Date());
    var block = quoteState.block;
    var usedBlock;

    if (quoteState.lastDate === today) {
      usedBlock = (block - 4 + QUOTES.length) % QUOTES.length;
    } else {
      usedBlock = block;
      quoteState.block = (block + 4) % QUOTES.length;
      quoteState.lastDate = today;
      saveQuoteState(quoteState);
    }

    return QUOTES.slice(usedBlock, usedBlock + 4);
  }

  function loadStreak() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        streak: Number(raw.streak) || 0,
        lastDate: typeof raw.lastDate === 'string' ? raw.lastDate : ''
      };
    } catch (error) {
      return { streak: 0, lastDate: '' };
    }
  }

  function saveStreak(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // Storage may be unavailable in private browsing; the app still works for the session.
    }
  }

  function renderStreak() {
    var today = dateKey(new Date());
    var yesterday = shiftDate(today, -1);
    var data = loadStreak();
    var shown = data.streak;

    if (data.lastDate && data.lastDate < yesterday) {
      shown = 0;
    }

    streakCount.textContent = String(shown);
    streakPill.classList.toggle('is-checked', data.lastDate === today);
  }

  function checkIn() {
    var today = dateKey(new Date());
    var yesterday = shiftDate(today, -1);
    var data = loadStreak();

    if (data.lastDate === today) {
      return;
    }

    var nextStreak = data.lastDate === yesterday ? data.streak + 1 : 1;
    saveStreak({ streak: nextStreak, lastDate: today });
    renderStreak();

    streakPill.classList.remove('bump');
    void streakPill.offsetWidth;
    streakPill.classList.add('bump');
  }

  var renderedDay = dateKey(new Date());

  function applyDailyContent() {
    var today = dateKey(new Date());
    var picked = dailyQuotes();

    quoteTexts.forEach(function (quote, index) {
      quote.textContent = picked[index] || quote.textContent;
    });

    renderStreak();

    if (today !== renderedDay) {
      renderedDay = today;
      streakPill.classList.remove('bump');
      void streakPill.offsetWidth;
      streakPill.classList.add('bump');
    }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
      checkIn();
    });
  });

  applyDailyContent();

  window.addEventListener('focus', applyDailyContent);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      applyDailyContent();
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (error) {
        console.warn('Service worker registration failed:', error);
      });
    });
  }

  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    installBtn.hidden = true;
    deferredPrompt = null;
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  });
})();
