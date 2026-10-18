async function generateSummary(transcript, wearable, articles) {
  try {
    const r = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, wearable, articles })
    });
    if (!r.ok) throw new Error('Server error');
    return await r.json();
  } catch (err) {
    console.error(err);
    // fallback so the demo never dies
    return await (await fetch('data/sample-summary.json')).json();
  }
}

async function getWebhookSummary(conversationId) {
  const r = await fetch(`/api/summary/${encodeURIComponent(conversationId)}`);
  if (!r.ok) throw new Error('Summary not found');
  return await r.json();
}

async function getLatestWebhookSummary() {
  const r = await fetch('/api/summary/latest');
  if (!r.ok) throw new Error('Summary not found');
  return await r.json();
}

async function generateSummaryAndDownloadPDF(transcript, articles) {
  const summary = await generateSummary(transcript, articles);
  downloadSummaryPDF(summary);
  return summary;
}