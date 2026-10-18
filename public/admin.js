// Anar Shah Survey - admin panel

(function () {
  'use strict';

  var STORAGE_KEY = 'anarshah_admin_pw';
  var REFRESH_MS = 30000;

  var loginScreen = document.getElementById('loginScreen');
  var loginForm = document.getElementById('loginForm');
  var loginBtn = document.getElementById('loginBtn');
  var loginError = document.getElementById('loginError');
  var passwordInput = document.getElementById('password');

  var dashboard = document.getElementById('dashboard');
  var logoutBtn = document.getElementById('logoutBtn');
  var refreshBtn = document.getElementById('refreshBtn');
  var updatedAt = document.getElementById('updatedAt');
  var dashError = document.getElementById('dashError');
  var tableBody = document.getElementById('tableBody');
  var emptyState = document.getElementById('emptyState');
  var statTotal = document.getElementById('statTotal');
  var statAvg = document.getElementById('statAvg');
  var statStars = document.getElementById('statStars');

  var timer = null;

  // ----- Helpers -----
  function getPassword() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setPassword(value) {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  function post(url, password) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (json) {
        return { status: response.status, ok: response.ok, json: json };
      });
    });
  }

  function starsText(n) {
    var full = Math.round(n);
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= full ? '\u2605' : '\u2606';
    return out;
  }

  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Sab data textContent se dikhaya jata hai (XSS se bachao)
  function makeCell(text, className) {
    var td = document.createElement('td');
    if (className) td.className = className;
    if (text === null || text === undefined || text === '') {
      td.textContent = '-';
      td.classList.add('muted');
    } else {
      td.textContent = String(text);
    }
    return td;
  }

  // ----- Screens -----
  function showLogin() {
    stopAutoRefresh();
    dashboard.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadData();
    startAutoRefresh();
  }

  function logout(message) {
    setPassword('');
    showLogin();
    loginError.textContent = message || '';
  }

  // ----- Data -----
  function renderStats(stats) {
    statTotal.textContent = stats.total;
    statAvg.textContent = stats.total ? stats.averageRating.toFixed(1) : '0';
    statStars.textContent = starsText(stats.averageRating);
  }

  function renderTable(rows) {
    tableBody.innerHTML = '';

    if (!rows.length) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    rows.forEach(function (row, index) {
      var tr = document.createElement('tr');
      tr.appendChild(makeCell(index + 1, 'nowrap'));
      tr.appendChild(makeCell(row.business_idea, 'text-cell'));
      tr.appendChild(makeCell(row.missing_thing, 'text-cell'));
      tr.appendChild(makeCell(row.improve_thing, 'text-cell'));
      tr.appendChild(makeCell(row.suggestions, 'text-cell'));

      var ratingTd = document.createElement('td');
      ratingTd.className = 'nowrap';
      var ratingSpan = document.createElement('span');
      ratingSpan.className = 'rating-stars';
      ratingSpan.textContent = starsText(row.rating);
      ratingTd.appendChild(ratingSpan);
      ratingTd.appendChild(document.createTextNode(' ' + row.rating + '/5'));
      tr.appendChild(ratingTd);

      tr.appendChild(makeCell(row.phone, 'nowrap'));
      tr.appendChild(makeCell(row.extra_note, 'text-cell'));
      tr.appendChild(makeCell(formatDate(row.created_at), 'nowrap'));
      tableBody.appendChild(tr);
    });
  }

  function loadData() {
    var password = getPassword();
    if (!password) {
      logout('');
      return Promise.resolve();
    }

    refreshBtn.disabled = true;
    dashError.textContent = '';

    return Promise.all([post('/api/stats', password), post('/api/responses', password)])
      .then(function (results) {
        var statsRes = results[0];
        var rowsRes = results[1];

        if (statsRes.status === 401 || rowsRes.status === 401) {
          logout('Ghalat password');
          return;
        }
        if (!statsRes.ok || !rowsRes.ok || !Array.isArray(rowsRes.json)) {
          dashError.textContent = 'Data load nahi ho saka. Refresh karein.';
          return;
        }

        renderStats(statsRes.json);
        renderTable(rowsRes.json);
        updatedAt.textContent = 'Aakhri update: ' + new Date().toLocaleTimeString('en-PK');
      })
      .catch(function () {
        dashError.textContent = 'Internet ka masla hai. Refresh karein.';
      })
      .then(function () {
        refreshBtn.disabled = false;
      });
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    timer = setInterval(loadData, REFRESH_MS);
  }

  function stopAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // ----- Events -----
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var password = passwordInput.value;
    if (!password) {
      loginError.textContent = 'Password likhein';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Check ho raha hai...';
    loginError.textContent = '';

    post('/api/verify-admin', password)
      .then(function (result) {
        if (result.ok && result.json.valid) {
          setPassword(password);
          showDashboard();
        } else if (result.status === 401) {
          loginError.textContent = 'Ghalat password';
        } else {
          loginError.textContent = result.json.error || 'Server mein masla hai';
        }
      })
      .catch(function () {
        loginError.textContent = 'Internet ka masla hai. Dobara koshish karein';
      })
      .then(function () {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      });
  });

  logoutBtn.addEventListener('click', function () {
    logout('');
  });

  refreshBtn.addEventListener('click', loadData);

  // Agar session mein password pehle se hai to seedha dashboard
  if (getPassword()) {
    showDashboard();
  } else {
    showLogin();
  }
})();