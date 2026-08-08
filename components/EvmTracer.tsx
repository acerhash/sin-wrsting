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
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs font-mono uppercase tracking-[0.3em]">
              OPCODE & STATE TRACE
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              LIVE MONITOR
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EVM STATE EXECUTION TRACER
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Trace how an Ethereum or Base node processes a Type-4 transaction: Authorization verification, code pointer injection, DELEGATECALL opcode processing, and storage state settlement.
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2 bg-[#111] p-2 border border-[#222]">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 text-[#aaa]">
            STEP {currentStepIdx + 1} / {steps.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentStepIdx === steps.length - 1}
            className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              isPlaying 
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-white text-black border-white hover:bg-[#eee]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {isPlaying ? 'PAUSE' : 'AUTO STEP'}
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-[#1a1a1a] hover:bg-[#333] text-[#888] hover:text-white transition-all border border-[#333]"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {steps.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => setCurrentStepIdx(idx)}
            className={`p-4 border text-left transition-all relative ${
              idx === currentStepIdx
                ? 'bg-white text-black border-white'
                : idx < currentStepIdx
                ? 'bg-[#111] border-[#333] text-white hover:border-[#555]'
                : 'bg-[#080808] border-[#1f1f1f] text-[#555]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest">0{s.step}</span>
              {idx < currentStepIdx && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
            </div>
            <span className="block text-xs font-black uppercase tracking-tight truncate">
              {s.title}
            </span>
          </button>
        ))}
      </div>

      {/* Main Step Detail Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left: Step Description & EVM Opcode */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#080808] border border-[#222] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#888]">
                  PHASE: {currentStep.phase}
                </span>
                {currentStep.evmOpcode && (
                  <span className="text-xs font-mono font-bold uppercase tracking-widest bg-white text-black px-2 py-0.5">
                    OPCODE: {currentStep.evmOpcode}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tight text-white">{currentStep.title}</h3>
              <p className="text-sm text-[#888] leading-relaxed font-sans">
                {currentStep.description}
              </p>

              {/* State Transition Flow Box */}
              <div className="p-4 bg-[#111] border border-[#222] space-y-3">
                <div className="text-[10px] font-mono font-bold text-[#666] uppercase tracking-[0.2em]">
                  EOA CODE POINTER MAPPING STATE
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs p-3 bg-[#080808] border border-[#222]">
                  <div>
                    <span className="text-[10px] text-[#555] block">EOA ADDRESS</span>
                    <span className="text-white font-bold">{eoaAddress.slice(0, 10)}...{eoaAddress.slice(-6)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white hidden sm:block" />
                  <div>
                    <span className="text-[10px] text-[#555] block">INJECTED CODE BYTECODE</span>
                    <span className="text-green-500 font-bold break-all">
                      {currentStep.codePointerHex.length > 20 ? currentStep.codePointerHex.slice(0, 18) + '...' : currentStep.codePointerHex}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: EVM Stack, Storage & Gas */}
          <div className="lg:col-span-5 space-y-6">
            {/* Gas Metering */}
            <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-white" /> GAS METERING
                </span>
                <span className="text-xs font-mono text-white font-bold">
                  {currentStep.gasUsedThisStep.toString()} GAS
                </span>
              </div>
              <div className="w-full bg-[#111] h-3 border border-[#222]">
                <div 
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (Number(currentStep.gasUsedThisStep) / 30000) * 100)}%` }}
                />
              </div>
            </div>

            {/* EVM Stack Inspector */}
            <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-3">
                <Layers className="w-4 h-4 text-white" /> VIRTUAL EVM STACK FRAME
              </span>
              <div className="space-y-2">
                {currentStep.stack.map((item, i) => (
                  <div key={i} className="p-2 bg-[#111] border border-[#222] font-mono text-xs text-white flex items-center justify-between">
                    <span className="text-[#555] text-[10px] font-bold">[{i}]</span>
                    <span className="font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Changes */}
            {currentStep.storageChanges.length > 0 && (
              <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-3">
                  <Database className="w-4 h-4 text-white" /> STATE DIFF (SSTORE)
                </span>
                {currentStep.storageChanges.map((sc, idx) => (
                  <div key={idx} className="p-3 bg-[#111] border border-[#222] font-mono text-[11px] space-y-1">
                    <div className="text-[#666] text-[10px]">SLOT: {sc.slot}</div>
                    <div className="text-red-500 line-through text-[10px]">OLD: {sc.oldValue}</div>
                    <div className="text-green-500 font-bold">NEW: {sc.newValue}</div>
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
