'use client';

import React, { useState } from 'react';
import { BLUEPRINTS, DelegationBlueprint } from '@/lib/eip7702-utils';
import { 
  Layers, 
  Zap, 
  ShieldCheck, 
  Bot, 
  Code2, 
  Check, 
  Copy, 
  ArrowUpRight, 
  Play, 
  Sparkles,
  TrendingDown
} from 'lucide-react';

interface DelegationBlueprintsProps {
  onSelectBlueprintForSim?: (bp: DelegationBlueprint) => void;
}

export function DelegationBlueprints({ onSelectBlueprintForSim }: DelegationBlueprintsProps) {
  const [selectedBp, setSelectedBp] = useState<DelegationBlueprint>(BLUEPRINTS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'solidity'>('overview');
  const [copied, setCopied] = useState<boolean>(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs font-mono uppercase tracking-[0.3em]">
              SMART ACCOUNT BLUEPRINTS
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              PECTRA EVM NATIVE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EIP-7702 USE-CASE BLUEPRINTS
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Select a delegation smart contract blueprint to instantly empower your EOA with account abstraction capabilities without funds migration or contract deployments.
          </p>
        </div>
      </div>

      {/* Blueprint Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLUEPRINTS.map((bp) => {
          const isSelected = bp.id === selectedBp.id;
          return (
            <button
              key={bp.id}
              onClick={() => setSelectedBp(bp)}
              className={`p-6 border text-left transition-all relative group ${
                isSelected
                  ? 'bg-white text-black border-white'
                  : 'bg-[#080808] border-[#222] text-[#aaa] hover:border-[#444] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border ${
                  isSelected ? 'bg-black text-white border-black' : 'bg-[#111] text-[#888] border-[#333]'
                }`}>
                  {bp.category}
                </span>
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-black' : 'text-green-500'}`}>
                  -{bp.estimatedGasSavingsPct}% GAS
                </span>
              </div>

              <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                {bp.name}
              </h3>
              <p className={`text-xs leading-relaxed mb-6 ${isSelected ? 'text-[#333]' : 'text-[#777]'}`}>
                {bp.tagline}
              </p>

              <div className={`pt-4 border-t flex items-center justify-between font-mono text-[10px] uppercase tracking-wider ${
                isSelected ? 'border-black/20 text-black' : 'border-[#1a1a1a] text-[#555]'
              }`}>
                <span>{bp.contractAddress.slice(0, 10)}...</span>
                <span className="font-bold flex items-center gap-0.5">INSPECT <ArrowUpRight className="w-3 h-3" /></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Blueprint Detailed View */}
      <div className="bg-[#080808] border border-[#222] p-6 space-y-6">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              {selectedBp.name}
            </h3>
            <p className="text-xs font-mono text-[#777] mt-1">{selectedBp.description}</p>
          </div>

          <div className="flex items-center gap-2 bg-[#111] p-1.5 border border-[#222]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                activeTab === 'overview' ? 'bg-white text-black border-white' : 'text-[#888] border-transparent hover:text-white'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                activeTab === 'calls' ? 'bg-white text-black border-white' : 'text-[#888] border-transparent hover:text-white'
              }`}
            >
              CALLS ({selectedBp.sampleCalls.length})
            </button>
            <button
              onClick={() => setActiveTab('solidity')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                activeTab === 'solidity' ? 'bg-white text-black border-white' : 'text-[#888] border-transparent hover:text-white'
              }`}
            >
              SOLIDITY CODE
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-[#111] border border-[#222] space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#666] uppercase tracking-widest block">
                  TARGET DELEGATION ADDRESS
                </span>
                <div className="font-mono text-xs text-white break-all bg-[#080808] p-3 border border-[#222]">
                  {selectedBp.contractAddress}
                </div>
              </div>

              <div className="p-4 bg-[#111] border border-[#222] space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#666] uppercase tracking-widest block">
                  ESTIMATED GAS REDUCTION
                </span>
                <div className="text-3xl font-black text-white italic">
                  {selectedBp.estimatedGasSavingsPct}% CHEAPER
                  <span className="block text-xs font-normal text-[#666] not-italic mt-1">VS ERC-4337 SAFE PROXY</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#111] border border-[#222] space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white border-b border-[#222] pb-2">
                KEY ARCHITECTURAL BENEFITS
              </h4>
              <ul className="space-y-3 text-xs text-[#aaa] font-sans">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-white mt-1.5" />
                  <span><strong>Zero Migration Risk:</strong> EOA keeps its exact address and balance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-white mt-1.5" />
                  <span><strong>Reversible:</strong> Clear authorization in a future transaction to revert to standard EOA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-white mt-1.5" />
                  <span><strong>EVM Native:</strong> Executed natively at protocol level during Pectra fork.</span>
                </li>
              </ul>

              {onSelectBlueprintForSim && (
                <button
                  onClick={() => onSelectBlueprintForSim(selectedBp)}
                  className="w-full mt-4 py-3 bg-white text-black hover:bg-[#eee] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> SIMULATE IN EVM TRACER
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="space-y-4">
            <p className="text-xs text-[#888] font-mono uppercase tracking-wider">
              Dispatched payload calls executed via EIP-7702 delegated smart account in one atomic batch:
            </p>
            {selectedBp.sampleCalls.map((call, idx) => (
              <div key={idx} className="p-4 bg-[#111] border border-[#222] space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>CALL #{idx + 1}: {call.functionName}</span>
                  <span className="text-[#666] text-[10px]">TARGET: {call.to.slice(0, 10)}...</span>
                </div>
                <div className="text-[#888] text-[11px] break-all bg-[#080808] p-2.5 border border-[#222]">
                  DATA: {call.data}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'solidity' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <span className="text-xs font-mono font-bold text-[#888] uppercase tracking-wider">
                TARGET DELEGATION SOURCE (SOLIDITY ^0.8.28)
              </span>
              <button
                onClick={() => copyCode(selectedBp.solidityCode)}
                className="text-xs font-mono text-white hover:text-green-500 uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED SOURCE' : 'COPY SOURCE'}
              </button>
            </div>
            <pre className="p-4 bg-[#111] border border-[#222] font-mono text-xs text-[#ccc] overflow-x-auto max-h-80 scrollbar-thin">
              {selectedBp.solidityCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
