// ---------- Icons (drawn with SVG, no emojis) ----------
function icon(inner) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}

var ICONS = {
  idle: icon('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/>'),
  listening: icon('<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>'),
  thinking: icon('<circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/>'),
  speaking: icon('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>')
};

// ---------- Screens ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---------- Voice states: "idle", "listening", "thinking", "speaking" ----------
function setVoiceState(state) {
  var mic = document.getElementById('mic-btn');
  mic.className = 'mic ' + state;
  mic.innerHTML = ICONS[state];

  var labels = {
    idle: 'Tap to start talking.',
    listening: "I'm listening...",
    thinking: 'One moment...',
    speaking: 'Speaking...'
  };
  document.getElementById('voice-status').textContent = labels[state];
}

// ---------- Chat bubbles: sender is "bot" or "user" ----------
function addMessage(text, sender) {
  var div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  var box = document.getElementById('messages');
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ---------- Red-flag warning ----------
function showUrgentBanner() {
  document.getElementById('urgent-banner').classList.remove('hidden');
}

// Show the mic icon when the page first loads
setVoiceState('idle');
// ---------- Checklist: mark a topic as covered ----------
// topics: cycle, pain, fatigue, mood, sleep, hotFlushes
function tickSymptom(topic) {
  var li = document.querySelector('#checklist li[data-topic="' + topic + '"]');
  if (li) li.classList.add('done');
}
// Clear all ticks (use when starting a new conversation)
function resetChecklist() {
  document.querySelectorAll('#checklist li').forEach(function (li) {
    li.classList.remove('done');
  });
}