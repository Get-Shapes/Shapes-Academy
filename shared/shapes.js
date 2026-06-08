/* ============================================================
   SHAPES TRAINING — Shared JavaScript
   Solo + Team modes, progress, quiz engine
   ============================================================ */
var STORAGE_KEY = 'shapes-training-progress';
var TIER_ID = 'shapes-training';

var MODULES = [
  { id: 'm01-shapes-kennenlernen', title: 'SHAPES Grundlagen', lessons: 4, icon: '🧩',
    lessonTitles: ['SHAPES kennenlernen','So funktioniert SHAPES','Die SHAPES Editionen','Markensprache'] },
  { id: 'm02-balance-check', title: 'Balance Check & Praxis', lessons: 4, icon: '⚖️',
    lessonTitles: ['Der Balance Check','Das Gästegespräch','SHAPES in der Praxis','Im Alltag mit SHAPES'] },
  { id: 'm03-gasteservice', title: 'Kommunikation', lessons: 4, icon: '💬',
    lessonTitles: ['Grundlagen der Kommunikation','Einwände sicher begegnen','Der Kurzvortrag','Erfolgreich kommunizieren'] },
  { id: 'm04-verkauf-alltag', title: 'Zusammenfassung', lessons: 3, icon: '📈',
    lessonTitles: ['Wissen teilen','Sichtbarkeit','Alles auf einen Blick'] },
  { id: 'm05-abschluss', title: 'Abschluss & Zertifikat', lessons: 0, icon: '🎓',
    lessonTitles: [] }
];

var isTeamMode = new URLSearchParams(window.location.search).has('team');
if (isTeamMode) { document.body.classList.add('mode-team'); }

// ── Progress ──
function getProgress() {
  // Team mode: always return empty progress (don't touch solo progress)
  if (isTeamMode) return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
}
function saveProgress(p) {
  if (isTeamMode) return; // Team mode: never write to solo storage
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch(e) {}
}
function markLessonComplete(moduleId, lessonId) {
  var p = getProgress();
  if (!p[TIER_ID]) { p[TIER_ID] = {}; }
  if (!p[TIER_ID][moduleId]) { p[TIER_ID][moduleId] = {}; }
  p[TIER_ID][moduleId][lessonId] = true;
  saveProgress(p);
  renderSidebar();
  renderSummary();
}
function isLessonComplete(moduleId, lessonId) {
  var p = getProgress();
  return !!(p[TIER_ID] && p[TIER_ID][moduleId] && p[TIER_ID][moduleId][lessonId]);
}

function moduleProgress(moduleId) {
  var mod = MODULES.find(function(m) { return m.id === moduleId; });
  if (!mod) { return { done: 0, total: 0, pct: 0 }; }
  var total = mod.lessons + 1;
  var done = 0;
  for (var i = 1; i <= mod.lessons; i++) {
    if (isLessonComplete(moduleId, 'l' + (i < 10 ? '0' : '') + i)) { done++; }
  }
  if (isLessonComplete(moduleId, 'quiz')) { done++; }
  return { done: done, total: total, pct: Math.round(done / total * 100) };
}

function tierProgress() {
  var total = 0, done = 0;
  MODULES.forEach(function(mod) {
    var mp = moduleProgress(mod.id);
    total += mp.total;
    done += mp.done;
  });
  return { done: done, total: total, pct: Math.round(done / total * 100) };
}

