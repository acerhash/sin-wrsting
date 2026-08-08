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
  ShieldAlert,
  Fuel,
  Gauge,
  Calculator,
  Flame,
  Coins,
  History,
  Clock,
  Undo2,
  Trash2,
  Bookmark
} from 'lucide-react';

const STORAGE_KEY = 'eip7702_builder_form_state_v1';
const HISTORY_STORAGE_KEY = 'eip7702_builder_history_v1';

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

export interface GasEstimateResult {
  hexResult: string;
  gasUnits: number;
  breakdown: {
    baseTxGas: number;
    eip7702AuthGas: number;
    executionGas: number;
  };
  estimatedFeeEth: string;
  estimatedFeeUsd: string;
  timestamp: string;
  rpcLatencyMs: number;
}

export interface Eip7702HistoryItem {
  id: string;
  timestamp: string;
  formattedTime: string;
  config: {
    chainId: number;
    eoaAddress: string;
    targetAddress: string;
    nonce: number;
    gasLimit: number;
    maxFeePerGas: number;
    yParity: number;
    rVal: string;
    sVal: string;
  };
  authHash: string;
  codePointer: string;
}

/**
 * Mock RPC call simulating eth_estimateGas for EIP-7702 Type-4 transaction
 */
const mockEstimateGasRpc = async (
  target: string,
  maxFeePerGasGwei: number
): Promise<GasEstimateResult> => {
  const startTime = performance.now();
  // Simulate network RPC round-trip delay (400 - 700 ms)
  const delayMs = Math.floor(Math.random() * 300) + 400;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const baseTxGas = 21000;
  // EIP-7702 authorization list item processing cost (~25,000 gas per auth entry)
  const eip7702AuthGas = 25000;
  
  // Execution gas depending on target contract address complexity
  const targetSeed = parseInt(target.slice(-4) || '7702', 16) % 12000;
  const executionGas = 28400 + targetSeed;

  const totalGas = baseTxGas + eip7702AuthGas + executionGas;
  const hexResult = '0x' + totalGas.toString(16);

  const totalGasFeeWei = BigInt(totalGas) * BigInt(Math.round(maxFeePerGasGwei * 1e9));
  const feeEthNum = Number(totalGasFeeWei) / 1e18;
  const feeEth = feeEthNum.toFixed(6);
  const feeUsd = (feeEthNum * 2800).toFixed(2); // Assume $2,800 / ETH

  const endTime = performance.now();
  const latency = Math.round(endTime - startTime);

  return {
    hexResult,
    gasUnits: totalGas,
    breakdown: {
      baseTxGas,
      eip7702AuthGas,
      executionGas
    },
    estimatedFeeEth: feeEth,
    estimatedFeeUsd: feeUsd,
    timestamp: new Date().toLocaleTimeString(),
    rpcLatencyMs: latency
  };
};

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

  // Gas Estimation States
  const [isEstimatingGas, setIsEstimatingGas] = useState<boolean>(false);
  const [gasEstimateResult, setGasEstimateResult] = useState<GasEstimateResult | null>(null);

  // Transaction History States
  const [history, setHistory] = useState<Eip7702HistoryItem[]>([]);
  const [historyNotification, setHistoryNotification] = useState<string | null>(null);

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

  // Auto-load form state & history on mount
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

        const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            setHistory(parsedHistory.slice(0, 5));
          } else {
            // Pre-seed with initial state if empty history
            const defaultHash = compute7702AuthorizationHash({
              chainId: DEFAULT_STATE.chainId,
              address: DEFAULT_STATE.targetAddress,
              nonce: DEFAULT_STATE.nonce
            });
            const defaultPointer = formatEoaCodePointer(DEFAULT_STATE.targetAddress);
            const initialBuild: Eip7702HistoryItem = {
              id: 'init-0',
              timestamp: new Date().toISOString(),
              formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              config: { ...DEFAULT_STATE },
              authHash: defaultHash,
              codePointer: defaultPointer
            };
            setHistory([initialBuild]);
          }
        } else {
          const defaultHash = compute7702AuthorizationHash({
            chainId: DEFAULT_STATE.chainId,
            address: DEFAULT_STATE.targetAddress,
            nonce: DEFAULT_STATE.nonce
          });
          const defaultPointer = formatEoaCodePointer(DEFAULT_STATE.targetAddress);
          const initialBuild: Eip7702HistoryItem = {
            id: 'init-0',
            timestamp: new Date().toISOString(),
            formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            config: { ...DEFAULT_STATE },
            authHash: defaultHash,
            codePointer: defaultPointer
          };
          setHistory([initialBuild]);
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

  // Persist transaction history
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      }
    } catch (e) {
      console.error('Error persisting transaction history to localStorage:', e);
    }
  }, [history, isLoaded]);

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
    setGasEstimateResult(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error resetting EIP-7702 config:', e);
    }
  };

  const handleSaveToHistory = () => {
    if (!isFormValid) return;

    const currentAuthHash = isTargetValid ? compute7702AuthorizationHash({
      chainId,
      address: targetAddress,
      nonce: isNonceValid ? nonce : 0
    }) : 'INVALID_TARGET_ADDRESS';

    const currentCodePointer = isTargetValid ? formatEoaCodePointer(targetAddress) : '0xef01000000000000000000000000000000000000000000';

    const newItem: Eip7702HistoryItem = {
      id: 'tx-' + Date.now(),
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      config: {
        chainId,
        eoaAddress,
        targetAddress,
        nonce,
        gasLimit,
        maxFeePerGas,
        yParity,
        rVal,
        sVal
      },
      authHash: currentAuthHash,
      codePointer: currentCodePointer
    };

    setHistory((prev) => {
      // Check if duplicate config exists at top
      const isSameAsTop = prev.length > 0 &&
        prev[0].config.chainId === chainId &&
        prev[0].config.eoaAddress === eoaAddress &&
        prev[0].config.targetAddress === targetAddress &&
        prev[0].config.nonce === nonce &&
        prev[0].config.gasLimit === gasLimit &&
        prev[0].config.maxFeePerGas === maxFeePerGas &&
        prev[0].config.yParity === yParity &&
        prev[0].config.rVal === rVal &&
        prev[0].config.sVal === sVal;

      if (isSameAsTop) {
        setHistoryNotification('CURRENT CONFIG ALREADY AT TOP OF HISTORY');
        setTimeout(() => setHistoryNotification(null), 2500);
        return prev;
      }

      const nextHistory = [newItem, ...prev].slice(0, 5);
      setHistoryNotification('SNAPSHOT SAVED TO TRANSACTION HISTORY');
      setTimeout(() => setHistoryNotification(null), 2500);
      return nextHistory;
    });
  };

  const handleRevertToHistory = (item: Eip7702HistoryItem) => {
    setChainId(item.config.chainId);
    setEoaAddress(item.config.eoaAddress);
    setTargetAddress(item.config.targetAddress);
    setNonce(item.config.nonce);
    setGasLimit(item.config.gasLimit);
    setMaxFeePerGas(item.config.maxFeePerGas);
    setYParity(item.config.yParity);
    setRVal(item.config.rVal);
    setSVal(item.config.sVal);
    setGasEstimateResult(null);

    setHistoryNotification(`REVERTED TO BUILD FROM ${item.formattedTime}`);
    setTimeout(() => setHistoryNotification(null), 2500);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error clearing history:', e);
    }
    setHistoryNotification('TRANSACTION HISTORY CLEARED');
    setTimeout(() => setHistoryNotification(null), 2500);
  };

  const isMatchingHistoryItem = (item: Eip7702HistoryItem) => {
    return (
      item.config.chainId === chainId &&
      item.config.eoaAddress.toLowerCase() === eoaAddress.toLowerCase() &&
      item.config.targetAddress.toLowerCase() === targetAddress.toLowerCase() &&
      item.config.nonce === nonce &&
      item.config.gasLimit === gasLimit &&
      item.config.maxFeePerGas === maxFeePerGas &&
      item.config.yParity === yParity &&
      item.config.rVal === rVal &&
      item.config.sVal === sVal
    );
  };

  const handleEstimateGas = async () => {
    if (isEstimatingGas) return;
    setIsEstimatingGas(true);
    try {
      const res = await mockEstimateGasRpc(
        isTargetValid ? targetAddress : DEFAULT_STATE.targetAddress,
        isMaxFeeValid ? maxFeePerGas : DEFAULT_STATE.maxFeePerGas
      );
      setGasEstimateResult(res);
      // Automatically apply estimated gas to gasLimit state
      setGasLimit(res.gasUnits);
    } catch (err) {
      console.error('Failed to estimate gas via mock RPC:', err);
    } finally {
      setIsEstimatingGas(false);
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
            onClick={handleSaveToHistory}
            disabled={!isFormValid}
            className="bg-green-500 text-black hover:bg-green-400 disabled:opacity-40 px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-green-500 transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" /> SAVE SNAPSHOT
          </button>
          <button
            onClick={handleRandomizeSig}
            className="bg-white text-black hover:bg-[#eee] px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> RE-SIGN AUTH
          </button>
          <button
            onClick={handleResetDefaults}
            className="bg-[#111] text-[#aaa] hover:text-white hover:border-[#444] px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-[#222] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET DEFAULTS
          </button>
        </div>
      </div>

      {/* Auto-save & Validation Status Indicator Bar */}
      <div className="bg-[#0a0a0a] border border-[#222] px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px] text-[#666] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
          <span>{isFormValid ? 'ALL FORM INPUTS VALIDATED' : 'ATTENTION: FIX INVALID INPUT HIGHLIGHTED BELOW'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-green-400 font-bold">
            <History className="w-3.5 h-3.5 text-green-400" />
            HISTORY: {history.length}/5 SAVED
          </span>
          <span>{lastSavedAt ? `LAST UPDATED: ${lastSavedAt}` : 'READY'}</span>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666]">
                    GAS LIMIT
                  </label>
                  <button
                    type="button"
                    onClick={handleEstimateGas}
                    disabled={isEstimatingGas || !isTargetValid}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-400 hover:text-green-300 disabled:opacity-40 flex items-center gap-1 bg-green-950/40 border border-green-500/30 px-2 py-0.5 hover:bg-green-900/40 transition-all cursor-pointer"
                  >
                    {isEstimatingGas ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-green-400" />
                    ) : (
                      <Fuel className="w-3 h-3 text-green-400" />
                    )}
                    {isEstimatingGas ? 'ESTIMATING...' : 'ESTIMATE GAS'}
                  </button>
                </div>
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

            {/* Mock RPC Gas Estimation Panel */}
            <div className="p-4 bg-[#0d0d0d] border border-[#222] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    RPC GAS ESTIMATOR (eth_estimateGas)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleEstimateGas}
                  disabled={isEstimatingGas || !isTargetValid}
                  className="px-3 py-1 bg-green-500 text-black hover:bg-green-400 font-bold text-xs uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isEstimatingGas ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calculator className="w-3.5 h-3.5" />
                  )}
                  {isEstimatingGas ? 'RUNNING RPC...' : 'ESTIMATE VIA RPC'}
                </button>
              </div>

              {isEstimatingGas && (
                <div className="p-3 bg-[#111] border border-green-500/30 flex items-center gap-3 text-xs text-green-400 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                  <span>EXECUTING MOCK JSON-RPC CALL: <code className="text-white">eth_estimateGas(EIP7702Tx)</code>...</span>
                </div>
              )}

              {gasEstimateResult && !isEstimatingGas && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-[#111] border border-[#222]">
                      <span className="block text-[#666] text-[9px] uppercase tracking-wider">RPC RETURN (HEX)</span>
                      <span className="text-green-400 font-bold break-all">{gasEstimateResult.hexResult}</span>
                    </div>
                    <div className="p-2 bg-[#111] border border-[#222]">
                      <span className="block text-[#666] text-[9px] uppercase tracking-wider">ESTIMATED GAS</span>
                      <span className="text-white font-bold">{gasEstimateResult.gasUnits.toLocaleString()} units</span>
                    </div>
                    <div className="p-2 bg-[#111] border border-[#222]">
                      <span className="block text-[#666] text-[9px] uppercase tracking-wider">ESTIMATED FEE (ETH)</span>
                      <span className="text-white font-bold">{gasEstimateResult.estimatedFeeEth} ETH</span>
                    </div>
                    <div className="p-2 bg-[#111] border border-[#222]">
                      <span className="block text-[#666] text-[9px] uppercase tracking-wider">ESTIMATED FEE (USD)</span>
                      <span className="text-green-400 font-bold">${gasEstimateResult.estimatedFeeUsd}</span>
                    </div>
                  </div>

                  {/* Gas Breakdown */}
                  <div className="p-2.5 bg-[#111] border border-[#222] space-y-1.5 text-[10px] text-[#aaa]">
                    <div className="flex justify-between items-center text-[#888] font-bold border-b border-[#222] pb-1">
                      <span>GAS COMPONENT BREAKDOWN</span>
                      <span className="text-[9px] text-[#555]">LATENCY: {gasEstimateResult.rpcLatencyMs}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-orange-400" /> Base EVM Transaction Fee
                      </span>
                      <span className="font-mono text-white">{gasEstimateResult.breakdown.baseTxGas.toLocaleString()} gas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Fuel className="w-3 h-3 text-green-400" /> EIP-7702 Set-Code Authorization Overhead
                      </span>
                      <span className="font-mono text-white">{gasEstimateResult.breakdown.eip7702AuthGas.toLocaleString()} gas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-3 h-3 text-blue-400" /> Target Contract Execution & Validation
                      </span>
                      <span className="font-mono text-white">{gasEstimateResult.breakdown.executionGas.toLocaleString()} gas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#777]">
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 className="w-3 h-3" /> Auto-applied to transaction gas limit input above
                    </span>
                    <span>TIMESTAMP: {gasEstimateResult.timestamp}</span>
                  </div>
                </div>
              )}

              {!gasEstimateResult && !isEstimatingGas && (
                <p className="text-[11px] text-[#666]">
                  Click <strong className="text-white">ESTIMATE VIA RPC</strong> to run mock <code className="text-white">eth_estimateGas</code> calculation on current EIP-7702 delegation payload.
                </p>
              )}
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

      {/* 05. Transaction History Section (Tracks Last 5 Built Transactions) */}
      <div className="bg-[#080808] border border-[#222] p-6 space-y-4 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1a1a1a] pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-white">
                  05. TRANSACTION HISTORY
                </h3>
                <span className="bg-green-500/20 text-green-400 border border-green-500/40 text-[10px] px-2 py-0.5 font-bold">
                  {history.length} / 5 BUILDS
                </span>
              </div>
              <p className="text-xs text-[#888] mt-0.5">
                Tracks the last 5 transaction configurations built. Click any saved snapshot to instantly restore its configuration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToHistory}
              disabled={!isFormValid}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" /> SAVE SNAPSHOT
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 bg-[#111] hover:bg-red-950/40 text-[#aaa] hover:text-red-400 border border-[#222] hover:border-red-500/40 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> CLEAR
              </button>
            )}
          </div>
        </div>

        {historyNotification && (
          <div className="p-2.5 bg-green-950/40 border border-green-500/50 text-green-400 text-xs flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-green-400 shrink-0" />
            <span className="font-bold">{historyNotification}</span>
          </div>
        )}

        {history.length === 0 ? (
          <div className="p-8 text-center bg-[#0d0d0d] border border-[#1f1f1f] space-y-2">
            <Clock className="w-8 h-8 text-[#444] mx-auto" />
            <p className="text-xs text-[#888] uppercase tracking-wider font-bold">
              NO TRANSACTION HISTORY SAVED YET
            </p>
            <p className="text-xs text-[#666]">
              Click <strong className="text-white">SAVE SNAPSHOT</strong> to store your current valid transaction payload.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {history.map((item, idx) => {
              const isActive = isMatchingHistoryItem(item);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 bg-[#0d0d0d] border flex flex-col justify-between space-y-3 transition-all relative ${
                    isActive
                      ? 'border-green-500 bg-green-950/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'border-[#222] hover:border-[#444]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-[#222] pb-2 text-[10px]">
                      <span className="text-green-400 font-bold uppercase tracking-wider">
                        BUILD #{idx + 1}
                      </span>
                      <span className="text-[#666] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#555]" />
                        {item.formattedTime}
                      </span>
                    </div>

                    {isActive && (
                      <div className="bg-green-500 text-black font-bold text-[9px] uppercase px-2 py-0.5 tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE FORM
                      </div>
                    )}

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-[#666] text-[9px] block uppercase">CHAIN ID</span>
                        <span className="text-white font-bold">{item.config.chainId}</span>
                      </div>
                      <div>
                        <span className="text-[#666] text-[9px] block uppercase">TARGET DELEGATE</span>
                        <span className="text-green-400 font-bold break-all text-[10px]" title={item.config.targetAddress}>
                          {item.config.targetAddress.slice(0, 6)}...{item.config.targetAddress.slice(-6)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#666] text-[9px] block uppercase">EOA SIGNER</span>
                        <span className="text-[#aaa] break-all text-[10px]" title={item.config.eoaAddress}>
                          {item.config.eoaAddress.slice(0, 6)}...{item.config.eoaAddress.slice(-6)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-[#888] pt-1.5 border-t border-[#1a1a1a]">
                        <span>NONCE: <strong className="text-white">{item.config.nonce}</strong></span>
                        <span>GAS: <strong className="text-white">{item.config.gasLimit.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevertToHistory(item)}
                    disabled={isActive}
                    className={`w-full py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1a1a1a] text-[#555] cursor-not-allowed border border-[#222]'
                        : 'bg-white text-black hover:bg-[#eee] border border-white'
                    }`}
                  >
                    <Undo2 className="w-3 h-3" />
                    {isActive ? 'CURRENT FORM' : 'REVERT TO THIS'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

