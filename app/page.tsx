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
  Globe,
  Activity
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'tracer' | 'blueprints' | 'rpc' | 'code' | 'miniapp' | 'ai'
  >('builder');

  const handleSelectBlueprintForSim = (bp: DelegationBlueprint) => {
    setActiveTab('tracer');
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-[#222] bg-[#080808] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white text-black font-black flex items-center justify-center text-xl tracking-tighter">
              7702
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[#666] text-[10px] font-mono uppercase tracking-[0.3em]">
                  Ethereum Improvement Proposal
                </span>
                <span className="bg-[#181818] text-[#888] text-[10px] font-mono px-2 py-0.5 border border-[#333] uppercase tracking-wider">
                  PECTRA READY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none text-white mt-0.5">
                EIP-7702 NODE STUDIO
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <div className="bg-white text-black px-3 py-1 text-xs font-black uppercase tracking-widest inline-block">
                Base Sepolia Active
              </div>
              <div className="mt-1 font-mono text-[10px] text-[#666] uppercase tracking-wider">
                BUILD: 0xFD21..99A • CHAIN: 84532
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header Tabs */}
      <nav className="border-b border-[#222] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
          {[
            { id: 'builder', label: '01. TX BUILDER', icon: Zap },
            { id: 'tracer', label: '02. EVM TRACER', icon: Cpu },
            { id: 'blueprints', label: '03. BLUEPRINTS', icon: Layers },
            { id: 'rpc', label: '04. NODE RPC', icon: Terminal },
            { id: 'code', label: '05. CODE SNIPPETS', icon: FileCode2 },
            { id: 'miniapp', label: '06. BASE MINIAPP', icon: Smartphone },
            { id: 'ai', label: '07. AI ASSISTANT', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border ${
                  isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-[#111] text-[#888] border-[#222] hover:text-white hover:border-[#444]'
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
      <footer className="border-t border-[#222] mt-16 py-8 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-[#555]">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold">SYSTEM: OPERATIONAL</span>
            <span>•</span>
            <span>MAGIC PREFIX: 0x05</span>
            <span>•</span>
            <span>TYPE: 0x04</span>
          </div>
          <div className="text-right">
            <span>EIP-7702 ETHEREUM NODE STUDIO • BASE Ecosystem</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
