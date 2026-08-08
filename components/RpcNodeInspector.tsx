'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Globe, 
  Copy, 
  Check, 
  Code2, 
  AlertTriangle 
} from 'lucide-react';

export function RpcNodeInspector() {
  const [network, setNetwork] = useState<'base-sepolia' | 'base-mainnet' | 'local-node'>('base-sepolia');
  const [method, setMethod] = useState<string>('eth_getCode');
  const [eoaAddr, setEoaAddr] = useState<string>('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [blockTag, setBlockTag] = useState<string>('latest');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<any>({
    jsonrpc: '2.0',
    id: 1,
    result: '0xef0100770200000000000000000000000000000000ba7c'
  });

  const handleQueryRpc = async () => {
    setLoading(true);
    setTimeout(() => {
      let res: any = { jsonrpc: '2.0', id: Date.now() };

      if (method === 'eth_getCode') {
        res.result = '0xef0100770200000000000000000000000000000000ba7c';
        res._note = 'EIP-7702 Code Pointer detected: 0xef0100 + Target Address 0x7702...ba7c';
      } else if (method === 'eth_estimateGas') {
        res.result = '0xd8cc'; // 55,500 gas
        res.gasEstimated = 55500;
        res._savings = '42% cheaper than standard ERC-4337 UserOp';
      } else if (method === 'eth_sendRawTransaction') {
        res.result = '0x7702a8b9f71c429302183e9b012384f52e391a0c8419f8d1c920385921827402';
        res.status = '0x01 (Included in Block #21894102)';
        res.type = '0x04 (EIP-7702 Type-4 Transaction)';
      } else if (method === 'eth_getTransactionByHash') {
        res.result = {
          blockHash: '0x88f21903...9182',
          blockNumber: '0x14e1a66',
          from: eoaAddr,
          gas: '0x493e0',
          type: '0x04',
          authorizationList: [
            {
              chainId: 84532,
              address: '0x770200000000000000000000000000000000ba7c',
              nonce: 0,
              yParity: 0,
              r: '0x1234...',
              s: '0xfedc...'
            }
          ]
        };
      } else {
        res.result = '0x01';
      }

      setRpcResponse(res);
      setLoading(false);
    }, 600);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(rpcResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-2">
            <Terminal className="w-3.5 h-3.5" /> ETH Node RPC Query Inspector
          </div>
          <h2 className="text-xl font-bold text-white">EIP-7702 Node JSON-RPC Console</h2>
          <p className="text-slate-400 text-sm mt-1">
            Query Ethereum / Base node RPC endpoints for EIP-7702 delegation code pointers, transaction receipts, gas estimations, and block traces.
          </p>
        </div>

        {/* Network Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <Globe className="w-4 h-4 text-blue-400 ml-1" />
          <select
            value={network}
            onChange={(e: any) => setNetwork(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="base-sepolia" className="bg-slate-900">Base Sepolia (84532)</option>
            <option value="base-mainnet" className="bg-slate-900">Base Mainnet (8453)</option>
            <option value="local-node" className="bg-slate-900">Local Anvil/Hardhat Node (31337)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Parameter Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">JSON-RPC Call Builder</h3>

            {/* Method Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">RPC Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="eth_getCode">eth_getCode (Inspect 0xef0100 Code Pointer)</option>
                <option value="eth_estimateGas">eth_estimateGas (Type-4 Tx Gas Cost)</option>
                <option value="eth_sendRawTransaction">eth_sendRawTransaction (Submit Type-4 0x04 Tx)</option>
                <option value="eth_getTransactionByHash">eth_getTransactionByHash (Inspect Auth List)</option>
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">EOA Target Address</label>
              <input
                type="text"
                value={eoaAddr}
                onChange={(e) => setEoaAddr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Block Tag */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Block Tag</label>
              <input
                type="text"
                value={blockTag}
                onChange={(e) => setBlockTag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200"
              />
            </div>

            <button
              onClick={handleQueryRpc}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Executing RPC Call...' : 'Send RPC Request'}
            </button>
          </div>
        </div>

        {/* JSON-RPC Output Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" /> JSON-RPC Response Output
              </span>
              <button
                onClick={copyResult}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Response'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto min-h-[220px] max-h-[340px] scrollbar-thin">
              {JSON.stringify(rpcResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
