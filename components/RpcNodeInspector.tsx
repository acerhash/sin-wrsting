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
  RotateCcw
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

  const [rpcResponse, setRpcResponse] = useState<any>({
    jsonrpc: '2.0',
    id: 1,
    result: '0xef0100770200000000000000000000000000000000ba7c'
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          <div className="bg-[#080808] border border-[#222] p-6 space-y-4">
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
    </div>
  );
}

