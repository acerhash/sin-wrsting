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
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export function Eip7702Builder() {
  const [chainId, setChainId] = useState<number>(84532); // Base Sepolia default
  const [eoaAddress, setEoaAddress] = useState<string>('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik EOA mock
  const [targetAddress, setTargetAddress] = useState<string>('0x770200000000000000000000000000000000ba7c');
  const [nonce, setNonce] = useState<number>(0);
  const [copied, setCopied] = useState<string | null>(null);

  // Signature state
  const [yParity, setYParity] = useState<number>(0);
  const [rVal, setRVal] = useState<string>('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  const [sVal, setSVal] = useState<string>('0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321');
  
  // Computed values
  const [authHash, setAuthHash] = useState<string>('');
  const [codePointer, setCodePointer] = useState<string>('');

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
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-2">
              <Zap className="w-3.5 h-3.5" /> EIP-7702 Transaction Type 0x04
            </div>
            <h2 className="text-xl font-bold text-white">Authorization Tuple & Transaction Builder</h2>
            <p className="text-slate-400 text-sm mt-1">
              Construct EIP-7702 signed authorization lists. Allows EOAs to temporarily adopt smart contract code during execution without deploying proxy contracts.
            </p>
          </div>
          <button
            onClick={handleRandomizeSig}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-sign Authorization
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" /> Authorization Parameters
            </h3>

            {/* Network Chain ID */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Chain ID</label>
              <select
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value={8453}>Base Mainnet (Chain ID 8453)</option>
                <option value={84532}>Base Sepolia Testnet (Chain ID 84532)</option>
                <option value={1}>Ethereum Mainnet (Chain ID 1)</option>
                <option value={17000}>Holesky Testnet (Chain ID 17000)</option>
                <option value={0}>Chain Agnostic (Chain ID 0 - Valid on Any EVM)</option>
              </select>
            </div>

            {/* EOA Address */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Signer EOA Address</label>
              <input
                type="text"
                value={eoaAddress}
                onChange={(e) => setEoaAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Target Code Address */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Delegation Code Address (Target Smart Account / Batcher)
              </label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* EOA Nonce */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                EOA Nonce (Must match current EOA nonce)
              </label>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Signature Parity & Values */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Secp256k1 Signature (yParity, r, s)</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Signature Active
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block text-[10px] text-slate-500">yParity</span>
                  <input
                    type="number"
                    value={yParity}
                    onChange={(e) => setYParity(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-500">r value</span>
                  <input
                    type="text"
                    value={rVal.slice(0, 16) + '...'}
                    readOnly
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Computations & Inspector */}
        <div className="lg:col-span-6 space-y-4">
          {/* Authorization Magic Hash Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Authorization Hash</h4>
              </div>
              <button
                onClick={() => copyToClipboard(authHash, 'authHash')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied === 'authHash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'authHash' ? 'Copied' : 'Copy Hash'}
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 break-all">
              {authHash}
            </div>

            <p className="text-[11px] text-slate-400">
              Computed as <code className="text-blue-300">keccak256(0x05 || RLP([chain_id, address, nonce]))</code>. Magic prefix <code className="text-amber-300">0x05</code> prevents replay attacks across EIP-191 & EIP-712 standard messages.
            </p>
          </div>

          {/* Code Pointer Injected Bytecode */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" /> EOA Code Pointer (23 Bytes)
              </h4>
              <button
                onClick={() => copyToClipboard(codePointer, 'codePointer')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied === 'codePointer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'codePointer' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all">
              <span className="text-emerald-400 font-bold">0xef0100</span>
              {codePointer.slice(8)}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Magic Prefix: 0xef0100</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Target Delegate Address</span>
            </div>
          </div>

          {/* Full JSON Payload */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" /> Type-4 Transaction Object
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(fullTxObject, null, 2), 'txObject')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied === 'txObject' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'txObject' ? 'Copied Payload' : 'Copy JSON'}
              </button>
            </div>

            <pre className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
              {JSON.stringify(fullTxObject, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
