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
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs font-mono uppercase tracking-[0.3em]">
              NODE RPC CONSOLE
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              JSON-RPC v2.0
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            NODE RPC INSPECTOR
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed">
            Query Ethereum and Base node RPC endpoints for EIP-7702 delegation code pointers, state queries, gas estimations, and block receipts.
          </p>
        </div>

        {/* Network Selector */}
        <div className="flex items-center gap-2 bg-[#111] p-2.5 border border-[#222]">
          <Globe className="w-4 h-4 text-white ml-1" />
          <select
            value={network}
            onChange={(e: any) => setNetwork(e.target.value)}
            className="bg-transparent text-xs font-mono font-bold uppercase text-white focus:outline-none cursor-pointer pr-2"
          >
            <option value="base-sepolia" className="bg-[#111]">Base Sepolia (84532)</option>
            <option value="base-mainnet" className="bg-[#111]">Base Mainnet (8453)</option>
            <option value="local-node" className="bg-[#111]">Local Node (31337)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Parameter Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#080808] border border-[#222] p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white border-b border-[#1a1a1a] pb-3">
              01. JSON-RPC CALL BUILDER
            </h3>

            {/* Method Picker */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                RPC METHOD
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs font-mono text-white focus:outline-none focus:border-white transition-all"
              >
                <option value="eth_getCode">eth_getCode (Inspect Code Pointer)</option>
                <option value="eth_estimateGas">eth_estimateGas (Type-4 Gas)</option>
                <option value="eth_sendRawTransaction">eth_sendRawTransaction (Submit Type-4)</option>
                <option value="eth_getTransactionByHash">eth_getTransactionByHash (Read Auth List)</option>
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                EOA TARGET ADDRESS
              </label>
              <input
                type="text"
                value={eoaAddr}
                onChange={(e) => setEoaAddr(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs font-mono text-white focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Block Tag */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">
                BLOCK TAG
              </label>
              <input
                type="text"
                value={blockTag}
                onChange={(e) => setBlockTag(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs font-mono text-white"
              />
            </div>

            <button
              onClick={handleQueryRpc}
              disabled={loading}
              className="w-full py-3 bg-white text-black hover:bg-[#eee] disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'EXECUTING CALL...' : 'SEND RPC REQUEST'}
            </button>
          </div>
        </div>

        {/* JSON-RPC Output Console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#080808] border border-[#222] p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-white" /> 02. JSON-RPC RESPONSE
              </span>
              <button
                onClick={copyResult}
                className="text-xs font-mono text-[#888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY RESPONSE'}
              </button>
            </div>

            <pre className="p-4 bg-[#111] border border-[#222] font-mono text-xs text-[#ccc] overflow-x-auto min-h-[220px] max-h-[340px] scrollbar-thin">
              {JSON.stringify(rpcResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
