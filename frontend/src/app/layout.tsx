import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MailMind AI - Intelligent Email Co-pilot',
  description: 'An autonomous AI email assistant running multi-agent workflows to classify inbox messages, schedule meetings, and automate replies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
