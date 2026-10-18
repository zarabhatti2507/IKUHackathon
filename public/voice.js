import { Conversation } from 'https://esm.sh/@elevenlabs/client@1.28.0';

const AGENT_ID = 'agent_2801m554tnc1egz9mrnfkwwn4md6';
let conversation = null;

function updateVoiceMode(mode) {
  const state = mode === 'speaking' ? 'speaking' : mode === 'listening' ? 'listening' : 'thinking';
  window.setVoiceState(state);
}

async function toggleConversation() {
  if (conversation) {
    await conversation.endSession();
    return;
  }

  window.setVoiceState('thinking');
  try {
    conversation = await Conversation.startSession({
      agentId: AGENT_ID,
      onConnect: ({ conversationId }) => {
        console.log(`ElevenLabs conversation connected: ${conversationId}`);
        window.setVoiceState('listening');
      },
      onDisconnect: () => {
        conversation = null;
        window.setVoiceState('idle');
      },
      onModeChange: ({ mode }) => updateVoiceMode(mode),
      onMessage: ({ source, message }) => {
        window.addMessage(message, source === 'user' ? 'user' : 'bot');
      },
      onError: (message) => {
        console.error('ElevenLabs conversation error', message);
        window.addMessage('I could not connect to the voice assistant. Please try again.', 'bot');
        conversation = null;
        window.setVoiceState('idle');
      }
    });
  } catch (error) {
    console.error('Unable to start ElevenLabs conversation', error);
    window.addMessage('Microphone access is needed to start the conversation.', 'bot');
    conversation = null;
    window.setVoiceState('idle');
  }
}

window.endVoiceConversation = async function () {
  if (conversation) await conversation.endSession();
};

document.getElementById('mic-btn').addEventListener('click', toggleConversation);