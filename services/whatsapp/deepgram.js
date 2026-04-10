import { WA_CONFIG } from './config.js';

export async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg') {
  const apiKey = WA_CONFIG.transcription.deepgramApiKey;
  if (!apiKey) {
    console.warn('[Deepgram] API key manquante — transcription ignorée');
    return { text: null, ok: false, error: 'API_KEY_MISSING' };
  }

  try {
    const resp = await fetch('https://api.deepgram.com/v1/listen?language=fr&model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': mimeType || 'audio/ogg',
      },
      body: audioBuffer,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Deepgram] Erreur HTTP:', resp.status, errText);
      return { text: null, ok: false, error: `HTTP_${resp.status}` };
    }

    const data = await resp.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    if (!transcript.trim()) {
      return { text: null, ok: false, error: 'EMPTY_TRANSCRIPT' };
    }

    return {
      text: transcript.trim(),
      ok: true,
      confidence: Math.round(confidence * 100),
      language: data?.results?.channels?.[0]?.detected_language || 'fr',
    };
  } catch (err) {
    console.error('[Deepgram] Exception:', err.message);
    return { text: null, ok: false, error: err.message };
  }
}
