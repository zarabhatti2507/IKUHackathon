import 'dotenv/config';
import express from 'express';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.static('public'));

const elevenlabs = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;
const summaries = new Map();

const SYSTEM = `You help women prepare for GP appointments.
You never diagnose. Use phrases like "worth discussing with your GP".
Return ONLY JSON with this shape:
{"condition":string,"symptoms":[{"topic":string,"detail":string}],
"redFlag":boolean, "questionsForGP":[string],
"articles":[{"title":string,"link":string}]}
Only include symptoms the user actually mentioned.
Do not use emojis or special symbols. Use plain text only.`;

async function createSummary(transcript, articles = []) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Transcript:\n${transcript}\n\nAvailable articles:\n${JSON.stringify(articles)}`,
    config: { systemInstruction: SYSTEM, responseMimeType: 'application/json' }
  });

  if (!response.text) throw new Error('Gemini returned an empty response');
  return JSON.parse(response.text);
}

app.post('/api/pos', express.text({ type: 'application/json' }), async (req, res) => {
  if (!elevenlabs || !WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'ElevenLabs webhook is not configured' });
  }

  const signature = req.headers['elevenlabs-signature'];

  let event;
  try {
    event = await elevenlabs.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Invalid ElevenLabs webhook signature', err);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (event.type !== 'post_call_transcription') {
    return res.status(200).json({ received: true });
  }

  const { conversation_id, transcript } = event.data;
  if (!conversation_id || !Array.isArray(transcript)) {
    return res.status(400).json({ error: 'Invalid transcription payload' });
  }

  const formattedTranscript = transcript
    .map((turn) => `${turn.role === 'agent' ? 'Assistant' : 'User'}: ${turn.message}`)
    .join('\n');

  try {
    const summary = await createSummary(formattedTranscript);
    summaries.set(conversation_id, summary);
    console.log(`Processed transcript for conversation: ${conversation_id}`);
    return res.status(200).json({ received: true, conversation_id });
  } catch (err) {
    console.error(`Gemini processing failed for conversation: ${conversation_id}`, err);
    return res.status(502).json({ error: 'Transcript processing failed' });
  }
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/summary/:conversationId', (req, res) => {
  const summary = summaries.get(req.params.conversationId);
  if (!summary) return res.status(404).json({ error: 'Summary not found' });
  res.json(summary);
});

app.post('/api/summary', async (req, res) => {
  const { transcript, articles } = req.body;
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' });
  try {
    res.json(await createSummary(transcript, articles));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'We couldn\'t generate your response at this time' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));