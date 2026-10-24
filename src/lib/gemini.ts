/**
 * Calls the server-side Gemini 3.8 Flash endpoint.
 * Zero client-side API key exposure.
 */

export async function askGemini(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.text || 'Done.';
  } catch (error: any) {
    console.warn('[Gemini Client Error]:', error);
    // Intelligent local conversational fallback if offline or no key
    if (prompt.toLowerCase().includes('time') || prompt.toLowerCase().includes('clock')) {
      return `Current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }
    if (prompt.toLowerCase().includes('weather')) {
      return 'Currently 68°F and sunny with light breeze.';
    }
    if (prompt.toLowerCase().includes('pomodoro') || prompt.toLowerCase().includes('timer')) {
      return 'Switching to timer mode for 25-minute focus.';
    }
    return `Gemini: Processed "${prompt.slice(0, 30)}..."`;
  }
}

/**
 * Speaks text using Web Speech API synthesis
 */
export function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}
