'use client';

import React, { useState, useEffect } from 'react';
import { generateTraceSimulation, EvmTraceStep } from '@/lib/eip7702-utils';
import { 
  Play, 
  Pause,
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Cpu, 
  Layers, 
  Database, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Terminal,
  Code2,
  SkipForward,
  SkipBack,
  Bug,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface OpcodeStep {
  pc: string;
  opcode: string;
  hexBytes: string;
  gasCost: number;
  gasRemaining: number;
  category: 'AUTH' | 'STACK' | 'CALL' | 'STORAGE' | 'CONTROL' | 'LOG';
  description: string;
  stackBefore: string[];
  stackAfter: string[];
  memoryState?: string;
  storageDiff?: { slot: string; oldValue: string; newValue: string };
}

const GENERATE_MOCK_OPCODES = (eoa: string, target: string): OpcodeStep[] => {
  const shortEoa = `${eoa.slice(0, 6)}...${eoa.slice(-4)}`;
  const shortTarget = `${target.slice(0, 6)}...${target.slice(-4)}`;

  return [
    {
      pc: '0x00',
      opcode: 'EIP7702_AUTH_CHECK',
      hexBytes: '0x05ef01',
      gasCost: 25000,
      gasRemaining: 300000,
      category: 'AUTH',
      description: `Verify EIP-7702 type 0x04 authorization signature tuple for EOA ${shortEoa}`,
      stackBefore: [],
      stackAfter: [`CHAIN_ID: 84532`, `NONCE: 0`, `SIGNER: ${shortEoa}`],
      memoryState: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      pc: '0x03',
      opcode: 'SET_CODE_POINTER',
      hexBytes: `0xef0100${target.replace('0x', '').slice(0, 8)}...`,
      gasCost: 12500,
      gasRemaining: 275000,
      category: 'AUTH',
      description: `Inject magic delegation code pointer 0xef0100 pointing to ${shortTarget}`,
      stackBefore: [`CHAIN_ID: 84532`, `NONCE: 0`, `SIGNER: ${shortEoa}`],
      stackAfter: [`CODE_HASH: 0xef0100...`, `EOA_NONCE: 1`],
      storageDiff: {
        slot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        oldValue: '0x0000000000000000000000000000000000000000000000000000000000000000',
        newValue: `0x000000000000000000000000${target.replace('0x', '')}`
      }
    },
    {
      pc: '0x1c',
      opcode: 'PUSH20',
      hexBytes: target,
      gasCost: 3,
      gasRemaining: 262500,
      category: 'STACK',
      description: `Push 20-byte target implementation contract address ${shortTarget} onto stack`,
      stackBefore: [`CODE_HASH: 0xef0100...`, `EOA_NONCE: 1`],
      stackAfter: [target, `CODE_HASH: 0xef0100...`, `EOA_NONCE: 1`],
      memoryState: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      pc: '0x31',
      opcode: 'PUSH1 0x00',
      hexBytes: '0x6000',
      gasCost: 3,
      gasRemaining: 262497,
      category: 'STACK',
      description: 'Push 0x00 (call value offset) for DELEGATECALL execution',
      stackBefore: [target, `CODE_HASH: 0xef0100...`],
      stackAfter: ['0x00', target, `CODE_HASH: 0xef0100...`],
    },
    {
      pc: '0x33',
      opcode: 'GAS',
      hexBytes: '0x5a',
      gasCost: 2,
      gasRemaining: 262494,
      category: 'STACK',
      description: 'Push current remaining gas limit onto stack for DELEGATECALL',
      stackBefore: ['0x00', target, `CODE_HASH: 0xef0100...`],
      stackAfter: ['262494 (gas)', '0x00', target, `CODE_HASH: 0xef0100...`],
    },
    {
      pc: '0x34',
      opcode: 'DELEGATECALL',
      hexBytes: '0xf4',
      gasCost: 700,
      gasRemaining: 261794,
      category: 'CALL',
      description: `Execute DELEGATECALL to target contract ${shortTarget} with address(this) = ${shortEoa}`,
      stackBefore: ['262494 (gas)', '0x00', target],
      stackAfter: ['0x01 (success)', `CONTEXT: ${shortEoa}`],
      memoryState: `0x000000000000000000000000${target.replace('0x', '').slice(0, 32)}`,
    },
    {
      pc: '0x35',
      opcode: 'CALLER',
      hexBytes: '0x33',
      gasCost: 2,
      gasRemaining: 261092,
      category: 'STACK',
      description: 'Fetch caller address inside delegated execution context',
      stackBefore: ['0x01 (success)', `CONTEXT: ${shortEoa}`],
      stackAfter: [eoa, '0x01 (success)'],
    },
    {
      pc: '0x36',
      opcode: 'SLOAD',
      hexBytes: '0x54',
      gasCost: 100,
      gasRemaining: 260992,
      category: 'STORAGE',
      description: 'Load delegation storage slot 0x0 for initialization verification',
      stackBefore: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
      stackAfter: ['0x00 (uninitialized)'],
    },
    {
      pc: '0x37',
      opcode: 'SSTORE',
      hexBytes: '0x55',
      gasCost: 5000,
      gasRemaining: 255992,
      category: 'STORAGE',
      description: 'Write delegation activation status 0x01 into EOA storage slot 0x1',
      stackBefore: ['0x01 (active)', '0x0000000000000000000000000000000000000000000000000000000000000001'],
      stackAfter: ['0x01 (success)'],
      storageDiff: {
        slot: '0x0000000000000000000000000000000000000000000000000000000000000001',
        oldValue: '0x0000000000000000000000000000000000000000000000000000000000000000',
        newValue: '0x0000000000000000000000000000000000000000000000000000000000000001'
      }
    },
    {
      pc: '0x3d',
      opcode: 'LOG2',
      hexBytes: '0xa2',
      gasCost: 750,
      gasRemaining: 255242,
      category: 'LOG',
      description: `Emit EIP7702CodeDelegated(address indexed eoa, address indexed target) log event`,
      stackBefore: ['0x20 (len)', '0x00 (offset)', 'TOPIC_DELEGATED', eoa],
      stackAfter: ['LOG_EMITTED'],
      memoryState: `0x000000000000000000000000${target.replace('0x', '')}`,
    },
    {
      pc: '0x42',
      opcode: 'RETURN',
      hexBytes: '0xf3',
      gasCost: 0,
      gasRemaining: 255242,
      category: 'CONTROL',
      description: 'Return execution buffer and complete atomic delegation call batch',
      stackBefore: ['0x20', '0x00'],
      stackAfter: ['EXECUTION_SUCCESS'],
    },
    {
      pc: '0x43',
      opcode: 'STOP',
      hexBytes: '0x00',
      gasCost: 0,
      gasRemaining: 255242,
      category: 'CONTROL',
      description: 'Halt EVM execution machine safely with state root commit',
      stackBefore: [],
      stackAfter: ['HALTED_0x01'],
    }
  ];
};

export function EvmTracer() {
  const [eoaAddress, setEoaAddress] = useState<string>('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [targetAddress, setTargetAddress] = useState<string>('0x770200000000000000000000000000000000ba7c');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'opcode'>('pipeline');

  // Opcode Debugger State
  const [currentOpcodeIdx, setCurrentOpcodeIdx] = useState<number>(0);
  const [isOpcodePlaying, setIsOpcodePlaying] = useState<boolean>(false);

  const steps = generateTraceSimulation(
    eoaAddress,
    targetAddress,
    84532,
    0,
    '0.05',
    3
  );

  const opcodes = GENERATE_MOCK_OPCODES(eoaAddress, targetAddress);

  const currentStep = steps[currentStepIdx];
  const currentOpcode = opcodes[currentOpcodeIdx];

  // Auto-play for high level steps
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, steps.length]);

  // Auto-play for step-by-step opcode debugger
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpcodePlaying) {
      interval = setInterval(() => {
        setCurrentOpcodeIdx((prev) => {
          if (prev >= opcodes.length - 1) {
            setIsOpcodePlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpcodePlaying, opcodes.length]);

  const handleNextStep = () => {
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(currentStepIdx + 1);
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1);
  };

  const handleResetStep = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleNextOpcode = () => {
    if (currentOpcodeIdx < opcodes.length - 1) setCurrentOpcodeIdx(currentOpcodeIdx + 1);
  };

  const handlePrevOpcode = () => {
    if (currentOpcodeIdx > 0) setCurrentOpcodeIdx(currentOpcodeIdx - 1);
  };

  const handleResetOpcode = () => {
    setCurrentOpcodeIdx(0);
    setIsOpcodePlaying(false);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Controls & Mode Switcher */}
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs uppercase tracking-[0.3em]">
              OPCODE & STATE TRACE
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              LIVE MONITOR
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EVM STATE EXECUTION TRACER
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed font-sans">
            Trace how an Ethereum or Base node processes a Type-4 transaction: Authorization verification, code pointer injection, DELEGATECALL opcode processing, and storage state settlement.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center bg-[#111] p-1 border border-[#222]">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-white text-black font-black'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              PHASE PIPELINE
            </button>
            <button
              onClick={() => setViewMode('opcode')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'opcode'
                  ? 'bg-blue-500 text-black font-black shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              OPCODE DEBUGGER
            </button>
          </div>

          {/* Stepper Controls depending on View Mode */}
          {viewMode === 'pipeline' ? (
            <div className="flex items-center gap-2 bg-[#111] p-1.5 border border-[#222]">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIdx === 0}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider px-2 text-[#aaa]">
                STEP {currentStepIdx + 1} / {steps.length}
              </span>
              <button
                onClick={handleNextStep}
                disabled={currentStepIdx === steps.length - 1}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-white text-black border-white hover:bg-[#eee]'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {isPlaying ? 'PAUSE' : 'AUTO'}
              </button>
              <button
                onClick={handleResetStep}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] text-[#888] hover:text-white transition-all border border-[#333] cursor-pointer"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#111] p-1.5 border border-[#222]">
              <button
                onClick={handlePrevOpcode}
                disabled={currentOpcodeIdx === 0}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333] cursor-pointer"
                title="Step Back Opcode"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider px-2 text-blue-400">
                PC {currentOpcode.pc} ({currentOpcodeIdx + 1}/{opcodes.length})
              </span>
              <button
                onClick={handleNextOpcode}
                disabled={currentOpcodeIdx === opcodes.length - 1}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 text-white transition-all border border-[#333] cursor-pointer"
                title="Step Forward Opcode"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpcodePlaying(!isOpcodePlaying)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  isOpcodePlaying 
                    ? 'bg-blue-500 text-black border-blue-500'
                    : 'bg-white text-black border-white hover:bg-[#eee]'
                }`}
              >
                {isOpcodePlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {isOpcodePlaying ? 'PAUSE' : 'STEP RUN'}
              </button>
              <button
                onClick={handleResetOpcode}
                className="p-2 bg-[#1a1a1a] hover:bg-[#333] text-[#888] hover:text-white transition-all border border-[#333] cursor-pointer"
                title="Reset PC"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODE 1: PHASE PIPELINE */}
      {viewMode === 'pipeline' && (
        <>
          {/* Progress Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {steps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStepIdx(idx)}
                className={`p-4 border text-left transition-all relative cursor-pointer ${
                  idx === currentStepIdx
                    ? 'bg-white text-black border-white'
                    : idx < currentStepIdx
                    ? 'bg-[#111] border-[#333] text-white hover:border-[#555]'
                    : 'bg-[#080808] border-[#1f1f1f] text-[#555]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest">0{s.step}</span>
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
                    <span className="text-xs font-bold uppercase tracking-widest text-[#888]">
                      PHASE: {currentStep.phase}
                    </span>
                    {currentStep.evmOpcode && (
                      <span className="text-xs font-bold uppercase tracking-widest bg-white text-black px-2 py-0.5">
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
                    <div className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">
                      EOA CODE POINTER MAPPING STATE
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 bg-[#080808] border border-[#222]">
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
                    <span className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-white" /> GAS METERING
                    </span>
                    <span className="text-xs text-white font-bold">
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
                  <span className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-3">
                    <Layers className="w-4 h-4 text-white" /> VIRTUAL EVM STACK FRAME
                  </span>
                  <div className="space-y-2">
                    {currentStep.stack.map((item, i) => (
                      <div key={i} className="p-2 bg-[#111] border border-[#222] text-xs text-white flex items-center justify-between">
                        <span className="text-[#555] text-[10px] font-bold">[{i}]</span>
                        <span className="font-bold">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Changes */}
                {currentStep.storageChanges.length > 0 && (
                  <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-3">
                      <Database className="w-4 h-4 text-white" /> STATE DIFF (SSTORE)
                    </span>
                    {currentStep.storageChanges.map((sc, idx) => (
                      <div key={idx} className="p-3 bg-[#111] border border-[#222] text-[11px] space-y-1">
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
        </>
      )}

      {/* MODE 2: STEP-BY-STEP OPCODE DEBUGGER */}
      {viewMode === 'opcode' && (
        <div className="space-y-6">
          {/* Debugger Active Banner */}
          <div className="p-4 bg-[#0a0f18] border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bug className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                  GRANULAR OPCODE DEBUGGER — STEPPING INSTRUCTIONS
                </span>
                <p className="text-[11px] text-[#aaa] font-sans">
                  Inspect exact Program Counter (PC), Opcode execution, EVM Stack pushes/pops, gas costs, and memory frames step-by-step.
                </p>
              </div>
            </div>

            {/* Step Controls */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={handlePrevOpcode}
                disabled={currentOpcodeIdx === 0}
                className="px-3 py-1.5 bg-[#111] hover:bg-[#222] disabled:opacity-30 border border-[#333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> PREV OPCODE
              </button>
              <button
                onClick={handleNextOpcode}
                disabled={currentOpcodeIdx === opcodes.length - 1}
                className="px-3 py-1.5 bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-30 font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                NEXT OPCODE <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Disassembly Opcode Table */}
            <div className="lg:col-span-7 bg-[#080808] border border-[#222] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2 text-xs text-[#888] font-bold">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" /> OPCODE DISASSEMBLY STREAM
                </span>
                <span className="text-[10px] text-[#666]">
                  TOTAL OPCODES: {opcodes.length}
                </span>
              </div>

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {opcodes.map((op, idx) => {
                  const isActive = idx === currentOpcodeIdx;
                  return (
                    <div
                      key={op.pc + idx}
                      onClick={() => setCurrentOpcodeIdx(idx)}
                      className={`p-2.5 border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-950/60 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                          : idx < currentOpcodeIdx
                          ? 'bg-[#0f0f0f] border-[#1a1a1a] text-[#777] hover:border-[#333]'
                          : 'bg-[#080808] border-[#1f1f1f] text-[#555] hover:border-[#333]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-12 text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-[#666]'}`}>
                          {op.pc}
                        </span>
                        <span className={`font-bold uppercase ${isActive ? 'text-white' : 'text-[#ccc]'}`}>
                          {op.opcode}
                        </span>
                        <span className="text-[10px] text-[#666] hidden sm:inline-block">
                          ({op.category})
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-amber-400">
                          -{op.gasCost} gas
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-blue-500 text-black text-[9px] font-bold uppercase">
                            ACTIVE PC
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Active Opcode Execution Inspector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Active Opcode Detail Card */}
              <div className="bg-[#080808] border border-blue-500/50 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#222] pb-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" /> PC {currentOpcode.pc}: {currentOpcode.opcode}
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 font-bold uppercase">
                    {currentOpcode.category}
                  </span>
                </div>

                <p className="text-xs text-[#aaa] font-sans leading-relaxed">
                  {currentOpcode.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#111] p-2 border border-[#222]">
                  <div>
                    <span className="text-[#666] block">INSTRUCTION BYTES</span>
                    <span className="text-white font-bold break-all">{currentOpcode.hexBytes}</span>
                  </div>
                  <div>
                    <span className="text-[#666] block">OPCODE GAS COST</span>
                    <span className="text-amber-400 font-bold">{currentOpcode.gasCost} GAS</span>
                  </div>
                </div>
              </div>

              {/* Stack Inspector (Before / After) */}
              <div className="bg-[#080808] border border-[#222] p-4 space-y-3">
                <span className="text-xs font-bold uppercase text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-2">
                  <Layers className="w-4 h-4 text-white" /> EVM STACK INSPECTOR
                </span>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] text-[#666] uppercase block">STACK STATE AFTER INSTRUCTION:</span>
                  <div className="space-y-1.5">
                    {currentOpcode.stackAfter.map((item, idx) => (
                      <div key={idx} className="p-2 bg-[#111] border border-[#222] text-xs text-green-400 flex items-center justify-between">
                        <span className="text-[#555] text-[10px]">STACK[{idx}]</span>
                        <span className="font-bold truncate max-w-[200px]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Memory Frame Buffer */}
              {currentOpcode.memoryState && (
                <div className="bg-[#080808] border border-[#222] p-4 space-y-2">
                  <span className="text-xs font-bold uppercase text-[#888] flex items-center gap-1.5 border-b border-[#1a1a1a] pb-2">
                    <Database className="w-4 h-4 text-purple-400" /> EVM MEMORY BUFFER (0x00 - 0x3f)
                  </span>
                  <div className="p-2 bg-[#0d0d0d] border border-[#222] text-[10px] text-purple-300 font-mono break-all leading-relaxed">
                    {currentOpcode.memoryState}
                  </div>
                </div>
              )}

              {/* Storage State Diff */}
              {currentOpcode.storageDiff && (
                <div className="bg-[#080808] border border-green-500/40 p-4 space-y-2">
                  <span className="text-xs font-bold uppercase text-green-400 flex items-center gap-1.5 border-b border-[#1a1a1a] pb-2">
                    <Database className="w-4 h-4 text-green-400" /> SSTORE MUTATION DETECTED
                  </span>
                  <div className="p-2 bg-[#0d0d0d] border border-[#222] text-[10px] space-y-1">
                    <div className="text-[#666]">SLOT: {currentOpcode.storageDiff.slot}</div>
                    <div className="text-red-400 line-through">OLD: {currentOpcode.storageDiff.oldValue}</div>
                    <div className="text-green-400 font-bold">NEW: {currentOpcode.storageDiff.newValue}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

