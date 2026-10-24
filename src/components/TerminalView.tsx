import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft } from 'lucide-react';
import { runTerminalCommand } from '../lib/tauri-bridge';
import { askGemini } from '../lib/gemini';
import { sound } from '../lib/audio';

export const TerminalView: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('Orb Terminal: Type "help", "calc 12*45", or "ai <query>"');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    sound.playTick();
    setInput('');

    if (query.startsWith('ai ') || query.startsWith('gemini ')) {
      setOutput('Thinking...');
      const prompt = query.replace(/^(ai|gemini)\s+/i, '');
      const answer = await askGemini(prompt);
      setOutput(`> ${answer}`);
      return;
    }

    const result = await runTerminalCommand(query);
    if (result === '__CLEAR__') {
      setOutput('');
    } else {
      setOutput(result);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center px-3 py-1.5 text-white outline-none">
      <div className="flex items-center gap-1.5 overflow-hidden mb-1">
        <TerminalIcon className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="font-mono text-[9px] text-white/70 truncate flex-1">
          {output}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <span className="text-emerald-400 font-mono text-[10px] font-semibold">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="help, calc 45*12, ai summarize..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/60"
          autoFocus
        />
        <button
          type="submit"
          className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
        >
          <CornerDownLeft className="w-2.5 h-2.5" />
        </button>
      </form>
    </div>
  );
};
