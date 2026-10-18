import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL;

const SYSTEM = `You help women prepare for GP appointments.
You never diagnose. Use phrases like "worth discussing with your GP".
Return ONLY JSON with this shape:
{"condition":string,"symptoms":[{"topic":string,"detail":string}],
"redFlag":boolean, "questionsForGP":[string]
"articles":[{"title":string,"link":string}]}
Only include symptoms the user actually mentioned.
Do not use emojis or special symbols. Use plain text only.`;

app.post('/api/summary', async (req, res) => {
  const { transcript, articles } = req.body;
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' });
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Transcript:\n${transcript}\n\nAvailable articles:\n${JSON.stringify(articles)}`,
      config: { systemInstruction: SYSTEM, responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'We couldn\'t generate your response at this time' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));