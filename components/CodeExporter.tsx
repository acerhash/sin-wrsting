'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, FileCode2, Sparkles } from 'lucide-react';

export function CodeExporter() {
  const [framework, setFramework] = useState<'viem' | 'wagmi' | 'ethers' | 'foundry' | 'miniapp'>('viem');
  const [copied, setCopied] = useState<boolean>(false);

  const snippets = {
    viem: `import { createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// 1. Initialize EOA Account
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');

const client = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// 2. Sign EIP-7702 Authorization Tuple (Magic Prefix 0x05)
const authorization = await client.signAuthorization({
  contractAddress: '0x770200000000000000000000000000000000ba7c', // Delegation target contract
  nonce: 0
});

// 3. Dispatch Type-4 (0x04) Transaction with authorizationList
const hash = await client.sendTransaction({
  authorizationList: [authorization],
  to: account.address, // Calls execute on self via delegate code
  data: '0x38ed1739...' // Encoded atomic batch calls
});

console.log('EIP-7702 Transaction Sent! Hash:', hash);`,

    wagmi: `import { useSendTransaction, useSignAuthorization } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function Eip7702BatchButton() {
  const { signAuthorizationAsync } = useSignAuthorization();
  const { sendTransactionAsync } = useSendTransaction();

  const handleExecuteBatch = async () => {
    // Sign Authorization Tuple
    const authorization = await signAuthorizationAsync({
      contractAddress: '0x770200000000000000000000000000000000ba7c',
      chainId: baseSepolia.id
    });

    // Execute Type-4 Transaction
    const txHash = await sendTransactionAsync({
      authorizationList: [authorization],
      data: '0x38ed1739...'
    });

    console.log('Submitted EIP-7702 Tx:', txHash);
  };

  return (
    <button onClick={handleExecuteBatch} className="btn-primary">
      Upgrade EOA & Execute Batch
    </button>
  );
}`,

    ethers: `import { ethers } from 'ethers';

// EIP-7702 Transaction Type 0x04 in Ethers.js
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet('0xYOUR_PRIVATE_KEY', provider);

// Construct Authorization Payload
const authorizationList = [{
  chainId: 84532,
  address: '0x770200000000000000000000000000000000ba7c',
  nonce: await wallet.getNonce(),
  yParity: 0,
  r: '0x...',
  s: '0x...'
}];

const tx = await wallet.sendTransaction({
  type: 4, // EIP-7702 Type 4
  to: wallet.address,
  authorizationList,
  data: '0x38ed1739...'
});

await tx.wait();
console.log('EIP-7702 Batch Confirmed:', tx.hash);`,

    foundry: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";

contract Eip7702Test is Test {
    address constant DELEGATE_BATCHER = 0x770200000000000000000000000000000000ba7c;
    
    function testEip7702EoaUpgrade() public {
        uint256 eoaPrivateKey = 0xA11CE;
        address eoa = vm.addr(eoaPrivateKey);
        
        // Attach EIP-7702 code pointer 0xef0100 + DELEGATE_BATCHER to EOA
        vm.etch(eoa, abi.encodePacked(hex"ef0100", DELEGATE_BATCHER));
        
        // Verify code pointer set
        bytes memory code = eoa.code;
        assertEq(code, abi.encodePacked(hex"ef0100", DELEGATE_BATCHER));
        
        // Execute batch call as EOA
        vm.prank(eoa);
        (bool success, ) = eoa.call(abi.encodeWithSignature("executeBatch((address,uint256,bytes)[])"));
        assertTrue(success);
    }
}`,

    miniapp: `import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export default function BaseMiniAppPage() {
  useEffect(() => {
    // Trigger ready signal to hide splash screen in Base App / Farcaster
    const initApp = async () => {
      await sdk.actions.ready();
    };
    initApp();
  }, []);

  return (
    <div className="p-4 bg-slate-900 text-white min-h-screen">
      <h1 className="text-xl font-bold">EIP-7702 Base Mini App</h1>
      <p className="text-sm text-slate-400">EOA Account Abstraction in Base App</p>
    </div>
  );
}`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[framework]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-2">
            <FileCode2 className="w-3.5 h-3.5" /> SDK & Smart Contract Code Exporter
          </div>
          <h2 className="text-xl font-bold text-white">Production Code Generator</h2>
          <p className="text-slate-400 text-sm mt-1">
            Export production-ready TypeScript, Viem v2, Wagmi v2, Foundry test scripts, and Base Mini App integration code.
          </p>
        </div>

        {/* Framework Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['viem', 'wagmi', 'ethers', 'foundry', 'miniapp'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFramework(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                framework === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" /> {framework.toUpperCase()} Implementation Snippet
          </span>
          <button
            onClick={copyCode}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard' : 'Copy Code'}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto max-h-[380px] scrollbar-thin">
          {snippets[framework]}
        </pre>
      </div>
    </div>
  );
}
