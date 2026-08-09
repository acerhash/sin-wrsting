'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Globe, 
  Copy, 
  Check, 
  Code2, 
  AlertTriangle,
  Activity,
  Play,
  Pause,
  Zap,
  BarChart2,
  Radio,
  Sliders,
  RotateCcw,
  History,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  ExternalLink,
  FileText,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface LatencyMetric {
  timestamp: string;
  latencyMs: number;
  successRate: number;
  requestsCount: number;
  method: string;
}

export interface SubmittedTx {
  id: string;
  txHash: string;
  method: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  blockNumber?: string;
  gasUsed?: string;
  from: string;
  to?: string;
  type: string;
  network: string;
  value?: string;
  authorizationCount?: number;
  authorizations?: Array<{
    chainId: number;
    address: string;
    nonce: number;
  }>;
  errorMessage?: string;
}

const INITIAL_METRICS: LatencyMetric[] = [
  { timestamp: '12:00:00', latencyMs: 42, successRate: 100, requestsCount: 12, method: 'eth_getCode' },
  { timestamp: '12:00:03', latencyMs: 38, successRate: 100, requestsCount: 24, method: 'eth_getCode' },
  { timestamp: '12:00:06', latencyMs: 55, successRate: 100, requestsCount: 36, method: 'eth_estimateGas' },
  { timestamp: '12:00:09', latencyMs: 40, successRate: 100, requestsCount: 48, method: 'eth_getCode' },
  { timestamp: '12:00:12', latencyMs: 65, successRate: 98, requestsCount: 60, method: 'eth_sendRawTx' },
  { timestamp: '12:00:15', latencyMs: 35, successRate: 100, requestsCount: 72, method: 'eth_getCode' },
  { timestamp: '12:00:18', latencyMs: 48, successRate: 100, requestsCount: 84, method: 'eth_getTransaction' },
  { timestamp: '12:00:21', latencyMs: 52, successRate: 100, requestsCount: 96, method: 'eth_getCode' },
];

const INITIAL_TRANSACTIONS: SubmittedTx[] = [
  {
    id: 'tx-1',
    txHash: '0x7702a8b9f71c429302183e9b012384f52e391a0c8419f8d1c920385921827402',
    method: 'eth_sendRawTransaction',
    timestamp: '12:00:21',
    status: 'confirmed',
    blockNumber: '21894102',
    gasUsed: '52,410',
    from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to: '0x770200000000000000000000000000000000ba7c',
    type: '0x04 (EIP-7702)',
    network: 'Base Sepolia',
    value: '0.00 ETH',
    authorizationCount: 1,
    authorizations: [
      { chainId: 84532, address: '0x770200000000000000000000000000000000ba7c', nonce: 0 }
    ]
  },
  {
    id: 'tx-2',
    txHash: '0x4f8921e331b209840212395a09b821034f8210c8419f8d1c92038592182759f2',
    method: 'eth_sendRawTransaction',
    timestamp: '12:00:15',
    status: 'confirmed',
    blockNumber: '21894098',
    gasUsed: '38,120',
    from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to: '0x4337000000000000000000000000000000001000',
    type: '0x04 (EIP-7702)',
    network: 'Base Sepolia',
    value: '0.005 ETH',
    authorizationCount: 1,
    authorizations: [
      { chainId: 84532, address: '0x4337000000000000000000000000000000001000', nonce: 1 }
    ]
  },
  {
    id: 'tx-3',
    txHash: '0x991f21a88b1239012839210e391a0c8419f8d1c920385921827402882190342',
    method: 'eth_sendRawTransaction',
    timestamp: '11:58:40',
    status: 'failed',
    blockNumber: '21894050',
    gasUsed: '21,000',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x770200000000000000000000000000000000ba7c',
    type: '0x04 (EIP-7702)',
    network: 'Base Sepolia',
    value: '0.00 ETH',
    authorizationCount: 1,
    errorMessage: 'EIP-7702: Invalid authorization signature yParity'
  }
];

