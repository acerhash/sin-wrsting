import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EIP-7702 ETH Node Studio | Ethereum & Base Mini App',
  description: 'Interactive Ethereum node simulator, EIP-7702 account abstraction playground, transaction builder, and EVM state tracer.',
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://picsum.photos/seed/eip7702/1200/630',
      button: {
        title: 'Launch ETH Node Studio',
        action: {
          type: 'launch_miniapp',
          name: 'EIP-7702 ETH Studio',
          url: process.env.APP_URL || 'https://localhost:3000',
          splashImageUrl: 'https://picsum.photos/seed/eip7702splash/800/800',
          splashBackgroundColor: '#0f172a'
        }
      }
    })
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

