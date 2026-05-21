import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Advoverse – Digital Chamber Management System',
  description:
    'Advoverse is a professional offline-first chamber management system for advocates, chambers, and law firms. Manage cases, hearings, documents, and your team from one system.',
  keywords: 'chamber management, advocate software, legal case management, law firm software, India',
  openGraph: {
    title: 'Advoverse – Digital Chamber Management System',
    description:
      'Professional offline-first chamber management for advocates and law firms.',
    url: 'https://advoverse.com',
    siteName: 'Advoverse',
    type: 'website',
  },
  metadataBase: new URL('https://advoverse.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
