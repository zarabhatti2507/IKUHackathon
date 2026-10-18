# HerHealth | HerVoice

HerHealth helps users prepare for a GP appointment by talking naturally with an ElevenLabs voice agent. After the conversation ends, the ElevenLabs post-call webhook sends the transcript to the Express backend, Gemini creates a structured summary, and the frontend displays it for review and PDF download.

## Features

- Custom frontend voice experience styled for HerHealth.
- ElevenLabs Conversational AI browser SDK for microphone conversations.
- Signed ElevenLabs post-call webhook handling.
- Gemini JSON summaries with symptoms, red-flag guidance, GP questions, and articles.
- Summary screen and client-side PDF download.
- Direct summary API for local testing.

## Requirements

- Node.js 18 or newer
- A Google Gemini API key
- An ElevenLabs API key
- An ElevenLabs webhook secret
- A public HTTPS tunnel such as ngrok for local webhook testing

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_available_gemini_model
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_WEBHOOK_SECRET=your_elevenlabs_webhook_secret
PORT=3000
```

Do not commit `.env` or share these values. Rotate credentials if they are exposed.

## Run Locally

Start the server:

```bash
npm start
```

Open the frontend at:

```text
http://localhost:3000/
```

The server serves the frontend from `public/` and listens on port `3000` by default.

## ElevenLabs Webhook

ElevenLabs cannot send webhooks to `localhost`. Start a tunnel in a second terminal:

```bash
npx ngrok config add-authtoken YOUR_NGROK_TOKEN
npx ngrok http 3000
```

Set the ElevenLabs post-call transcription webhook URL to:

```text
https://YOUR_NGROK_DOMAIN.ngrok-free.app/api/pos
```

The webhook must send the `post_call_transcription` event. The backend verifies the `elevenlabs-signature` header before processing the transcript.

## Application Flow

```text
Browser voice SDK
	-> ElevenLabs conversation
	-> POST /api/pos
	-> Gemini structured summary
	-> GET /api/summary/latest
	-> Summary screen
	-> Client-side PDF download
```

The browser SDK is loaded in `public/voice.js` from the official `@elevenlabs/client` package through an ESM CDN. The agent ID is configured in that file.

## API Routes

### `POST /api/pos`

Receives and verifies ElevenLabs post-call transcription webhooks, sends the transcript to Gemini, and stores the resulting summary in memory.

### `GET /api/summary/latest`

Returns the most recently processed webhook summary, including its `conversationId` and `processedAt` timestamp. The frontend polls this endpoint after the voice session ends.

### `GET /api/summary/:conversationId`

Returns a stored summary for a specific ElevenLabs conversation ID.

### `POST /api/summary`

Generates a summary directly from a JSON request. Example:

```bash
curl -X POST http://localhost:3000/api/summary \
	-H "Content-Type: application/json" \
	-d '{"transcript":"User: I have felt tired recently.","articles":[]}'
```

## Frontend Files

- `public/index.html` - HerHealth screens and layout.
- `public/style.css` - Visual design and responsive styles.
- `public/ui.js` - Screen state, voice states, summary rendering, and PDF actions.
- `public/voice.js` - ElevenLabs browser SDK session adapter.
- `public/summary.js` - Summary API helpers.
- `public/pdf.js` - Client-side PDF generation.

## Testing

1. Start the server with `npm start`.
2. Open `http://localhost:3000/`.
3. Select **Start talking** and allow microphone access.
4. Have a conversation with the ElevenLabs agent.
5. Select **Finish and see my summary**.
6. Wait for the post-call webhook and summary to appear.
7. Select **Download PDF**.

For a direct backend check, use the `curl` example above. A successful webhook response looks like:

```json
{
	"received": true,
	"conversation_id": "conv_example"
}
```

## Current Limitations

- Summaries are stored only in memory and are lost when the server restarts.
- `latest` is designed for a single-user demo; concurrent users should use persistent storage and session-specific access.
- The PDF is generated in the browser, not saved on the server.
- Microphone access requires a secure context such as `localhost` or HTTPS.