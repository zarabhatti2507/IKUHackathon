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