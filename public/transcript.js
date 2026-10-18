import 'dotenv/config';
import express from 'express';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { GoogleGenAI } from '@google/genai';

const app = express();
const elevenlabs = new ElevenLabsClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `You help women prepare for GP appointments.
Never diagnose. Use phrases like "worth discussing with your GP".
Return only valid JSON with this shape:
{"condition":string,"symptoms":[{"topic":string,"detail":string}],
"redFlag":boolean,"questionsForGP":[string]}
Only include symptoms the user actually mentioned.
Do not use emojis or special symbols.`;

app.post('/api/pos', express.text({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['elevenlabs-signature'];

  let event;
  try {
    event = await elevenlabs.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error('Invalid ElevenLabs webhook signature', error);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (event.type === 'post_call_transcription') {
    const { conversation_id, transcript } = event.data;
    const formattedMessages = transcript.map((turn) => ({
      role: turn.role === 'agent' ? 'assistant' : 'user',
      content: turn.message,
    }));

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Transcript:\n${JSON.stringify(formattedMessages)}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      if (!response.text) {
        throw new Error('Gemini returned an empty response');
      }

      const summary = JSON.parse(response.text);
      console.log(`Processed transcript for conversation: ${conversation_id}`, summary);
    } catch (error) {
      console.error(`Gemini processing failed for conversation: ${conversation_id}`, error);
      return res.status(502).json({ error: 'Transcript processing failed' });
    }
  }

  res.status(200).json({ received: true });
});

app.listen(3000, () => console.log('Webhook listener running on port 3000'));
