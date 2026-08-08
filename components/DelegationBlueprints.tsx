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
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Pre-built Smart Account Delegation Blueprints
          </div>
          <h2 className="text-xl font-bold text-white">EIP-7702 Use-Case Blueprints</h2>
          <p className="text-slate-400 text-sm mt-1">
            Choose a target delegation smart contract blueprint to upgrade your EOA with account abstraction capabilities without funds migration.
          </p>
        </div>
      </div>

      {/* Blueprint Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BLUEPRINTS.map((bp) => {
          const isSelected = bp.id === selectedBp.id;
          return (
            <button
              key={bp.id}
              onClick={() => setSelectedBp(bp)}
              className={`p-5 rounded-2xl border text-left transition-all relative group overflow-hidden ${
                isSelected
                  ? 'bg-blue-950/50 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {bp.category}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> -{bp.estimatedGasSavingsPct}% Gas
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                {bp.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                {bp.tagline}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span>Contract: {bp.contractAddress.slice(0, 10)}...</span>
                <span className="text-blue-400 flex items-center gap-0.5">Explore <ArrowUpRight className="w-3 h-3" /></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Blueprint Detailed View */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {selectedBp.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedBp.description}</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calls' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Calls Payload ({selectedBp.sampleCalls.length})
            </button>
            <button
              onClick={() => setActiveTab('solidity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'solidity' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solidity Contract
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Delegation Address
                </span>
                <div className="font-mono text-sm text-blue-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  {selectedBp.contractAddress}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estimated Gas Reduction
                </span>
                <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                  {selectedBp.estimatedGasSavingsPct}% Cheaper
                  <span className="text-xs font-normal text-slate-400">vs ERC-4337 Safe Proxy</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Architectural Benefits
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span><strong>Zero Migration Risk:</strong> EOA keeps its exact address and existing balance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span><strong>Reversible:</strong> Clear authorization in a future transaction to revert to standard EOA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                  <span><strong>EVM Native:</strong> Executed natively at protocol level during Pectra fork without custom mempool hacks.</span>
                </li>
              </ul>

              {onSelectBlueprintForSim && (
                <button
                  onClick={() => onSelectBlueprintForSim(selectedBp)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <Play className="w-3.5 h-3.5" /> Simulate in EVM State Tracer
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Payload calls dispatched through the EIP-7702 delegated smart account contract in a single transaction frame:
            </p>
            {selectedBp.sampleCalls.map((call, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-blue-400 font-bold">
                  <span>Call #{idx + 1}: {call.functionName}</span>
                  <span className="text-slate-500 text-[10px]">Target: {call.to.slice(0, 10)}...</span>
                </div>
                <div className="text-slate-400 text-[11px] break-all bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                  Data: {call.data}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'solidity' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Target Delegation Source (Solidity ^0.8.28)</span>
              <button
                onClick={() => copyCode(selectedBp.solidityCode)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Code' : 'Copy Source'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-80 scrollbar-thin">
              {selectedBp.solidityCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
