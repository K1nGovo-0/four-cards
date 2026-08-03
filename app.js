(function () {
  'use strict';

  var STORAGE_KEY = 'four-card-streak:v1';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var quoteTexts = Array.prototype.slice.call(document.querySelectorAll('.quote-text'));
  var streakCount = document.getElementById('streakCount');
  var streakPill = document.getElementById('streakPill');
  var installBtn = document.getElementById('installBtn');

  var QUOTES = [
    '种一棵树最好的时间是十年前，其次是现在。',
    '山再高，往上攀，总能登顶。',
    '你坚持的东西，总有一天会反过来拥抱你。',
    '每天进步一点点，坚持带来大改变。',
    '星光不问赶路人，时光不负有心人。',
    '慢慢来，比较快。',
    '所有的为时已晚，其实都是恰逢其时。',
    '不要害怕走得慢，只要一直在走。',
    '最远的距离是知道和做到。',
    '今天不走，明天要跑。',
    '所谓坚持，就是犹豫着退缩着，但还在往前走。',
    '低谷是上坡路的前奏。',
    '把简单的事做好，就是不简单。',
    '你只管努力，剩下的交给时间。',
    '先成为自己的光，再照亮别人。',
    '困难是化了妆的礼物。',
    '水滴石穿，不是水的力量，是重复的力量。',
    '做三四月的事，八九月自有答案。',
    '不积跬步，无以至千里。',
    '努力是会上瘾的，尤其是尝到甜头之后。',
    '心若有所向往，何惧道阻且长。',
    '每一次跌倒，都是为了站得更稳。',
    '完成比完美更重要。',
    '今天比昨天好，就是进步。',
    '怕什么真理无穷，进一寸有一寸的欢喜。',
    '若你决定灿烂，山无遮，海无拦。',
    '熬过无人问津的日子，才有诗和远方。',
    '凡是过往，皆为序章。',
    '生活原本沉闷，但跑起来就有风。',
    '半山腰太挤，你要去山顶看看。',
    '未来的你，一定会感谢现在拼命的自己。',
    '再小的努力，乘以 365 都很明显。',
    '把每一天都当作重新出发。',
    '坚持下去，不是因为看见希望，而是坚持了才有希望。',
    '现在的汗水，会变成未来的底气。',
    '所有的美好，都在你坚持的路上。'
  ];

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

  function hashString(value) {
    var hash = 0;
    for (var i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dailyQuotes() {
    var seed = hashString(dateKey(new Date()));
    var random = mulberry32(seed);
    var pool = QUOTES.slice();

    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var swap = pool[i];
      pool[i] = pool[j];
      pool[j] = swap;
    }

    return pool.slice(0, 4);
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
