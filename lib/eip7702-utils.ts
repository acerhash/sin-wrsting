import { keccak256, toHex } from 'viem';

export function encodeRlpItem(item: string): string {
  const hex = item.startsWith('0x') ? item.slice(2) : item;
  if (hex === '' || hex === '00') {
    return '80';
  }
  const bytes = hex.length / 2;
  if (bytes === 1 && parseInt(hex, 16) < 0x80) {
    return hex.padStart(2, '0');
  }
  if (bytes <= 55) {
    return (0x80 + bytes).toString(16) + hex;
  }
  const lenHex = bytes.toString(16);
  const lenBytes = Math.ceil(lenHex.length / 2);
  return (0xb7 + lenBytes).toString(16) + lenHex.padStart(lenBytes * 2, '0') + hex;
}

export function encodeRlpList(items: string[]): string {
  const encodedItems = items.map(encodeRlpItem).join('');
  const bytes = encodedItems.length / 2;
  if (bytes <= 55) {
    return (0xc0 + bytes).toString(16) + encodedItems;
  }
  const lenHex = bytes.toString(16);
  const lenBytes = Math.ceil(lenHex.length / 2);
  return (0xf7 + lenBytes).toString(16) + lenHex.padStart(lenBytes * 2, '0') + encodedItems;
}

