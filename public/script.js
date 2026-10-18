// انار شاہ سروے - صارف کی طرف

(function () {
  'use strict';

  var form = document.getElementById('surveyForm');
  var submitBtn = document.getElementById('submitBtn');
  var starsBox = document.getElementById('stars');
  var stars = Array.prototype.slice.call(starsBox.querySelectorAll('.star'));
  var ratingText = document.getElementById('ratingText');
  var toastEl = document.getElementById('toast');

  var SUBMIT_LABEL = 'سروے بھیجیں 🚀';
  var LOADING_LABEL = 'بھیجا جا رہا ہے...';
  var ratingLabels = ['ابھی ریٹنگ نہیں دی', 'بہت خراب', 'خراب', 'ٹھیک ہے', 'اچھا', 'بہت اچھا'];

  var rating = 0;
  var toastTimer = null;

  // ----- Toast -----
  function showToast(message, type) {
    toastEl.textContent = message;
    toastEl.className = 'toast ' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 4000);
  }

  // ----- Stars -----
  function paintStars(upTo, cssClass) {
    stars.forEach(function (star) {
      var value = Number(star.dataset.value);
      star.classList.toggle(cssClass, value <= upTo);
    });
  }

  function setRating(value) {
    rating = value;
    paintStars(rating, 'active');
    stars.forEach(function (star) {
      star.setAttribute('aria-checked', Number(star.dataset.value) === rating ? 'true' : 'false');
    });
    ratingText.textContent = rating ? ratingLabels[rating] + ' (' + rating + ' / 5)' : ratingLabels[0];
    if (rating) clearError('rating');
  }

  stars.forEach(function (star) {
    var value = Number(star.dataset.value);
    star.addEventListener('mouseenter', function () {
      paintStars(value, 'hover');
    });
    star.addEventListener('click', function () {
      setRating(value);
    });
  });
  starsBox.addEventListener('mouseleave', function () {
    paintStars(0, 'hover');
  });

  // ----- Errors -----
  function showError(field, message) {
    var el = document.getElementById('err_' + field);
    if (el) el.textContent = message;
    var input = document.getElementById(field);
    if (input) input.classList.add('invalid');
  }

  function clearError(field) {
    var el = document.getElementById('err_' + field);
    if (el) el.textContent = '';
    var input = document.getElementById(field);
    if (input) input.classList.remove('invalid');
  }

  ['business_idea', 'missing_thing', 'phone'].forEach(function (field) {
    var input = document.getElementById(field);
    input.addEventListener('input', function () {
      clearError(field);
    });
  });

  // ----- Validation -----
  function validate(data) {
    var firstBad = null;

    if (!data.business_idea) {
      showError('business_idea', 'یہ سوال ضروری ہے۔ برائے مہربانی جواب لکھیں۔');
      firstBad = firstBad || 'business_idea';
    }
    if (!data.missing_thing) {
      showError('missing_thing', 'یہ سوال ضروری ہے۔ برائے مہربانی جواب لکھیں۔');
      firstBad = firstBad || 'missing_thing';
    }
    if (!data.rating) {
      showError('rating', 'برائے مہربانی ریٹنگ دیں (1 سے 5 ستارے)۔');
      firstBad = firstBad || 'stars';
    }
    if (data.phone && !/^[0-9+\-\s]{7,20}$/.test(data.phone)) {
      showError('phone', 'فون نمبر درست نہیں ہے۔ مثال: 03XX-XXXXXXX');
      firstBad = firstBad || 'phone';
    }

    if (firstBad) {
      var target = document.getElementById(firstBad);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.focus && firstBad !== 'stars') target.focus({ preventScroll: true });
      }
      return false;
    }
    return true;
  }

  // ----- Submit -----
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? LOADING_LABEL : SUBMIT_LABEL;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var data = {
      business_idea: form.business_idea.value.trim(),
      missing_thing: form.missing_thing.value.trim(),
      improve_thing: form.improve_thing.value.trim(),
      suggestions: form.suggestions.value.trim(),
      rating: rating,
      phone: form.phone.value.trim(),
      extra_note: form.extra_note.value.trim(),
      website: form.website.value // honeypot
    };

    if (!validate(data)) {
      showToast('برائے مہربانی ضروری سوالوں کے جواب دیں', 'error');
      return;
    }

    setLoading(true);

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (json) {
          return { ok: response.ok, json: json };
        });
      })
      .then(function (result) {
        if (result.ok && result.json.success) {
          form.reset();
          setRating(0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('شکریہ! آپ کی رائے محفوظ ہو گئی', 'success');
        } else {
          showToast('کچھ مسئلہ آ گیا۔ دوبارہ کوشش کریں', 'error');
        }
      })
      .catch(function () {
        showToast('انٹرنیٹ کا مسئلہ ہے۔ دوبارہ کوشش کریں', 'error');
      })
      .then(function () {
        setLoading(false);
      });
  });
})();