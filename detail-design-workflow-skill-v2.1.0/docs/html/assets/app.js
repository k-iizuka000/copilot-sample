/* 詳細設計ワークフロー解説HTML 共通スクリプト（正本）
   契約:
   - .step[data-num][data-reads][data-writes][data-stop] … 手順カード
   - .io-item[data-io-id] … 入力・出力カード（.io-out は出力）
   - #step-detail … 詳細カード（[data-f="title|note|reads|writes|stop"] を持つ）
   - .reset-flow … 全体表示に戻すボタン
   動き: 手順クリック→関係する入出力だけ点灯・他は減光。
         入出力クリック→それに触れる手順だけ点灯。もう一度クリックで解除。 */
(function () {
  'use strict';

  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var ios = Array.prototype.slice.call(document.querySelectorAll('.io-item'));
  var detail = document.getElementById('step-detail');
  if (!steps.length && !ios.length) return;

  function splitIds(attr) {
    return (attr || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function ioLabel(id) {
    var el = document.querySelector('.io-item[data-io-id="' + id + '"]');
    if (!el) return id;
    var name = el.querySelector('.io-name');
    return name ? name.textContent.trim() : el.textContent.trim();
  }

  function fill(field, value) {
    if (!detail) return;
    var el = detail.querySelector('[data-f="' + field + '"]');
    if (el) el.textContent = value;
  }

  function clearAll() {
    steps.forEach(function (s) { s.classList.remove('active', 'dim'); });
    ios.forEach(function (i) { i.classList.remove('lit', 'dim', 'selected'); });
    if (detail) { detail.hidden = true; detail.classList.remove('io-mode'); }
  }

  function showStep(step) {
    clearAll();
    step.classList.add('active');
    steps.forEach(function (s) { if (s !== step) s.classList.add('dim'); });

    var reads = splitIds(step.getAttribute('data-reads'));
    var writes = splitIds(step.getAttribute('data-writes'));
    ios.forEach(function (io) {
      var id = io.getAttribute('data-io-id');
      if (reads.indexOf(id) >= 0 || writes.indexOf(id) >= 0) io.classList.add('lit');
      else io.classList.add('dim');
    });

    if (detail) {
      detail.hidden = false;
      detail.classList.remove('io-mode');
      var name = step.querySelector('.step-name');
      var num = step.getAttribute('data-num');
      fill('title', (num ? '手順' + num + '：' : '') + (name ? name.textContent.trim() : ''));
      fill('note', '');
      fill('reads', reads.length ? reads.map(ioLabel).join(' ／ ') : '—');
      fill('writes', writes.length ? writes.map(ioLabel).join(' ／ ') : '—');
      fill('stop', step.getAttribute('data-stop') || '—');
    }
  }

  function showIo(io) {
    clearAll();
    io.classList.add('selected', 'lit');
    ios.forEach(function (other) { if (other !== io) other.classList.add('dim'); });

    var id = io.getAttribute('data-io-id');
    var touching = [];
    steps.forEach(function (s) {
      var reads = splitIds(s.getAttribute('data-reads'));
      var writes = splitIds(s.getAttribute('data-writes'));
      if (reads.indexOf(id) >= 0 || writes.indexOf(id) >= 0) {
        s.classList.add('active');
        touching.push('手順' + (s.getAttribute('data-num') || '?'));
      } else {
        s.classList.add('dim');
      }
    });

    if (detail) {
      detail.hidden = false;
      detail.classList.add('io-mode');
      fill('title', ioLabel(id));
      fill('note', touching.length
        ? 'これに触れる手順（点灯中）: ' + touching.join('、')
        : 'この項目に直接触れる手順の明記はありません（ページ全体の前提・出力先です）');
    }
  }

  steps.forEach(function (s) {
    s.addEventListener('click', function () {
      if (s.classList.contains('active') && !s.classList.contains('dim')) clearAll();
      else showStep(s);
    });
  });

  ios.forEach(function (io) {
    io.addEventListener('click', function () {
      if (io.classList.contains('selected')) clearAll();
      else showIo(io);
    });
  });

  Array.prototype.slice.call(document.querySelectorAll('.reset-flow')).forEach(function (btn) {
    btn.addEventListener('click', clearAll);
  });
})();
