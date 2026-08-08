'use client';

import React, { useState } from 'react';
import { generateTraceSimulation, EvmTraceStep } from '@/lib/eip7702-utils';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Cpu, 
  Layers, 
  Database, 
  Zap, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EvmTracer() {
  const [eoaAddress, setEoaAddress] = useState<string>('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [targetAddress, setTargetAddress] = useState<string>('0x770200000000000000000000000000000000ba7c');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps = generateTraceSimulation(
    eoaAddress,
    targetAddress,
    84532,
    0,
    '0.05',
    3
  );

  const currentStep = steps[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const toggleAutoPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let idx = currentStepIdx;
    const interval = setInterval(() => {
      idx++;
      if (idx >= steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
      } else {
        setCurrentStepIdx(idx);
      }
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-2">
            <Cpu className="w-3.5 h-3.5" /> Ethereum Node EVM State Tracer
          </div>
          <h2 className="text-xl font-bold text-white">Interactive EIP-7702 State Execution Visualizer</h2>
          <p className="text-slate-400 text-sm mt-1">
            Walk through how an Ethereum / Base node executes a Type-4 transaction: Authorization verification, code pointer injection, DELEGATECALL execution, and storage settlement.
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-3 text-slate-300">
            Step {currentStepIdx + 1} of {steps.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentStepIdx === steps.length - 1}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPlaying 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Play className="w-3 h-3" /> {isPlaying ? 'Pause' : 'Auto Step'}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Pipeline */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => setCurrentStepIdx(idx)}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              idx === currentStepIdx
                ? 'bg-blue-950/60 border-blue-500/60 text-blue-200 shadow-md shadow-blue-500/10'
                : idx < currentStepIdx
                ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                : 'bg-slate-950 border-slate-900 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold">0{s.step}</span>
              {idx < currentStepIdx && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <span className="block text-xs font-semibold truncate">{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      {/* Main Step Detail Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left: Step Description & EVM Opcode */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {currentStep.phase}
                </span>
                {currentStep.evmOpcode && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    OPCODE: {currentStep.evmOpcode}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentStep.description}
              </p>

              {/* State Transition Flow Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  EOA Code Pointer Mapping State
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">EOA Address</span>
                    <span className="text-slate-200">{eoaAddress.slice(0, 10)}...{eoaAddress.slice(-6)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 hidden sm:block" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Injected Code Bytecode</span>
                    <span className="text-emerald-400 font-bold break-all">
                      {currentStep.codePointerHex.length > 20 ? currentStep.codePointerHex.slice(0, 18) + '...' : currentStep.codePointerHex}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: EVM Stack, Storage & Gas */}
          <div className="lg:col-span-5 space-y-4">
            {/* Gas Metering */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Gas Usage Meter
                </span>
                <span className="text-xs font-mono text-amber-300">
                  Used: {currentStep.gasUsedThisStep.toString()} gas
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-amber-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (Number(currentStep.gasUsedThisStep) / 30000) * 100)}%` }}
                />
              </div>
            </div>

            {/* EVM Stack Inspector */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" /> Virtual EVM Stack Frame
              </span>
              <div className="space-y-1.5">
                {currentStep.stack.map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-blue-300 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">[{i}]</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Changes */}
            {currentStep.storageChanges.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" /> State Diff / SSTORE Updates
                </span>
                {currentStep.storageChanges.map((sc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="text-slate-400 text-[10px] truncate">Slot: {sc.slot}</div>
                    <div className="text-red-400 line-through text-[10px]">Old: {sc.oldValue}</div>
                    <div className="text-emerald-400 font-bold">New: {sc.newValue}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
