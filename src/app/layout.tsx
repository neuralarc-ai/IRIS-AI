import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Source_Code_Pro, Space_Grotesk } from 'next/font/google';

// Initialize code font
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'IRIS AI - Key Account Management CRM',
  description: 'Minimalist AI-Powered Key Account Management CRM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sourceCodePro.variable} ${spaceGrotesk.variable}`}>
      <body className={`font-sans antialiased bg-background text-foreground ${spaceGrotesk.className} min-h-screen flex flex-col`}>
        {children}
        <footer className="w-full py-4 flex justify-center items-center text-sm text-muted-foreground mt-auto sticky bottom-0 bg-background z-50">
          IRIS- credit <span className="mx-1">©</span> 2025 NeuralArc
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
