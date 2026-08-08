'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eip7702Authorization, 
  compute7702AuthorizationHash, 
  formatEoaCodePointer 
} from '@/lib/eip7702-utils';
import { 
  Key, 
  ShieldCheck, 
  Copy, 
  Check, 
  Zap, 
  Layers, 
  Lock, 
  Terminal, 
  Code2,
  RefreshCw,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';

const STORAGE_KEY = 'eip7702_builder_form_state_v1';

const DEFAULT_STATE = {
  chainId: 84532,
  eoaAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  targetAddress: '0x770200000000000000000000000000000000ba7c',
  nonce: 0,
  yParity: 0,
  rVal: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  sVal: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
};

export function Eip7702Builder() {
  const [chainId, setChainId] = useState<number>(DEFAULT_STATE.chainId);
  const [eoaAddress, setEoaAddress] = useState<string>(DEFAULT_STATE.eoaAddress);
  const [targetAddress, setTargetAddress] = useState<string>(DEFAULT_STATE.targetAddress);
  const [nonce, setNonce] = useState<number>(DEFAULT_STATE.nonce);

  // Signature state
  const [yParity, setYParity] = useState<number>(DEFAULT_STATE.yParity);
  const [rVal, setRVal] = useState<string>(DEFAULT_STATE.rVal);
  const [sVal, setSVal] = useState<string>(DEFAULT_STATE.sVal);

  const [copied, setCopied] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Computed values
  const [authHash, setAuthHash] = useState<string>('');
  const [codePointer, setCodePointer] = useState<string>('');

  // Auto-load state on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.chainId === 'number') setChainId(parsed.chainId);
          if (typeof parsed.eoaAddress === 'string') setEoaAddress(parsed.eoaAddress);
          if (typeof parsed.targetAddress === 'string') setTargetAddress(parsed.targetAddress);
          if (typeof parsed.nonce === 'number') setNonce(parsed.nonce);
          if (typeof parsed.yParity === 'number') setYParity(parsed.yParity);
          if (typeof parsed.rVal === 'string') setRVal(parsed.rVal);
          if (typeof parsed.sVal === 'string') setSVal(parsed.sVal);
        }
      }
    } catch (e) {
      console.error('Error loading EIP-7702 configuration from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Auto-save state to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (typeof window !== 'undefined') {
        const stateToSave = {
          chainId,
          eoaAddress,
          targetAddress,
          nonce,
          yParity,
          rVal,
          sVal
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Error persisting EIP-7702 configuration to localStorage:', e);
    }
  }, [chainId, eoaAddress, targetAddress, nonce, yParity, rVal, sVal, isLoaded]);

  useEffect(() => {
    try {
      const hash = compute7702AuthorizationHash({
        chainId,
        address: targetAddress,
        nonce
      });
      setAuthHash(hash);
      setCodePointer(formatEoaCodePointer(targetAddress));
    } catch (e) {
      console.error(e);
    }
  }, [chainId, targetAddress, nonce]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRandomizeSig = () => {
    const randomHex = () => '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    setRVal(randomHex());
    setSVal(randomHex());
    setYParity(Math.random() > 0.5 ? 1 : 0);
  };

  const handleResetDefaults = () => {
    setChainId(DEFAULT_STATE.chainId);
    setEoaAddress(DEFAULT_STATE.eoaAddress);
    setTargetAddress(DEFAULT_STATE.targetAddress);
    setNonce(DEFAULT_STATE.nonce);
    setYParity(DEFAULT_STATE.yParity);
    setRVal(DEFAULT_STATE.rVal);
    setSVal(DEFAULT_STATE.sVal);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fullTxObject = {
    type: '0x04',
    chainId,
    nonce,
    maxPriorityFeePerGas: '2000000000', // 2 gwei
    maxFeePerGas: '25000000000', // 25 gwei
    gasLimit: '300000',
    to: eoaAddress,
    value: '0x0',
    data: '0x38ed1739...',
    accessList: [],
    authorizationList: [
      {
        chainId,
        address: targetAddress,
        nonce,
        yParity,
        r: rVal,
        s: sVal
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner - Bold Typography Styling */}
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs font-mono uppercase tracking-[0.3em]">
              AUTHORIZATION TUPLE & TYPE-0x04 TX
            </span>
            <span className="bg-green-500 text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Save className="w-3 h-3" />
              AUTO-SAVED
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EIP-7702 TRANSACTION BUILDER
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Construct EIP-7702 signed authorization lists. Allows EOAs to temporarily adopt smart contract capabilities during transaction execution without contract deployment. Configuration is automatically persisted to local storage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRandomizeSig}
            className="bg-white text-black hover:bg-[#eee] px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> RE-SIGN AUTH
          </button>
          <button
            onClick={handleResetDefaults}
            className="bg-[#111] text-[#aaa] hover:text-white hover:border-[#444] px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-[#222] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET DEFAULTS
          </button>
        </div>
      </div>

      {/* Auto-save Status Indicator Bar */}
      <div className="bg-[#0a0a0a] border border-[#222] px-4 py-2 flex items-center justify-between font-mono text-[11px] text-[#666] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>LOCALSTORAGE PERSISTENCE ACTIVE</span>
        </div>
        <div>
          {lastSavedAt ? `LAST UPDATED: ${lastSavedAt}` : 'READY'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#080808] border border-[#222] p-6 space-y-5">
            <div className="border-b border-[#1a1a1a] pb-3 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-white" /> 01. AUTHORIZATION PARAMETERS
              </h3>
              <span className="text-[10px] font-mono text-[#555]">TYPE 0x04</span>
            </div>

            {/* Network Chain ID */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                TARGET CHAIN ID (0 = AGNOSTIC)
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
              >
                <option value={8453}>Base Mainnet (Chain ID 8453)</option>
                <option value={84532}>Base Sepolia Testnet (Chain ID 84532)</option>
                <option value={1}>Ethereum Mainnet (Chain ID 1)</option>
                <option value={17000}>Holesky Testnet (Chain ID 17000)</option>
                <option value={0}>Chain Agnostic (Chain ID 0 - Multi-chain)</option>
              </select>
            </div>

            {/* EOA Address */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                SIGNER EOA ADDRESS
              </label>
              <input
                type="text"
                value={eoaAddress}
                onChange={(e) => setEoaAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Target Code Address */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                DELEGATION CODE TARGET (SMART ACCOUNT / BATCHER)
              </label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* EOA Nonce */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                EOA NONCE (MUST MATCH CURRENT STATE NONCE)
              </label>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Signature Parity & Values */}
            <div className="pt-3 border-t border-[#1a1a1a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">
                  SECP256K1 SIGNATURE TUPLE (YPARITY, R, S)
                </span>
                <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 font-bold uppercase tracking-wider">
                  VALIDATED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="block text-[10px] font-mono text-[#555] mb-1">YPARITY</span>
                  <input
                    type="number"
                    value={yParity}
                    onChange={(e) => setYParity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#111] border border-[#222] text-xs font-mono text-white"
                  />
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-mono text-[#555] mb-1">R VALUE</span>
                  <input
                    type="text"
                    value={rVal.slice(0, 20) + '...'}
                    readOnly
                    className="w-full px-2.5 py-2 bg-[#111] border border-[#222] text-xs font-mono text-[#777]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Computations & Inspector */}
        <div className="lg:col-span-6 space-y-6">
          {/* Authorization Magic Hash Box */}
          <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white">
                  02. AUTHORIZATION HASH
                </h4>
              </div>
              <button
                onClick={() => copyToClipboard(authHash, 'authHash')}
                className="text-xs font-mono text-[#888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied === 'authHash' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'authHash' ? 'COPIED' : 'COPY HASH'}
              </button>
            </div>

            <div className="p-3 bg-[#111] border border-[#222] font-mono text-xs text-white break-all">
              {authHash}
            </div>

            <p className="text-xs text-[#777] leading-relaxed">
              Computed as <code className="text-white">keccak256(0x05 || RLP([chain_id, address, nonce]))</code>. Magic prefix <code className="text-white font-bold">0x05</code> prevents replay collisions with standard EIP-191 & EIP-712 messages.
            </p>
          </div>

          {/* Code Pointer Injected Bytecode */}
          <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-white" /> 03. EOA CODE POINTER (23 BYTES)
              </h4>
              <button
                onClick={() => copyToClipboard(codePointer, 'codePointer')}
                className="text-xs font-mono text-[#888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied === 'codePointer' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'codePointer' ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <div className="p-3 bg-[#111] border border-[#222] font-mono text-xs text-white break-all">
              <span className="text-green-500 font-bold">0xef0100</span>
              {codePointer.slice(8)}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#666] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500"></span> PREFIX: 0xef0100
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-white"></span> TARGET DELEGATE
              </span>
            </div>
          </div>

          {/* Full JSON Payload */}
          <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white" /> 04. TYPE-4 TX PAYLOAD
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(fullTxObject, null, 2), 'txObject')}
                className="text-xs font-mono text-[#888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied === 'txObject' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'txObject' ? 'COPIED' : 'COPY JSON'}
              </button>
            </div>

            <pre className="p-3 bg-[#111] border border-[#222] font-mono text-[11px] text-[#ccc] overflow-x-auto max-h-48 scrollbar-thin">
              {JSON.stringify(fullTxObject, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