// ── Sidebar rendering ──
function renderSidebar() {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) { return; }
  var cp = window.location.pathname;
  var base = cp.indexOf('/solo/index.html') !== -1 || cp === '/' || cp.endsWith('/solo/') ? '' : '../';
  var html = '';
  MODULES.forEach(function(mod, m) {
    var mp = moduleProgress(mod.id);
    if (m > 0) { html += '<hr class="sidebar-module-sep" />'; }
    html += '<div class="sidebar-module">';
    html += '<div class="sidebar-module-header"><span>' + mod.title + '</span><span class="sidebar-module-progress">' + mp.pct + '%</span></div>';
    for (var l = 1; l <= mod.lessons; l++) {
      var lid = 'l' + (l < 10 ? '0' : '') + l;
      var url = base + mod.id + '/' + lid + '.html' + (isTeamMode ? '?team' : '');
      var active = cp.indexOf(mod.id + '/' + lid + '.html') !== -1;
      var done = isLessonComplete(mod.id, lid);
      html += '<a href="' + url + '" class="sidebar-lesson' + (active ? ' active' : '') + (done ? ' completed' : '') + '"><span class="sidebar-lesson-icon"></span><span>' + (mod.lessonTitles[l-1] || 'Lektion ' + l) + '</span></a>';
    }
    var qUrl = base + mod.id + '/quiz.html' + (isTeamMode ? '?team' : '');
    var qA = cp.indexOf(mod.id + '/quiz.html') !== -1;
    var qD = isLessonComplete(mod.id, 'quiz');
    var quizLocked;
    if (isTeamMode) {
      quizLocked = false; // Team mode: all tests freely accessible
    } else if (mod.id === 'm05-abschluss') {
      quizLocked = !isLessonComplete('m01-shapes-kennenlernen', 'quiz') ||
                   !isLessonComplete('m02-balance-check', 'quiz') ||
                   !isLessonComplete('m03-gasteservice', 'quiz') ||
                   !isLessonComplete('m04-verkauf-alltag', 'quiz');
    } else {
      quizLocked = mp.done < mod.lessons;
    }
    var quizLabel;
    if (mod.id === 'm05-abschluss' && quizLocked) {
      quizLabel = '🔒 Abschlussquiz (erst alle Module abschliessen)';
    } else {
      quizLabel = quizLocked ? '🔒 Test (erst alle Lektionen lesen)' : 'Test';
    }
    if (quizLocked) {
      html += '<span class="sidebar-lesson quiz-item locked"><span class="sidebar-lesson-icon"></span><span>' + quizLabel + '</span></span>';
    } else {
      html += '<a href="' + qUrl + '" class="sidebar-lesson quiz-item' + (qA ? ' active' : '') + (qD ? ' completed' : '') + '"><span class="sidebar-lesson-icon"></span><span>' + quizLabel + '</span></a>';
    }
    html += '</div>';
  });
  nav.innerHTML = html;
  renderSummary();
}

function renderSummary() {
  var s = document.getElementById('progress-summary');
  if (!s) { return; }
  if (isTeamMode) {
    s.innerHTML = '<span>Team-Modus</span><span class="progress-summary-bar"><span class="progress-summary-fill" style="width:0%;"></span></span><span>kein Fortschritt</span>';
    return;
  }
  var tp = tierProgress();
  s.innerHTML = '<span>Gesamtfortschritt</span><span class="progress-summary-bar"><span class="progress-summary-fill" style="width:' + tp.pct + '%;"></span></span><span>' + tp.done + '/' + tp.total + '</span>';
}

// ── Quiz engine ──
function checkQuiz(quizData) {
  var total = quizData.length;
  var correct = 0;
  quizData.forEach(function(q, idx) {
    var selected = document.querySelector('input[name="q' + idx + '"]:checked');
    var fb = document.getElementById('fb-' + idx);
    if (!fb) { return; }
    if (selected) {
      if (selected.value === q.answer) {
        correct++;
        fb.textContent = '✓ Richtig!';
        fb.className = 'feedback correct';
        selected.parentElement.classList.add('correct');
      } else {
        var ca = document.querySelector('input[name="q' + idx + '"][value="' + q.answer + '"]');
        fb.textContent = '✗ Leider falsch. Richtige Antwort: ' + (ca ? ca.parentElement.textContent.trim() : q.answer);
        fb.className = 'feedback incorrect';
        selected.parentElement.classList.add('incorrect');
      }
    } else {
      var cb = document.querySelector('input[name="q' + idx + '"][value="' + q.answer + '"]');
      fb.textContent = '❓ Keine Antwort ausgewählt. Richtige Antwort: ' + (cb ? cb.parentElement.textContent.trim() : q.answer);
      fb.className = 'feedback incorrect';
    }
    document.querySelectorAll('input[name="q' + idx + '"]').forEach(function(inp) { inp.disabled = true; });
  });
  var pct = Math.round(correct / total * 100);
  var passed = pct >= 80;
  var scoreEl = document.getElementById('score-display');
  if (scoreEl) {
    scoreEl.innerHTML = '<div class="score-card"><div class="score-pct ' + (passed ? 'score-pass' : 'score-fail') + '">' + pct + '%</div><div class="score-label">' + correct + ' von ' + total + ' richtig — ' + (passed ? 'Bestanden! 🎉' : 'Leider nicht bestanden. Versuche es erneut.') + '</div></div>';
  }
  document.getElementById('btn-check').style.display = 'none';
  document.getElementById('btn-retry').style.display = 'inline-flex';
  return { correct: correct, total: total, pct: pct, passed: passed };
}

