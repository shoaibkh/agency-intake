import './globals.css';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Agency Intake OS',
  description: 'Public intake + AI analysis + internal dashboard for agency project briefs.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
