import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Source_Code_Pro } from 'next/font/google';

// Initialize code font
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
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
    <html lang="en" suppressHydrationWarning className={sourceCodePro.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
