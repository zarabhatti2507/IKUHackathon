async function generateSummary(transcript, articles) {
  try {
    const r = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, articles })
    });
    if (!r.ok) throw new Error('Server error');
    return await r.json();
  } catch (err) {
    console.error(err);
  
    return await (await fetch('data/sample-summary.json')).json();
  }
}