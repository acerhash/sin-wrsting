import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is missing.' },
        { status: 500 }
      );
    }

    const { prompt, contextType, payload } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert Ethereum protocol engineer and EVM core developer specializing in EIP-7702 (Set EOA Account Code), Account Abstraction, Pectra hard fork, Base network, and Viem/Solidity development.
    Provide concise, precise, technical yet easy-to-understand answers.
    When given transaction authorization payloads, explain the tuple fields (chain_id, address, nonce, y_parity, r, s), authorization hash computation (0x05 || RLP), security considerations, gas savings, or code implementation details.`;

    let fullPrompt = prompt;
    if (contextType === 'payload_analysis' && payload) {
      fullPrompt = `Analyze this EIP-7702 Authorization Payload / Type-4 Transaction:\n${JSON.stringify(payload, null, 2)}\n\nUser Question: ${prompt}`;
    } else if (contextType === 'gas_comparison') {
      fullPrompt = `Compare gas consumption and architectural trade-offs between EOA, ERC-4337 (EntryPoint + Safe Proxy), and EIP-7702 (Type 0x04 Set EOA Code) for: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process AI request.' },
      { status: 500 }
    );
  }
}
