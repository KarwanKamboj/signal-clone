import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Messenger — Secure Messaging Platform',
  description: 'A pixel-perfect clone of Signal messaging app with end-to-end encryption aesthetics, real-time WebSockets, direct and group messaging.',
  keywords: ['Signal', 'Messaging', 'WebSockets', 'Next.js', 'FastAPI', 'SQLite', 'Encrypted Chat'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#121212] text-[#ecebed] h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
