'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';

export function Gemini7702Assistant() {
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Core Protocol Assistant specializing in EIP-7702, Ethereum node state execution, Account Abstraction, and Base network development. Ask me anything about authorization hashes, Type-4 transaction formats, or gas savings!'
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
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Protocol Specialist (Gemini 2.5)
          </div>
          <h2 className="text-xl font-bold text-white">EIP-7702 AI Architecture Assistant</h2>
          <p className="text-slate-400 text-sm mt-1">
            Get instant expert explanations on authorization signatures, opcode mechanics, security attack vectors, and gas optimization.
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
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all text-left"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 text-sm ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-[80%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-sans text-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 p-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Gemini is analyzing EVM protocol specification...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about EIP-7702, authorization lists, or Base mini app setup..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
