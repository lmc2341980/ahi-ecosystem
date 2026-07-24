import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AHI — AI Ecosystem',
  description: 'AHI: Evolving AI ecosystem with orchestration, governance, and persistent knowledge.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
