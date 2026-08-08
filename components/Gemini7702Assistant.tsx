'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';

export function Gemini7702Assistant() {
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Greetings. I am your AI Core Protocol Assistant specializing in EIP-7702, Ethereum node state execution, Account Abstraction, and Base network architecture. Query me on authorization hashes, Type-4 transaction formats, or gas optimizations.'
    }
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/explain-7702', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });

      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `⚠️ Error: ${data.error}` }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.text }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ Network error: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs font-mono uppercase tracking-[0.3em]">
              GEMINI 2.5 PROTOCOL SPECIALIST
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              AI ENGINE ONLINE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EIP-7702 AI ARCHITECTURE ASSISTANT
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Instant protocol explanations on authorization signatures, opcode mechanics, security attack vectors, and gas optimization.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2">
        {[
          'How does EIP-7702 compare to ERC-4337 in gas efficiency?',
          'Why does EIP-7702 use 0x05 as the magic byte in auth tuples?',
          'What prevents front-running or signature replay in 7702?',
          'How does EOA code pointer (0xef0100) work inside EVM?'
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3.5 py-2 bg-[#080808] hover:bg-[#111] border border-[#222] hover:border-[#444] text-xs font-mono font-bold text-[#aaa] hover:text-white uppercase tracking-wider transition-all text-left"
          >
            • {q}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-[#080808] border border-[#222] p-6 space-y-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 text-sm ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 leading-relaxed font-mono text-xs ${
                  m.role === 'user'
                    ? 'bg-white text-black font-bold border border-white'
                    : 'bg-[#111] border border-[#222] text-[#ccc]'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 bg-[#222] text-white flex items-center justify-center font-bold shrink-0 border border-[#333]">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white p-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> ANALYZING EVM PROTOCOL SPECIFICATION...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-4 border-t border-[#1a1a1a]">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about EIP-7702, authorization lists, or Base miniapp setup..."
            className="flex-1 px-4 py-3 bg-[#111] border border-[#222] text-xs font-mono text-white focus:outline-none focus:border-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 bg-white text-black hover:bg-[#eee] disabled:opacity-40 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-white"
          >
            <Send className="w-3.5 h-3.5" /> SEND
          </button>
        </div>
      </div>
    </div>
  );
}