export function RpcNodeInspector() {
  const [network, setNetwork] = useState<'base-sepolia' | 'base-mainnet' | 'local-node'>('base-sepolia');
  const [method, setMethod] = useState<string>('eth_getCode');
  const [eoaAddr, setEoaAddr] = useState<string>('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [blockTag, setBlockTag] = useState<string>('latest');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<LatencyMetric[]>(INITIAL_METRICS);
  const [requestsTotal, setRequestsTotal] = useState<number>(96);

  // Transaction History State
  const [transactions, setTransactions] = useState<SubmittedTx[]>(INITIAL_TRANSACTIONS);
  const [txFilter, setTxFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [txSearch, setTxSearch] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>('tx-1');
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);

  const [rpcResponse, setRpcResponse] = useState<any>({
    jsonrpc: '2.0',
    id: 1,
    result: '0xef0100770200000000000000000000000000000000ba7c'
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addNewSubmittedTx = (customHash?: string) => {
    const hash = customHash || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    const netLabel = network === 'base-sepolia' ? 'Base Sepolia' : network === 'base-mainnet' ? 'Base Mainnet' : 'Local Node';
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const simulatedBlock = (21894100 + Math.floor(Math.random() * 50)).toString();

    const newTx: SubmittedTx = {
      id: `tx-${Date.now()}`,
      txHash: hash,
      method: 'eth_sendRawTransaction',
      timestamp: nowStr,
      status: 'pending',
      from: eoaAddr,
      to: '0x770200000000000000000000000000000000ba7c',
      type: '0x04 (EIP-7702)',
      network: netLabel,
      value: '0.00 ETH',
      authorizationCount: 1,
      authorizations: [
        {
          chainId: network === 'base-mainnet' ? 8453 : network === 'base-sepolia' ? 84532 : 31337,
          address: '0x770200000000000000000000000000000000ba7c',
          nonce: Math.floor(Math.random() * 3)
        }
      ]
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Automatically transition to confirmed after 2.5 seconds
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === newTx.id
            ? {
                ...item,
                status: 'confirmed',
                blockNumber: simulatedBlock,
                gasUsed: (42000 + Math.floor(Math.random() * 12000)).toLocaleString()
              }
            : item
        )
      );
    }, 2500);

    return hash;
  };

  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(hash);
    setTimeout(() => setCopiedTxHash(null), 2000);
  };

  const handleInspectTxInRpc = (tx: SubmittedTx) => {
    setMethod('eth_getTransactionByHash');
    setRpcResponse({
      jsonrpc: '2.0',
      id: Date.now(),
      result: {
        hash: tx.txHash,
        status: tx.status === 'confirmed' ? '0x01' : tx.status === 'failed' ? '0x00' : 'pending',
        blockNumber: tx.blockNumber ? `0x${parseInt(tx.blockNumber).toString(16)}` : null,
        from: tx.from,
        to: tx.to,
        gas: tx.gasUsed ? `0x${parseInt(tx.gasUsed.replace(',', '')).toString(16)}` : '0x0',
        type: tx.type.split(' ')[0],
        value: tx.value,
        authorizationList: tx.authorizations || [
          {
            chainId: network === 'base-mainnet' ? 8453 : network === 'base-sepolia' ? 84532 : 31337,
            address: '0x770200000000000000000000000000000000ba7c',
            nonce: 0,
            yParity: 0,
            r: '0x9a8b7c...',
            s: '0x123456...'
          }
        ]
      }
    });

    const builderElem = document.getElementById('rpc-call-builder');
    if (builderElem) {
      builderElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const countConfirmed = transactions.filter((t) => t.status === 'confirmed').length;
  const countPending = transactions.filter((t) => t.status === 'pending').length;
  const countFailed = transactions.filter((t) => t.status === 'failed').length;

  const filteredTxs = transactions.filter((tx) => {
    const matchesFilter = txFilter === 'all' || tx.status === txFilter;
    const matchesSearch =
      !txSearch ||
      tx.txHash.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.from.toLowerCase().includes(txSearch.toLowerCase()) ||
      (tx.to && tx.to.toLowerCase().includes(txSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Real-time metrics streamer
  useEffect(() => {
    if (isLiveStreaming) {
      timerRef.current = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        // Base latency depends on network
        const baseLatency = network === 'local-node' ? 8 : network === 'base-mainnet' ? 28 : 45;
        const jitter = Math.floor(Math.random() * 25) - 10;
        const latencyMs = Math.max(5, baseLatency + jitter);
        
        // Occasional minor success rate fluctuation
        const successRate = Math.random() > 0.95 ? 96 : 100;

        setRequestsTotal((prev) => {
          const nextCount = prev + 1;
          setMetrics((prevMetrics) => {
            const newMetric: LatencyMetric = {
              timestamp: timeStr,
              latencyMs,
              successRate,
              requestsCount: nextCount,
              method: 'eth_getCode (ping)'
            };
            const updated = [...prevMetrics, newMetric];
            return updated.slice(-15); // keep last 15 points
          });
          return nextCount;
        });
      }, 2500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLiveStreaming, network]);

  const handleQueryRpc = async () => {
    setLoading(true);
    const startTime = Date.now();

    setTimeout(() => {
      const durationMs = Date.now() - startTime;
      let res: any = { jsonrpc: '2.0', id: Date.now() };

      if (method === 'eth_getCode') {
        res.result = '0xef0100770200000000000000000000000000000000ba7c';
        res._note = 'EIP-7702 Code Pointer detected: 0xef0100 + Target Address 0x7702...ba7c';
      } else if (method === 'eth_estimateGas') {
        res.result = '0xd8cc'; // 55,500 gas
        res.gasEstimated = 55500;
        res._savings = '42% cheaper than standard ERC-4337 UserOp';
      } else if (method === 'eth_sendRawTransaction') {
        const newHash = addNewSubmittedTx();
        res.result = newHash;
        res.status = '0x01 (Pending inclusion in mempool)';
        res.type = '0x04 (EIP-7702 Type-4 Transaction)';
        res._note = 'Transaction submitted to mempool. Status updated in Transaction History below.';
      } else if (method === 'eth_getTransactionByHash') {
        res.result = {
          blockHash: '0x88f21903...9182',
          blockNumber: '0x14e1a66',
          from: eoaAddr,
          gas: '0x493e0',
          type: '0x04',
          authorizationList: [
            {
              chainId: network === 'base-mainnet' ? 8453 : network === 'base-sepolia' ? 84532 : 31337,
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

      // Append to metrics chart
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setRequestsTotal((prev) => {
        const nextCount = prev + 1;
        setMetrics((prevMetrics) => [
          ...prevMetrics.slice(-14),
          {
            timestamp: timeStr,
            latencyMs: durationMs,
            successRate: 100,
            requestsCount: nextCount,
            method
          }
        ]);
        return nextCount;
      });
    }, 450);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(rpcResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate telemetry aggregates
  const avgLatency = Math.round(
    metrics.reduce((acc, curr) => acc + curr.latencyMs, 0) / (metrics.length || 1)
  );
  const avgSuccessRate = Math.round(
    metrics.reduce((acc, curr) => acc + curr.successRate, 0) / (metrics.length || 1)
  );
  const currentLatency = metrics.length ? metrics[metrics.length - 1].latencyMs : 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Banner */}
      <div className="border border-[#222] bg-[#080808] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#666] text-xs uppercase tracking-[0.3em]">
              NODE RPC CONSOLE & TELEMETRY
            </span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
              JSON-RPC v2.0
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase">
            NODE RPC INSPECTOR
          </h2>
          <p className="mt-2 text-sm text-[#888] max-w-2xl leading-relaxed font-sans">
            Query Ethereum and Base node RPC endpoints for EIP-7702 delegation code pointers, state queries, gas estimations, and monitor real-time latency & response metrics.
          </p>
        </div>

        {/* Network & Live Ping Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111] p-2.5 border border-[#222]">
            <Globe className="w-4 h-4 text-white ml-1 shrink-0" />
            <select
              value={network}
              onChange={(e: any) => setNetwork(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="base-sepolia" className="bg-[#111]">Base Sepolia (84532)</option>
              <option value="base-mainnet" className="bg-[#111]">Base Mainnet (8453)</option>
              <option value="local-node" className="bg-[#111]">Local Node (31337)</option>
            </select>
          </div>

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-[#111] text-[#888] border-[#333] hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
            {isLiveStreaming ? 'LIVE TELEMETRY ON' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Real-Time Performance Visualization (Recharts) */}
      <div className="border border-[#222] bg-[#080808] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                REAL-TIME RPC NODE TELEMETRY & LATENCY METRICS
              </h3>
              <p className="text-xs text-[#777] font-sans">
                Active node health monitor: Response time (ms) and request success rate over time.
              </p>
            </div>
          </div>

          {/* Quick Metrics KPI Pill */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-[#111] border border-[#222]">
              <span className="text-[9px] text-[#666] uppercase block">LATEST PING</span>
              <span className="text-sm font-bold text-blue-400">{currentLatency} ms</span>
            </div>
            <div className="p-2 bg-[#111] border border-[#222]">
              <span className="text-[9px] text-[#666] uppercase block">AVG LATENCY</span>
              <span className="text-sm font-bold text-white">{avgLatency} ms</span>
            </div>
            <div className="p-2 bg-[#111] border border-[#222]">
              <span className="text-[9px] text-[#666] uppercase block">SUCCESS RATE</span>
              <span className="text-sm font-bold text-emerald-400">{avgSuccessRate}%</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#555" 
                tick={{ fill: '#777', fontSize: 10 }} 
                tickLine={false}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#3b82f6" 
                tick={{ fill: '#3b82f6', fontSize: 10 }} 
                unit="ms" 
                tickLine={false}
                domain={[0, 'auto']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#10b981" 
                tick={{ fill: '#10b981', fontSize: 10 }} 
                unit="%" 
                tickLine={false}
                domain={[80, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  borderColor: '#333',
                  borderRadius: '0px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#fff'
                }}
                formatter={(value: any, name: any) => [
                  name === 'latencyMs' ? `${value} ms` : `${value}%`,
                  name === 'latencyMs' ? 'Response Latency' : 'Success Rate'
                ]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} 
                formatter={(value) => (value === 'latencyMs' ? 'Latency (ms)' : 'Success Rate (%)')}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="latencyMs"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLatency)"
                name="latencyMs"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorSuccess)"
                name="successRate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Request Parameter Form */}
        <div className="lg:col-span-5 space-y-6">
          <div id="rpc-call-builder" className="bg-[#080808] border border-[#222] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white border-b border-[#1a1a1a] pb-3">
              01. JSON-RPC CALL BUILDER
            </h3>

            {/* Method Picker */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#666] mb-1.5">
                RPC METHOD
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs text-white focus:outline-none focus:border-white transition-all cursor-pointer"
              >
                <option value="eth_getCode">eth_getCode (Inspect Code Pointer)</option>
                <option value="eth_estimateGas">eth_estimateGas (Type-4 Gas)</option>
                <option value="eth_sendRawTransaction">eth_sendRawTransaction (Submit Type-4)</option>
                <option value="eth_getTransactionByHash">eth_getTransactionByHash (Read Auth List)</option>
              </select>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#666] mb-1.5">
                EOA TARGET ADDRESS
              </label>
              <input
                type="text"
                value={eoaAddr}
                onChange={(e) => setEoaAddr(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs text-white focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Block Tag */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#666] mb-1.5">
                BLOCK TAG
              </label>
              <input
                type="text"
                value={blockTag}
                onChange={(e) => setBlockTag(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-[#222] text-xs text-white"
              />
            </div>

            <button
              onClick={handleQueryRpc}
              disabled={loading}
              className="w-full py-3 bg-white text-black hover:bg-[#eee] disabled:opacity-50 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white cursor-pointer"
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
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-white" /> 02. JSON-RPC RESPONSE
              </span>
              <button
                onClick={copyResult}
                className="text-xs text-[#888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY RESPONSE'}
              </button>
            </div>

            <pre className="p-4 bg-[#111] border border-[#222] text-xs text-[#ccc] overflow-x-auto min-h-[220px] max-h-[340px] scrollbar-thin">
              {JSON.stringify(rpcResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* 03. Local Transaction Submission History */}
      <div className="bg-[#080808] border border-[#222] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  03. LOCAL TRANSACTION SUBMISSION HISTORY
                </h3>
                <span className="bg-[#1a1a1a] text-[#888] text-[10px] px-2 py-0.5 font-bold border border-[#333]">
                  {transactions.length} TOTAL
                </span>
              </div>
              <p className="text-xs text-[#777] font-sans">
                Track status, execution gas, EIP-7702 authorization payload, and block confirmation for locally submitted raw transactions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => addNewSubmittedTx()}
              className="px-3 py-2 bg-white text-black hover:bg-[#eee] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-white"
            >
              <Zap className="w-3.5 h-3.5" />
              SUBMIT TEST TYPE-4 TX
            </button>
            <button
              onClick={() => setTransactions([])}
              disabled={transactions.length === 0}
              className="px-3 py-2 bg-[#111] text-[#888] hover:text-white hover:bg-[#181818] disabled:opacity-30 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-[#222] transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#111] p-3 border border-[#222]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'ALL', count: transactions.length },
                { id: 'confirmed', label: 'CONFIRMED', count: countConfirmed },
                { id: 'pending', label: 'PENDING', count: countPending },
                { id: 'failed', label: 'FAILED', count: countFailed },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTxFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  txFilter === tab.id
                    ? 'bg-white text-black'
                    : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 ${
                    txFilter === tab.id ? 'bg-black text-white' : 'bg-[#222] text-[#888]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Tx Hash or Address..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080808] border border-[#222] text-xs text-white placeholder-[#555] focus:outline-none focus:border-white transition-all"
            />
          </div>
        </div>

        {/* Transactions Table / Cards */}
        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center bg-[#111] border border-[#222] space-y-2">
            <History className="w-8 h-8 text-[#444] mx-auto" />
            <p className="text-xs text-[#888] font-bold uppercase">NO TRANSACTIONS FOUND</p>
            <p className="text-xs text-[#555] font-sans">
              No transactions match your current filter or search criteria. Send a raw transaction above or submit a test transaction.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTxs.map((tx) => {
              const isExpanded = expandedTxId === tx.id;
              return (
                <div
                  key={tx.id}
                  className={`border transition-all ${
                    isExpanded
                      ? 'border-white/40 bg-[#0d0d0d]'
                      : 'border-[#222] bg-[#111] hover:border-[#333]'
                  }`}
                >
                  {/* Summary Bar */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Status Badge */}
                      {tx.status === 'confirmed' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> PENDING
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <XCircle className="w-3.5 h-3.5" /> FAILED
                        </span>
                      )}

                      {/* Tx Hash with Copy */}
                      <div className="flex items-center gap-2 bg-[#080808] px-2.5 py-1 border border-[#222]">
                        <span className="text-xs font-mono font-bold text-white">
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyTxHash(tx.txHash)}
                          className="text-[#666] hover:text-white transition-all cursor-pointer"
                          title="Copy Full Tx Hash"
                        >
                          {copiedTxHash === tx.txHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Type Tag */}
                      <span className="bg-[#1e1e1e] text-[#ccc] px-2 py-0.5 text-[10px] font-bold border border-[#333]">
                        {tx.type}
                      </span>
                      <span className="text-xs text-[#666]">•</span>
                      <span className="text-xs text-[#888]">{tx.network}</span>
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          {tx.blockNumber ? `Block #${tx.blockNumber}` : 'In Mempool'}
                        </div>
                        <div className="text-[10px] text-[#666]">
                          {tx.gasUsed ? `${tx.gasUsed} gas` : 'Estimating gas...'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInspectTxInRpc(tx)}
                          className="p-1.5 bg-[#1a1a1a] text-[#aaa] hover:text-white hover:bg-[#252525] border border-[#333] transition-all cursor-pointer"
                          title="Inspect via JSON-RPC"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          className="p-1.5 bg-[#1a1a1a] text-[#aaa] hover:text-white hover:bg-[#252525] border border-[#333] transition-all cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-4 bg-[#080808] border-t border-[#1a1a1a] space-y-4">
                      {/* Grid Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 bg-[#111] border border-[#222]">
                          <span className="text-[9px] text-[#666] uppercase block">SENDER (EOA)</span>
                          <span className="font-mono text-[#ccc] truncate block">{tx.from}</span>
                        </div>
                        <div className="p-2.5 bg-[#111] border border-[#222]">
                          <span className="text-[9px] text-[#666] uppercase block">TARGET CONTRACT</span>
                          <span className="font-mono text-[#ccc] truncate block">{tx.to || 'N/A'}</span>
                        </div>
                        <div className="p-2.5 bg-[#111] border border-[#222]">
                          <span className="text-[9px] text-[#666] uppercase block">VALUE</span>
                          <span className="font-mono text-white block">{tx.value || '0 ETH'}</span>
                        </div>
                        <div className="p-2.5 bg-[#111] border border-[#222]">
                          <span className="text-[9px] text-[#666] uppercase block">SUBMISSION TIMESTAMP</span>
                          <span className="font-mono text-[#ccc] block">{tx.timestamp}</span>
                        </div>
                      </div>

                      {/* Error message if failed */}
                      {tx.errorMessage && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{tx.errorMessage}</span>
                        </div>
                      )}

                      {/* Authorizations list */}
                      {tx.authorizations && tx.authorizations.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">
                            EIP-7702 AUTHORIZATION LIST ({tx.authorizations.length})
                          </span>
                          <div className="space-y-1.5">
                            {tx.authorizations.map((auth, i) => (
                              <div
                                key={i}
                                className="p-2.5 bg-[#111] border border-[#222] font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#aaa]"
                              >
                                <div>
                                  <span className="text-white font-bold">Address: </span>
                                  <span>{auth.address}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-[#777]">
                                  <span>Chain ID: {auth.chainId}</span>
                                  <span>Nonce: {auth.nonce}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
                        <span className="text-[10px] text-[#555]">
                          TX ID: {tx.id} • Method: {tx.method}
                        </span>
                        <button
                          onClick={() => handleInspectTxInRpc(tx)}
                          className="px-3 py-1.5 bg-white text-black hover:bg-[#eee] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          INSPECT IN RPC BUILDER
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

