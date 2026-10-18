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
var conversationStartedAt = 0;
var currentSummary = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  if (id === 'talk') conversationStartedAt = Date.now();
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
window.setVoiceState = setVoiceState;

// ---------- Chat bubbles: sender is "bot" or "user" ----------
function addMessage(text, sender) {
  var div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  var box = document.getElementById('messages');
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
window.addMessage = addMessage;

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

function setSummaryLoading(isLoading) {
  var finishButton = document.getElementById('finish-summary');
  if (finishButton) finishButton.disabled = isLoading;
  if (isLoading) {
    document.getElementById('summary-symptoms').textContent = 'Waiting for your conversation summary...';
    document.getElementById('summary-questions').textContent = '';
  }
}

function renderSummary(summary) {
  currentSummary = summary;
  var symptoms = document.getElementById('summary-symptoms');
  var questions = document.getElementById('summary-questions');
  var resources = document.getElementById('resources');

  symptoms.textContent = '';
  (summary.symptoms || []).forEach(function (symptom) {
    var item = document.createElement('p');
    item.textContent = symptom.topic + ': ' + symptom.detail;
    symptoms.appendChild(item);
  });
  if (!symptoms.childElementCount) symptoms.textContent = 'No specific symptoms were identified.';

  questions.textContent = '';
  (summary.questionsForGP || []).forEach(function (question) {
    var item = document.createElement('p');
    item.textContent = question;
    questions.appendChild(item);
  });
  if (!questions.childElementCount) questions.textContent = 'No questions were generated.';

  resources.textContent = '';
  (summary.articles || []).forEach(function (article) {
    var item = document.createElement('article');
    item.className = 'card';
    item.textContent = article.title;
    resources.appendChild(item);
  });

  if (summary.redFlag) showUrgentBanner();
}

async function waitForWebhookSummary() {
  for (var attempt = 0; attempt < 15; attempt += 1) {
    try {
      var result = await getLatestWebhookSummary();
      if (result.processedAt >= conversationStartedAt) return result.summary;
    } catch (error) {
      if (attempt === 14) throw error;
    }
    await new Promise(function (resolve) { setTimeout(resolve, 2000); });
  }
  throw new Error('The conversation summary is not ready yet.');
}

async function finishConversation() {
  if (window.endVoiceConversation) await window.endVoiceConversation();
  showScreen('summary');
  setSummaryLoading(true);
  try {
    renderSummary(await waitForWebhookSummary());
  } catch (error) {
    document.getElementById('summary-symptoms').textContent = error.message;
  } finally {
    setSummaryLoading(false);
  }
}

document.getElementById('finish-summary').addEventListener('click', finishConversation);
document.getElementById('download-pdf').addEventListener('click', function () {
  if (currentSummary) downloadSummaryPDF(currentSummary);
});