export interface Eip7702Authorization {
  chainId: number;
  address: `0x${string}`;
  nonce: number;
  yParity: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

export interface Eip7702Transaction {
  type: '0x04';
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
  accessList: any[];
  authorizationList: Eip7702Authorization[];
  yParity?: number;
  r?: `0x${string}`;
  s?: `0x${string}`;
}

export interface EvmTraceStep {
  step: number;
  phase: 'AUTH_VERIFY' | 'CODE_POINTER_INJECT' | 'EVM_EXECUTE' | 'STATE_PERSIST' | 'GAS_REFUND';
  title: string;
  description: string;
  evmOpcode?: string;
  eoaAddress: string;
  delegationTarget: string;
  codePointerHex: string;
  gasRemaining: bigint;
  gasUsedThisStep: bigint;
  stack: string[];
  memoryHex?: string;
  storageChanges: { slot: string; oldValue: string; newValue: string }[];
}

export interface DelegationBlueprint {
  id: string;
  name: string;
  category: 'Batching' | 'Sponsorship' | 'Security' | 'Automation';
  tagline: string;
  description: string;
  contractAddress: `0x${string}`;
  sampleCalls: { to: string; value: string; data: string; functionName: string }[];
  solidityCode: string;
  estimatedGasSavingsPct: number;
}

export const BLUEPRINTS: DelegationBlueprint[] = [
  {
    id: 'batch-executor',
    name: 'Atomic Multi-Call Batcher',
    category: 'Batching',
    tagline: 'Execute Approve + Swap + Stake in a single EOA transaction',
    description: 'Delegates EOA logic to an atomic multi-call contract. Allows executing multiple calls sequentially in a single atomic transaction without deploying a proxy contract.',
    contractAddress: '0x770200000000000000000000000000000000ba7c',
    sampleCalls: [
      { to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', value: '0', data: '0x095ea7b30000000000000000000000004752ba5db8b5e696da0339d254b2d35500c1df5f0000000000000000000000000000000000000000000000000000000005f5e100', functionName: 'approve(USDC, 100)' },
      { to: '0x4752ba5DB8B5E696dA0339D254B2D35500c1DF5f', value: '0', data: '0x38ed17390000000000000000000000000000000000000000000000000000000005f5e100...', functionName: 'swapExactTokensForTokens(100 USDC -> ETH)' },
      { to: '0x95c80ed25a7a51d3ddbf966c0d603e87834927eb', value: '0.05', data: '0xd0e30db0', functionName: 'depositETH()' }
    ],
    solidityCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EIP-7702 Atomic Batch Executor Delegate
 * @notice Target code attached to EOAs via EIP-7702 authorization list.
 */
contract Eip7702BatchExecutor {
    struct Call {
        address target;
        uint256 value;
        bytes callData;
    }

    event BatchExecuted(address indexed eoa, uint256 callCount);

    function executeBatch(Call[] calldata calls) external payable returns (bytes[] memory results) {
        // Verification: When delegated via EIP-7702, address(this) is the EOA itself!
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory result) = calls[i].target.call{value: calls[i].value}(calls[i].callData);
            require(success, "Batch call failed at index");
            results[i] = result;
        }
        emit BatchExecuted(address(this), calls.length);
    }
}`,
    estimatedGasSavingsPct: 42
  },
  {
    id: 'paymaster-sponsor',
    name: 'Gasless Paymaster Delegate',
    category: 'Sponsorship',
    tagline: 'Sponsor transaction gas without EOA holding native ETH',
    description: 'Enables a 3rd party Relayer/Paymaster to submit and pay gas for an EOA transaction. The EOA authorizes the transaction payload and delegate code verifies paymaster signatures or deducts fee in USDC.',
    contractAddress: '0x770200000000000000000000000000000000pay1',
    sampleCalls: [
      { to: '0x1111111111111111111111111111111111111111', value: '0', data: '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000064', functionName: 'transfer(Recipient, 100 USDC)' }
    ],
    solidityCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Eip7702GaslessPaymaster {
    address public immutable paymasterRelayer;

    constructor(address _paymaster) {
        paymasterRelayer = _paymaster;
    }

    function executeGasless(
        bytes calldata executionData,
        uint256 nonce,
        bytes calldata userSig
    ) external payable {
        // EOA verifies signature and executes payload while Paymaster pays gas.
        bytes32 digest = keccak256(abi.encodePacked(address(this), executionData, nonce, block.chainid));
        address signer = ECDSA.recover(digest, userSig);
        require(signer == address(this), "Invalid EOA signature");
        
        (bool success, ) = address(this).call(executionData);
        require(success, "Execution failed");
    }
}`,
    estimatedGasSavingsPct: 65
  },
  {
    id: 'session-key-guard',
    name: 'Session Key & Spend Guard',
    category: 'Automation',
    tagline: 'Delegate restricted sub-key access with daily spending caps',
    description: 'Grant dApps or automated trading bots temporary authorization to trade on behalf of your EOA without exposing your primary private key.',
    contractAddress: '0x7702000000000000000000000000000000002e55',
    sampleCalls: [
      { to: '0x4752ba5DB8B5E696dA0339D254B2D35500c1DF5f', value: '0', data: '0x38ed1739...', functionName: 'autoRebalanceDEX(Max 20 USDC)' }
    ],
    solidityCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Eip7702SessionKeyGuard {
    mapping(address => uint256) public sessionKeyExpiry;
    mapping(address => uint256) public sessionDailySpent;
    uint256 public constant DAILY_LIMIT = 50 * 1e6; // 50 USDC

    function executeWithSessionKey(
        address sessionKey,
        address target,
        bytes calldata data,
        uint256 amount,
        bytes calldata sessionSig
    ) external {
        require(block.timestamp < sessionKeyExpiry[sessionKey], "Session expired");
        require(sessionDailySpent[sessionKey] + amount <= DAILY_LIMIT, "Daily limit exceeded");
        
        sessionDailySpent[sessionKey] += amount;
        (bool ok, ) = target.call(data);
        require(ok, "Call failed");
    }
}`,
    estimatedGasSavingsPct: 50
  }
];

export function compute7702AuthorizationHash(auth: { chainId: number; address: string; nonce: number }): `0x${string}` {
  // MAGIC BYTE 0x05 for EIP-7702 Authorization tuple:
  // keccak256("0x05" + RLP([chain_id, address, nonce]))
  const encodedTuple = encodeRlpList([
    auth.chainId === 0 ? '0x' : toHex(auth.chainId),
    auth.address,
    auth.nonce === 0 ? '0x' : toHex(auth.nonce)
  ]);
  
  // Concatenate 0x05 byte + RLP hex
  const prefixedHex = `0x05${encodedTuple}` as `0x${string}`;
  return keccak256(prefixedHex);
}

export function formatEoaCodePointer(targetAddress: string): string {
  // EIP-7702 code stored at EOA is magic bytes: 0xef0100 + 20-byte target contract address
  const cleanAddr = targetAddress.replace(/^0x/, '').toLowerCase().padStart(40, '0');
  return `0xef0100${cleanAddr}`;
}

export function generateTraceSimulation(
  eoaAddress: string,
  targetAddress: string,
  chainId: number,
  nonce: number,
  txValueEth: string,
  batchCallsCount: number
): EvmTraceStep[] {
  const codePointer = formatEoaCodePointer(targetAddress);
  const steps: EvmTraceStep[] = [
    {
      step: 1,
      phase: 'AUTH_VERIFY',
      title: 'Verify EIP-7702 Authorization Tuple',
      description: `EVM inspects authorization tuple in transaction type 0x04. Computes digest keccak256(0x05 || RLP([chain_id: ${chainId}, address: ${targetAddress.slice(0, 10)}..., nonce: ${nonce}])) and recovers signer address ${eoaAddress.slice(0, 8)}...`,
      evmOpcode: 'EIP7702_VERIFY_AUTH',
      eoaAddress,
      delegationTarget: targetAddress,
      codePointerHex: '0x (Empty EOA)',
      gasRemaining: BigInt(300000),
      gasUsedThisStep: BigInt(25000),
      stack: [`CHAIN_ID: ${chainId}`, `NONCE: ${nonce}`, `SIGNER: ${eoaAddress.slice(0, 10)}...`],
      storageChanges: []
    },
    {
      step: 2,
      phase: 'CODE_POINTER_INJECT',
      title: 'Inject EOA Delegation Code Pointer (0xef0100)',
      description: `Node temporarily/persistently sets bytecode for EOA ${eoaAddress.slice(0, 8)}... to magic prefix 0xef0100 followed by delegation address ${targetAddress.slice(0, 10)}... EOA nonce incremented from ${nonce} to ${nonce + 1}.`,
      evmOpcode: 'SET_CODE_POINTER',
      eoaAddress,
      delegationTarget: targetAddress,
      codePointerHex: codePointer,
      gasRemaining: BigInt(275000),
      gasUsedThisStep: BigInt(12500),
      stack: [`EOA_CODE: ${codePointer.slice(0, 18)}...`, `NONCE_NEW: ${nonce + 1}`],
      storageChanges: [
        { slot: 'EOA_CODE_HASH', oldValue: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 (empty)', newValue: keccak256(codePointer as `0x${string}`) }
      ]
    },
    {
      step: 3,
      phase: 'EVM_EXECUTE',
      title: 'EVM DELEGATECALL to Target Code',
      description: `Transaction execution targets ${eoaAddress}. Because EOA code pointer is set to ${targetAddress.slice(0, 10)}..., EVM loads bytecode from ${targetAddress.slice(0, 10)}... and executes in EOA context (address(this) = ${eoaAddress.slice(0, 8)}...).`,
      evmOpcode: 'DELEGATECALL',
      eoaAddress,
      delegationTarget: targetAddress,
      codePointerHex: codePointer,
      gasRemaining: BigInt(262500),
      gasUsedThisStep: BigInt(18000),
      stack: [`CALLER: ${eoaAddress}`, `VALUE: ${txValueEth} ETH`, `CALL_COUNT: ${batchCallsCount}`],
      storageChanges: [
        { slot: '0x0000000000000000000000000000000000000000000000000000000000000001', oldValue: '0x00', newValue: '0x01 (Batch Executed)' }
      ]
    },
    {
      step: 4,
      phase: 'STATE_PERSIST',
      title: 'Persist State & Storage Updates',
      description: `Atomic calls completed successfully. All contract calls, token transfers, and approval states reflect on the EOA's state without proxy factory deployment overhead.`,
      evmOpcode: 'SSTORE / LOG2',
      eoaAddress,
      delegationTarget: targetAddress,
      codePointerHex: codePointer,
      gasRemaining: BigInt(244500),
      gasUsedThisStep: BigInt(5000),
      stack: ['STATUS: SUCCESS (0x01)', 'LOGS: 2 Events Emitted'],
      storageChanges: []
    },
    {
      step: 5,
      phase: 'GAS_REFUND',
      title: 'Gas Settlement & Finalization',
      description: `Total Gas Used: 55,500 gas (~40% cheaper than ERC-4337 UserOp). Block state root updated. EOA is now upgraded and ready for subsequent transactions!`,
      evmOpcode: 'STOP',
      eoaAddress,
      delegationTarget: targetAddress,
      codePointerHex: codePointer,
      gasRemaining: BigInt(244500),
      gasUsedThisStep: BigInt(0),
      stack: ['FINAL_STATUS: 0x01', 'BLOCK_INCLUDED: #21894102'],
      storageChanges: []
    }
  ];

  return steps;
}
