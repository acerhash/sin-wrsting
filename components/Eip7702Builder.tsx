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
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

const STORAGE_KEY = 'eip7702_builder_form_state_v1';

const DEFAULT_STATE = {
  chainId: 84532,
  eoaAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  targetAddress: '0x770200000000000000000000000000000000ba7c',
  nonce: 0,
  gasLimit: 300000,
  maxFeePerGas: 25,
  yParity: 0,
  rVal: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  sVal: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
};

// Validation Helper Functions
const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
const isValidHex32 = (hex: string) => /^0x[a-fA-F0-9]{64}$/.test(hex.trim());
const isValidNonce = (n: number) => !isNaN(n) && n >= 0 && Number.isInteger(n);
const isValidGasLimit = (g: number) => !isNaN(g) && g >= 21000;
const isValidMaxFee = (f: number) => !isNaN(f) && f > 0;

export function Eip7702Builder() {
  const [chainId, setChainId] = useState<number>(DEFAULT_STATE.chainId);
  const [eoaAddress, setEoaAddress] = useState<string>(DEFAULT_STATE.eoaAddress);
  const [targetAddress, setTargetAddress] = useState<string>(DEFAULT_STATE.targetAddress);
  const [nonce, setNonce] = useState<number>(DEFAULT_STATE.nonce);
  const [gasLimit, setGasLimit] = useState<number>(DEFAULT_STATE.gasLimit);
  const [maxFeePerGas, setMaxFeePerGas] = useState<number>(DEFAULT_STATE.maxFeePerGas);

  // Signature state
  const [yParity, setYParity] = useState<number>(DEFAULT_STATE.yParity);
  const [rVal, setRVal] = useState<string>(DEFAULT_STATE.rVal);
  const [sVal, setSVal] = useState<string>(DEFAULT_STATE.sVal);

  const [copied, setCopied] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Validation States
  const isEoaValid = isValidAddress(eoaAddress);
  const isTargetValid = isValidAddress(targetAddress);
  const isNonceValid = isValidNonce(nonce);
  const isGasValid = isValidGasLimit(gasLimit);
  const isMaxFeeValid = isValidMaxFee(maxFeePerGas);
  const isYParityValid = yParity === 0 || yParity === 1;
  const isRValid = isValidHex32(rVal);
  const isSValid = isValidHex32(sVal);

  const isFormValid = isEoaValid && isTargetValid && isNonceValid && isGasValid && isMaxFeeValid && isYParityValid && isRValid && isSValid;

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
          if (typeof parsed.gasLimit === 'number') setGasLimit(parsed.gasLimit);
          if (typeof parsed.maxFeePerGas === 'number') setMaxFeePerGas(parsed.maxFeePerGas);
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
          gasLimit,
          maxFeePerGas,
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
  }, [chainId, eoaAddress, targetAddress, nonce, gasLimit, maxFeePerGas, yParity, rVal, sVal, isLoaded]);

  useEffect(() => {
    try {
      if (isTargetValid) {
        const hash = compute7702AuthorizationHash({
          chainId,
          address: targetAddress,
          nonce: isNonceValid ? nonce : 0
        });
        setAuthHash(hash);
        setCodePointer(formatEoaCodePointer(targetAddress));
      } else {
        setAuthHash('INVALID_TARGET_ADDRESS');
        setCodePointer('0xef0100' + '00'.repeat(20));
      }
    } catch (e) {
      console.error(e);
    }
  }, [chainId, targetAddress, nonce, isTargetValid, isNonceValid]);

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
    setGasLimit(DEFAULT_STATE.gasLimit);
    setMaxFeePerGas(DEFAULT_STATE.maxFeePerGas);
    setYParity(DEFAULT_STATE.yParity);
    setRVal(DEFAULT_STATE.rVal);
    setSVal(DEFAULT_STATE.sVal);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error resetting EIP-7702 config:', e);
    }
  };

  const fullTxObject = {
    type: '0x04',
    chainId,
    nonce: isNonceValid ? nonce : 0,
    maxPriorityFeePerGas: '2000000000', // 2 gwei
    maxFeePerGas: isMaxFeeValid ? (maxFeePerGas * 1e9).toString() : '25000000000',
    gasLimit: isGasValid ? gasLimit.toString() : '300000',
    to: isEoaValid ? eoaAddress : '0x0000000000000000000000000000000000000000',
    value: '0x0',
    data: '0x38ed1739...',
    accessList: [],
    authorizationList: [
      {
        chainId,
        address: isTargetValid ? targetAddress : '0x0000000000000000000000000000000000000000',
        nonce: isNonceValid ? nonce : 0,
        yParity: isYParityValid ? yParity : 0,
        r: isRValid ? rVal : '0x0',
        s: isSValid ? sVal : '0x0'
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
            {isFormValid ? (
              <span className="bg-green-500/10 text-green-400 border border-green-500/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                VALID FORM
              </span>
            ) : (
              <span className="bg-red-500/10 text-red-400 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                INVALID INPUTS
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            EIP-7702 TRANSACTION BUILDER
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Construct EIP-7702 signed authorization lists with real-time visual input validation. Allows EOAs to temporarily adopt smart contract capabilities during transaction execution without contract deployment.
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

      {/* Auto-save & Validation Status Indicator Bar */}
      <div className="bg-[#0a0a0a] border border-[#222] px-4 py-2 flex items-center justify-between font-mono text-[11px] text-[#666] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
          <span>{isFormValid ? 'ALL FORM INPUTS VALIDATED' : 'ATTENTION: FIX INVALID INPUT HIGHLIGHTED BELOW'}</span>
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
              <div className="flex items-center gap-2">
                {isFormValid ? (
                  <span className="text-[10px] font-mono text-green-400 bg-green-950/40 border border-green-500/30 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-green-400" /> READY
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> CORRECTION REQ.
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#555]">TYPE 0x04</span>
              </div>
            </div>

            {/* Network Chain ID */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                TARGET CHAIN ID (0 = AGNOSTIC)
              </label>
              <div className="relative">
                <select
                  value={chainId}
                  onChange={(e) => setChainId(Number(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 bg-[#111] border border-green-500/80 text-sm font-mono text-white focus:outline-none focus:border-green-400 transition-all"
                >
                  <option value={8453}>Base Mainnet (Chain ID 8453)</option>
                  <option value={84532}>Base Sepolia Testnet (Chain ID 84532)</option>
                  <option value={1}>Ethereum Mainnet (Chain ID 1)</option>
                  <option value={17000}>Holesky Testnet (Chain ID 17000)</option>
                  <option value={0}>Chain Agnostic (Chain ID 0 - Multi-chain)</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="mt-1 text-[10px] font-mono text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> Valid EVM chain ID selected
              </p>
            </div>

            {/* EOA Address */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                SIGNER EOA ADDRESS
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={eoaAddress}
                  onChange={(e) => setEoaAddress(e.target.value)}
                  placeholder="0x..."
                  className={`w-full pl-3 pr-10 py-2.5 bg-[#111] border text-sm font-mono text-white focus:outline-none transition-all ${
                    isEoaValid
                      ? 'border-green-500/80 focus:border-green-400'
                      : 'border-red-500 text-red-200 bg-red-950/20 focus:border-red-400'
                  }`}
                />
                <div className="absolute right-3 top-3 pointer-events-none">
                  {isEoaValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {isEoaValid ? (
                <p className="mt-1 text-[10px] font-mono text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Valid EVM 20-byte address format
                </p>
              ) : (
                <p className="mt-1 text-[10px] font-mono text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Invalid address: Must start with 0x and contain exactly 40 hex characters
                </p>
              )}
            </div>

            {/* Target Code Address */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                DELEGATION CODE TARGET (SMART ACCOUNT / BATCHER)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x..."
                  className={`w-full pl-3 pr-10 py-2.5 bg-[#111] border text-sm font-mono text-white focus:outline-none transition-all ${
                    isTargetValid
                      ? 'border-green-500/80 focus:border-green-400'
                      : 'border-red-500 text-red-200 bg-red-950/20 focus:border-red-400'
                  }`}
                />
                <div className="absolute right-3 top-3 pointer-events-none">
                  {isTargetValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {isTargetValid ? (
                <p className="mt-1 text-[10px] font-mono text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Valid EVM smart contract target address
                </p>
              ) : (
                <p className="mt-1 text-[10px] font-mono text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Invalid target address: Must start with 0x and contain exactly 40 hex characters
                </p>
              )}
            </div>

            {/* Nonce & Gas Limit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* EOA Nonce */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                  EOA NONCE
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={nonce}
                    onChange={(e) => setNonce(Number(e.target.value))}
                    min={0}
                    className={`w-full pl-3 pr-8 py-2.5 bg-[#111] border text-sm font-mono text-white focus:outline-none transition-all ${
                      isNonceValid
                        ? 'border-green-500/80 focus:border-green-400'
                        : 'border-red-500 text-red-200 bg-red-950/20 focus:border-red-400'
                    }`}
                  />
                  <div className="absolute right-2.5 top-3 pointer-events-none">
                    {isNonceValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                </div>
                {isNonceValid ? (
                  <p className="mt-1 text-[10px] font-mono text-green-500">✓ Nonce ≥ 0</p>
                ) : (
                  <p className="mt-1 text-[10px] font-mono text-red-400">✗ Integer ≥ 0 required</p>
                )}
              </div>

              {/* Gas Limit */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                  GAS LIMIT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(Number(e.target.value))}
                    min={21000}
                    className={`w-full pl-3 pr-8 py-2.5 bg-[#111] border text-sm font-mono text-white focus:outline-none transition-all ${
                      isGasValid
                        ? 'border-green-500/80 focus:border-green-400'
                        : 'border-red-500 text-red-200 bg-red-950/20 focus:border-red-400'
                    }`}
                  />
                  <div className="absolute right-2.5 top-3 pointer-events-none">
                    {isGasValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                </div>
                {isGasValid ? (
                  <p className="mt-1 text-[10px] font-mono text-green-500">✓ Gas limit ≥ 21,000</p>
                ) : (
                  <p className="mt-1 text-[10px] font-mono text-red-400">✗ Minimum 21,000 gas required</p>
                )}
              </div>
            </div>

            {/* Signature Parity & Values */}
            <div className="pt-3 border-t border-[#1a1a1a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">
                  SECP256K1 SIGNATURE TUPLE (YPARITY, R, S)
                </span>
                {isRValid && isSValid && isYParityValid ? (
                  <span className="text-[10px] font-mono bg-green-500/20 text-green-400 border border-green-500/40 px-2 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VALID SIG
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> INVALID SIG
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="block text-[10px] font-mono text-[#555] mb-1">YPARITY (0/1)</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={yParity}
                      onChange={(e) => setYParity(Number(e.target.value))}
                      min={0}
                      max={1}
                      className={`w-full px-2.5 py-2 bg-[#111] border text-xs font-mono text-white focus:outline-none ${
                        isYParityValid ? 'border-green-500/80' : 'border-red-500 text-red-200'
                      }`}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-mono text-[#555] mb-1">R VALUE (32 BYTES)</span>
                  <input
                    type="text"
                    value={rVal}
                    onChange={(e) => setRVal(e.target.value)}
                    className={`w-full px-2.5 py-2 bg-[#111] border text-xs font-mono text-white focus:outline-none ${
                      isRValid ? 'border-green-500/80' : 'border-red-500 text-red-200'
                    }`}
                  />
                  {!isRValid && (
                    <p className="mt-1 text-[9px] font-mono text-red-400">Must be 0x + 64 hex characters</p>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-[#555] mb-1">S VALUE (32 BYTES)</span>
                <input
                  type="text"
                  value={sVal}
                  onChange={(e) => setSVal(e.target.value)}
                  className={`w-full px-2.5 py-2 bg-[#111] border text-xs font-mono text-white focus:outline-none ${
                    isSValid ? 'border-green-500/80' : 'border-red-500 text-red-200'
                  }`}
                />
                {!isSValid && (
                  <p className="mt-1 text-[9px] font-mono text-red-400">Must be 0x + 64 hex characters</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Computations & Inspector */}
        <div className="lg:col-span-6 space-y-6">
          {/* Authorization Magic Hash Box */}
          <div className={`bg-[#080808] border p-6 space-y-3 transition-all ${
            isTargetValid ? 'border-[#222]' : 'border-red-500/50 bg-red-950/10'
          }`}>
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isTargetValid ? 'text-white' : 'text-red-400'}`} />
                <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white">
                  02. AUTHORIZATION HASH
                </h4>
              </div>
              <button
                onClick={() => copyToClipboard(authHash, 'authHash')}
                disabled={!isTargetValid}
                className="text-xs font-mono text-[#888] hover:text-white disabled:opacity-30 uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied === 'authHash' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'authHash' ? 'COPIED' : 'COPY HASH'}
              </button>
            </div>

            <div className={`p-3 bg-[#111] border font-mono text-xs break-all ${
              isTargetValid ? 'border-[#222] text-white' : 'border-red-500/50 text-red-400'
            }`}>
              {authHash}
            </div>

            <p className="text-xs text-[#777] leading-relaxed">
              Computed as <code className="text-white">keccak256(0x05 || RLP([chain_id, address, nonce]))</code>. Magic prefix <code className="text-white font-bold">0x05</code> prevents replay collisions with standard EIP-191 & EIP-712 messages.
            </p>
          </div>

          {/* Code Pointer Injected Bytecode */}
          <div className={`bg-[#080808] border p-6 space-y-3 transition-all ${
            isTargetValid ? 'border-[#222]' : 'border-red-500/50 bg-red-950/10'
          }`}>
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Code2 className={`w-4 h-4 ${isTargetValid ? 'text-white' : 'text-red-400'}`} /> 03. EOA CODE POINTER (23 BYTES)
              </h4>
              <button
                onClick={() => copyToClipboard(codePointer, 'codePointer')}
                disabled={!isTargetValid}
                className="text-xs font-mono text-[#888] hover:text-white disabled:opacity-30 uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied === 'codePointer' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'codePointer' ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <div className={`p-3 bg-[#111] border font-mono text-xs break-all ${
              isTargetValid ? 'border-[#222] text-white' : 'border-red-500/50 text-red-400'
            }`}>
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
          <div className={`bg-[#080808] border p-6 space-y-3 transition-all ${
            isFormValid ? 'border-[#222]' : 'border-red-500/30'
          }`}>
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

