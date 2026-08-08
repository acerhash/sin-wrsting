'use client';

import React, { useState } from 'react';
import { Eip7702Builder } from '@/components/Eip7702Builder';
import { EvmTracer } from '@/components/EvmTracer';
import { DelegationBlueprints } from '@/components/DelegationBlueprints';
import { RpcNodeInspector } from '@/components/RpcNodeInspector';
import { CodeExporter } from '@/components/CodeExporter';
import { BaseMiniAppValidator } from '@/components/BaseMiniAppValidator';
import { Gemini7702Assistant } from '@/components/Gemini7702Assistant';
import { DelegationBlueprint } from '@/lib/eip7702-utils';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Terminal, 
  FileCode2, 
  Smartphone, 
  Sparkles, 
  ShieldCheck,
  Globe
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'tracer' | 'blueprints' | 'rpc' | 'code' | 'miniapp' | 'ai'
  >('builder');

  const handleSelectBlueprintForSim = (bp: DelegationBlueprint) => {
    setActiveTab('tracer');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5 fill-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">EIP-7702</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ETH Node Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Account Abstraction & Pectra EOA Upgrade Playground</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Base Sepolia (84532)
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header Tabs */}
      <nav className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'builder', label: 'Tx Builder', icon: Zap },
            { id: 'tracer', label: 'EVM Tracer', icon: Cpu },
            { id: 'blueprints', label: 'Blueprints', icon: Layers },
            { id: 'rpc', label: 'Node RPC', icon: Terminal },
            { id: 'code', label: 'Code Snippets', icon: FileCode2 },
            { id: 'miniapp', label: 'Base MiniApp', icon: Smartphone },
            { id: 'ai', label: 'AI Assistant', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'builder' && <Eip7702Builder />}
        {activeTab === 'tracer' && <EvmTracer />}
        {activeTab === 'blueprints' && (
          <DelegationBlueprints onSelectBlueprintForSim={handleSelectBlueprintForSim} />
        )}
        {activeTab === 'rpc' && <RpcNodeInspector />}
        {activeTab === 'code' && <CodeExporter />}
        {activeTab === 'miniapp' && <BaseMiniAppValidator />}
        {activeTab === 'ai' && <Gemini7702Assistant />}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-12 py-6 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EIP-7702 Ethereum Node Studio • Built for Base & Ethereum Pectra Ecosystem</span>
          <span className="font-mono text-slate-600">Magic Prefix: 0x05 • Type: 0x04 • Code: 0xef0100</span>
        </div>
      </footer>
    </main>
  );
}