function resetQuiz() {
  document.querySelectorAll('.quiz-question').forEach(function(q) {
    q.querySelectorAll('.option').forEach(function(o) {
      o.classList.remove('selected', 'correct', 'incorrect');
      var inp = o.querySelector('input');
      if (inp) { inp.checked = false; inp.disabled = false; }
    });
    var fb = q.querySelector('.feedback');
    if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
  });
  var sd = document.getElementById('score-display');
  if (sd) { sd.innerHTML = ''; }
  var bc = document.getElementById('btn-check');
  if (bc) { bc.style.display = 'inline-flex'; }
  var br = document.getElementById('btn-retry');
  if (br) { br.style.display = 'none'; }
}

// ── Lesson page init ──
function initLesson(moduleId, lessonId, lessonCount) {
  renderSidebar();
  var marked = false;
  window.addEventListener('scroll', function() {
    if (marked) { return; }
    var sp = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (sp > 0.8) {
      markLessonComplete(moduleId, lessonId);
      marked = true;
    }
  });
  var markBtn = document.getElementById('btn-mark-read');
  if (markBtn) {
    markBtn.addEventListener('click', function(e) {
      if (isTeamMode) { e.preventDefault(); }
      markLessonComplete(moduleId, lessonId);
      markBtn.textContent = '✓ Gelesen';
      markBtn.className = 'btn btn-success';
    });
  }
}


function initTeamMode() {
  var sbl = document.getElementById('sidebar-back-link');
  if (sbl) {
    var p = window.location.pathname;
    var cnt = (p.match(/\//g) || []).length;
    // Pages in solo/module/ are 3 levels deep from root
    // team/index.html is at team/index.html (1 level from root)
    // From solo/module/dir/file.html: ../../team/index.html
    // From solo/module/file.html: ../../team/index.html
    var up = '';
    for (var i = 0; i < cnt - 1; i++) { up += '../'; }
    sbl.setAttribute('href', up + 'team/index.html');
    sbl.innerHTML = '<span aria-hidden="true">←</span> Team-Dashboard';
  }
  // Fix breadcrumb links
  document.querySelectorAll('.breadcrumb a').forEach(function(a) {
    var h = a.getAttribute('href');
    if (h && h.indexOf('.html') > 0 && h.indexOf('?team') < 0 && h.indexOf('team/') < 0) {
      a.setAttribute('href', h + '?team');
    }
  });
  // Fix nav buttons
  document.querySelectorAll('.nav-btn[href*=".html"]').forEach(function(b) {
    var h = b.getAttribute('href');
    if (h && h.indexOf('?team') < 0) {
      b.setAttribute('href', h + '?team');
    }
  });
  // Fix next lesson link specifically
  var nl = document.getElementById('nav-next-link');
  if (nl) {
    var h = nl.getAttribute('href');
    if (h && h.indexOf('?team') < 0) {
      nl.setAttribute('href', h + '?team');
    }
  }
}


document.addEventListener('DOMContentLoaded', function() { renderSidebar(); if (isTeamMode) { initTeamMode(); } });
