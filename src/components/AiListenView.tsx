import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Sparkles, Volume2 } from 'lucide-react';
import { askGemini, speakText } from '../lib/gemini';
import { sound } from '../lib/audio';

interface AiListenViewProps {
  isListening: boolean;
}

export const AiListenView: React.FC<AiListenViewProps> = ({ isListening }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setQuery(transcript);
            handleAskGemini(transcript);
          }
          setIsRecognizing(false);
        };

        recognition.onerror = () => {
          setIsRecognizing(false);
        };

        recognition.onend = () => {
          setIsRecognizing(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // When hover is activated, try to start listening
  useEffect(() => {
    if (isListening && recognitionRef.current && !isRecognizing) {
      try {
        recognitionRef.current.start();
        setIsRecognizing(true);
      } catch {
        // Recognition might already be running
      }
    }
  }, [isListening]);

  const handleAskGemini = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    sound.playPop();

    const answer = await askGemini(promptText);
    setResponse(answer);
    setIsLoading(false);
    speakText(answer);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskGemini(query);
  };

  return (
    <div className="w-full h-full flex items-center px-3 py-1.5 text-white gap-2 relative overflow-hidden outline-none">
      {/* Mic/Gemini trigger button */}
      <button
        onClick={() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsRecognizing(true);
              sound.playTick();
            } catch {
              setIsRecognizing(false);
            }
          } else {
            inputRef.current?.focus();
          }
        }}
        className={`relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
          isRecognizing || isListening
            ? 'bg-rose-500/30 border-rose-400 text-rose-300'
            : 'bg-white/10 border-white/20 text-sky-300 hover:bg-white/20'
        }`}
        title="Speak or Ask Gemini"
      >
        {isRecognizing && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 rounded-full border border-rose-400/60"
          />
        )}
        {isLoading ? (
          <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Input or Live Response Stream */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {response ? (
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[9px] text-white/90 truncate flex-1">
              {response}
            </span>
            <button
              onClick={() => {
                setResponse('');
                setQuery('');
              }}
              className="text-[8px] text-white/40 hover:text-white shrink-0 px-1"
            >
              ×
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex items-center gap-1 w-full">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRecognizing ? 'Listening...' : 'Ask Gemini anything...'}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="p-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 disabled:opacity-30 transition-colors"
            >
              <Send className="w-2.5 h-2.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
